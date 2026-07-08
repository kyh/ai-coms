import { defineTool } from "eve/tools";

import {
  archiveThreadsInputSchema,
  archiveThreadsPayloadSchema,
} from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    'Archive (value: true) or unarchive (value: false) threads. Use for "archive the newsletters", "clean up my inbox", "move it back to the inbox". Batch all thread ids into one call.',
  inputSchema: archiveThreadsInputSchema,
  outputSchema: archiveThreadsPayloadSchema,
  // Stateless: the client owns the mailbox and no-ops on unknown ids.
  execute: (input) => input,
  toModelOutput: (output) => ({
    type: "text",
    value: `Successfully ${output.value ? "archived" : "unarchived"} ${output.threadIds.length} thread${output.threadIds.length === 1 ? "" : "s"}.`,
  }),
});
