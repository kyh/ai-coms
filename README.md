# AI Coms

AI-native communications — a unified inbox you manage by talking to it. Triage, summarize, archive, and draft replies in natural language. A forkable Next.js template built on [eve](https://eve.dev), Vercel's agent framework.

![AI Coms](public/og.jpg)

## Features

- **Three-pane inbox** — folders + labels, thread list with priority/label badges and unread state, thread view with reply composer
- **AI assistant dock** (`⌘K`) — "Triage my inbox", "Summarize the thread with Acme", "Draft a polite decline to the recruiter" — the agent mutates the mailbox through typed eve tools; results stream into the UI live
- **Drafts, not sends** — AI-written replies land in the composer for review; nothing is sent on your behalf
- **Manual controls** — star, archive, read/unread, labels, priority — everything the AI does, you can do by hand
- **Local-first** — ~15 hand-authored threads seeded into localStorage (zod-validated); reset anytime from the sidebar
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
├── instructions.md        # system prompt (triage rubric, drafting style, per-turn context contract)
├── channels/eve.ts        # HTTP auth: user bearer key → Vercel OIDC → localhost dev
└── tools/
    ├── triage_threads.ts  # defineTool — filename = tool name the model sees
    ├── draft_reply.ts
    ├── archive_threads.ts
    ├── star_threads.ts
    ├── mark_threads.ts
    └── *.ts               # disableTool() sentinels for the built-in harness tools
next.config.ts             # withEve(nextConfig) — mounts eve behind the Next.js origin
src/lib/assistant-schemas.ts  # zod contract shared by agent tools + chat panel
src/lib/mailbox-context.ts # per-turn app state (thread digest + open thread's full messages)
src/components/chat/       # chat panel (useEveAgent bridge), api key dialog
src/components/mail/       # app shell, sidebar, thread list, thread view
src/lib/thread-store.ts    # zustand + localStorage persist
```

The streaming contract: the client sends a compact mailbox digest (plus the open thread's full messages) as eve `clientContext` on every turn (`send({ message, clientContext })`); each tool returns a structured payload the chat panel receives as an `action.result` stream event, zod-parses against `assistant-schemas.ts`, and applies to the zustand store — so AI triage, archives, and drafts appear in the inbox in real time.

## Notes

- UI: shadcn/ui **base-vega** style (Base UI primitives). Add components with `pnpm dlx shadcn@latest add <name>`.
- `public/og.jpg` is a placeholder — replace it with your own brand assets before shipping a fork.
- Never run `eve build` while `pnpm dev` is running — it corrupts eve's dev cache (fix: delete `.eve/` + `.workflow-data/` and restart).
