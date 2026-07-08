import { defineTool } from "eve/tools";

import { markReadInputSchema, markReadPayloadSchema } from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    'Mark conversations as read, clearing their unread badges. Use for "clear my unreads", "mark #random read". Batch every conversation id into one call. Do not call this just because you summarized a channel — only when the user asks to clear unreads.',
  inputSchema: markReadInputSchema,
  outputSchema: markReadPayloadSchema,
  // Stateless: the client owns the workspace and no-ops on unknown ids.
  execute: (input) => input,
  toModelOutput: (output) => ({
    type: "text",
    value: `Successfully marked ${output.conversationIds.length} conversation${output.conversationIds.length === 1 ? "" : "s"} as read.`,
  }),
});
