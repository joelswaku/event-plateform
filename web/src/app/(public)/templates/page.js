import { generateMetadata as genMeta, PAGE_METADATA } from "@/lib/seo";
import TemplatesPageContent from "./TemplatesPageContent";

/* ─── SEO Metadata ──────────────────────────────────────────── */
export const metadata = genMeta(PAGE_METADATA.templates);

/* ─── Page ──────────────────────────────────────────────────── */
export default function TemplatesPage() {
  return <TemplatesPageContent />;
}
