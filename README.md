# AI Coms

AI-native communications — a unified inbox you manage by talking to it. Triage, summarize, archive, and draft replies in natural language. Forkable Next.js + Vercel AI SDK template.

![AI Coms](public/og.jpg)

## Features

- **Three-pane inbox**: folders + labels, thread list with priority/label badges and unread state, thread view with reply composer
- **AI assistant dock** (`⌘K`): "Triage my inbox", "Summarize the thread with Acme", "Draft a polite decline to the recruiter" — the agent mutates the mailbox through streamed data parts
- **Drafts, not sends**: AI-written replies land in the composer for review; nothing is sent on your behalf
- **Manual controls**: star, archive, read/unread, labels, priority — everything the AI does, you can do by hand
- **Local-first demo data**: ~15 hand-authored threads seeded into localStorage; reset anytime from the sidebar
- **Keyless demo mode**: enter the `demo` key to replay a scripted triage exchange with no API key

## Setup

```bash
pnpm install
echo 'AI_GATEWAY_API_KEY=vck_...' > .env.local   # optional: SECRET_KEY=... for a shared prod sentinel
pnpm dev
```

In development the server uses `AI_GATEWAY_API_KEY`. In production, users supply their own [Vercel AI Gateway key](https://vercel.com/docs/ai-gateway) via the in-app dialog (stored in localStorage), or click "Use a demo key" for scripted responses.

## Architecture

```
src/ai/gateway.ts                     model wiring (openai/gpt-5.1-instant via AI Gateway)
src/ai/agents/coms-agent.ts           ToolLoopAgent: triageThreads, draftReply,
                                      archiveThreads, starThreads, markThreads
src/ai/messages/data-parts.ts         zod schemas + DataPart map — the client<->server contract
src/ai/response/stream-chat-response.ts  createUIMessageStream + writer.merge
src/app/api/chat/route.ts             zod-parsed body, API-key resolution
src/components/chat/chat-panel.tsx    useChat + onData → zod-parse → zustand mutations + toasts
src/components/chat/demo-transport.ts StaticChatTransport scripted flow (key "demo")
src/lib/thread-store.ts               zustand store, persisted + zod-validated
src/lib/mailbox-context.ts            per-request mailbox digest shipped to the stateless server
```

Each agent tool emits exactly one `data-*` part; the client zod-parses every payload in `onData` before touching the store. The server holds no state — the client sends a compact mailbox digest (plus the open thread's full messages) with every request.

## Notes

- `public/og.jpg` is a placeholder — replace it with your own 1920x1080 image.
- UI components are shadcn **base-vega** (Base UI). Add more via `pnpm dlx shadcn@latest add <name>`.
