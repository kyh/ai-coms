import { defineTool } from "eve/tools";

import {
  createChannelInputSchema,
  createChannelPayloadSchema,
} from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    'Create a new channel in the workspace and switch to it. Use for "make a channel for the postmortem", "spin up #launch". Give the channel a short slug-friendly name (no leading "#") and a one-sentence purpose. The channel starts with only the user in it.',
  inputSchema: createChannelInputSchema,
  outputSchema: createChannelPayloadSchema,
  // Stateless: the client owns the workspace. It slugifies the name, rejects
  // duplicates with a toast, and creates the channel otherwise.
  execute: (input) => input,
  toModelOutput: (output) => ({
    type: "text",
    value: `Requested a new channel #${output.name}. The client creates it unless a channel with that name already exists, in which case the user sees a collision warning.`,
  }),
});
