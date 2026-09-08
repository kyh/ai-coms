import { ME } from "./workspace";
import type { Conversation, Message, User, UserStatus } from "./workspace";

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
  { avatarColor: "violet", id: ME, name: "You", presence: "online", title: "Product Engineer" },
  {
    avatarColor: "rose",
    id: "u-priya",
    name: "Priya Raman",
    presence: "online",
    title: "Engineering Manager",
  },
  {
    avatarColor: "emerald",
    id: "u-marcus",
    name: "Marcus Webb",
    presence: "online",
    title: "Backend Engineer",
  },
  {
    avatarColor: "sky",
    id: "u-tomas",
    name: "Tomás Ruiz",
    presence: "away",
    title: "Site Reliability",
  },
  {
    avatarColor: "amber",
    id: "u-dana",
    name: "Dana Osei",
    presence: "online",
    title: "Design Lead",
  },
  {
    avatarColor: "fuchsia",
    id: "u-hana",
    name: "Hana Kobayashi",
    presence: "online",
    title: "Frontend Engineer",
  },
  {
    avatarColor: "cyan",
    id: "u-sam",
    name: "Sam Achebe",
    presence: "offline",
    title: "Data Analyst",
  },
  {
    avatarColor: "lime",
    id: "u-leah",
    name: "Leah Novak",
    presence: "away",
    title: "People Ops",
  },
];

const everyone = seedUsers.map((user) => user.id);

export const createSeedConversations = (): Conversation[] => [
  {
    id: "c-general",
    kind: "channel",
    lastReadAt: minutesAgo(2),
    memberIds: everyone,
    muted: false,
    name: "general",
    purpose: "Company-wide announcements and anything that doesn't have a home yet",
  },
  {
    id: "c-engineering",
    kind: "channel",
    // Mid-stream: the release-train chatter is read, today's deploy is not.
    lastReadAt: hoursAgo(20),
    memberIds: [ME, "u-priya", "u-marcus", "u-tomas", "u-hana", "u-sam"],
    muted: false,
    name: "engineering",
    purpose: "Ship logs, deploys, and code review",
  },
  {
    id: "c-design",
    kind: "channel",
    lastReadAt: minutesAgo(3),
    memberIds: [ME, "u-dana", "u-hana", "u-priya"],
    muted: false,
    name: "design",
    purpose: "Crits, specs, and the design system",
  },
  {
    id: "c-incidents",
    kind: "channel",
    // Yesterday's SEV-3 is read; today's SEV-2 is the thing you missed.
    lastReadAt: hoursAgo(26),
    memberIds: [ME, "u-tomas", "u-marcus", "u-priya", "u-hana"],
    muted: false,
    name: "incidents",
    purpose: "Active incidents and postmortems. Page, don't lurk.",
  },
  {
    id: "c-random",
    kind: "channel",
    lastReadAt: minutesAgo(4),
    memberIds: everyone,
    muted: true,
    name: "random",
    purpose: "Dogs, espresso, and other load-bearing culture",
  },
  { id: "dm-priya", kind: "dm", lastReadAt: minutesAgo(5), userId: "u-priya" },
  // Marcus's code-review ping is the one unread DM.
  { id: "dm-marcus", kind: "dm", lastReadAt: hoursAgo(20), userId: "u-marcus" },
  { id: "dm-leah", kind: "dm", lastReadAt: minutesAgo(6), userId: "u-leah" },
];

export const createSeedMessages = (): Message[] => [
  // ---------------------------------------------------------------------------
  // #general — welcomes, weekly numbers, light standup texture. Fully read.
  // ---------------------------------------------------------------------------
  {
    at: hoursAgo(30),
    authorId: "u-priya",
    body: "Welcome Leah Novak, who joins us this week on People Ops. She'll own hiring loops, onboarding, and — mercifully — the offsite.",
    conversationId: "c-general",
    id: "m-gen-1",
    reactions: [{ by: ["u-marcus", "u-dana", "u-hana", ME], emoji: "🎉" }],
  },
  {
    at: hoursAgo(29.6),
    authorId: "u-leah",
    body: "Thanks Priya! I'll be DMing most of you this week with something small to ask. Apologies in advance.",
    conversationId: "c-general",
    id: "m-gen-2",
    reactions: [{ by: ["u-sam"], emoji: "👍" }],
  },
  {
    at: hoursAgo(9),
    authorId: "u-sam",
    body: "Weekly numbers are up in the dashboard. Headline: signups +14% WoW, activation flat, checkout conversion down 0.6pt. The checkout dip is worth a look — it started Tuesday, not today.",
    conversationId: "c-general",
    id: "m-gen-3",
    reactions: [{ by: ["u-priya", ME], emoji: "👀" }],
  },
  {
    at: hoursAgo(8.4),
    authorId: ME,
    body: "Tuesday lines up with the pricing-page CDN cache incident. Might be the same story rather than two.",
    conversationId: "c-general",
    id: "m-gen-4",
    reactions: [],
  },
  {
    at: hoursAgo(8.2),
    authorId: "u-sam",
    body: "Plausible. I'll segment by landing page and post here tomorrow.",
    conversationId: "c-general",
    id: "m-gen-5",
    reactions: [],
  },

  // ---------------------------------------------------------------------------
  // #engineering — release train (read) then today's deploy + rollback (unread).
  // ---------------------------------------------------------------------------
  {
    at: hoursAgo(26),
    authorId: "u-priya",
    body: "Release train 4.12 cuts tomorrow at 10:00 PT. Anything not merged by 18:00 today rides the next one.",
    conversationId: "c-engineering",
    id: "m-eng-1",
    reactions: [{ by: ["u-marcus", "u-hana"], emoji: "👍" }],
  },
  {
    at: hoursAgo(25.2),
    authorId: "u-hana",
    body: "#4471 (virtualized message list) is green and ready for review. Scroll jank on a 10k-message channel goes 340ms → 22ms.",
    conversationId: "c-engineering",
    id: "m-eng-2",
    reactions: [{ by: ["u-priya", ME, "u-tomas"], emoji: "🔥" }],
  },
  {
    at: hoursAgo(24.6),
    authorId: "u-marcus",
    body: "Read it end to end. `useStickyIndex` does a linear scan on every scroll frame — fine at 10k rows, ugly at 100k. Non-blocking, but leave a TODO.",
    conversationId: "c-engineering",
    id: "m-eng-2-r1",
    parentId: "m-eng-2",
    reactions: [],
  },
  {
    at: hoursAgo(24.4),
    authorId: "u-hana",
    body: "Fair. Binary search instead, it's four lines. Pushed.",
    conversationId: "c-engineering",
    id: "m-eng-2-r2",
    parentId: "m-eng-2",
    reactions: [],
  },
  {
    at: hoursAgo(23.8),
    authorId: ME,
    body: "Ship it once CI is green. Biggest perf win we've had this quarter.",
    conversationId: "c-engineering",
    id: "m-eng-2-r3",
    parentId: "m-eng-2",
    reactions: [],
  },
  {
    at: hoursAgo(23.5),
    authorId: "u-hana",
    body: "Merged.",
    conversationId: "c-engineering",
    id: "m-eng-2-r4",
    parentId: "m-eng-2",
    reactions: [{ by: ["u-priya", ME], emoji: "🎉" }],
  },
  {
    at: hoursAgo(22),
    authorId: ME,
    body: "Cut list for 4.12 is in the release doc. Two items still unowned: the changelog and the status-page copy.",
    conversationId: "c-engineering",
    id: "m-eng-3",
    reactions: [],
  },
  {
    at: hoursAgo(21.5),
    authorId: "u-priya",
    body: "I'll take both.",
    conversationId: "c-engineering",
    id: "m-eng-4",
    reactions: [{ by: [ME], emoji: "🙏" }],
  },
  // --- lastReadAt for #engineering sits here (20h) ---
  {
    at: hoursAgo(6.2),
    authorId: "u-tomas",
    body: "Heads up: deploying payments-svc 2.9.0 to prod at 14:00 PT. Canary at 5% for twenty minutes, then full.",
    conversationId: "c-engineering",
    id: "m-eng-5",
    reactions: [],
  },
  {
    at: hoursAgo(6),
    authorId: "u-marcus",
    body: "That carries my idempotency-key change. Watch checkout error rate — that's the blast radius.",
    conversationId: "c-engineering",
    id: "m-eng-6",
    reactions: [],
  },
  {
    at: hoursAgo(4.1),
    authorId: "u-tomas",
    body: "Canary was clean, went to 100% at 14:02. That aged poorly — see #incidents.",
    conversationId: "c-engineering",
    id: "m-eng-7",
    reactions: [{ by: ["u-priya", "u-hana"], emoji: "👀" }],
  },
  {
    at: hoursAgo(2.2),
    authorId: "u-marcus",
    body: "Rolled back. payments-svc is on 2.8.4 and healthy. The fix is PR #4488 — one line plus a regression test. It needs a reviewer.",
    conversationId: "c-engineering",
    id: "m-eng-8",
    reactions: [],
  },
  {
    at: hoursAgo(1.4),
    authorId: "u-priya",
    body: "Given the rollback, 4.12 slips to Friday 10:00 unless #4488 lands today. Treat that PR as top of queue.",
    conversationId: "c-engineering",
    id: "m-eng-9",
    reactions: [{ by: ["u-hana", "u-tomas"], emoji: "👍" }],
  },
  {
    at: minutesAgo(12),
    authorId: "u-hana",
    body: "CI on #4488 is green apart from the snapshot test that's flaked three times this week. Retrying, but someone should just delete it.",
    conversationId: "c-engineering",
    id: "m-eng-10",
    reactions: [],
  },

  // ---------------------------------------------------------------------------
  // #design — crit thread with a Figma link, then the spec landing. Read.
  // ---------------------------------------------------------------------------
  {
    at: hoursAgo(22),
    authorId: "u-dana",
    body: "Crit for the message composer: https://figma.com/file/9xK2vR/composer-v3 — three variants. I'm partial to B. Feedback by end of day Thursday, then I lock it.",
    conversationId: "c-design",
    id: "m-des-1",
    reactions: [{ by: [ME, "u-hana"], emoji: "👀" }],
  },
  {
    at: hoursAgo(21.2),
    authorId: "u-hana",
    body: "B, but the send button needs eight more pixels of breathing room at 320px. Right now it kisses the attachment icon.",
    conversationId: "c-design",
    id: "m-des-1-r1",
    parentId: "m-des-1",
    reactions: [],
  },
  {
    at: hoursAgo(20.4),
    authorId: ME,
    body: "B as well. C's toolbar competes with the message list for attention and loses.",
    conversationId: "c-design",
    id: "m-des-1-r2",
    parentId: "m-des-1",
    reactions: [],
  },
  {
    at: hoursAgo(19.5),
    authorId: "u-dana",
    body: "Locking B and specing the 320px case explicitly. Thanks both.",
    conversationId: "c-design",
    id: "m-des-1-r3",
    parentId: "m-des-1",
    reactions: [{ by: ["u-hana"], emoji: "✅" }],
  },
  {
    at: hoursAgo(5),
    authorId: "u-dana",
    body: "Composer v3 spec is up. New tokens: `--composer-pad: 12px`, radius 10, and the focus ring finally matches the rest of the app.",
    conversationId: "c-design",
    id: "m-des-2",
    reactions: [{ by: ["u-priya", ME], emoji: "✅" }],
  },
  {
    at: hoursAgo(4.6),
    authorId: "u-hana",
    body: "Picking it up right after the release. Should be a day.",
    conversationId: "c-design",
    id: "m-des-3",
    reactions: [],
  },
  {
    at: hoursAgo(4.5),
    authorId: "u-priya",
    body: "After the release, please. 4.12 is already fragile.",
    conversationId: "c-design",
    id: "m-des-4",
    reactions: [],
  },

  // ---------------------------------------------------------------------------
  // #incidents — yesterday's SEV-3 (read) and today's SEV-2 with a resolving
  // thread (unread). The centrepiece for "what did I miss".
  // ---------------------------------------------------------------------------
  {
    at: hoursAgo(27),
    authorId: "u-tomas",
    body: "SEV-3 closed: stale CDN cache served a two-week-old /pricing to about 4% of visitors. Purged, TTL lowered to 5m. No data impact.",
    conversationId: "c-incidents",
    id: "m-inc-1",
    reactions: [{ by: ["u-priya", ME], emoji: "✅" }],
  },
  {
    at: hoursAgo(3.9),
    authorId: "u-tomas",
    body: "🔴 SEV-2 declared. Checkout API p99 is 8.4s (normally 240ms) and the error rate is 3.2%. I'm incident commander. Updates in this thread.",
    conversationId: "c-incidents",
    id: "m-inc-2",
    reactions: [{ by: ["u-priya", "u-marcus", "u-hana"], emoji: "👀" }],
  },
  {
    at: hoursAgo(3.6),
    authorId: "u-marcus",
    body: "Onset correlates exactly with the 14:02 payments-svc 2.9.0 rollout. Rolling back now.",
    conversationId: "c-incidents",
    id: "m-inc-2-r1",
    parentId: "m-inc-2",
    reactions: [],
  },
  {
    at: hoursAgo(3.2),
    authorId: "u-tomas",
    body: "Rollback complete at 14:19. p99 back to 240ms, error rate 0.04%. Holding for 15 minutes before I downgrade.",
    conversationId: "c-incidents",
    id: "m-inc-2-r2",
    parentId: "m-inc-2",
    reactions: [{ by: ["u-priya"], emoji: "🎉" }],
  },
  {
    at: hoursAgo(2.9),
    authorId: "u-priya",
    body: "Customer impact window 14:02–14:19, roughly 1,100 failed checkouts. I'm writing the status-page update and will personally mail the twelve enterprise accounts that hit it.",
    conversationId: "c-incidents",
    id: "m-inc-2-r3",
    parentId: "m-inc-2",
    reactions: [],
  },
  {
    at: hoursAgo(2.5),
    authorId: "u-marcus",
    body: "Root cause: the new idempotency key includes the cart's `updatedAt`, so a retry never matches the original request and every retry re-charges the gateway. Fix is a one-line key change plus a regression test — PR #4488.",
    conversationId: "c-incidents",
    id: "m-inc-2-r4",
    parentId: "m-inc-2",
    reactions: [{ by: ["u-tomas"], emoji: "🔥" }],
  },
  {
    at: hoursAgo(2.1),
    authorId: "u-tomas",
    body: "SEV-2 resolved at 14:31. Postmortem doc is mine.",
    conversationId: "c-incidents",
    id: "m-inc-2-r5",
    parentId: "m-inc-2",
    reactions: [],
  },
  {
    at: hoursAgo(2),
    authorId: "u-tomas",
    body: "Postmortem for today's SEV-2 is Friday 11:00 PT. Marcus and Priya, please bring a timeline. Blameless as always — the deploy pipeline let a payments change go to 100% on twenty minutes of canary, and that's the thing to fix.",
    conversationId: "c-incidents",
    id: "m-inc-3",
    reactions: [{ by: ["u-priya", "u-marcus"], emoji: "✅" }],
  },

  // ---------------------------------------------------------------------------
  // #random — muted, read, and doing its job.
  // ---------------------------------------------------------------------------
  {
    at: hoursAgo(26.5),
    authorId: "u-sam",
    body: "My dog learned to open the fridge. I now have no dog treats and no dignity.",
    conversationId: "c-random",
    id: "m-ran-1",
    reactions: [{ by: ["u-hana", "u-dana", ME], emoji: "😄" }],
  },
  {
    at: hoursAgo(26.3),
    authorId: "u-hana",
    body: "Post evidence or it didn't happen.",
    conversationId: "c-random",
    id: "m-ran-2",
    reactions: [],
  },
  {
    at: hoursAgo(26.2),
    authorId: "u-sam",
    body: "The evidence is a $60 vet bill and one very pleased labrador.",
    conversationId: "c-random",
    id: "m-ran-3",
    reactions: [{ by: ["u-marcus"], emoji: "🔥" }],
  },
  {
    at: hoursAgo(7),
    authorId: "u-marcus",
    body: "The espresso machine has been descaled. It no longer tastes like a battery.",
    conversationId: "c-random",
    id: "m-ran-4",
    reactions: [{ by: ["u-dana", "u-hana", "u-priya", ME], emoji: "🎉" }],
  },
  {
    at: hoursAgo(6.5),
    authorId: "u-dana",
    body: "Motion to name it. I nominate Gaggia Ballentine.",
    conversationId: "c-random",
    id: "m-ran-5",
    reactions: [{ by: ["u-sam"], emoji: "👍" }],
  },

  // ---------------------------------------------------------------------------
  // DMs.
  // ---------------------------------------------------------------------------
  {
    at: hoursAgo(21),
    authorId: "u-priya",
    body: "Go/no-go for 4.12 is tomorrow at 10:00. Anything on your plate that would block it?",
    conversationId: "dm-priya",
    id: "m-dm-priya-1",
    reactions: [],
  },
  {
    at: hoursAgo(20.6),
    authorId: ME,
    body: "Only the composer spec, and Dana lands that today. We're clear.",
    conversationId: "dm-priya",
    id: "m-dm-priya-2",
    reactions: [],
  },
  {
    at: hoursAgo(20.5),
    authorId: "u-priya",
    body: "Good. If the payments deploy misbehaves this afternoon I may pull you in — you know that code better than Tomás does.",
    conversationId: "dm-priya",
    id: "m-dm-priya-3",
    reactions: [],
  },

  {
    at: hoursAgo(26),
    authorId: ME,
    body: "Thanks for covering the CDN rollback yesterday. I owe you an espresso from the machine that no longer tastes like a battery.",
    conversationId: "dm-marcus",
    id: "m-dm-marcus-1",
    reactions: [{ by: ["u-marcus"], emoji: "😄" }],
  },
  // --- lastReadAt for dm-marcus sits here (20h) ---
  {
    at: hoursAgo(2),
    authorId: "u-marcus",
    body: "Can you review #4488 when you get a second? It's the idempotency fix from the SEV — one line in `payments-svc/idempotency.ts` and a regression test that replays a retry storm.",
    conversationId: "dm-marcus",
    id: "m-dm-marcus-2",
    reactions: [],
  },
  {
    at: hoursAgo(1.8),
    authorId: "u-marcus",
    body: "No rush if you're heads-down, but Priya wants it in 4.12 and the train leaves Friday.",
    conversationId: "dm-marcus",
    id: "m-dm-marcus-3",
    reactions: [],
  },

  {
    at: hoursAgo(9.5),
    authorId: "u-leah",
    body: "Hi! I'm building the loop for the senior frontend role. Would you take the systems-design interview? 45 minutes, Tuesdays or Thursdays.",
    conversationId: "dm-leah",
    id: "m-dm-leah-1",
    reactions: [],
  },
  {
    at: hoursAgo(9.1),
    authorId: ME,
    body: "Happy to. Thursdays are much better — Tuesdays are release days.",
    conversationId: "dm-leah",
    id: "m-dm-leah-2",
    reactions: [],
  },
  {
    at: hoursAgo(9),
    authorId: "u-leah",
    body: "Booked. I'll send the rubric this week; the first candidate is next Thursday at 14:00.",
    conversationId: "dm-leah",
    id: "m-dm-leah-3",
    reactions: [{ by: [ME], emoji: "👍" }],
  },
];

export const createSeedStatus = (): UserStatus => ({ emoji: "🎧", text: "Heads down" });
