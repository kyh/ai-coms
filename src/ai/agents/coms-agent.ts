import { stepCountIs, tool, ToolLoopAgent } from "ai";
import { z } from "zod";

import { createModel } from "../gateway";
import {
  archiveThreadsDataSchema,
  draftReplyDataSchema,
  markThreadsDataSchema,
  starThreadsDataSchema,
  triageUpdateSchema,
} from "../messages/data-parts";
import type { ComsStreamWriter } from "../messages/types";
import { formatMailboxContext, type MailboxContext } from "@/lib/mailbox-context";
import comsPrompt from "./coms-agent-prompt";

/**
 * Every tool follows the same idiom: validate input, write one data part to
 * the UI message stream (the client applies it to the zustand store), and
 * return a short text ack to the model.
 */

type WriterParams = {
  writer: ComsStreamWriter;
};

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

function createTriageThreadsTool({ writer }: WriterParams) {
  return tool({
    description: `Assign priority and labels to one or more threads. Use for "triage my inbox", "prioritize", "label", or any request to organize threads. Batch all threads into a single call. Follow the triage rubric in your instructions; reuse existing mailbox labels where they fit. Labels are additive — they are merged with the thread's existing labels.`,
    inputSchema: z.object({
      updates: z.array(triageUpdateSchema),
    }),
    execute: async ({ updates }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: "data-triage-threads",
        data: { updates },
      });
      return `Successfully triaged ${count(updates.length, "thread")}.`;
    },
  });
}

function createDraftReplyTool({ writer }: WriterParams) {
  return tool({
    description: `Write a reply draft into a thread's composer. Use when the user asks you to draft, write, or reply to something. The draft is placed in the composer for the user to review — it is NOT sent. Write only the message body (no subject line, no "To:" headers). Match the thread's tone and answer its open questions.`,
    inputSchema: draftReplyDataSchema,
    execute: async ({ threadId, draft }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: "data-draft-reply",
        data: { threadId, draft },
      });
      return `Successfully drafted a reply for thread ${threadId}. The draft is in the composer awaiting the user's review.`;
    },
  });
}

function createArchiveThreadsTool({ writer }: WriterParams) {
  return tool({
    description: `Archive (value: true) or unarchive (value: false) threads. Use for "archive the newsletters", "clean up my inbox", "move it back to the inbox". Batch all thread ids into one call.`,
    inputSchema: archiveThreadsDataSchema,
    execute: async ({ threadIds, value }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: "data-archive-threads",
        data: { threadIds, value },
      });
      return `Successfully ${value ? "archived" : "unarchived"} ${count(threadIds.length, "thread")}.`;
    },
  });
}

function createStarThreadsTool({ writer }: WriterParams) {
  return tool({
    description: `Star (value: true) or unstar (value: false) threads. Use when the user wants to flag threads to keep an eye on, or asks you to highlight what matters.`,
    inputSchema: starThreadsDataSchema,
    execute: async ({ threadIds, value }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: "data-star-threads",
        data: { threadIds, value },
      });
      return `Successfully ${value ? "starred" : "unstarred"} ${count(threadIds.length, "thread")}.`;
    },
  });
}

function createMarkThreadsTool({ writer }: WriterParams) {
  return tool({
    description: `Mark threads as unread (unread: true) or read (unread: false). Use for "mark everything as read", "mark that one unread so I come back to it".`,
    inputSchema: markThreadsDataSchema,
    execute: async ({ threadIds, unread }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: "data-mark-threads",
        data: { threadIds, unread },
      });
      return `Successfully marked ${count(threadIds.length, "thread")} as ${unread ? "unread" : "read"}.`;
    },
  });
}

type CreateComsAgentParams = {
  apiKey: string;
  writer: ComsStreamWriter;
  mailboxContext: MailboxContext;
};

export function createComsAgent({ apiKey, writer, mailboxContext }: CreateComsAgentParams) {
  return new ToolLoopAgent({
    model: createModel(apiKey),
    instructions: `${comsPrompt}\n\n${formatMailboxContext(mailboxContext)}`,
    tools: {
      triageThreads: createTriageThreadsTool({ writer }),
      draftReply: createDraftReplyTool({ writer }),
      archiveThreads: createArchiveThreadsTool({ writer }),
      starThreads: createStarThreadsTool({ writer }),
      markThreads: createMarkThreadsTool({ writer }),
    },
    toolChoice: "auto",
    stopWhen: stepCountIs(5),
  });
}
