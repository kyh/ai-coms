import type { UIMessage, UIMessageStreamWriter } from "ai";
import type { z } from "zod";

import type {
  archiveThreadsDataSchema,
  DataPart,
  draftReplyDataSchema,
  markThreadsDataSchema,
  starThreadsDataSchema,
  triageThreadsDataSchema,
} from "./data-parts";
import type { Metadata } from "./metadata";

/**
 * Tool input/output shapes as they appear in UI messages. Typed (instead of
 * `never`) so the chat transcript can render tool activity.
 */
export type ComsToolSet = {
  triageThreads: { input: z.infer<typeof triageThreadsDataSchema>; output: string };
  draftReply: { input: z.infer<typeof draftReplyDataSchema>; output: string };
  archiveThreads: { input: z.infer<typeof archiveThreadsDataSchema>; output: string };
  starThreads: { input: z.infer<typeof starThreadsDataSchema>; output: string };
  markThreads: { input: z.infer<typeof markThreadsDataSchema>; output: string };
};

export type ComsChatUIMessage = UIMessage<Metadata, DataPart, ComsToolSet>;

export type ComsStreamWriter = UIMessageStreamWriter<ComsChatUIMessage>;
