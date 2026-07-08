import { ME, type Thread } from "./thread";

/**
 * Hand-authored seed mailbox. Dates are computed relative to first load so the
 * inbox always looks fresh.
 */

const HOUR = 60 * 60 * 1000;
const seedBase = Date.now();

const hoursAgo = (hours: number): string => new Date(seedBase - hours * HOUR).toISOString();

const daysAgo = (days: number): string => hoursAgo(days * 24);

export const seedThreads: Thread[] = [
  {
    id: "thr-acme-launch",
    subject: "Acme launch: final go/no-go for Thursday",
    participants: ["Priya Raman", "Marcus Webb", ME],
    labels: ["work"],
    priority: "none",
    starred: false,
    archived: false,
    unread: true,
    messages: [
      {
        id: "msg-acme-1",
        from: "Priya Raman",
        at: daysAgo(1.2),
        body: "Team — we're 48 hours out. Status check:\n\n- Marketing site: done, staged at /launch\n- Pricing page: waiting on legal sign-off (expected tomorrow AM)\n- Onboarding flow: two P1 bugs left, both have owners\n\nI want a go/no-go call Thursday 9am. If legal slips past noon tomorrow, we push a week. Please flag blockers on this thread today.",
      },
      {
        id: "msg-acme-2",
        from: "Marcus Webb",
        at: hoursAgo(5),
        body: "Both P1s are fixed and verified in staging. One thing I want eyes on: the trial-to-paid email sequence still references the old $29 tier. Who owns lifecycle emails? That has to change before Thursday or we'll be quoting a price that doesn't exist.",
      },
      {
        id: "msg-acme-3",
        from: "Priya Raman",
        at: hoursAgo(3),
        body: "Good catch — that's yours actually, the copy doc is in your drafts folder from March. Can you confirm by EOD you'll have it updated? That's the last open item on my list before the go/no-go.",
      },
    ],
  },
  {
    id: "thr-invoice-northwind",
    subject: "Invoice #2214 — due July 15 (Northwind Hosting)",
    participants: ["Northwind Billing", ME],
    labels: ["finance"],
    priority: "none",
    starred: false,
    archived: false,
    unread: true,
    messages: [
      {
        id: "msg-invoice-1",
        from: "Northwind Billing",
        at: daysAgo(2),
        body: "Hi,\n\nInvoice #2214 for $1,840.00 (Q3 dedicated hosting, prepaid) is now available. Payment is due July 15.\n\nNote: this reflects the 8% rate increase we announced in May. Your next renewal window (October) is the last chance to lock the current rate for 12 months.\n\nPay online: northwind.example/invoices/2214\n\n— Northwind Billing",
      },
    ],
  },
  {
    id: "thr-recruiter-vertex",
    subject: "Staff Engineer role at Vertex — quick chat this week?",
    participants: ["Dana Kimball", ME],
    labels: ["recruiting"],
    priority: "none",
    starred: false,
    archived: false,
    unread: true,
    messages: [
      {
        id: "msg-recruiter-1",
        from: "Dana Kimball",
        at: daysAgo(1),
        body: "Hi there,\n\nI lead technical recruiting at Vertex Robotics. Your work on real-time collaboration tooling came up twice in our hiring committee last week — genuinely impressive stuff.\n\nWe're hiring a Staff Engineer to own our teleoperation platform (TypeScript/Rust, ~40 eng org, Series C). Comp band is $240–290k base plus meaningful equity.\n\nAny chance you're open to a 20-minute intro call this week or next? Happy to work around your schedule.\n\nBest,\nDana",
      },
    ],
  },
  {
    id: "thr-standup-notes",
    subject: "Standup notes — week of July 6",
    participants: ["Alex Osei", ME],
    labels: ["work"],
    priority: "none",
    starred: false,
    archived: false,
    unread: true,
    messages: [
      {
        id: "msg-standup-1",
        from: "Alex Osei",
        at: hoursAgo(20),
        body: "Monday notes:\n\n- Sofia: shipped the audit-log exporter; starting on retention policies\n- Marcus: launch P1s (see Priya's thread)\n- Alex: reviewing the storage migration RFC, comments due Wed\n- Jamie: OOO until Thursday\n\nReminder: sprint demo moved to Friday 2pm because of the launch. Add your demo slot to the doc by Thursday.",
      },
    ],
  },
  {
    id: "thr-flaky-tests",
    subject: "[escalation] CI red 6 times today — checkout suite flake",
    participants: ["Sofia Marchetti", "Alex Osei", ME],
    labels: ["engineering"],
    priority: "none",
    starred: false,
    archived: false,
    unread: true,
    messages: [
      {
        id: "msg-flaky-1",
        from: "Sofia Marchetti",
        at: hoursAgo(9),
        body: "Escalating because this is now blocking everyone: checkout-e2e has failed 6 of the last 9 main builds, each time on a different spec. Retries mask it about half the time, which is worse — people have stopped trusting red.\n\nPattern I see: every failure involves the mocked payment gateway timing out at exactly 5000ms. Suspect the new gateway stub added in #4182 isn't resolving its ready promise under parallelism.",
      },
      {
        id: "msg-flaky-2",
        from: "Alex Osei",
        at: hoursAgo(7),
        body: "Reproduced locally with --parallel=4. It's #4182: the stub binds one port per worker but the health check always polls worker 0's port. Two options:\n\n1. Quick: serialize the checkout suite (adds ~4 min to CI)\n2. Right: per-worker port injection, ~half a day\n\nI'd do 1 today and 2 this sprint. Sofia, can you own the revert-to-serial PR? I'll take the fix.",
      },
      {
        id: "msg-flaky-3",
        from: "Sofia Marchetti",
        at: hoursAgo(6),
        body: "Serial PR is up: #4190. One approval needed and CI is already green on it twice in a row. Merging after lunch unless someone objects.",
      },
    ],
  },
  {
    id: "thr-frontend-digest",
    subject: "Frontend Digest #312: View Transitions everywhere, CSS anchor positioning ships",
    participants: ["Frontend Digest", ME],
    labels: ["newsletter"],
    priority: "none",
    starred: false,
    archived: false,
    unread: true,
    messages: [
      {
        id: "msg-digest-1",
        from: "Frontend Digest",
        at: daysAgo(0.8),
        body: "This week in frontend:\n\n• View Transitions API is now Baseline — same-document transitions work in all evergreen browsers\n• CSS anchor positioning lands in Firefox 141, completing cross-browser support\n• A deep dive on React Server Components caching semantics that's worth your time\n• TypeScript 6.1 beta: inferred type predicates get smarter\n\nRead online: frontenddigest.example/312\n\nYou're receiving this because you subscribed. Unsubscribe anytime.",
      },
    ],
  },
  {
    id: "thr-customer-sev2",
    subject: "Meridian Corp: export jobs silently dropping rows (SEV-2?)",
    participants: ["Tom Okafor", "Sofia Marchetti", ME],
    labels: ["support", "engineering"],
    priority: "high",
    starred: true,
    archived: false,
    unread: true,
    messages: [
      {
        id: "msg-sev-1",
        from: "Tom Okafor",
        at: hoursAgo(26),
        body: "Meridian (our second-largest account, renewal in September) reports their nightly CSV exports are missing rows — about 2% per file, no errors anywhere. Started roughly when we shipped 2.41 last Tuesday.\n\nThey've built downstream reconciliation on these exports, so their finance team is currently hand-patching data every morning. Account is understandably unhappy.\n\nCan someone from platform confirm whether the 2.41 pagination change could drop rows under concurrent writes?",
      },
      {
        id: "msg-sev-2",
        from: "Sofia Marchetti",
        at: hoursAgo(22),
        body: "Yes — it can. The new cursor pagination keys on updated_at, so rows modified mid-export can jump behind the cursor. It only shows under write load, which is why staging never caught it.\n\nFix is keying on (updated_at, id) — small change, but needs a backfill-safe migration. I can have it in review tomorrow. Tom, can you get Meridian a workaround note today (re-run exports at 3am their time when write volume is near zero) and an incident summary from us by Friday?",
      },
    ],
  },
  {
    id: "thr-design-review",
    subject: "Design review: settings IA overhaul (v3)",
    participants: ["June Park", ME],
    labels: ["work", "design"],
    priority: "none",
    starred: false,
    archived: false,
    unread: false,
    messages: [
      {
        id: "msg-design-1",
        from: "June Park",
        at: daysAgo(3),
        body: "v3 of the settings IA is in Figma (link in the project channel). Big changes since v2:\n\n- Billing and Workspace split into separate top-level sections per the user interviews\n- Danger zone actions moved behind a confirmation drawer instead of inline buttons\n- Search now spans all settings, not just the visible section\n\nI'd like written feedback by Thursday so I can lock scope with eng Friday. Specifically: does the Billing split create any deep-link migration work on your side?",
      },
      {
        id: "msg-design-2",
        from: ME,
        at: daysAgo(2.5),
        body: "Looked through it — the split is right, interviews clearly support it. Deep-link impact is manageable: /settings/billing already exists, we just need redirects for the three /settings/workspace#billing-* anchors. I'll list them in the doc. One question: does settings search need to respect permissions, or is it fine to show items the user can't edit?",
      },
    ],
  },
  {
    id: "thr-conf-talk",
    subject: "Invitation to speak at SystemsConf 2026 (Nov 12–13, Amsterdam)",
    participants: ["Lena Vogel", ME],
    labels: ["speaking"],
    priority: "none",
    starred: true,
    archived: false,
    unread: false,
    messages: [
      {
        id: "msg-conf-1",
        from: "Lena Vogel",
        at: daysAgo(4),
        body: "Hello!\n\nI'm co-chairing SystemsConf 2026 (Nov 12–13, Amsterdam, ~800 attendees). We'd love a 30-minute talk on how you scaled real-time sync — your blog post on conflict-free editing made the rounds on our program committee.\n\nWe cover travel + 2 nights hotel and there's a speaker dinner on the 11th. CFP formally closes July 25, but this is a direct invitation — if you're interested we'll reserve the slot.\n\nCould you let us know by July 18?\n\nWarm regards,\nLena",
      },
    ],
  },
  {
    id: "thr-q3-planning",
    subject: "Q3 planning doc — comments before Friday's review",
    participants: ["Priya Raman", "June Park", "Alex Osei", ME],
    labels: ["work", "planning"],
    priority: "none",
    starred: false,
    archived: false,
    unread: true,
    messages: [
      {
        id: "msg-q3-1",
        from: "Priya Raman",
        at: daysAgo(2),
        body: "Q3 draft is ready for comments. Three proposed bets:\n\n1. Self-serve enterprise tier (biggest revenue swing, biggest scope risk)\n2. Mobile read-only app (cheap, high retention signal from surveys)\n3. Storage migration completion (not optional, carryover from Q2)\n\nThe doc ranks them with rough sizing. Please leave comments by Thursday night — Friday's review is decision-making, not discussion.",
      },
      {
        id: "msg-q3-2",
        from: "Alex Osei",
        at: daysAgo(1.1),
        body: "Commented in the doc, but headline: the storage migration sizing is optimistic. Q2 taught us the long tail of legacy formats is where the time goes. I'd budget 1.5x and treat the enterprise tier as the flex scope, not the migration.",
      },
    ],
  },
  {
    id: "thr-security-advisory",
    subject: "Security advisory: critical CVE in json-schema-walker (patch available)",
    participants: ["Platform Security Bot", ME],
    labels: ["engineering", "security"],
    priority: "none",
    starred: false,
    archived: false,
    unread: true,
    messages: [
      {
        id: "msg-security-1",
        from: "Platform Security Bot",
        at: hoursAgo(14),
        body: "CVE-2026-31877 (CVSS 9.1) — prototype pollution in json-schema-walker < 3.2.1.\n\nAffected repos in your org:\n• api-gateway (json-schema-walker@3.1.4, direct dependency)\n• billing-service (3.0.9, transitive via schema-kit)\n\njson-schema-walker@3.2.1 patches the issue and is API-compatible. Exploitation requires attacker-controlled schema input; api-gateway accepts user schemas on the /validate endpoint, so treat as urgent.\n\nAuto-generated PRs: #4193 (api-gateway), #4194 (billing-service).",
      },
    ],
  },
  {
    id: "thr-dinner-plans",
    subject: "Ramen Saturday?",
    participants: ["Maya Lin", ME],
    labels: ["personal"],
    priority: "none",
    starred: false,
    archived: false,
    unread: false,
    messages: [
      {
        id: "msg-dinner-1",
        from: "Maya Lin",
        at: daysAgo(1.5),
        body: "That new tsukemen place on 5th finally has walk-in seating again. Saturday 7pm? Ben's in if we are. Loser of Mario Kart pays for gyoza, standard rules.",
      },
      {
        id: "msg-dinner-2",
        from: ME,
        at: daysAgo(1.4),
        body: "In. But we're playing before dinner this time — last month you 'warmed up' for an hour while I sat there starving.",
      },
      {
        id: "msg-dinner-3",
        from: "Maya Lin",
        at: hoursAgo(30),
        body: "Deal. 5:30 at mine, controllers charged. Bring the good snacks and your acceptance of defeat.",
      },
    ],
  },
  {
    id: "thr-saas-renewal",
    subject: "Your Lumatrace plan renews August 1 — seat audit recommended",
    participants: ["Lumatrace", ME],
    labels: ["finance", "tooling"],
    priority: "none",
    starred: false,
    archived: false,
    unread: true,
    messages: [
      {
        id: "msg-renewal-1",
        from: "Lumatrace",
        at: daysAgo(3),
        body: "Hi,\n\nYour annual Lumatrace Observability plan (42 seats, $18,900/yr) renews automatically on August 1.\n\nUsage note: 11 of your 42 seats have had no activity in the last 90 days. Dropping to the 32-seat tier before renewal would save $4,500/yr. Seat changes after renewal are prorated at the higher monthly rate.\n\nManage your plan: lumatrace.example/billing\n\n— The Lumatrace Team",
      },
    ],
  },
  {
    id: "thr-interview-debrief",
    subject: "Debrief: Rosa Delgado — Senior Backend (loop completed Tuesday)",
    participants: ["Dana Kimball", "Alex Osei", "Sofia Marchetti", ME],
    labels: ["recruiting"],
    priority: "none",
    starred: false,
    archived: false,
    unread: true,
    messages: [
      {
        id: "msg-debrief-1",
        from: "Dana Kimball",
        at: daysAgo(0.9),
        body: "All four interviews are done and scorecards are in. Summary:\n\n• System design: strong hire (best distributed-queue answer Alex has seen this cycle)\n• Coding: hire\n• Behavioral: hire, notes praise her incident write-ups\n• Domain deep-dive: lean hire — less Kafka depth than the JD asks, but fast on fundamentals\n\nShe has a competing offer with a decision deadline next Wednesday. I need hire/no-hire from this group by Thursday EOD to make the timeline work. Please reply here or drop async comments on the packet.",
      },
      {
        id: "msg-debrief-2",
        from: "Sofia Marchetti",
        at: hoursAgo(16),
        body: "Hire. The Kafka gap is coachable — she debugged our streaming exercise faster than most people who claim expert-level. I'd rather have her fundamentals than keyword depth. Also: her question about our on-call load was the sharpest candidate question I've gotten all year.",
      },
    ],
  },
  {
    id: "thr-onboarding-intro",
    subject: "Welcome Jamie Torres — starting Monday on platform",
    participants: ["Priya Raman", "Jamie Torres", ME],
    labels: ["work"],
    priority: "none",
    starred: false,
    archived: true,
    unread: false,
    messages: [
      {
        id: "msg-onboard-1",
        from: "Priya Raman",
        at: daysAgo(6),
        body: "Everyone, meet Jamie Torres — joining platform as a senior engineer on Monday, coming from four years of infra work at a fintech. Jamie will start on the storage migration with Alex.\n\nBuddy assignments: Sofia (week 1 code walkthrough), Marcus (on-call shadowing week 3). Jamie — say hi!",
      },
      {
        id: "msg-onboard-2",
        from: "Jamie Torres",
        at: daysAgo(5.8),
        body: "Hi all! Excited to join. Fair warning: I will ask a lot of questions about why the deploy pipeline works the way it does — in my experience that's where the bodies are buried. See everyone Monday.",
      },
    ],
  },
  {
    id: "thr-metrics-digest",
    subject: "Weekly metrics: activation up 4.2%, churn flat, NPS 47",
    participants: ["Metrics Bot", ME],
    labels: ["newsletter", "work"],
    priority: "none",
    starred: false,
    archived: true,
    unread: false,
    messages: [
      {
        id: "msg-metrics-1",
        from: "Metrics Bot",
        at: daysAgo(5),
        body: "Week of June 29:\n\n• Activation (D7): 38.4% (+4.2pp WoW) — driven by the new onboarding checklist\n• Churn (monthly, logo): 2.1% (flat)\n• NPS: 47 (n=212)\n• Support volume: 340 tickets (-8%)\n\nTop detractor theme: export reliability (see Meridian escalation).\n\nFull dashboard: metrics.internal/weekly",
      },
    ],
  },
];
