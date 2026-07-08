import { defineTool } from "eve/tools";

import { draftReplyInputSchema, draftReplyPayloadSchema } from "../../src/lib/assistant-schemas";

export default defineTool({
  description:
    "Write a reply draft into a thread's composer. Use when the user asks you to draft, write, or reply to something. The draft is placed in the composer for the user to review — it is NOT sent. Write only the message body (no subject line, no \"To:\" headers). Match the thread's tone and answer its open questions.",
  inputSchema: draftReplyInputSchema,
  outputSchema: draftReplyPayloadSchema,
  // Stateless: the client puts the draft in the thread's composer and
  // surfaces an error toast if the thread no longer exists.
  execute: (input) => input,
  toModelOutput: (output) => ({
    type: "text",
    value: `Successfully drafted a reply for thread ${output.threadId}. The draft is in the composer awaiting the user's review.`,
  }),
});
