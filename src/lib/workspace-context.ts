import { z } from "zod";

import {
  conversationMessages,
  conversationTitle,
  lastActivityAt,
  ME,
  presenceSchema,
  reactionSchema,
  threadReplies,
  unreadCount,
} from "@/lib/workspace";
import type { Conversation, Message, User, UserStatus } from "@/lib/workspace";

/**
 * The dynamic state the client ships with every chat request. The server is
 * stateless: this digest (plus the active conversation's recent messages) is
 * appended to the agent's instructions so it can reason about the real
 * workspace — which is also why summaries need no tool.
 */

/** Recent-window size for the active conversation. Keeps the turn payload lean. */
const ACTIVE_MESSAGE_LIMIT = 40;

const contextMessageSchema = z.object({
  at: z.iso.datetime(),
  author: z.string(),
  body: z.string(),
  id: z.string(),
  /** Present on thread replies: the id of the message they hang off. */
  parentId: z.string().optional(),
  reactions: z.array(reactionSchema),
  /** Present on root messages that have replies. */
  replyCount: z.number().optional(),
});

const conversationDigestSchema = z.object({
  id: z.string(),
  kind: z.enum(["channel", "dm"]),
  lastActivityAt: z.iso.datetime(),
  /** DMs are never muted; the flag is always false for them. */
  muted: z.boolean(),
  /** `#engineering` or a person's name. */
  title: z.string(),
  unreadCount: z.number(),
});

const activeConversationSchema = z.object({
  id: z.string(),
  kind: z.enum(["channel", "dm"]),
  memberCount: z.number(),
  /** Newest `ACTIVE_MESSAGE_LIMIT` messages, thread replies included, oldest first. */
  messages: z.array(contextMessageSchema),
  /** Channels only. */
  purpose: z.string().optional(),
  title: z.string(),
});

const openThreadContextSchema = z.object({
  messages: z.array(contextMessageSchema),
  parentMessageId: z.string(),
});

export const workspaceContextSchema = z.object({
  activeConversation: activeConversationSchema.optional(),
  conversations: z.array(conversationDigestSchema),
  me: z.object({ id: z.string(), name: z.string(), status: z.string() }),
  /** Current datetime, ISO 8601 with UTC instant. */
  now: z.string(),
  openThread: openThreadContextSchema.optional(),
  /** IANA timezone, e.g. "America/Los_Angeles". */
  timeZone: z.string(),
  users: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      presence: presenceSchema,
      title: z.string().optional(),
    }),
  ),
});

export type WorkspaceContext = z.infer<typeof workspaceContextSchema>;

type ContextMessage = z.infer<typeof contextMessageSchema>;

type ActiveConversation = z.infer<typeof activeConversationSchema>;

const displayTitle = (conversation: Conversation, users: User[]): string =>
  conversation.kind === "channel"
    ? `#${conversation.name}`
    : conversationTitle(conversation, users);

const isMuted = (conversation: Conversation): boolean =>
  conversation.kind === "channel" ? conversation.muted : false;

const memberCount = (conversation: Conversation): number =>
  conversation.kind === "channel" ? conversation.memberIds.length : 2;

const toContextMessage = (
  message: Message,
  users: User[],
  allMessages: Message[],
): ContextMessage => {
  const author = users.find((user) => user.id === message.authorId)?.name ?? message.authorId;
  const replies = message.parentId === undefined ? threadReplies(allMessages, message.id) : [];
  const contextMessage: ContextMessage = {
    at: message.at,
    author,
    body: message.body,
    id: message.id,
    reactions: message.reactions,
  };
  if (message.parentId !== undefined) {
    contextMessage.parentId = message.parentId;
  }
  if (replies.length > 0) {
    contextMessage.replyCount = replies.length;
  }
  return contextMessage;
};

interface WorkspaceContextInput {
  users: User[];
  conversations: Conversation[];
  messages: Message[];
  status: UserStatus;
  selectedConversationId: string | null;
  openThreadId: string | null;
}

/** Client side: build the compact digest sent in the request body. */
export const buildWorkspaceContext = ({
  users,
  conversations,
  messages,
  status,
  selectedConversationId,
  openThreadId,
}: WorkspaceContextInput): WorkspaceContext => {
  const me = users.find((user) => user.id === ME);
  const active = conversations.find((conversation) => conversation.id === selectedConversationId);
  const openThreadParent = messages.find((message) => message.id === openThreadId);

  const context: WorkspaceContext = {
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      kind: conversation.kind,
      lastActivityAt: lastActivityAt(messages, conversation.id),
      muted: isMuted(conversation),
      title: displayTitle(conversation, users),
      unreadCount: unreadCount(conversation, messages),
    })),
    me: {
      id: ME,
      name: me?.name ?? "You",
      status: status.text.length > 0 ? `${status.emoji} ${status.text}`.trim() : "",
    },
    now: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    users: users
      .filter((user) => user.id !== ME)
      .map((user) => ({
        id: user.id,
        name: user.name,
        presence: user.presence,
        title: user.title,
      })),
  };

  if (active !== undefined) {
    const activeConversation: ActiveConversation = {
      id: active.id,
      kind: active.kind,
      memberCount: memberCount(active),
      messages: conversationMessages(messages, active.id)
        .slice(-ACTIVE_MESSAGE_LIMIT)
        .map((message) => toContextMessage(message, users, messages)),
      title: displayTitle(active, users),
    };
    if (active.kind === "channel") {
      activeConversation.purpose = active.purpose;
    }
    context.activeConversation = activeConversation;
  }

  if (openThreadParent !== undefined) {
    context.openThread = {
      messages: [openThreadParent, ...threadReplies(messages, openThreadParent.id)].map((message) =>
        toContextMessage(message, users, messages),
      ),
      parentMessageId: openThreadParent.id,
    };
  }

  return context;
};
