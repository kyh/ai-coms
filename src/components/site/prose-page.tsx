import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { siteConfig } from "@/lib/config";
import { findProsePage, homeLink, prosePageLinks } from "@/lib/agent/site-content";
import type { ProsePage as ProsePageContent } from "@/lib/agent/site-content";
import { buildProsePageGraph } from "@/lib/agent/structured-data";

const requireProsePage = (path: string): ProsePageContent => {
  const page = findProsePage(path);
  if (!page) {
    throw new Error(`No prose page registered for ${path}`);
  }
  return page;
};

export const prosePageMetadata = (path: string): Metadata => {
  const page = requireProsePage(path);
  return {
    alternates: { canonical: page.path },
    description: page.description,
    openGraph: { description: page.description, title: page.title, url: page.path },
    title: page.title,
  };
};

export const ProsePage = ({ path }: { path: string }) => {
  const page = requireProsePage(path);
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-6 py-16">
      <JsonLd node={buildProsePageGraph(page)} />
      <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {[homeLink, ...prosePageLinks].map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-foreground">
            {link.href === "/" ? siteConfig.name : link.label}
          </Link>
        ))}
      </nav>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{page.heading}</h1>
        <p className="text-muted-foreground">{page.description}</p>
      </header>
      {page.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="leading-7 text-foreground/90">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </main>
  );
};
