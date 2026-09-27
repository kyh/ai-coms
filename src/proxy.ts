import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { negotiateMediaType, notAcceptableBody, withVaryAccept } from "@/lib/agent/accept";

/**
 * Markdown content negotiation (acceptmarkdown.com): one URL, two
 * representations. Server Components always render HTML, so Markdown-preferring
 * requests are rewritten to `/api/markdown/*` before the page renders.
 */

const markdownRewrite = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone();
  url.pathname = `/api/markdown${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
};

/** Keep Next's RSC vary tokens; a plain `set` would let a CDN serve a flight payload to a document request. */
const applyVary = (response: NextResponse): NextResponse => {
  response.headers.set("Vary", withVaryAccept(response.headers.get("Vary")));
  return response;
};

/** React's own transport (`text/x-component`), not a representation of the page — negotiating it would 406 Server Actions. */
const isFlightRequest = (request: NextRequest) =>
  (request.headers.get("accept") ?? "").toLowerCase().includes("text/x-component") ||
  request.headers.has("next-action");

export const proxy = (request: NextRequest) => {
  if (isFlightRequest(request)) {
    return applyVary(NextResponse.next());
  }

  const accept = request.headers.get("accept");
  const chosen = negotiateMediaType(accept);

  if (chosen === "text/markdown") {
    return applyVary(markdownRewrite(request, request.nextUrl.pathname));
  }

  if (chosen === null) {
    return new Response(notAcceptableBody(accept), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
      },
      status: 406,
    });
  }

  return applyVary(NextResponse.next());
};

/**
 * Only requests whose Accept names markdown invoke the proxy, so HTML views
 * never pay for it. Next and Vercel compile `has` values to case-sensitive
 * regexes, hence the per-character casing. eve's routes and Next internals are
 * excluded; files with a single representation are too.
 */
export const config = {
  matcher: [
    {
      has: [{ key: "accept", type: "header", value: ".*[Mm][Aa][Rr][Kk][Dd][Oo][Ww][Nn].*" }],
      source:
        "/((?!api/|_next/|_vercel/|_eve_internal/|eve/|favicon/|robots\\.txt$|sitemap\\.xml$|llms\\.txt$|og\\.jpg$).*)",
    },
  ],
};
