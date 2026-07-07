import { z } from "zod";

import { prioritySchema } from "@/lib/thread";

/**
 * The client<->server streaming contract. Each tool writes exactly one of
 * these data parts; the client zod-parses every payload in onData before
 * mutating the store. Wire types carry a `data-` prefix ("data-triage-threads");
 * the DataPart map keys do not.
 */

export const triageUpdateSchema = z.object({
  threadId: z.string(),
  priority: prioritySchema,
  labels: z.array(z.string()),
});

export const triageThreadsDataSchema = z.object({
  updates: z.array(triageUpdateSchema),
});

export const draftReplyDataSchema = z.object({
  threadId: z.string(),
  draft: z.string(),
});

export const archiveThreadsDataSchema = z.object({
  threadIds: z.array(z.string()),
  value: z.boolean(),
});

export const starThreadsDataSchema = z.object({
  threadIds: z.array(z.string()),
  value: z.boolean(),
});

export const markThreadsDataSchema = z.object({
  threadIds: z.array(z.string()),
  unread: z.boolean(),
});

export type DataPart = {
  "triage-threads": z.infer<typeof triageThreadsDataSchema>;
  "draft-reply": z.infer<typeof draftReplyDataSchema>;
  "archive-threads": z.infer<typeof archiveThreadsDataSchema>;
  "star-threads": z.infer<typeof starThreadsDataSchema>;
  "mark-threads": z.infer<typeof markThreadsDataSchema>;
};

/** Schemas keyed by (unprefixed) data part name, for validateUIMessages. */
export const dataPartSchemas: { [K in keyof DataPart]: z.ZodType<DataPart[K]> } = {
  "triage-threads": triageThreadsDataSchema,
  "draft-reply": draftReplyDataSchema,
  "archive-threads": archiveThreadsDataSchema,
  "star-threads": starThreadsDataSchema,
  "mark-threads": markThreadsDataSchema,
};
