import { generateMetadata as genMeta, PAGE_METADATA } from "@/lib/seo";
import FeaturesPageContent from "./FeaturesPageContent";

/* ─── SEO Metadata ──────────────────────────────────────────── */
export const metadata = genMeta(PAGE_METADATA.features);

/* ─── Page ──────────────────────────────────────────────────── */
export default function FeaturesPage() {
  return <FeaturesPageContent />;
}
