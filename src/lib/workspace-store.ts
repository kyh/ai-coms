"use client";

import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  createSeedConversations,
  createSeedMessages,
  createSeedStatus,
  seedUsers,
} from "@/lib/seed-workspace";
import {
  conversationSchema,
  ME,
  messageSchema,
  slugifyChannelName,
  userSchema,
  userStatusSchema,
  type Conversation,
  type Message,
  type User,
  type UserStatus,
} from "@/lib/workspace";

/**
 * `createChannel` can fail for exactly two reasons, and the caller has to
 * handle both — so it returns a result, not a nullable id.
 */
export type CreateChannelResult =
  | { ok: true; conversationId: string }
  | { ok: false; reason: "invalid-name" | "duplicate" };

type WorkspaceState = {
  users: User[];
  conversations: Conversation[];
  /** Flat message log; thread replies carry `parentId` and live here too. */
  messages: Message[];
  /** Per-conversation composer text, keyed by conversation id. */
  drafts: Record<string, string>;
  status: UserStatus;
  selectedConversationId: string | null;
  /** Id of the parent message whose thread pane is open, if any. */
  openThreadId: string | null;
  hydrated: boolean;
  /** Whether the one-time seed has run — prevents seeds resurrecting after a full clear. */
  seeded: boolean;

  setHydrated: () => void;
  selectConversation: (conversationId: string) => void;
  openThread: (messageId: string) => void;
  closeThread: () => void;

  sendMessage: (conversationId: string, body: string) => void;
  sendThreadReply: (parentId: string, body: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  markRead: (conversationIds: string[]) => void;
  createChannel: (name: string, purpose: string) => CreateChannelResult;
  setDraft: (conversationId: string, draft: string) => void;
  clearDraft: (conversationId: string) => void;
  setStatus: (status: UserStatus) => void;

  seed: () => void;
  resetWorkspace: () => void;
};

/**
 * localStorage boundary: every persisted record is zod-parsed on read and any
 * malformed entry is dropped, so corrupt/tampered storage can't crash
 * downstream consumers.
 */
const persistedStateSchema = z.object({
  users: z.array(z.unknown()).transform((users) =>
    users.flatMap((user) => {
      const parsed = userSchema.safeParse(user);
      return parsed.success ? [parsed.data] : [];
    }),
  ),
  conversations: z.array(z.unknown()).transform((conversations) =>
    conversations.flatMap((conversation) => {
      const parsed = conversationSchema.safeParse(conversation);
      return parsed.success ? [parsed.data] : [];
    }),
  ),
  messages: z.array(z.unknown()).transform((messages) =>
    messages.flatMap((message) => {
      const parsed = messageSchema.safeParse(message);
      return parsed.success ? [parsed.data] : [];
    }),
  ),
  drafts: z.record(z.string(), z.string()).optional(),
  status: userStatusSchema.optional(),
  selectedConversationId: z.string().nullable().optional(),
  seeded: z.boolean().optional(),
});

const markConversationsRead = (
  conversations: Conversation[],
  conversationIds: string[],
): Conversation[] => {
  const ids = new Set(conversationIds);
  const now = new Date().toISOString();
  return conversations.map((conversation) =>
    ids.has(conversation.id) ? { ...conversation, lastReadAt: now } : conversation,
  );
};

const DEFAULT_CONVERSATION_ID = "c-general";

const seedState = () => ({
  users: seedUsers,
  conversations: createSeedConversations(),
  messages: createSeedMessages(),
  status: createSeedStatus(),
});

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      users: [],
      conversations: [],
      messages: [],
      drafts: {},
      status: { emoji: "", text: "" },
      selectedConversationId: null,
      openThreadId: null,
      hydrated: false,
      seeded: false,

      setHydrated: () => set({ hydrated: true }),

      selectConversation: (conversationId) =>
        set((state) => ({
          selectedConversationId: conversationId,
          openThreadId: null,
          conversations: markConversationsRead(state.conversations, [conversationId]),
        })),

      openThread: (messageId) => set({ openThreadId: messageId }),
      closeThread: () => set({ openThreadId: null }),

      sendMessage: (conversationId, body) => {
        const trimmed = body.trim();
        if (trimmed.length === 0) return;
        set((state) => {
          if (!state.conversations.some((conversation) => conversation.id === conversationId)) {
            return state;
          }
          const { [conversationId]: _sent, ...drafts } = state.drafts;
          return {
            messages: [
              ...state.messages,
              {
                id: crypto.randomUUID(),
                conversationId,
                authorId: ME,
                at: new Date().toISOString(),
                body: trimmed,
                reactions: [],
              },
            ],
            drafts,
            // Your own message can't be unread; keep the badge honest.
            conversations: markConversationsRead(state.conversations, [conversationId]),
          };
        });
      },

      sendThreadReply: (parentId, body) => {
        const trimmed = body.trim();
        if (trimmed.length === 0) return;
        const parent = get().messages.find((message) => message.id === parentId);
        if (parent === undefined) return;
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: crypto.randomUUID(),
              conversationId: parent.conversationId,
              authorId: ME,
              at: new Date().toISOString(),
              body: trimmed,
              reactions: [],
              parentId,
            },
          ],
          conversations: markConversationsRead(state.conversations, [parent.conversationId]),
        }));
      },

      /** Toggles the current user in/out of a message's reaction. Empty reactions vanish. */
      toggleReaction: (messageId, emoji) =>
        set((state) => ({
          messages: state.messages.map((message) => {
            if (message.id !== messageId) return message;
            const existing = message.reactions.find((reaction) => reaction.emoji === emoji);
            if (existing === undefined) {
              return { ...message, reactions: [...message.reactions, { emoji, by: [ME] }] };
            }
            const by = existing.by.includes(ME)
              ? existing.by.filter((userId) => userId !== ME)
              : [...existing.by, ME];
            const replacement = by.length > 0 ? [{ emoji, by }] : [];
            return {
              ...message,
              reactions: message.reactions.flatMap((reaction) =>
                reaction.emoji === emoji ? replacement : [reaction],
              ),
            };
          }),
        })),

      markRead: (conversationIds) =>
        set((state) => ({
          conversations: markConversationsRead(state.conversations, conversationIds),
        })),

      createChannel: (name, purpose) => {
        const slug = slugifyChannelName(name);
        if (slug.length === 0) return { ok: false, reason: "invalid-name" };
        const { conversations } = get();
        const duplicate = conversations.some(
          (conversation) => conversation.kind === "channel" && conversation.name === slug,
        );
        if (duplicate) return { ok: false, reason: "duplicate" };

        const conversationId = `c-${slug}`;
        const channel: Conversation = {
          kind: "channel",
          id: conversationId,
          name: slug,
          purpose: purpose.trim(),
          memberIds: [ME],
          lastReadAt: new Date().toISOString(),
          muted: false,
        };
        set((state) => ({
          conversations: [...state.conversations, channel],
          selectedConversationId: conversationId,
          openThreadId: null,
        }));
        return { ok: true, conversationId };
      },

      setDraft: (conversationId, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [conversationId]: draft } })),

      clearDraft: (conversationId) =>
        set((state) => {
          const { [conversationId]: _cleared, ...drafts } = state.drafts;
          return { drafts };
        }),

      setStatus: (status) => set({ status }),

      // Land on #general: it is fully read, so the unread badges on
      // #engineering, #incidents, and the DM from Marcus greet the visitor.
      seed: () =>
        set((state) => ({
          ...seedState(),
          selectedConversationId: state.selectedConversationId ?? DEFAULT_CONVERSATION_ID,
          seeded: true,
        })),

      resetWorkspace: () =>
        set({
          ...seedState(),
          drafts: {},
          selectedConversationId: DEFAULT_CONVERSATION_ID,
          openThreadId: null,
          seeded: true,
        }),
    }),
    {
      name: "ai-coms-workspace",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        users: state.users,
        conversations: state.conversations,
        messages: state.messages,
        drafts: state.drafts,
        status: state.status,
        selectedConversationId: state.selectedConversationId,
        seeded: state.seeded,
      }),
      merge: (persisted, current) => {
        const parsed = persistedStateSchema.safeParse(persisted);
        if (!parsed.success) return current;
        return {
          ...current,
          users: parsed.data.users,
          conversations: parsed.data.conversations,
          messages: parsed.data.messages,
          drafts: parsed.data.drafts ?? {},
          status: parsed.data.status ?? current.status,
          selectedConversationId: parsed.data.selectedConversationId ?? null,
          seeded: parsed.data.seeded ?? false,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        if (!state.seeded) state.seed();
        state.setHydrated();
      },
    },
  ),
);
