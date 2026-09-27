import { siteConfig } from "@/lib/config";

/**
 * The prose every representation shares: the HTML pages, their Markdown twins
 * and /llms.txt all render from here, so an agent and a browser never read two
 * different stories.
 */

export interface ProseSection {
  heading: string;
  paragraphs: string[];
}

export interface ProsePage {
  path: `/${string}`;
  schemaType: "AboutPage" | "ContactPage" | "WebPage";
  title: string;
  heading: string;
  description: string;
  sections: ProseSection[];
}

export interface LinkItem {
  href: string;
  label: string;
  text: string;
}

export const siteSummary =
  "AI Coms is a free, open-source, AI-native team chat app: a Slack-style workspace with channels, direct messages, threads and reactions that you keep up with by talking to an AI assistant. It runs in the browser with no sign-up, and it doubles as a forkable Next.js template built on eve, Vercel's agent framework, and the AI SDK.";

export const homeIntro: ProseSection[] = [
  {
    heading: "What you can do",
    paragraphs: [
      "Open the demo workspace — eight teammates, five channels, three DMs and a live stream of unread messages — and ask the assistant (⌘K) to catch you up on #engineering, summarize a long thread, draft a reply to a teammate, add a reaction, create a channel, or mark conversations read.",
      "Drafts land in the message composer for you to review; nothing is ever posted on your behalf. Everything the assistant can do, you can also do by hand: send, reply in threads, react, and create channels.",
    ],
  },
  {
    heading: "How it works",
    paragraphs: [
      "The workspace lives in your browser's localStorage and is validated with zod on load. Each assistant turn sends a compact digest of the workspace to an eve agent, which answers in prose or calls typed tools whose results stream back into the UI. Visitors bring their own Vercel AI Gateway key, stored only in their browser.",
      "The whole app is MIT-licensed on GitHub. Fork it as a starting point for AI-native messaging, support inboxes, or any product where an assistant should read and act on a live workspace.",
    ],
  },
];

export const whenToUse = [
  "A user wants a working demo of an AI assistant that summarizes, triages and drafts replies inside a team-chat (Slack-style) workspace.",
  "A developer needs a forkable Next.js 16 + React 19 template showing an eve agent with typed tools that mutate client state in real time.",
  "Someone is looking for a reference implementation of bring-your-own-key AI features via the Vercel AI Gateway.",
  "Someone wants an example of human-in-the-loop AI drafting, where AI-written messages are staged for review rather than sent.",
];

export const notWhenToUse = [
  "It is not a hosted chat service: there are no accounts, no real teammates, and no message delivery between people.",
  "It has no public API, MCP server or CLI; the agent endpoint only serves the app's own UI.",
];

export const prosePages: ProsePage[] = [
  {
    description: "What AI Coms is, what it demonstrates, and how it is built.",
    heading: "About AI Coms",
    path: "/about",
    schemaType: "AboutPage",
    sections: [
      {
        heading: "What it is",
        paragraphs: [
          siteSummary,
          "It is a demo and a template, not a hosted messaging product. The workspace is a hand-authored fixture of a small product team — people, channels, DMs, threads and mid-stream unreads — seeded into your browser the first time you open the app, and you can reset it from the sidebar at any time.",
        ],
      },
      {
        heading: "What it demonstrates",
        paragraphs: [
          "An assistant that works on the state of an app rather than beside it. Ask it to catch you up, summarize a thread, or draft a reply, and it reads a per-turn digest of the workspace. When it needs to change something — drafting a message, reacting, creating a channel, marking conversations read, setting your status — it calls a typed tool, and the result streams back into the interface immediately.",
          "Drafts are never sent automatically. Human review is part of the design, not an afterthought.",
        ],
      },
      {
        heading: "How it is built",
        paragraphs: [
          "Next.js 16 with the App Router, React 19, Tailwind CSS v4 and shadcn/ui on Base UI primitives. The agent runs on eve, Vercel's agent framework, through the Vercel AI Gateway using the AI SDK. Client state is a zustand store persisted to localStorage and validated with zod. The source is MIT-licensed on GitHub.",
          `AI Coms is built and maintained by ${siteConfig.author.name}, an independent developer who publishes a family of open-source AI-native app templates.`,
        ],
      },
    ],
    title: "About",
  },
  {
    description: "How to reach the maintainer of AI Coms.",
    heading: "Contact",
    path: "/contact",
    schemaType: "ContactPage",
    sections: [
      {
        heading: "Email",
        paragraphs: [
          `Write to ${siteConfig.email} for questions about AI Coms, licensing, collaboration, or anything else. Messages are read by ${siteConfig.author.name}, the maintainer; expect a reply within a few days.`,
        ],
      },
      {
        heading: "GitHub",
        paragraphs: [
          `Bug reports, feature requests and pull requests are welcome at ${siteConfig.repository}. Opening an issue is the fastest way to report something broken, because it keeps the discussion public and searchable for anyone who hits the same problem.`,
        ],
      },
      {
        heading: "Before you write",
        paragraphs: [
          "AI Coms is a demo workspace: there are no accounts to recover and no real messages to retrieve, and your workspace data never leaves your browser. If the assistant rejects your key, check that it is a valid Vercel AI Gateway key with available credit. Security issues are best reported privately by email rather than in a public issue.",
        ],
      },
    ],
    title: "Contact",
  },
  {
    description: "What AI Coms stores, what it sends, and who processes it.",
    heading: "Privacy",
    path: "/privacy",
    schemaType: "WebPage",
    sections: [
      {
        heading: "No accounts, no database",
        paragraphs: [
          "AI Coms has no sign-up and no server-side database. The demo workspace — people, channels, messages, reactions and drafts — is stored in your browser's localStorage and never uploaded for storage. Clearing your site data or using “Reset demo data” removes it.",
        ],
      },
      {
        heading: "Your AI Gateway key",
        paragraphs: [
          "If you add a Vercel AI Gateway key, it is stored in your browser's localStorage and sent with each assistant request as a bearer token, so the agent can call the model on your account. The agent runtime keeps it with that session's state so it can make model calls for you; the app does not store it anywhere else.",
        ],
      },
      {
        heading: "Assistant requests",
        paragraphs: [
          "When you message the assistant, your prompt and a digest of the workspace (conversation names, unread counts, and recent messages, including any you typed) are sent to the app's eve agent running on Vercel, which forwards them to the model through the Vercel AI Gateway. Those providers process the request under their own privacy terms. Don't paste sensitive information into the assistant.",
        ],
      },
      {
        heading: "Analytics",
        paragraphs: [
          "The site uses Vercel Web Analytics and Vercel Speed Insights to count page views and measure performance. They are cookieless and collect aggregate, anonymized data such as page path, referrer, country, device type and load timings. No advertising trackers are used, and nothing is sold.",
          `Questions about privacy go to ${siteConfig.email}.`,
        ],
      },
    ],
    title: "Privacy",
  },
];

export const findProsePage = (pathname: string): ProsePage | undefined =>
  prosePages.find((page) => page.path === pathname);

export const homeLink: LinkItem = {
  href: "/",
  label: "Home",
  text: "the live AI Coms workspace demo",
};

export const prosePageLinks: LinkItem[] = prosePages.map((page) => ({
  href: page.path,
  label: page.title,
  text: page.description,
}));

export const machineLinks: LinkItem[] = [
  { href: "/llms.txt", label: "llms.txt", text: "this summary, for agents" },
  { href: "/sitemap.xml", label: "Sitemap", text: "every indexable URL" },
  {
    href: siteConfig.repository,
    label: "Source code",
    text: "the MIT-licensed template on GitHub",
  },
];
