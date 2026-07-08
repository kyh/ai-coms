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
  type Conversation,
  type Message,
  type User,
  type UserStatus,
} from "@/lib/workspace";

/**
 * The dynamic state the client ships with every chat request. The server is
 * stateless: this digest (plus the active conversation's recent messages) is
 * appended to the agent's instructions so it can reason about the real
 * workspace — which is also why summaries need no tool.
 */

/** Recent-window size for the active conversation. Keeps the turn payload lean. */
const ACTIVE_MESSAGE_LIMIT = 40;

const contextMessageSchema = z.object({
  id: z.string(),
  author: z.string(),
  at: z.iso.datetime(),
  body: z.string(),
  reactions: z.array(reactionSchema),
  /** Present on thread replies: the id of the message they hang off. */
  parentId: z.string().optional(),
  /** Present on root messages that have replies. */
  replyCount: z.number().optional(),
});

const conversationDigestSchema = z.object({
  id: z.string(),
  kind: z.enum(["channel", "dm"]),
  /** `#engineering` or a person's name. */
  title: z.string(),
  unreadCount: z.number(),
  /** DMs are never muted; the flag is always false for them. */
  muted: z.boolean(),
  lastActivityAt: z.iso.datetime(),
});

const activeConversationSchema = z.object({
  id: z.string(),
  kind: z.enum(["channel", "dm"]),
  title: z.string(),
  /** Channels only. */
  purpose: z.string().optional(),
  memberCount: z.number(),
  /** Newest `ACTIVE_MESSAGE_LIMIT` messages, thread replies included, oldest first. */
  messages: z.array(contextMessageSchema),
});

const openThreadContextSchema = z.object({
  parentMessageId: z.string(),
  messages: z.array(contextMessageSchema),
});

export const workspaceContextSchema = z.object({
  /** Current datetime, ISO 8601 with UTC instant. */
  now: z.string(),
  /** IANA timezone, e.g. "America/Los_Angeles". */
  timeZone: z.string(),
  me: z.object({ id: z.string(), name: z.string(), status: z.string() }),
  users: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      presence: presenceSchema,
      title: z.string().optional(),
    }),
  ),
  conversations: z.array(conversationDigestSchema),
  activeConversation: activeConversationSchema.optional(),
  openThread: openThreadContextSchema.optional(),
});

export type WorkspaceContext = z.infer<typeof workspaceContextSchema>;

type ContextMessage = z.infer<typeof contextMessageSchema>;

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
  return {
    id: message.id,
    author,
    at: message.at,
    body: message.body,
    reactions: message.reactions,
    ...(message.parentId === undefined ? {} : { parentId: message.parentId }),
    ...(replies.length > 0 ? { replyCount: replies.length } : {}),
  };
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

  return {
    now: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    me: {
      id: ME,
      name: me?.name ?? "You",
      status: status.text.length > 0 ? `${status.emoji} ${status.text}`.trim() : "",
    },
    users: users
      .filter((user) => user.id !== ME)
      .map((user) => ({
        id: user.id,
        name: user.name,
        presence: user.presence,
        ...(user.title === undefined ? {} : { title: user.title }),
      })),
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      kind: conversation.kind,
      title: displayTitle(conversation, users),
      unreadCount: unreadCount(conversation, messages),
      muted: isMuted(conversation),
      lastActivityAt: lastActivityAt(messages, conversation.id),
    })),
    ...(active === undefined
      ? {}
      : {
          activeConversation: {
            id: active.id,
            kind: active.kind,
            title: displayTitle(active, users),
            ...(active.kind === "channel" ? { purpose: active.purpose } : {}),
            memberCount: memberCount(active),
            messages: conversationMessages(messages, active.id)
              .slice(-ACTIVE_MESSAGE_LIMIT)
              .map((message) => toContextMessage(message, users, messages)),
          },
        }),
    ...(openThreadParent === undefined
      ? {}
      : {
          openThread: {
            parentMessageId: openThreadParent.id,
            messages: [openThreadParent, ...threadReplies(messages, openThreadParent.id)].map(
              (message) => toContextMessage(message, users, messages),
            ),
          },
        }),
  };
};
