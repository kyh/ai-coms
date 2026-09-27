import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { prosePages } from "./site-content";
import {
  buildHomeGraph,
  buildOrganization,
  buildProsePageGraph,
  serializeJsonLd,
} from "./structured-data";

describe("structured data", () => {
  test("the home graph carries Organization, WebSite and SoftwareApplication", () => {
    const types = buildHomeGraph()["@graph"].map((node) => node["@type"]);
    assert.deepEqual(types, ["Organization", "WebSite", "SoftwareApplication"]);
  });

  test("the organization is contactable without a postal address", () => {
    const organization = buildOrganization();
    assert.equal(organization.email, "kai@kyh.io");
    assert.ok(organization.contactPoint.every((point) => point.email === organization.email));
    assert.ok(organization.sameAs.length > 0);
    assert.equal("address" in organization, false);
  });

  test("prose pages link back to the organization", () => {
    for (const page of prosePages) {
      const [, webPage] = buildProsePageGraph(page)["@graph"];
      assert.equal(webPage["@type"], page.schemaType);
      assert.equal(webPage.url, `https://coms.kyh.io${page.path}`);
    }
  });

  test("serialization cannot close the script tag early", () => {
    const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    assert.equal(serialized.includes("<"), false);
    assert.equal(JSON.parse(serialized).name, "</script><script>alert(1)</script>");
  });
});
