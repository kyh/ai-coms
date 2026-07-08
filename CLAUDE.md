# Agent Instructions

AI-native communications app: a unified inbox you manage by talking to it. Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, eve (Vercel's agent framework) + `ai@7`.

## Tech Stack

- **Framework**: Next.js 16, React 19
- **UI**: Tailwind v4, shadcn/ui **base-vega** style (Base UI primitives — `@base-ui/react`, `render` prop, NOT Radix), lucide icons, sonner toasts
- **AI**: `eve` (agent runtime, `withEve` Next integration, `useEveAgent` client hook) via Vercel AI Gateway (`openai/gpt-5.1-instant`); BYO-key via bearer auth + dynamic model resolver
- **State**: zustand + localStorage persist (zod-validated on rehydrate)
- **Package Manager**: pnpm

## Architecture

```
agent/agent.ts                  # defineAgent: model + step.started BYO-key resolver + limits
agent/instructions.md           # system prompt (triage rubric, drafting style, per-turn context contract)
agent/channels/eve.ts           # auth walk: gatewayKeyBearer → vercelOidc → localDev
agent/tools/triage_threads.ts   # defineTool; snake_case filename = tool name
agent/tools/{draft_reply,archive_threads,star_threads,mark_threads}.ts
agent/tools/<builtin>.ts        # disableTool() sentinels (bash, web_fetch, …)
src/lib/assistant-schemas.ts    # zod contract: tool input + payload schemas (shared both sides)
src/lib/mailbox-context.ts      # per-turn app state shape (thread digest + open thread)
src/components/chat/chat-panel.tsx  # useEveAgent bridge: clientContext out, action.result in
src/components/chat/api-key-dialog.tsx
src/components/mail/            # coms-app shell, mail-sidebar, thread-list, thread-view
src/lib/thread-store.ts         # zustand store, seeds from src/lib/seed-threads.ts
```

Flow: chat panel `send({ message, clientContext: mailboxDigest })` → eve channel authenticates (user bearer key / OIDC / localhost) → dynamic model resolver picks the user's gateway key from session auth (fallback: server `AI_GATEWAY_API_KEY`) → tools return structured payloads → client `onEvent` zod-parses `action.result` events → store mutation + sonner toast. `draft_reply` lands in the open thread's composer for review — nothing is ever sent automatically.

## Commands

```bash
pnpm dev          # dev server — boots Next.js AND the eve agent runtime
pnpm build        # production build (Next). Vercel builds the eve service via withEve
pnpm lint         # oxlint
pnpm format:fix   # oxfmt
```

**NEVER run `eve build` while `pnpm dev` is running** — it corrupts the eve dev workflow cache. If dev breaks mysteriously: delete `.eve/` + `.workflow-data/` and restart.

## Conventions

- Path alias: `@/*` → `./src/*` — but files imported by `agent/` code MUST use relative imports (eve's compiler doesn't read tsconfig paths)
- kebab-case filenames for TS/TSX; `agent/tools/*` are snake_case (eve derives tool names from filenames)
- No `any`, no `!`, no `as` — zod-parse at boundaries (stream events, tool payloads, localStorage)
- Add ui components ONLY via `pnpm dlx shadcn@latest add <name>` (base-vega registry); never hand-copy
- Base UI idioms: `render` prop (not `asChild`), `data-open:`/`data-closed:` variants
