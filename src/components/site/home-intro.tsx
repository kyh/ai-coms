import { siteConfig } from "@/lib/config";
import { homeIntro, prosePageLinks, siteSummary, whenToUse } from "@/lib/agent/site-content";

/**
 * The workspace is client-only (it hydrates from localStorage), so without this
 * the server HTML carries no readable text for crawlers or screen readers.
 * Its links are untabbable so keyboard focus never lands on something invisible.
 */
export const HomeIntro = () => (
  <section className="sr-only">
    <h1>{siteConfig.name} — AI-native team chat</h1>
    <p>{siteSummary}</p>
    {homeIntro.map((section) => (
      <section key={section.heading}>
        <h2>{section.heading}</h2>
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
    ))}
    <h2>When to use it</h2>
    <ul>
      {whenToUse.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
    <nav aria-label="Site">
      <ul>
        {prosePageLinks.map((link) => (
          <li key={link.href}>
            <a href={link.href} tabIndex={-1}>
              {link.label}
            </a>
          </li>
        ))}
        <li>
          <a href={siteConfig.repository} tabIndex={-1}>
            Source code on GitHub
          </a>
        </li>
      </ul>
    </nav>
  </section>
);
