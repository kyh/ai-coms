import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from "ai";

import { createComsAgent } from "@/ai/agents/coms-agent";
import type { ChatUIMessage } from "@/ai/messages/types";
import type { MailboxContext } from "@/lib/mailbox-context";

/**
 * Opens a UI-message stream, runs the agent over the conversation, and
 * merges the agent's output (text + tool `data-*` parts) back into the
 * same stream. The per-turn app context is appended to the agent's
 * instructions server-side; the server keeps no state.
 */
export function streamChatResponse(
  messages: ChatUIMessage[],
  apiKey: string,
  mailboxContext: MailboxContext,
) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream<ChatUIMessage>({
      originalMessages: messages,
      execute: async ({ writer }) => {
        const agent = createComsAgent({ apiKey, writer, mailboxContext });
        const result = await agent.stream({
          messages: await convertToModelMessages(messages),
        });
        void result.consumeStream();
        writer.merge(result.toUIMessageStream({ sendReasoning: true }));
      },
    }),
  });
}
