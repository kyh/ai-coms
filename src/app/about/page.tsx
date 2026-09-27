import { ProsePage, prosePageMetadata } from "@/components/site/prose-page";

export const metadata = prosePageMetadata("/about");

const Page = () => <ProsePage path="/about" />;

export default Page;
