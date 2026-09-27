import { siteConfig } from "@/lib/config";

import { absoluteUrl } from "./markdown";
import { siteSummary } from "./site-content";
import type { ProsePage } from "./site-content";

export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

export interface JsonLdNode {
  [key: string]: JsonLdValue;
}

const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;
const APPLICATION_ID = `${siteConfig.url}/#application`;

/**
 * No `address` or phone on purpose: this is a personal open-source project with
 * no premises, and an invented PostalAddress would be worse than a partial
 * score.
 */
export const buildOrganization = () =>
  ({
    "@id": ORGANIZATION_ID,
    "@type": "Organization",
    contactPoint: [
      {
        "@type": "ContactPoint",
        availableLanguage: ["en"],
        contactType: "customer support",
        email: siteConfig.email,
        url: absoluteUrl("/contact"),
      },
      {
        "@type": "ContactPoint",
        availableLanguage: ["en"],
        contactType: "technical support",
        email: siteConfig.email,
        url: `${siteConfig.repository}/issues`,
      },
    ],
    description: siteSummary,
    email: siteConfig.email,
    founder: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
    logo: absoluteUrl("/favicon/favicon-96x96.png"),
    name: siteConfig.name,
    sameAs: siteConfig.sameAs,
    url: siteConfig.url,
  }) satisfies JsonLdNode;

const buildWebSite = () =>
  ({
    "@id": WEBSITE_ID,
    "@type": "WebSite",
    description: siteConfig.description,
    inLanguage: "en-US",
    name: siteConfig.name,
    publisher: { "@id": ORGANIZATION_ID },
    url: siteConfig.url,
  }) satisfies JsonLdNode;

const buildSoftwareApplication = () =>
  ({
    "@id": APPLICATION_ID,
    "@type": "SoftwareApplication",
    applicationCategory: "CommunicationApplication",
    codeRepository: siteConfig.repository,
    description: siteSummary,
    featureList: [
      "Slack-style channels, direct messages, threads and reactions",
      "AI assistant that catches you up, summarizes threads and drafts replies",
      "Drafts are staged for review, never sent automatically",
      "Bring your own Vercel AI Gateway key",
    ],
    image: absoluteUrl("/og.jpg"),
    isAccessibleForFree: true,
    license: "https://opensource.org/licenses/MIT",
    name: siteConfig.name,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    operatingSystem: "Web browser",
    publisher: { "@id": ORGANIZATION_ID },
    url: siteConfig.url,
  }) satisfies JsonLdNode;

export const buildHomeGraph = () =>
  ({
    "@context": "https://schema.org",
    "@graph": [buildOrganization(), buildWebSite(), buildSoftwareApplication()],
  }) satisfies JsonLdNode;

export const buildProsePageGraph = (page: ProsePage) =>
  ({
    "@context": "https://schema.org",
    "@graph": [
      buildOrganization(),
      {
        "@id": `${absoluteUrl(page.path)}#webpage`,
        "@type": page.schemaType,
        about: { "@id": ORGANIZATION_ID },
        description: page.description,
        inLanguage: "en-US",
        isPartOf: { "@id": WEBSITE_ID },
        name: page.heading,
        url: absoluteUrl(page.path),
      },
    ],
  }) satisfies JsonLdNode;

/** Escaping `<` keeps any value from closing the surrounding `<script>` early. */
export const serializeJsonLd = (node: JsonLdNode): string =>
  JSON.stringify(node).replaceAll("<", "\\u003c");
