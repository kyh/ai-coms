import { z } from "zod";

import {
  messageSchema,
  prioritySchema,
  threadLastActivity,
  threadSender,
  threadSnippet,
  type Thread,
} from "@/lib/thread";

/**
 * The dynamic state the client ships with every chat request. The server is
 * stateless: this digest (plus the open thread's full messages) is appended to
 * the agent's instructions so it can reason about the actual mailbox.
 */

const threadDigestSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  labels: z.array(z.string()),
  priority: prioritySchema,
  unread: z.boolean(),
  starred: z.boolean(),
  archived: z.boolean(),
  lastActivity: z.string(),
  snippet: z.string(),
});

const openThreadContextSchema = z.object({
  id: z.string(),
  subject: z.string(),
  participants: z.array(z.string()),
  messages: z.array(messageSchema),
});

export const mailboxContextSchema = z.object({
  /** Current datetime, ISO 8601 with UTC instant. */
  now: z.string(),
  /** IANA timezone, e.g. "America/Los_Angeles". */
  timeZone: z.string(),
  threads: z.array(threadDigestSchema),
  openThread: openThreadContextSchema.optional(),
});

export type MailboxContext = z.infer<typeof mailboxContextSchema>;

/** Client side: build the compact digest sent in the request body. */
export const buildMailboxContext = (
  threads: Thread[],
  openThreadId: string | null,
): MailboxContext => {
  const openThread = threads.find((thread) => thread.id === openThreadId);
  return {
    now: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    threads: threads.map((thread) => ({
      id: thread.id,
      subject: thread.subject,
      from: threadSender(thread),
      labels: thread.labels,
      priority: thread.priority,
      unread: thread.unread,
      starred: thread.starred,
      archived: thread.archived,
      lastActivity: threadLastActivity(thread),
      snippet: threadSnippet(thread),
    })),
    ...(openThread
      ? {
          openThread: {
            id: openThread.id,
            subject: openThread.subject,
            participants: openThread.participants,
            messages: openThread.messages,
          },
        }
      : {}),
  };
};
