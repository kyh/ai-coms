import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from "ai";

import { createComsAgent } from "../agents/coms-agent";
import type { ComsChatUIMessage } from "../messages/types";
import type { MailboxContext } from "@/lib/mailbox-context";

/**
 * Server stream plumbing: run the ToolLoopAgent and merge its UI message
 * stream (text + tool parts + data parts) into a single response stream.
 */
export const streamChatResponse = (
  messages: ComsChatUIMessage[],
  apiKey: string,
  mailboxContext: MailboxContext,
) =>
  createUIMessageStreamResponse({
    stream: createUIMessageStream({
      originalMessages: messages,
      execute: async ({ writer }) => {
        const agent = createComsAgent({ apiKey, writer, mailboxContext });

        const result = await agent.stream({
          messages: await convertToModelMessages(messages),
        });

        void result.consumeStream();

        writer.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
    }),
  });
