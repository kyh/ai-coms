# Agent Instructions

AI-native team-chat app: a Slack-style workspace you keep up with by talking to it. Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, eve (Vercel's agent framework) + `ai@7`.

## Tech Stack

- **Framework**: Next.js 16, React 19
- **UI**: Tailwind v4, shadcn/ui **base-vega** style (Base UI primitives — `@base-ui/react`, `render` prop, NOT Radix), lucide icons, sonner toasts
- **AI**: `eve` (agent runtime, `withEve` Next integration, `useEveAgent` client hook) via Vercel AI Gateway (`openai/gpt-5.1-instant`); BYO-key via bearer auth + dynamic model resolver
- **State**: zustand + localStorage persist (zod-validated on rehydrate)
- **Package Manager**: pnpm

## Architecture

```
agent/agent.ts                  # defineAgent: model + step.started BYO-key resolver + limits
agent/instructions.md           # system prompt (persona, per-turn context contract, etiquette)
agent/channels/eve.ts           # eve's TRANSPORT channel — auth walk: gatewayKeyBearer → vercelOidc → localDev
                                #   NOT a chat channel. Domain channels live in src/lib/workspace.ts.
agent/tools/draft_message.ts    # defineTool; snake_case filename = tool name
agent/tools/{create_channel,add_reaction,mark_read,set_status}.ts
agent/tools/<builtin>.ts        # disableTool() sentinels (bash, web_fetch, …)
src/lib/workspace.ts            # zod domain: users, messages, conversation = channel | dm (discriminated union)
                                #   + pure helpers: unreadCount, rootMessages, threadReplies, messageGroups
src/lib/workspace-store.ts      # zustand store, seeds from src/lib/seed-workspace.ts
src/lib/workspace-context.ts    # per-turn app state (conversation digest + active conversation + open thread)
src/lib/assistant-schemas.ts    # zod contract: tool input + payload schemas (shared both sides)
src/components/chat/chat-panel.tsx  # useEveAgent bridge: clientContext out, action.result in
src/components/chat/api-key-dialog.tsx
src/components/workspace/       # coms-app shell, workspace-sidebar, conversation-view,
                                #   message-list (grouping + reactions), message-composer,
                                #   thread-pane, create-channel-dialog, presence-dot, user-avatar
```

Flow: chat panel `send({ message, clientContext: workspaceDigest })` → eve channel authenticates (user bearer key / OIDC / localhost) → dynamic model resolver picks the user's gateway key from session auth (fallback: server `AI_GATEWAY_API_KEY`) → tools return structured payloads → client `onEvent` zod-parses `action.result` events → store mutation + sonner toast. `draft_message` lands in the conversation's composer for review — nothing is ever sent automatically. Summaries and "catch me up" are answered as prose from the per-turn context; no tool is involved.

## Domain notes

- A `Conversation` is a discriminated union on `kind`: `channel` (name, purpose, memberIds, muted) or `dm` (userId). There is no optional-field soup — never widen it.
- Thread replies are ordinary messages with a `parentId`; they live in the same flat `messages` array as their parent.
- Unread = messages after a conversation's `lastReadAt` not authored by `ME`. Opening a conversation marks it read.
- The thread pane overlays the assistant panel so the assistant stays mounted and keeps its transcript.

## Commands

```bash
pnpm dev          # dev server — boots Next.js AND the eve agent runtime
pnpm verify       # typecheck · lint · format (the only gate; this repo has no CI)
pnpm typecheck    # tsc --noEmit (covers agent/ too)
pnpm lint         # oxlint (warnings are errors)
pnpm format       # oxfmt --check
pnpm format:fix   # oxfmt --write
pnpm build        # production build (Next). Vercel builds the eve service via withEve
```

**NEVER run `eve build` while `pnpm dev` is running** — it corrupts the eve dev workflow cache. If dev breaks mysteriously: delete `.eve/` + `.workflow-data/` and restart.

## Agent-driven development

`AGENTS.md` is the full workflow (tool-agnostic, meant to be run). The essentials:

- **Provisioning is `pnpm install`.** No database, no auth, no Docker, no bootstrap script — the workspace seeds itself into `localStorage["ai-coms-workspace"]` on first page load, so "open the page" is this repo's seeded-login analogue. "Reset demo data" in the sidebar restores the fixture.
- **Verify**: `pnpm verify` for the static gate, then drive the running app with `agent-browser` — web is the only surface and it is fully headless-driveable. There is no CI here, so `pnpm verify` is the only gate.
- **Assistant turns need `AI_GATEWAY_API_KEY` in `.env.local`.** In dev only the pre-send gate is bypassed; without a key the turn still fails at the model call and `onError` pops an "Invalid API key" toast **plus the modal key dialog** — expected, not a regression, but it blocks browser automation until cancelled. Every non-AI surface verifies offline.
- **Never assert on rendered timestamps** — the seed computes every `at` relative to `Date.now()` at first load. Assert on message bodies, channel names, unread counts.

## Conventions

- Path alias: `@/*` → `./src/*` — but files imported by `agent/` code MUST use relative imports (eve's compiler doesn't read tsconfig paths)
- kebab-case filenames for TS/TSX; `agent/tools/*` are snake_case (eve derives tool names from filenames)
- No `any`, no `!`, no `as` — zod-parse at boundaries (stream events, tool payloads, localStorage)
- Add ui components ONLY via `pnpm dlx shadcn@latest add <name>` (base-vega registry); never hand-copy
- Base UI idioms: `render` prop (not `asChild`), `data-open:`/`data-closed:` variants
