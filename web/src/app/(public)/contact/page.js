import { generateMetadata as genMeta, PAGE_METADATA } from "@/lib/seo";
import ContactPageContent from "./ContactPageContent";

/* ─── SEO Metadata ──────────────────────────────────────────── */
export const metadata = genMeta(PAGE_METADATA.contact);

/* ─── Page ──────────────────────────────────────────────────── */
export default function ContactPage() {
  return <ContactPageContent />;
}
