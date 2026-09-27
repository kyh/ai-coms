import { siteConfig } from "@/lib/config";

import {
  homeIntro,
  homeLink,
  machineLinks,
  notWhenToUse,
  prosePageLinks,
  siteSummary,
  whenToUse,
} from "./site-content";
import type { LinkItem, ProsePage, ProseSection } from "./site-content";

export const absoluteUrl = (href: string): string =>
  href.startsWith("/") ? `${siteConfig.url}${href === "/" ? "" : href}` : href;

const bullets = (items: string[]): string => items.map((item) => `- ${item}`).join("\n");

const linkList = (links: LinkItem[]): string =>
  bullets(links.map((link) => `[${link.label}](${absoluteUrl(link.href)}): ${link.text}`));

const sectionLines = (sections: ProseSection[]): string[] =>
  sections.flatMap((section) => [
    `## ${section.heading}`,
    "",
    ...section.paragraphs.flatMap((paragraph) => [paragraph, ""]),
  ]);

const document = (lines: string[]): string => `${lines.join("\n").trimEnd()}\n`;

export const renderHomeMarkdown = (): string =>
  document([
    `# ${siteConfig.name}`,
    "",
    `> ${siteSummary}`,
    "",
    ...sectionLines(homeIntro),
    "## When to use it",
    "",
    bullets(whenToUse),
    "",
    "## Pages",
    "",
    linkList([...prosePageLinks, ...machineLinks]),
  ]);

export const renderProsePageMarkdown = (page: ProsePage): string =>
  document([
    `# ${page.heading}`,
    "",
    `> ${page.description}`,
    "",
    ...sectionLines(page.sections),
    "## More",
    "",
    linkList([homeLink, ...machineLinks]),
  ]);

export const renderNotFoundMarkdown = (pathname: string): string =>
  document([
    "# 404 — Page not found",
    "",
    `> \`${pathname}\` does not exist on ${siteConfig.url}.`,
    "",
    "Try one of these instead:",
    "",
    linkList([homeLink, ...prosePageLinks, ...machineLinks]),
  ]);

/**
 * llmstxt.org shape: H1, blockquote, free prose, then H2 link lists. The
 * when-to-use guidance stays above the first H2 because the spec reserves H2
 * sections for links.
 */
export const renderLlmsTxt = (): string =>
  document([
    `# ${siteConfig.name}`,
    "",
    `> ${siteSummary}`,
    "",
    `**When to use ${siteConfig.name}:**`,
    "",
    bullets(whenToUse),
    "",
    "**When not to:**",
    "",
    bullets(notWhenToUse),
    "",
    "Every page is also available as Markdown: request it with `Accept: text/markdown`.",
    "",
    "## Pages",
    "",
    linkList([homeLink, ...prosePageLinks]),
    "",
    "## Optional",
    "",
    linkList(machineLinks.filter((link) => link.href !== "/llms.txt")),
  ]);
