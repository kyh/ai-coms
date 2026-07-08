import { defineTool } from "eve/tools";

import { starThreadsInputSchema, starThreadsPayloadSchema } from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    "Star (value: true) or unstar (value: false) threads. Use when the user wants to flag threads to keep an eye on, or asks you to highlight what matters.",
  inputSchema: starThreadsInputSchema,
  outputSchema: starThreadsPayloadSchema,
  // Stateless: the client owns the mailbox and no-ops on unknown ids.
  execute: (input) => input,
  toModelOutput: (output) => ({
    type: "text",
    value: `Successfully ${output.value ? "starred" : "unstarred"} ${output.threadIds.length} thread${output.threadIds.length === 1 ? "" : "s"}.`,
  }),
});
