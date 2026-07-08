import { defineTool } from "eve/tools";

// Relative import: agent/ is compiled by eve, which resolves plain relative
// paths but not tsconfig `@/*` aliases. Domain schemas stay in src/lib.
import {
  draftMessageInputSchema,
  draftMessagePayloadSchema,
} from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    "Write a message draft into a conversation's composer and open that conversation. Use when the user asks you to draft, write, or reply to someone in a channel or DM. The draft is placed in the composer for the user to review — it is NEVER sent. Write only the message body, in the user's own voice, matching the conversation's tone.",
  inputSchema: draftMessageInputSchema,
  outputSchema: draftMessagePayloadSchema,
  // Stateless: the client owns the workspace, puts the draft in the composer,
  // and surfaces an error toast if the conversation no longer exists.
  execute: (input) => input,
  toModelOutput: (output) => ({
    type: "text",
    value: `Successfully drafted a message for conversation ${output.conversationId}. The draft is in the composer awaiting the user's review.`,
  }),
});
