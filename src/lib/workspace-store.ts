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
} from "@/lib/workspace";
import type { Conversation, Message, User, UserStatus } from "@/lib/workspace";

/**
 * `createChannel` can fail for exactly two reasons, and the caller has to
 * handle both — so it returns a result, not a nullable id.
 */
export type CreateChannelResult =
  | { ok: true; conversationId: string }
  | { ok: false; reason: "invalid-name" | "duplicate" };

interface WorkspaceState {
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
}

/**
 * localStorage boundary: every persisted record is zod-parsed on read and any
 * malformed entry is dropped, so corrupt/tampered storage can't crash
 * downstream consumers.
 */
const persistedStateSchema = z.object({
  conversations: z.array(z.unknown()).transform((conversations) =>
    conversations.flatMap((conversation) => {
      const parsed = conversationSchema.safeParse(conversation);
      return parsed.success ? [parsed.data] : [];
    }),
  ),
  drafts: z.record(z.string(), z.string()).optional(),
  messages: z.array(z.unknown()).transform((messages) =>
    messages.flatMap((message) => {
      const parsed = messageSchema.safeParse(message);
      return parsed.success ? [parsed.data] : [];
    }),
  ),
  seeded: z.boolean().optional(),
  selectedConversationId: z.string().nullable().optional(),
  status: userStatusSchema.optional(),
  users: z.array(z.unknown()).transform((users) =>
    users.flatMap((user) => {
      const parsed = userSchema.safeParse(user);
      return parsed.success ? [parsed.data] : [];
    }),
  ),
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
  conversations: createSeedConversations(),
  messages: createSeedMessages(),
  status: createSeedStatus(),
  users: seedUsers,
});

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      clearDraft: (conversationId) =>
        set((state) => {
          const { [conversationId]: _cleared, ...drafts } = state.drafts;
          return { drafts };
        }),

      closeThread: () => set({ openThreadId: null }),

      conversations: [],

      createChannel: (name, purpose) => {
        const slug = slugifyChannelName(name);
        if (slug.length === 0) {
          return { ok: false, reason: "invalid-name" };
        }
        const { conversations } = get();
        const duplicate = conversations.some(
          (conversation) => conversation.kind === "channel" && conversation.name === slug,
        );
        if (duplicate) {
          return { ok: false, reason: "duplicate" };
        }
        const conversationId = `c-${slug}`;
        const channel: Conversation = {
          id: conversationId,
          kind: "channel",
          lastReadAt: new Date().toISOString(),
          memberIds: [ME],
          muted: false,
          name: slug,
          purpose: purpose.trim(),
        };
        set((state) => ({
          conversations: [...state.conversations, channel],
          openThreadId: null,
          selectedConversationId: conversationId,
        }));
        return { conversationId, ok: true };
      },

      drafts: {},

      hydrated: false,

      markRead: (conversationIds) =>
        set((state) => ({
          conversations: markConversationsRead(state.conversations, conversationIds),
        })),

      messages: [],

      openThread: (messageId) => set({ openThreadId: messageId }),

      openThreadId: null,

      resetWorkspace: () =>
        set({
          ...seedState(),
          drafts: {},
          openThreadId: null,
          seeded: true,
          selectedConversationId: DEFAULT_CONVERSATION_ID,
        }),

      // Land on #general: it is fully read, so the unread badges on
      // #engineering, #incidents, and the DM from Marcus greet the visitor.
      seed: () =>
        set((state) => ({
          ...seedState(),
          seeded: true,
          selectedConversationId: state.selectedConversationId ?? DEFAULT_CONVERSATION_ID,
        })),

      seeded: false,

      selectConversation: (conversationId) =>
        set((state) => ({
          conversations: markConversationsRead(state.conversations, [conversationId]),
          openThreadId: null,
          selectedConversationId: conversationId,
        })),

      selectedConversationId: null,

      sendMessage: (conversationId, body) => {
        const trimmed = body.trim();
        if (trimmed.length === 0) {
          return;
        }
        set((state) => {
          if (!state.conversations.some((conversation) => conversation.id === conversationId)) {
            return state;
          }
          const { [conversationId]: _sent, ...drafts } = state.drafts;
          return {
            // Your own message can't be unread; keep the badge honest.
            conversations: markConversationsRead(state.conversations, [conversationId]),
            drafts,
            messages: [
              ...state.messages,
              {
                at: new Date().toISOString(),
                authorId: ME,
                body: trimmed,
                conversationId,
                id: crypto.randomUUID(),
                reactions: [],
              },
            ],
          };
        });
      },

      sendThreadReply: (parentId, body) => {
        const trimmed = body.trim();
        if (trimmed.length === 0) {
          return;
        }
        const parent = get().messages.find((message) => message.id === parentId);
        if (parent === undefined) {
          return;
        }
        set((state) => ({
          conversations: markConversationsRead(state.conversations, [parent.conversationId]),
          messages: [
            ...state.messages,
            {
              at: new Date().toISOString(),
              authorId: ME,
              body: trimmed,
              conversationId: parent.conversationId,
              id: crypto.randomUUID(),
              parentId,
              reactions: [],
            },
          ],
        }));
      },
      /** Toggles the current user in/out of a message's reaction. Empty reactions vanish. */

      setDraft: (conversationId, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [conversationId]: draft } })),

      setHydrated: () => set({ hydrated: true }),

      setStatus: (status) => set({ status }),

      status: { emoji: "", text: "" },

      toggleReaction: (messageId, emoji) =>
        set((state) => ({
          messages: state.messages.map((message) => {
            if (message.id !== messageId) {
              return message;
            }
            const existing = message.reactions.find((reaction) => reaction.emoji === emoji);
            if (existing === undefined) {
              return { ...message, reactions: [...message.reactions, { by: [ME], emoji }] };
            }
            const by = existing.by.includes(ME)
              ? existing.by.filter((userId) => userId !== ME)
              : [...existing.by, ME];
            const replacement = by.length > 0 ? [{ by, emoji }] : [];
            return {
              ...message,
              reactions: message.reactions.flatMap((reaction) =>
                reaction.emoji === emoji ? replacement : [reaction],
              ),
            };
          }),
        })),

      users: [],
    }),
    {
      merge: (persisted, current) => {
        const parsed = persistedStateSchema.safeParse(persisted);
        if (!parsed.success) {
          return current;
        }
        return {
          ...current,
          conversations: parsed.data.conversations,
          drafts: parsed.data.drafts ?? {},
          messages: parsed.data.messages,
          seeded: parsed.data.seeded ?? false,
          selectedConversationId: parsed.data.selectedConversationId ?? null,
          status: parsed.data.status ?? current.status,
          users: parsed.data.users,
        };
      },
      name: "ai-coms-workspace",
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) {
          return;
        }
        if (!state.seeded) {
          state.seed();
        }
        state.setHydrated();
      },
      partialize: (state) => ({
        conversations: state.conversations,
        drafts: state.drafts,
        messages: state.messages,
        seeded: state.seeded,
        selectedConversationId: state.selectedConversationId,
        status: state.status,
        users: state.users,
      }),
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
