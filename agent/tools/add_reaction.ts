import { defineTool } from "eve/tools";

import { addReactionInputSchema, addReactionPayloadSchema } from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    'React to a message as the user. Use for "react with a checkmark to Tomás\'s resolution", "👍 that". Pass a message id from the workspace context — never invent one. Reacting with an emoji the user has already used on that message removes the reaction.',
  inputSchema: addReactionInputSchema,
  outputSchema: addReactionPayloadSchema,
  // Stateless: the client owns the workspace and no-ops on unknown ids.
  execute: (input) => input,
  toModelOutput: (output) => ({
    type: "text",
    value: `Successfully reacted with ${output.emoji} to message ${output.messageId}.`,
  }),
});
