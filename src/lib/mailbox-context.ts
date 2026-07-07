import { z } from "zod";

import {
  messageSchema,
  prioritySchema,
  threadSender,
  threadSnippet,
  threadLastActivity,
  type Thread,
} from "./thread";

/**
 * The dynamic state the client ships with every chat request. The server is
 * stateless: this digest (plus the open thread's full messages) is appended to
 * the agent's instructions so it can reason about the actual mailbox.
 */

export const threadDigestSchema = z.object({
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

export const openThreadContextSchema = z.object({
  id: z.string(),
  subject: z.string(),
  participants: z.array(z.string()),
  messages: z.array(messageSchema),
});

export const mailboxContextSchema = z.object({
  now: z.string(),
  timezone: z.string(),
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
    now: new Date().toString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

/** Server side: render the digest into instruction text for the agent. */
export const formatMailboxContext = (context: MailboxContext): string => {
  const lines = context.threads.map((thread) => {
    const flags = [
      thread.unread ? "unread" : "read",
      thread.starred ? "starred" : null,
      thread.archived ? "archived" : null,
    ].filter((flag): flag is string => flag !== null);
    const labels = thread.labels.length > 0 ? thread.labels.join(", ") : "none";
    return [
      `- id: ${thread.id}`,
      `  subject: ${thread.subject}`,
      `  from: ${thread.from} | last activity: ${thread.lastActivity}`,
      `  priority: ${thread.priority} | labels: ${labels} | ${flags.join(", ")}`,
      `  snippet: ${thread.snippet}`,
    ].join("\n");
  });

  const sections = [
    `## Current mailbox\n\nCurrent datetime: ${context.now} (timezone: ${context.timezone})\n\nThreads (${context.threads.length}):\n${lines.join("\n")}`,
  ];

  if (context.openThread) {
    const messages = context.openThread.messages
      .map((message) => `From: ${message.from}\nAt: ${message.at}\n${message.body}`)
      .join("\n\n---\n\n");
    sections.push(
      `## Currently open thread\n\nThe user is looking at thread "${context.openThread.id}" (${context.openThread.subject}) with participants: ${context.openThread.participants.join(", ")}.\n\nFull messages:\n\n${messages}`,
    );
  }

  return sections.join("\n\n");
};
