# Agent Instructions

AI-native communications app: a unified inbox you manage by talking to it. Forkable Next.js template.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **UI**: Tailwind CSS v4, shadcn/ui **base-vega** style (Base UI primitives via `@base-ui/react` — NOT Radix), lucide icons, sonner toasts
- **AI**: Vercel AI SDK `ai@6` + `@ai-sdk/react` — `ToolLoopAgent` + streamed data parts; `@loremllm/transport` for keyless demo mode
- **State**: zustand (persisted to localStorage, zod-validated on read)
- **Package Manager**: pnpm

## Project Structure

```
src/
├── ai/
│   ├── gateway.ts               # MODEL_ID + createModel(apiKey) — single model wiring point
│   ├── agents/coms-agent.ts     # ToolLoopAgent factory; tools write data parts
│   ├── agents/coms-agent-prompt.ts
│   ├── messages/data-parts.ts   # zod schemas + DataPart map — client<->server contract
│   ├── messages/{metadata,types}.ts
│   └── response/stream-chat-response.ts
├── app/
│   ├── api/chat/route.ts        # zod-parsed body, key resolution, delegates to streamChatResponse
│   ├── {layout,page,sitemap}.tsx|ts, robots.txt/route.ts
├── components/
│   ├── chat/                    # chat-panel (useChat + onData), api-key-dialog, demo-transport
│   ├── mail/                    # coms-app shell, mail-sidebar, thread-list, thread-view
│   └── ui/                      # shadcn base-vega components (CLI-managed)
├── hooks/use-local-storage.ts
└── lib/                         # thread schemas, seed data, zustand store, mailbox context
```

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # oxlint
pnpm format:fix   # oxfmt
```

## Conventions

- Path alias: `@/*` -> `./src/*`; kebab-case filenames for all TS/TSX
- **No `any`, no `!`, no `as` assertions** — zod-parse at every boundary (request body, onData payloads, localStorage)
- UI components ONLY via `pnpm dlx shadcn@latest add <name>` (components.json routes to base-vega); Base UI uses the `render` prop, never `asChild`
- AI flow: client ships `mailboxContext` in the request body (stateless server) → agent tools `writer.write` `data-*` parts → client `onData` zod-parses and mutates the store
- Keys: `AI_GATEWAY_API_KEY` env in dev; users bring their own Vercel Gateway key in prod (or the `"demo"` key for the scripted transport)
