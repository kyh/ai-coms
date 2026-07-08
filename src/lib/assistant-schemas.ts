import { z } from "zod";

// -----------------------------------------------------------------------------
// The client<->agent contract, shared by both sides:
// - `agent/tools/*.ts` use the input schemas as `inputSchema` and the payload
//   schemas as `outputSchema` (what `execute` returns).
// - The chat panel zod-parses every `action.result` tool output against the
//   payload schemas before touching the zustand store.
// Note: agent/ lives outside src/, so tools import this file relatively
// (`../../src/lib/assistant-schemas`) — eve's compiler does not read
// tsconfig path aliases. Keep this module free of `@/` imports.
// -----------------------------------------------------------------------------

export const draftMessageInputSchema = z.object({
  conversationId: z.string().describe("Exact conversation id from the workspace context"),
  body: z.string().describe("The message body only — no channel prefix, no author name"),
});

export const createChannelInputSchema = z.object({
  name: z.string().describe("Channel name without the leading '#'; it will be slugified"),
  purpose: z.string().describe("One sentence describing what the channel is for"),
});

export const addReactionInputSchema = z.object({
  messageId: z.string().describe("Exact message id from the workspace context"),
  emoji: z.string().describe("A single emoji character, e.g. ✅ or 🎉"),
});

export const markReadInputSchema = z.object({
  conversationIds: z
    .array(z.string())
    .describe("Exact conversation ids from the workspace context"),
});

export const setStatusInputSchema = z.object({
  emoji: z.string().describe("A single emoji for the status, e.g. 🎧"),
  text: z.string().describe("Short status text, e.g. 'Heads down' or 'In a postmortem'"),
});

// The tools are stateless: the client owns the workspace, so every tool echoes
// its validated input and the chat panel applies it to the store.

/** `draft_message` tool output: the draft, echoed back for the conversation's composer. */
export const draftMessagePayloadSchema = draftMessageInputSchema;
/** `create_channel` tool output: the requested channel, echoed back. */
export const createChannelPayloadSchema = createChannelInputSchema;
/** `add_reaction` tool output: the reaction, echoed back. */
export const addReactionPayloadSchema = addReactionInputSchema;
/** `mark_read` tool output: the conversations to mark read, echoed back. */
export const markReadPayloadSchema = markReadInputSchema;
/** `set_status` tool output: the new status, echoed back. */
export const setStatusPayloadSchema = setStatusInputSchema;
