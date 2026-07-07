import { validateUIMessages } from "ai";
import { z } from "zod";

import { dataPartSchemas } from "@/ai/messages/data-parts";
import type { ComsChatUIMessage } from "@/ai/messages/types";
import { streamChatResponse } from "@/ai/response/stream-chat-response";
import { mailboxContextSchema } from "@/lib/mailbox-context";

const bodySchema = z.object({
  messages: z.array(z.unknown()),
  gatewayApiKey: z.string().optional(),
  mailboxContext: mailboxContextSchema,
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  let messages: ComsChatUIMessage[];
  try {
    body = bodySchema.parse(await request.json());
    messages = await validateUIMessages<ComsChatUIMessage>({
      messages: body.messages,
      dataSchemas: dataPartSchemas,
    });
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  // Key resolution: dev uses the env key; prod accepts the SECRET_KEY
  // sentinel (swapped for the env key) or the user's own gateway key.
  const isLocal = process.env.NODE_ENV === "development";
  const isSecretKey = !!process.env.SECRET_KEY && body.gatewayApiKey === process.env.SECRET_KEY;
  const apiKey = isSecretKey || isLocal ? process.env.AI_GATEWAY_API_KEY : body.gatewayApiKey;

  if (!apiKey) {
    return new Response("Gateway API key is required", { status: 400 });
  }

  return streamChatResponse(messages, apiKey, body.mailboxContext);
}
