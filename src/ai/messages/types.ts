import type { UIMessage, UIMessageStreamWriter } from "ai";
import type { z } from "zod";

import type {
  archiveThreadsDataSchema,
  DataPart,
  draftReplyDataSchema,
  markThreadsDataSchema,
  starThreadsDataSchema,
  triageThreadsDataSchema,
} from "@/ai/messages/data-parts";

/**
 * UI tool typings for the agent's tool set — lets the chat transcript
 * narrow `tool-*` message parts without casts.
 */
export type ChatTools = {
  triageThreads: { input: z.infer<typeof triageThreadsDataSchema>; output: string };
  draftReply: { input: z.infer<typeof draftReplyDataSchema>; output: string };
  archiveThreads: { input: z.infer<typeof archiveThreadsDataSchema>; output: string };
  starThreads: { input: z.infer<typeof starThreadsDataSchema>; output: string };
  markThreads: { input: z.infer<typeof markThreadsDataSchema>; output: string };
};

export type ChatUIMessage = UIMessage<unknown, DataPart, ChatTools>;

export type ChatStreamWriter = UIMessageStreamWriter<ChatUIMessage>;
