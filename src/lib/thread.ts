import { z } from "zod";

/**
 * Domain schemas for the mailbox. Everything that crosses a boundary
 * (localStorage, AI data parts, request bodies) is parsed with these.
 */

export const prioritySchema = z.enum(["none", "low", "med", "high"]);

export type Priority = z.infer<typeof prioritySchema>;

export const messageSchema = z.object({
  id: z.string(),
  from: z.string(),
  at: z.iso.datetime(),
  body: z.string(),
});

type Message = z.infer<typeof messageSchema>;

export const threadSchema = z.object({
  id: z.string(),
  subject: z.string(),
  participants: z.array(z.string()),
  labels: z.array(z.string()),
  priority: prioritySchema,
  starred: z.boolean(),
  archived: z.boolean(),
  unread: z.boolean(),
  messages: z.array(messageSchema),
});

export type Thread = z.infer<typeof threadSchema>;

/** Display name used for messages authored in the reply composer. */
export const ME = "You";

const lastMessage = (thread: Thread): Message | undefined => thread.messages.at(-1);

export const threadSnippet = (thread: Thread, maxLength = 120): string => {
  const body = lastMessage(thread)?.body ?? "";
  const flat = body.replaceAll(/\s+/g, " ").trim();
  return flat.length > maxLength ? `${flat.slice(0, maxLength).trimEnd()}…` : flat;
};

/** Sender to show in the thread list: the most recent counterparty. */
export const threadSender = (thread: Thread): string => {
  const other = thread.messages.findLast((message) => message.from !== ME);
  return (other ?? lastMessage(thread))?.from ?? "Unknown";
};

export const threadLastActivity = (thread: Thread): string =>
  lastMessage(thread)?.at ?? new Date(0).toISOString();
