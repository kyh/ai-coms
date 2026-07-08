import { z } from "zod";

// Relative (not `@/`) so eve's compiler can bundle this module for agent
// tools — eve does not read tsconfig path aliases.
import { prioritySchema } from "./thread";

// -----------------------------------------------------------------------------
// The client<->agent contract, shared by both sides:
// - `agent/tools/*.ts` use the input schemas as `inputSchema` and the payload
//   schemas as `outputSchema` (what `execute` returns).
// - The chat panel zod-parses every `action.result` tool output against the
//   payload schemas before touching the zustand store.
// Note: agent/ lives outside src/, so tools import this file relatively
// (`../../src/lib/assistant-schemas`) — eve's compiler does not read
// tsconfig path aliases.
// -----------------------------------------------------------------------------

export const triageUpdateSchema = z.object({
  threadId: z.string().describe("Exact thread id from the mailbox context"),
  priority: prioritySchema.describe("Priority per the triage rubric"),
  labels: z
    .array(z.string())
    .describe("Short lowercase labels to add — merged with the thread's existing labels"),
});

export const triageThreadsInputSchema = z.object({
  updates: z.array(triageUpdateSchema).describe("One entry per thread being triaged"),
});

export const draftReplyInputSchema = z.object({
  threadId: z.string().describe("Exact id of the thread to draft a reply in"),
  draft: z.string().describe("The reply body only — no subject line, no 'To:' headers"),
});

export const archiveThreadsInputSchema = z.object({
  threadIds: z.array(z.string()).describe("Exact thread ids from the mailbox context"),
  value: z.boolean().describe("true = archive, false = unarchive"),
});

export const starThreadsInputSchema = z.object({
  threadIds: z.array(z.string()).describe("Exact thread ids from the mailbox context"),
  value: z.boolean().describe("true = star, false = unstar"),
});

export const markThreadsInputSchema = z.object({
  threadIds: z.array(z.string()).describe("Exact thread ids from the mailbox context"),
  unread: z.boolean().describe("true = mark unread, false = mark read"),
});

// The tools are stateless: the client owns the mailbox, so every tool echoes
// its validated input and the chat panel applies it to the store.

/** `triage_threads` tool output: the applied updates, echoed back. */
export const triageThreadsPayloadSchema = triageThreadsInputSchema;
/** `draft_reply` tool output: the draft, echoed back for the open thread's composer. */
export const draftReplyPayloadSchema = draftReplyInputSchema;
/** `archive_threads` tool output: the applied change, echoed back. */
export const archiveThreadsPayloadSchema = archiveThreadsInputSchema;
/** `star_threads` tool output: the applied change, echoed back. */
export const starThreadsPayloadSchema = starThreadsInputSchema;
/** `mark_threads` tool output: the applied change, echoed back. */
export const markThreadsPayloadSchema = markThreadsInputSchema;
