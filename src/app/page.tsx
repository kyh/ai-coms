import type { Metadata } from "next";

import { JsonLd } from "@/components/site/json-ld";
import { HomeIntro } from "@/components/site/home-intro";
import { ComsApp } from "@/components/workspace/coms-app";
import { buildHomeGraph } from "@/lib/agent/structured-data";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const Page = () => (
  <>
    <JsonLd node={buildHomeGraph()} />
    <HomeIntro />
    <ComsApp />
  </>
);

export default Page;
