import { z } from "zod";

/**
 * Domain schemas for the workspace. Everything that crosses a boundary
 * (localStorage, AI tool payloads, request bodies) is parsed with these.
 *
 * NOTE: `agent/channels/eve.ts` is eve's *transport* channel and has nothing
 * to do with the chat channels modelled here. Domain channels live in this
 * file; nothing under `src/lib` should ever import from `agent/`.
 */

/** Tailwind-ish palette tokens; resolved to classes in `user-avatar.tsx`. */
export const avatarColorSchema = z.enum([
  "rose",
  "amber",
  "emerald",
  "sky",
  "violet",
  "fuchsia",
  "cyan",
  "lime",
]);

export type AvatarColor = z.infer<typeof avatarColorSchema>;

export const presenceSchema = z.enum(["online", "away", "offline"]);

export type Presence = z.infer<typeof presenceSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarColor: avatarColorSchema,
  presence: presenceSchema,
  title: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

/** The current user's Slack-style status line, shown under their name. */
export const userStatusSchema = z.object({
  emoji: z.string(),
  text: z.string(),
});

export type UserStatus = z.infer<typeof userStatusSchema>;

export const reactionSchema = z.object({
  emoji: z.string(),
  /** User ids who reacted. Never empty — an emptied reaction is removed. */
  by: z.array(z.string()),
});

export type Reaction = z.infer<typeof reactionSchema>;

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  authorId: z.string(),
  at: z.iso.datetime(),
  body: z.string(),
  reactions: z.array(reactionSchema),
  /** Present => this message is a reply inside the parent's thread. */
  parentId: z.string().optional(),
});

export type Message = z.infer<typeof messageSchema>;

export const channelSchema = z.object({
  kind: z.literal("channel"),
  id: z.string(),
  /** Slug, without the leading `#`. */
  name: z.string(),
  purpose: z.string(),
  memberIds: z.array(z.string()),
  lastReadAt: z.iso.datetime(),
  muted: z.boolean(),
});

export type Channel = z.infer<typeof channelSchema>;

export const dmSchema = z.object({
  kind: z.literal("dm"),
  id: z.string(),
  /** The other participant. The current user is always implicit. */
  userId: z.string(),
  lastReadAt: z.iso.datetime(),
});

export type DirectMessage = z.infer<typeof dmSchema>;

/**
 * A conversation is a channel or a DM — never both, never neither. The
 * discriminant carries the fields, so there is no "channel with a userId" or
 * "dm with members" to mishandle.
 */
export const conversationSchema = z.discriminatedUnion("kind", [channelSchema, dmSchema]);

export type Conversation = z.infer<typeof conversationSchema>;

/** The current user's id. `ME` is a member of every seeded conversation. */
export const ME = "u-me";

/** Emoji offered by the reaction picker. A fixed set — no picker library. */
export const REACTION_EMOJI = ["✅", "🎉", "👀", "🔥", "👍", "🙏", "🚀", "😄"] as const;

// -----------------------------------------------------------------------------
// Derived helpers — all pure, all total.
// -----------------------------------------------------------------------------

/** Display title: the channel's name (no `#`) or the DM partner's name. */
export const conversationTitle = (conversation: Conversation, users: User[]): string => {
  if (conversation.kind === "channel") return conversation.name;
  return users.find((user) => user.id === conversation.userId)?.name ?? "Unknown";
};

const byTime = (a: Message, b: Message): number =>
  new Date(a.at).getTime() - new Date(b.at).getTime();

/** Every message in a conversation, thread replies included, oldest first. */
export const conversationMessages = (messages: Message[], conversationId: string): Message[] =>
  messages.filter((message) => message.conversationId === conversationId).sort(byTime);

/** Top-level messages (not thread replies) in a conversation, oldest first. */
export const rootMessages = (messages: Message[], conversationId: string): Message[] =>
  messages
    .filter(
      (message) => message.conversationId === conversationId && message.parentId === undefined,
    )
    .sort(byTime);

/** Replies hanging off a parent message, oldest first. */
export const threadReplies = (messages: Message[], messageId: string): Message[] =>
  messages.filter((message) => message.parentId === messageId).sort(byTime);

/**
 * Unread = anything posted after `lastReadAt` that the current user did not
 * write. Thread replies count too: a channel with only unread replies is
 * still a channel with something new in it.
 */
export const unreadCount = (conversation: Conversation, messages: Message[]): number => {
  const readAt = new Date(conversation.lastReadAt).getTime();
  return conversationMessages(messages, conversation.id).filter(
    (message) => message.authorId !== ME && new Date(message.at).getTime() > readAt,
  ).length;
};

/** ISO timestamp of the newest message, or the epoch for an empty conversation. */
export const lastActivityAt = (messages: Message[], conversationId: string): string =>
  conversationMessages(messages, conversationId).at(-1)?.at ?? new Date(0).toISOString();

/** Consecutive messages by one author, within this many ms, render as one block. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export type MessageGroup = {
  /** The first message's id — stable across re-renders. */
  id: string;
  authorId: string;
  /** Timestamp of the first message in the group. */
  at: string;
  messages: Message[];
};

/**
 * The Slack look: consecutive messages from the same author, each within five
 * minutes of the one before it, collapse into a group whose avatar and byline
 * render once. Input is assumed time-ordered (use `rootMessages`).
 */
export const messageGroups = (messages: Message[]): MessageGroup[] => {
  const groups: MessageGroup[] = [];
  for (const message of messages) {
    const current = groups.at(-1);
    const previous = current?.messages.at(-1);
    const contiguous =
      current !== undefined &&
      previous !== undefined &&
      current.authorId === message.authorId &&
      new Date(message.at).getTime() - new Date(previous.at).getTime() <= GROUP_WINDOW_MS;

    if (current !== undefined && contiguous) {
      current.messages.push(message);
    } else {
      groups.push({
        id: message.id,
        authorId: message.authorId,
        at: message.at,
        messages: [message],
      });
    }
  }
  return groups;
};

/** Two-letter monogram for the avatar fallback. */
export const initials = (name: string): string =>
  name
    .split(/\s+/u)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");

/** `Design Crit!` -> `design-crit`. Returns "" when nothing survives. */
export const slugifyChannelName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "")
    .slice(0, 40);
