import { generateMetadata as genMeta, PAGE_METADATA } from "@/lib/seo";

/* ─── SEO Metadata ──────────────────────────────────────────── */
export const metadata = genMeta(PAGE_METADATA.faq);

export default function FAQLayout({ children }) {
  return children;
}
