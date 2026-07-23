import { generateMetadata as genMeta, PAGE_METADATA } from "@/lib/seo";
import AboutPageContent from "./AboutPageContent";

/* ─── SEO Metadata ──────────────────────────────────────────── */
export const metadata = genMeta(PAGE_METADATA.about);

/* ─── Page ──────────────────────────────────────────────────── */
export default function AboutPage() {
  return <AboutPageContent />;
}
