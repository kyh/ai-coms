import { defineTool } from "eve/tools";

import { markThreadsInputSchema, markThreadsPayloadSchema } from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    'Mark threads as unread (unread: true) or read (unread: false). Use for "mark everything as read", "mark that one unread so I come back to it".',
  inputSchema: markThreadsInputSchema,
  outputSchema: markThreadsPayloadSchema,
  // Stateless: the client owns the mailbox and no-ops on unknown ids.
  execute: (input) => input,
  toModelOutput: (output) => ({
    type: "text",
    value: `Successfully marked ${output.threadIds.length} thread${output.threadIds.length === 1 ? "" : "s"} as ${output.unread ? "unread" : "read"}.`,
  }),
});
