import { ME, type Conversation, type Message, type User, type UserStatus } from "./workspace";

/**
 * Hand-authored seed workspace: one week of a small product team, compressed
 * into "today + yesterday". Timestamps are computed relative to first load so
 * the workspace always looks live, and `lastReadAt` is placed mid-stream in
 * #engineering, #incidents, and the DM with Marcus so the app opens with real
 * unreads for "catch me up" to chew on.
 */

const MINUTE = 60 * 1000;
const seedBase = Date.now();

const minutesAgo = (minutes: number): string => new Date(seedBase - minutes * MINUTE).toISOString();

const hoursAgo = (hours: number): string => minutesAgo(hours * 60);

export const seedUsers: User[] = [
  { id: ME, name: "You", avatarColor: "violet", presence: "online", title: "Product Engineer" },
  {
    id: "u-priya",
    name: "Priya Raman",
    avatarColor: "rose",
    presence: "online",
    title: "Engineering Manager",
  },
  {
    id: "u-marcus",
    name: "Marcus Webb",
    avatarColor: "emerald",
    presence: "online",
    title: "Backend Engineer",
  },
  {
    id: "u-tomas",
    name: "Tomás Ruiz",
    avatarColor: "sky",
    presence: "away",
    title: "Site Reliability",
  },
  {
    id: "u-dana",
    name: "Dana Osei",
    avatarColor: "amber",
    presence: "online",
    title: "Design Lead",
  },
  {
    id: "u-hana",
    name: "Hana Kobayashi",
    avatarColor: "fuchsia",
    presence: "online",
    title: "Frontend Engineer",
  },
  {
    id: "u-sam",
    name: "Sam Achebe",
    avatarColor: "cyan",
    presence: "offline",
    title: "Data Analyst",
  },
  {
    id: "u-leah",
    name: "Leah Novak",
    avatarColor: "lime",
    presence: "away",
    title: "People Ops",
  },
];

const everyone = seedUsers.map((user) => user.id);

export const createSeedConversations = (): Conversation[] => [
  {
    kind: "channel",
    id: "c-general",
    name: "general",
    purpose: "Company-wide announcements and anything that doesn't have a home yet",
    memberIds: everyone,
    lastReadAt: minutesAgo(2),
    muted: false,
  },
  {
    kind: "channel",
    id: "c-engineering",
    name: "engineering",
    purpose: "Ship logs, deploys, and code review",
    memberIds: [ME, "u-priya", "u-marcus", "u-tomas", "u-hana", "u-sam"],
    // Mid-stream: the release-train chatter is read, today's deploy is not.
    lastReadAt: hoursAgo(20),
    muted: false,
  },
  {
    kind: "channel",
    id: "c-design",
    name: "design",
    purpose: "Crits, specs, and the design system",
    memberIds: [ME, "u-dana", "u-hana", "u-priya"],
    lastReadAt: minutesAgo(3),
    muted: false,
  },
  {
    kind: "channel",
    id: "c-incidents",
    name: "incidents",
    purpose: "Active incidents and postmortems. Page, don't lurk.",
    memberIds: [ME, "u-tomas", "u-marcus", "u-priya", "u-hana"],
    // Yesterday's SEV-3 is read; today's SEV-2 is the thing you missed.
    lastReadAt: hoursAgo(26),
    muted: false,
  },
  {
    kind: "channel",
    id: "c-random",
    name: "random",
    purpose: "Dogs, espresso, and other load-bearing culture",
    memberIds: everyone,
    lastReadAt: minutesAgo(4),
    muted: true,
  },
  { kind: "dm", id: "dm-priya", userId: "u-priya", lastReadAt: minutesAgo(5) },
  // Marcus's code-review ping is the one unread DM.
  { kind: "dm", id: "dm-marcus", userId: "u-marcus", lastReadAt: hoursAgo(20) },
  { kind: "dm", id: "dm-leah", userId: "u-leah", lastReadAt: minutesAgo(6) },
];

export const createSeedMessages = (): Message[] => [
  // ---------------------------------------------------------------------------
  // #general — welcomes, weekly numbers, light standup texture. Fully read.
  // ---------------------------------------------------------------------------
  {
    id: "m-gen-1",
    conversationId: "c-general",
    authorId: "u-priya",
    at: hoursAgo(30),
    body: "Welcome Leah Novak, who joins us this week on People Ops. She'll own hiring loops, onboarding, and — mercifully — the offsite.",
    reactions: [{ emoji: "🎉", by: ["u-marcus", "u-dana", "u-hana", ME] }],
  },
  {
    id: "m-gen-2",
    conversationId: "c-general",
    authorId: "u-leah",
    at: hoursAgo(29.6),
    body: "Thanks Priya! I'll be DMing most of you this week with something small to ask. Apologies in advance.",
    reactions: [{ emoji: "👍", by: ["u-sam"] }],
  },
  {
    id: "m-gen-3",
    conversationId: "c-general",
    authorId: "u-sam",
    at: hoursAgo(9),
    body: "Weekly numbers are up in the dashboard. Headline: signups +14% WoW, activation flat, checkout conversion down 0.6pt. The checkout dip is worth a look — it started Tuesday, not today.",
    reactions: [{ emoji: "👀", by: ["u-priya", ME] }],
  },
  {
    id: "m-gen-4",
    conversationId: "c-general",
    authorId: ME,
    at: hoursAgo(8.4),
    body: "Tuesday lines up with the pricing-page CDN cache incident. Might be the same story rather than two.",
    reactions: [],
  },
  {
    id: "m-gen-5",
    conversationId: "c-general",
    authorId: "u-sam",
    at: hoursAgo(8.2),
    body: "Plausible. I'll segment by landing page and post here tomorrow.",
    reactions: [],
  },

  // ---------------------------------------------------------------------------
  // #engineering — release train (read) then today's deploy + rollback (unread).
  // ---------------------------------------------------------------------------
  {
    id: "m-eng-1",
    conversationId: "c-engineering",
    authorId: "u-priya",
    at: hoursAgo(26),
    body: "Release train 4.12 cuts tomorrow at 10:00 PT. Anything not merged by 18:00 today rides the next one.",
    reactions: [{ emoji: "👍", by: ["u-marcus", "u-hana"] }],
  },
  {
    id: "m-eng-2",
    conversationId: "c-engineering",
    authorId: "u-hana",
    at: hoursAgo(25.2),
    body: "#4471 (virtualized message list) is green and ready for review. Scroll jank on a 10k-message channel goes 340ms → 22ms.",
    reactions: [{ emoji: "🔥", by: ["u-priya", ME, "u-tomas"] }],
  },
  {
    id: "m-eng-2-r1",
    conversationId: "c-engineering",
    parentId: "m-eng-2",
    authorId: "u-marcus",
    at: hoursAgo(24.6),
    body: "Read it end to end. `useStickyIndex` does a linear scan on every scroll frame — fine at 10k rows, ugly at 100k. Non-blocking, but leave a TODO.",
    reactions: [],
  },
  {
    id: "m-eng-2-r2",
    conversationId: "c-engineering",
    parentId: "m-eng-2",
    authorId: "u-hana",
    at: hoursAgo(24.4),
    body: "Fair. Binary search instead, it's four lines. Pushed.",
    reactions: [],
  },
  {
    id: "m-eng-2-r3",
    conversationId: "c-engineering",
    parentId: "m-eng-2",
    authorId: ME,
    at: hoursAgo(23.8),
    body: "Ship it once CI is green. Biggest perf win we've had this quarter.",
    reactions: [],
  },
  {
    id: "m-eng-2-r4",
    conversationId: "c-engineering",
    parentId: "m-eng-2",
    authorId: "u-hana",
    at: hoursAgo(23.5),
    body: "Merged.",
    reactions: [{ emoji: "🎉", by: ["u-priya", ME] }],
  },
  {
    id: "m-eng-3",
    conversationId: "c-engineering",
    authorId: ME,
    at: hoursAgo(22),
    body: "Cut list for 4.12 is in the release doc. Two items still unowned: the changelog and the status-page copy.",
    reactions: [],
  },
  {
    id: "m-eng-4",
    conversationId: "c-engineering",
    authorId: "u-priya",
    at: hoursAgo(21.5),
    body: "I'll take both.",
    reactions: [{ emoji: "🙏", by: [ME] }],
  },
  // --- lastReadAt for #engineering sits here (20h) ---
  {
    id: "m-eng-5",
    conversationId: "c-engineering",
    authorId: "u-tomas",
    at: hoursAgo(6.2),
    body: "Heads up: deploying payments-svc 2.9.0 to prod at 14:00 PT. Canary at 5% for twenty minutes, then full.",
    reactions: [],
  },
  {
    id: "m-eng-6",
    conversationId: "c-engineering",
    authorId: "u-marcus",
    at: hoursAgo(6),
    body: "That carries my idempotency-key change. Watch checkout error rate — that's the blast radius.",
    reactions: [],
  },
  {
    id: "m-eng-7",
    conversationId: "c-engineering",
    authorId: "u-tomas",
    at: hoursAgo(4.1),
    body: "Canary was clean, went to 100% at 14:02. That aged poorly — see #incidents.",
    reactions: [{ emoji: "👀", by: ["u-priya", "u-hana"] }],
  },
  {
    id: "m-eng-8",
    conversationId: "c-engineering",
    authorId: "u-marcus",
    at: hoursAgo(2.2),
    body: "Rolled back. payments-svc is on 2.8.4 and healthy. The fix is PR #4488 — one line plus a regression test. It needs a reviewer.",
    reactions: [],
  },
  {
    id: "m-eng-9",
    conversationId: "c-engineering",
    authorId: "u-priya",
    at: hoursAgo(1.4),
    body: "Given the rollback, 4.12 slips to Friday 10:00 unless #4488 lands today. Treat that PR as top of queue.",
    reactions: [{ emoji: "👍", by: ["u-hana", "u-tomas"] }],
  },
  {
    id: "m-eng-10",
    conversationId: "c-engineering",
    authorId: "u-hana",
    at: minutesAgo(12),
    body: "CI on #4488 is green apart from the snapshot test that's flaked three times this week. Retrying, but someone should just delete it.",
    reactions: [],
  },

  // ---------------------------------------------------------------------------
  // #design — crit thread with a Figma link, then the spec landing. Read.
  // ---------------------------------------------------------------------------
  {
    id: "m-des-1",
    conversationId: "c-design",
    authorId: "u-dana",
    at: hoursAgo(22),
    body: "Crit for the message composer: https://figma.com/file/9xK2vR/composer-v3 — three variants. I'm partial to B. Feedback by end of day Thursday, then I lock it.",
    reactions: [{ emoji: "👀", by: [ME, "u-hana"] }],
  },
  {
    id: "m-des-1-r1",
    conversationId: "c-design",
    parentId: "m-des-1",
    authorId: "u-hana",
    at: hoursAgo(21.2),
    body: "B, but the send button needs eight more pixels of breathing room at 320px. Right now it kisses the attachment icon.",
    reactions: [],
  },
  {
    id: "m-des-1-r2",
    conversationId: "c-design",
    parentId: "m-des-1",
    authorId: ME,
    at: hoursAgo(20.4),
    body: "B as well. C's toolbar competes with the message list for attention and loses.",
    reactions: [],
  },
  {
    id: "m-des-1-r3",
    conversationId: "c-design",
    parentId: "m-des-1",
    authorId: "u-dana",
    at: hoursAgo(19.5),
    body: "Locking B and specing the 320px case explicitly. Thanks both.",
    reactions: [{ emoji: "✅", by: ["u-hana"] }],
  },
  {
    id: "m-des-2",
    conversationId: "c-design",
    authorId: "u-dana",
    at: hoursAgo(5),
    body: "Composer v3 spec is up. New tokens: `--composer-pad: 12px`, radius 10, and the focus ring finally matches the rest of the app.",
    reactions: [{ emoji: "✅", by: ["u-priya", ME] }],
  },
  {
    id: "m-des-3",
    conversationId: "c-design",
    authorId: "u-hana",
    at: hoursAgo(4.6),
    body: "Picking it up right after the release. Should be a day.",
    reactions: [],
  },
  {
    id: "m-des-4",
    conversationId: "c-design",
    authorId: "u-priya",
    at: hoursAgo(4.5),
    body: "After the release, please. 4.12 is already fragile.",
    reactions: [],
  },

  // ---------------------------------------------------------------------------
  // #incidents — yesterday's SEV-3 (read) and today's SEV-2 with a resolving
  // thread (unread). The centrepiece for "what did I miss".
  // ---------------------------------------------------------------------------
  {
    id: "m-inc-1",
    conversationId: "c-incidents",
    authorId: "u-tomas",
    at: hoursAgo(27),
    body: "SEV-3 closed: stale CDN cache served a two-week-old /pricing to about 4% of visitors. Purged, TTL lowered to 5m. No data impact.",
    reactions: [{ emoji: "✅", by: ["u-priya", ME] }],
  },
  {
    id: "m-inc-2",
    conversationId: "c-incidents",
    authorId: "u-tomas",
    at: hoursAgo(3.9),
    body: "🔴 SEV-2 declared. Checkout API p99 is 8.4s (normally 240ms) and the error rate is 3.2%. I'm incident commander. Updates in this thread.",
    reactions: [{ emoji: "👀", by: ["u-priya", "u-marcus", "u-hana"] }],
  },
  {
    id: "m-inc-2-r1",
    conversationId: "c-incidents",
    parentId: "m-inc-2",
    authorId: "u-marcus",
    at: hoursAgo(3.6),
    body: "Onset correlates exactly with the 14:02 payments-svc 2.9.0 rollout. Rolling back now.",
    reactions: [],
  },
  {
    id: "m-inc-2-r2",
    conversationId: "c-incidents",
    parentId: "m-inc-2",
    authorId: "u-tomas",
    at: hoursAgo(3.2),
    body: "Rollback complete at 14:19. p99 back to 240ms, error rate 0.04%. Holding for 15 minutes before I downgrade.",
    reactions: [{ emoji: "🎉", by: ["u-priya"] }],
  },
  {
    id: "m-inc-2-r3",
    conversationId: "c-incidents",
    parentId: "m-inc-2",
    authorId: "u-priya",
    at: hoursAgo(2.9),
    body: "Customer impact window 14:02–14:19, roughly 1,100 failed checkouts. I'm writing the status-page update and will personally mail the twelve enterprise accounts that hit it.",
    reactions: [],
  },
  {
    id: "m-inc-2-r4",
    conversationId: "c-incidents",
    parentId: "m-inc-2",
    authorId: "u-marcus",
    at: hoursAgo(2.5),
    body: "Root cause: the new idempotency key includes the cart's `updatedAt`, so a retry never matches the original request and every retry re-charges the gateway. Fix is a one-line key change plus a regression test — PR #4488.",
    reactions: [{ emoji: "🔥", by: ["u-tomas"] }],
  },
  {
    id: "m-inc-2-r5",
    conversationId: "c-incidents",
    parentId: "m-inc-2",
    authorId: "u-tomas",
    at: hoursAgo(2.1),
    body: "SEV-2 resolved at 14:31. Postmortem doc is mine.",
    reactions: [],
  },
  {
    id: "m-inc-3",
    conversationId: "c-incidents",
    authorId: "u-tomas",
    at: hoursAgo(2),
    body: "Postmortem for today's SEV-2 is Friday 11:00 PT. Marcus and Priya, please bring a timeline. Blameless as always — the deploy pipeline let a payments change go to 100% on twenty minutes of canary, and that's the thing to fix.",
    reactions: [{ emoji: "✅", by: ["u-priya", "u-marcus"] }],
  },

  // ---------------------------------------------------------------------------
  // #random — muted, read, and doing its job.
  // ---------------------------------------------------------------------------
  {
    id: "m-ran-1",
    conversationId: "c-random",
    authorId: "u-sam",
    at: hoursAgo(26.5),
    body: "My dog learned to open the fridge. I now have no dog treats and no dignity.",
    reactions: [{ emoji: "😄", by: ["u-hana", "u-dana", ME] }],
  },
  {
    id: "m-ran-2",
    conversationId: "c-random",
    authorId: "u-hana",
    at: hoursAgo(26.3),
    body: "Post evidence or it didn't happen.",
    reactions: [],
  },
  {
    id: "m-ran-3",
    conversationId: "c-random",
    authorId: "u-sam",
    at: hoursAgo(26.2),
    body: "The evidence is a $60 vet bill and one very pleased labrador.",
    reactions: [{ emoji: "🔥", by: ["u-marcus"] }],
  },
  {
    id: "m-ran-4",
    conversationId: "c-random",
    authorId: "u-marcus",
    at: hoursAgo(7),
    body: "The espresso machine has been descaled. It no longer tastes like a battery.",
    reactions: [{ emoji: "🎉", by: ["u-dana", "u-hana", "u-priya", ME] }],
  },
  {
    id: "m-ran-5",
    conversationId: "c-random",
    authorId: "u-dana",
    at: hoursAgo(6.5),
    body: "Motion to name it. I nominate Gaggia Ballentine.",
    reactions: [{ emoji: "👍", by: ["u-sam"] }],
  },

  // ---------------------------------------------------------------------------
  // DMs.
  // ---------------------------------------------------------------------------
  {
    id: "m-dm-priya-1",
    conversationId: "dm-priya",
    authorId: "u-priya",
    at: hoursAgo(21),
    body: "Go/no-go for 4.12 is tomorrow at 10:00. Anything on your plate that would block it?",
    reactions: [],
  },
  {
    id: "m-dm-priya-2",
    conversationId: "dm-priya",
    authorId: ME,
    at: hoursAgo(20.6),
    body: "Only the composer spec, and Dana lands that today. We're clear.",
    reactions: [],
  },
  {
    id: "m-dm-priya-3",
    conversationId: "dm-priya",
    authorId: "u-priya",
    at: hoursAgo(20.5),
    body: "Good. If the payments deploy misbehaves this afternoon I may pull you in — you know that code better than Tomás does.",
    reactions: [],
  },

  {
    id: "m-dm-marcus-1",
    conversationId: "dm-marcus",
    authorId: ME,
    at: hoursAgo(26),
    body: "Thanks for covering the CDN rollback yesterday. I owe you an espresso from the machine that no longer tastes like a battery.",
    reactions: [{ emoji: "😄", by: ["u-marcus"] }],
  },
  // --- lastReadAt for dm-marcus sits here (20h) ---
  {
    id: "m-dm-marcus-2",
    conversationId: "dm-marcus",
    authorId: "u-marcus",
    at: hoursAgo(2),
    body: "Can you review #4488 when you get a second? It's the idempotency fix from the SEV — one line in `payments-svc/idempotency.ts` and a regression test that replays a retry storm.",
    reactions: [],
  },
  {
    id: "m-dm-marcus-3",
    conversationId: "dm-marcus",
    authorId: "u-marcus",
    at: hoursAgo(1.8),
    body: "No rush if you're heads-down, but Priya wants it in 4.12 and the train leaves Friday.",
    reactions: [],
  },

  {
    id: "m-dm-leah-1",
    conversationId: "dm-leah",
    authorId: "u-leah",
    at: hoursAgo(9.5),
    body: "Hi! I'm building the loop for the senior frontend role. Would you take the systems-design interview? 45 minutes, Tuesdays or Thursdays.",
    reactions: [],
  },
  {
    id: "m-dm-leah-2",
    conversationId: "dm-leah",
    authorId: ME,
    at: hoursAgo(9.1),
    body: "Happy to. Thursdays are much better — Tuesdays are release days.",
    reactions: [],
  },
  {
    id: "m-dm-leah-3",
    conversationId: "dm-leah",
    authorId: "u-leah",
    at: hoursAgo(9),
    body: "Booked. I'll send the rubric this week; the first candidate is next Thursday at 14:00.",
    reactions: [{ emoji: "👍", by: [ME] }],
  },
];

export const createSeedStatus = (): UserStatus => ({ emoji: "🎧", text: "Heads down" });
