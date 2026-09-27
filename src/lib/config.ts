export const siteConfig = {
  author: { name: "Kaiyu Hsu", url: "https://kyh.io" },
  creator: "@kaiyuhsu",
  description:
    "AI-native team chat — catch up on channels, summarize threads, and draft messages in natural language. Forkable Next.js + AI SDK template.",
  email: "im.kaiyu@gmail.com",
  name: "AI Coms",
  repository: "https://github.com/kyh/ai-coms",
  routes: ["", "/about", "/contact", "/privacy"],
  sameAs: ["https://github.com/kyh/ai-coms", "https://github.com/kyh", "https://x.com/kaiyuhsu"],
  shortName: "AI Coms",
  url: process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://coms.kyh.io",
};
