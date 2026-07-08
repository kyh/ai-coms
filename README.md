# AI Coms

AI-native team chat — a Slack-style workspace you keep up with by talking to it. Catch up on channels, summarize threads, draft messages, and clear unreads in natural language. A forkable Next.js template built on [eve](https://eve.dev), Vercel's agent framework.

![AI Coms](public/og.jpg)

## Features

- **Slack-style workspace** — channels and DMs with unread badges, presence dots, message grouping by author, emoji reactions, and threads in a side pane
- **AI assistant dock** (`⌘K`) — "Catch me up on #engineering", "Summarize this thread", "Draft a reply to Priya", "What did I miss while away?" — the agent mutates the workspace through typed eve tools; results stream into the UI live
- **Drafts, not sends** — AI-written messages land in the composer for review; nothing is posted on your behalf
- **Manual controls** — send, reply in thread, react, create channels, mark read — everything the AI does, you can do by hand
- **Local-first** — a hand-authored workspace (8 people, 5 channels, 3 DMs, ~45 messages, mid-stream unreads) seeded into localStorage and zod-validated; reset anytime from the sidebar
- **Bring your own key** — visitors add their own [Vercel AI Gateway key](https://vercel.com/docs/ai-gateway) (stored in the browser) and the agent runs on it per session

## Setup

```bash
pnpm install
echo "AI_GATEWAY_API_KEY=vck_..." > .env.local
pnpm dev
```

`pnpm dev` boots both runtimes: the Next.js dev server and eve's agent dev server (proxied same-origin by `withEve`). In development the agent uses `AI_GATEWAY_API_KEY`; in production, keyless visitors are prompted for their own gateway key, which rides each request as a bearer token and backs a per-session model.

## Architecture

```
agent/
├── agent.ts               # defineAgent: gateway model + BYO-key dynamic model resolver
├── instructions.md        # system prompt (persona, per-turn context contract, chat etiquette)
├── channels/eve.ts        # eve's TRANSPORT channel (auth: bearer key → Vercel OIDC → localhost dev)
│                          #   unrelated to the workspace's chat channels
└── tools/
    ├── draft_message.ts   # defineTool — filename = tool name the model sees
    ├── create_channel.ts
    ├── add_reaction.ts
    ├── mark_read.ts
    ├── set_status.ts
    └── *.ts               # disableTool() sentinels for the built-in harness tools
next.config.ts             # withEve(nextConfig) — mounts eve behind the Next.js origin
src/lib/workspace.ts       # zod domain: conversation = channel | dm, messages, reactions, threads
src/lib/workspace-store.ts # zustand + localStorage persist
src/lib/workspace-context.ts  # per-turn app state (digest + active conversation + open thread)
src/lib/assistant-schemas.ts  # zod contract shared by agent tools + chat panel
src/components/chat/       # chat panel (useEveAgent bridge), api key dialog
src/components/workspace/  # shell, sidebar, conversation view, message list, thread pane
```

The streaming contract: the client sends a compact workspace digest (plus the active conversation's recent messages and any open thread) as eve `clientContext` on every turn (`send({ message, clientContext })`); each tool returns a structured payload the chat panel receives as an `action.result` stream event, zod-parses against `assistant-schemas.ts`, and applies to the zustand store — so AI drafts, reactions, and new channels appear in the workspace in real time. Summaries need no tool: the per-turn context already carries the messages, so the model answers in prose.

## Notes

- A `Conversation` is a discriminated union on `kind` (`channel` | `dm`), so illegal states — a DM with members, a channel with a `userId` — cannot be represented.
- UI: shadcn/ui **base-vega** style (Base UI primitives). Add components with `pnpm dlx shadcn@latest add <name>`.
- `public/og.jpg` is a placeholder — replace it with your own brand assets before shipping a fork.
- Never run `eve build` while `pnpm dev` is running — it corrupts eve's dev cache (fix: delete `.eve/` + `.workflow-data/` and restart).
