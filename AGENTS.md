# AGENTS.md

**ai-coms** is an AI-native team-chat template: a Slack-style workspace (channels, DMs, threads, reactions) you keep up with by talking to it. One Next.js 16 app, React 19, Tailwind v4, and an [eve](https://eve.dev) agent runtime mounted behind the same origin. This is the tool-agnostic guide for coding agents — it's meant to be run, not just read. Claude also reads `CLAUDE.md`; both point back here.

## Quickstart (headless)

```sh
pnpm install
pnpm dev          # Next.js + the eve agent runtime → http://localhost:3000
```

That's the whole provisioning story. **There is no database, no auth, no Docker, and no bootstrap script** — all state is a zustand store persisted to `localStorage`, and the workspace seeds itself on first page load.

The assistant is the one part that needs a secret: a [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) key.

```sh
echo "AI_GATEWAY_API_KEY=vck_..." > .env.local   # optional; only the assistant needs it
```

Liveness: `curl -s -o /dev/null -w '%{http_code}' localhost:3000` → `200`. There is no `/api/health`; `/` is the only page (plus `/robots.txt` and `/sitemap.xml`).

## Seeded state (this repo's "seeded login")

There is **no login and no seeded account** — the app is single-user and entirely client-side. The analogue of a seeded database is: open the page. `src/lib/workspace-store.ts` rehydrates from `localStorage["ai-coms-workspace"]` and, if it has never seeded, plants the fixture in `src/lib/seed-workspace.ts`:

- 8 people (you are "You"; Priya Raman, Marcus Webb, Tomás Ruiz, Dana Osei, Hana Kobayashi, Sam Achebe, Leah Novak)
- 5 channels — `general`, `engineering`, `design`, `incidents`, `random` (muted) — and 3 DMs
- ~45 messages, landing on `general` with unreads pre-placed: `engineering` **6**, `incidents` **7**, the DM from Marcus Webb **2**

**"Reset demo data"** at the bottom of the sidebar is the `db:reset` analogue — it restores exactly that fixture. Clearing the storage key does the same on next load.

Assertion rule: every seed timestamp is derived from `Date.now()` at first load, so rendered times and day dividers move. **Assert on message bodies, channel names, and unread counts — never on a rendered timestamp.**

## Verify a change end-to-end

Static gate — run before every commit:

```sh
pnpm verify       # typecheck · lint · format
pnpm build        # slower; Next only — Vercel compiles the eve service via withEve
```

`withEve` does **not** compile `agent/` during `pnpm build`; it only writes `.vercel/output/config.json` declaring an `eve` service for Vercel to build later. Locally, `tsc` (via `pnpm typecheck`) is what covers `agent/`. `eve build` is the only real eve compile — and it must never run while `pnpm dev` is up.

This repo has **no CI workflow**, so `pnpm verify` is the only gate that will ever run on your change. `pnpm format` is check-only; use `pnpm format:fix` to actually rewrite.

Runtime — drive the real UI with [agent-browser](https://github.com/vercel-labs/agent-browser). This sequence was run against this commit:

```sh
agent-browser open http://localhost:3000
agent-browser wait 2000                          # let the store rehydrate (see gotchas)
agent-browser find text engineering click        # opens #engineering
agent-browser snapshot -i -c                     # badge gone; READ THE CURRENT REFS HERE
# The thread affordance is the button whose accessible name starts with a reply
# count — on the seeded #engineering it reads `4 replies Last reply …`. Take its
# @eN ref from the snapshot you just printed; the @e21 below is illustrative.
agent-browser scrollintoview @e21
agent-browser click @e21                         # thread pane replaces the assistant rail
agent-browser find role button click "Close thread"
agent-browser find placeholder "Message #engineering" fill "hello from an agent"
agent-browser press Enter                        # sends; the composer clears
agent-browser screenshot /tmp/after.png
```

Prefer content locators (`find text`, `find role`, `find placeholder`) over `@eN` refs wherever they work — they survive renumbering. The one exception is the "N replies" button: `find text "4 replies"` does **not** match it (the text lives in a nested span and the accessible name carries a timestamp), and `find role button click "4 replies"` resolves but the click is a silent no-op while the message is above the fold. Snapshot → `scrollintoview @ref` → `click @ref` is the only sequence that opens the thread.

Everything else in the workspace is reachable the same way and needs no key: reaction pills (bare-count buttons under a message) toggle your reaction, "New channel" creates one, "Reset demo data" restores the fixture, and the assistant rail toggles from the header "Assistant" button or `⌘K` / `Ctrl+K`. To read state instead of the a11y tree:
`agent-browser eval "JSON.parse(localStorage.getItem('ai-coms-workspace')).state.messages.at(-1)"`.

Five gotchas, all observed:

- **Wait for hydration.** First paint is `<AppSkeleton />` until the store rehydrates in an effect. A snapshot taken too early shows only skeletons — re-snapshot (or `agent-browser wait 500`) until a channel name such as `general` appears before asserting anything.
- **`@eN` refs are valid only for the snapshot that produced them.** They are DOM-order artifacts and renumber on every navigation, seed edit, or added control — on `#general` the very same `@e21` is a reaction pill, not the thread button. Re-snapshot immediately before any ref-based step, and never copy a ref out of these docs.
- **The message list is a scroll container pinned to the bottom.** A real mouse click on something above the fold — the "N replies" affordance on an older message, an early reaction pill, an assistant example prompt — silently does nothing and still reports success. `scrollintoview` first, then click.
- **A keyless assistant turn opens a modal.** See below — dismiss it with `find role button click "Cancel"` before continuing, or skip the assistant entirely when no key is configured.
- **Port collisions.** If something else holds `:3000`, Next picks another port — read the port off `pnpm dev`'s output rather than assuming 3000, or pin it with `pnpm dev --port 3100`.

Don't stop at `pnpm verify` — exercise the actual flow and observe the result.

## What needs the AI Gateway key

| Surface                                                                                 | Needs `AI_GATEWAY_API_KEY`?        |
| --------------------------------------------------------------------------------------- | ---------------------------------- |
| Workspace: channels, DMs, threads, reactions, drafts, composer, channel creation, reset | No — fully verifiable offline      |
| Assistant turns (catch me up, summarize, draft, tool calls)                             | Yes — every turn ends at the model |

In development only the **pre-send** gate is bypassed (`src/components/chat/chat-panel.tsx`: `needsKey = !apiKey && process.env.NODE_ENV !== "development"`), so the panel accepts input and the request reaches the server. Without a key the model call then fails, and `onError` classifies it as an auth error — which means all three of these happen, verified:

- the server logs `[eve:harness.tool-loop] AI Gateway authentication failed`
- a toast reads **"Invalid API key…"** — misleading, since no key was ever entered
- the **modal** "Enter Vercel Gateway API Key" dialog opens and covers the workspace

That is _expected_ without a key; it is not a regression. But the modal blocks every subsequent agent-browser step, so dismiss it (`find role button click "Cancel"`) or don't drive the assistant at all when `AI_GATEWAY_API_KEY` is unset. After dismissing, an inline notice stays in the panel offering "add yours". In production the pre-send gate is live too, so keyless visitors get the dialog _before_ any request and the agent then runs on their own key.

## Platform matrix

| Surface           | Dev command          | Agent-verifiable at runtime?                                                 |
| ----------------- | -------------------- | ---------------------------------------------------------------------------- |
| Web (Next.js)     | `pnpm dev`           | **Yes** — headless via agent-browser                                         |
| eve agent runtime | booted by `pnpm dev` | Yes, but only with `AI_GATEWAY_API_KEY` (or a BYO key entered in the dialog) |

There is no mobile, desktop, or extension target — the browser app is the whole product.

## Rules that matter

- **NEVER run `eve build` while `pnpm dev` is running** — it corrupts eve's dev workflow cache. Recovery: delete `.eve/` and `.workflow-data/`, then restart.
- Files under `agent/` must use **relative imports**: eve's compiler doesn't read tsconfig paths, so `@/*` silently fails to resolve there.
- `agent/tools/*.ts` are **snake_case** — eve derives the model-visible tool name from the filename. Everything else is kebab-case.
- **No `any`, no `!`, no `as`.** zod-parse at every boundary: stream events, tool payloads, localStorage.
- `Conversation` is a discriminated union on `kind` (`channel` | `dm`). Don't widen it with optional fields.
- Add UI components only via `pnpm dlx shadcn@latest add <name>` (base-vega / Base UI — `render` prop, not `asChild`); never hand-copy into `src/components/ui`.
- `shadcn` lives in devDependencies but `src/app/globals.css` does `@import "shadcn/tailwind.css"` — it is a **build-time** dependency. Never prune dev deps in a build step.
- `typescript` is pinned to `^6` and excluded from update sweeps (`pnpm.updateConfig.ignoreDependencies`). TypeScript 7 / tsgo breaks Next 16 — do not bump it.

## Map

- `agent/agent.ts` — model + BYO-key resolver · `agent/instructions.md` — system prompt · `agent/channels/eve.ts` — transport auth walk · `agent/tools/*.ts` — the tools the model can call
- `src/lib/workspace.ts` — zod domain + pure helpers · `src/lib/workspace-store.ts` — zustand store · `src/lib/seed-workspace.ts` — the fixture · `src/lib/workspace-context.ts` — per-turn digest · `src/lib/assistant-schemas.ts` — tool payload contract
- `src/components/workspace/` — the app shell and its panes · `src/components/chat/` — the assistant panel and key dialog
- `CLAUDE.md` — conventions, architecture map, command list (Claude-specific) · `README.md` — product-facing overview
