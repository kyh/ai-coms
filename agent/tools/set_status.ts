import { defineTool } from "eve/tools";

import { setStatusInputSchema, setStatusPayloadSchema } from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    'Set the user\'s workspace status — the emoji and short text shown under their name in the sidebar. Use for "set my status to in a meeting", "tell people I\'m heads down until 3". Pick a fitting emoji when the user does not name one.',
  inputSchema: setStatusInputSchema,
  outputSchema: setStatusPayloadSchema,
  // Stateless: the client owns the workspace and renders the status.
  execute: (input) => input,
  toModelOutput: (output) => ({
    type: "text",
    value: `Successfully set the user's status to ${output.emoji} ${output.text}.`,
  }),
});
