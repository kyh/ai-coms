import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  renderHomeMarkdown,
  renderLlmsTxt,
  renderNotFoundMarkdown,
  renderProsePageMarkdown,
} from "./markdown";
import { prosePages } from "./site-content";

describe("renderLlmsTxt", () => {
  const llms = renderLlmsTxt();

  test("follows the llmstxt.org shape: H1, then a blockquote summary", () => {
    const [h1, blank, quote] = llms.split("\n");
    assert.equal(h1, "# AI Coms");
    assert.equal(blank, "");
    assert.ok(quote?.startsWith("> "));
  });

  test("puts when-to-use guidance before the first H2 link list", () => {
    const whenToUse = llms.indexOf("**When to use AI Coms:**");
    assert.ok(whenToUse > 0);
    assert.ok(whenToUse < llms.indexOf("\n## "));
  });

  test("links every trust page with an absolute URL", () => {
    for (const page of prosePages) {
      assert.ok(llms.includes(`(https://coms.kyh.io${page.path})`), page.path);
    }
  });
});

describe("page markdown", () => {
  test("home carries an H1 and the when-to-use list", () => {
    const home = renderHomeMarkdown();
    assert.ok(home.startsWith("# AI Coms\n"));
    assert.ok(home.includes("## When to use it"));
  });

  test("each prose page renders its heading and every section", () => {
    for (const page of prosePages) {
      const markdown = renderProsePageMarkdown(page);
      assert.ok(markdown.startsWith(`# ${page.heading}\n`));
      for (const section of page.sections) {
        assert.ok(markdown.includes(`## ${section.heading}`), section.heading);
      }
    }
  });

  test("trust pages carry at least 500 characters of prose", () => {
    for (const page of prosePages) {
      const prose = page.sections.flatMap((section) => section.paragraphs).join(" ");
      assert.ok(prose.length >= 500, `${page.path} has ${prose.length}`);
    }
  });

  test("the 404 body names the path and points at recovery surfaces", () => {
    const body = renderNotFoundMarkdown("/nope");
    assert.ok(body.includes("`/nope`"));
    assert.ok(body.includes("https://coms.kyh.io/llms.txt"));
    assert.ok(body.includes("https://coms.kyh.io/sitemap.xml"));
  });
});
