import { defineTool } from "eve/tools";

// Relative import: agent/ is compiled by eve, which resolves plain relative
// paths but not tsconfig `@/*` aliases. Domain schemas stay in src/lib.
import {
  triageThreadsInputSchema,
  triageThreadsPayloadSchema,
} from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    'Assign priority and labels to one or more threads. Use for "triage my inbox", "prioritize", "label", or any request to organize threads. Batch all threads into a single call. Follow the triage rubric in your instructions; reuse existing mailbox labels where they fit. Labels are additive — they are merged with the thread\'s existing labels.',
  inputSchema: triageThreadsInputSchema,
  outputSchema: triageThreadsPayloadSchema,
  // The tool is stateless: the client owns the mailbox and applies the
  // updates when it receives them (unknown thread ids are ignored there).
  execute: (input) => input,
  toModelOutput: (output) => ({
    type: "text",
    value: `Successfully triaged ${output.updates.length} thread${output.updates.length === 1 ? "" : "s"}.`,
  }),
});
