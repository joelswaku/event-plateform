"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import useT from "@/hooks/useT";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content: "We collect information you provide directly — such as your name, email address, business name, portfolio content, and payment information during registration or use of the platform. We also collect usage data such as pages visited, features used, and device information to improve the platform.",
  },
  {
    title: "2. How We Use Your Information",
    content: "We use your information to operate and improve the EventApp platform, process payments, send transactional emails (booking confirmations, invoices), provide customer support, and show your vendor profile in search results and the marketplace.",
  },
  {
    title: "3. Sharing Your Information",
    content: "We do not sell your personal data. We share information only with service providers who help us operate the platform (e.g., payment processors, email providers). We may disclose information if required by law or to protect the rights and safety of our users.",
  },
  {
    title: "4. Vendor Profile Data",
    content: "Information you add to your vendor profile (name, photos, services, reviews) is publicly visible to event organizers on the marketplace. You control this data and can update or remove it at any time from your profile settings.",
  },
  {
    title: "5. Cookies",
    content: "We use essential cookies to keep you logged in and maintain your session. We use analytics cookies to understand how users interact with the platform so we can improve it. You can disable non-essential cookies in your browser settings.",
  },
  {
    title: "6. Data Retention",
    content: "We retain your account data as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where we are required to retain it for legal or financial compliance reasons.",
  },
  {
    title: "7. Security",
    content: "We use industry-standard security measures including encryption in transit and at rest to protect your data. No system is 100% secure — if you suspect unauthorized access to your account, contact us immediately at security@eventapp.io.",
  },
  {
    title: "8. Your Rights",
    content: "Depending on your location, you may have rights to access, correct, or delete your personal data. To exercise any of these rights, contact us at privacy@eventapp.io and we will respond within 30 days.",
  },
  {
    title: "9. Changes to This Policy",
    content: "We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notice. The date at the top of this page shows when it was last updated.",
  },
  {
    title: "10. Contact",
    content: "For privacy questions or data requests, contact us at privacy@eventapp.io or write to EventApp, 123 Market Street, San Francisco, CA 94105.",
  },
];

export default function PrivacyPage() {
  const T = useT();

  return (
    <div style={{ background: T.pageBg, color: T.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minHeight: "100vh" }}>
      <Navbar />

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "120px 32px 96px" }}>
        <div style={{ marginBottom: "48px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>Legal</div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: "14px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "14px", color: T.textFaint, fontWeight: 400 }}>
            Last updated: January 1, 2026 · <Link href="/terms" style={{ color: "#818cf8", textDecoration: "none" }}>Terms of Service</Link>
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {SECTIONS.map(({ title, content }) => (
            <div key={title} style={{ ...T.glass, padding: "24px 28px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "10px", color: T.text }}>{title}</h2>
              <p style={{ fontSize: "14px", color: T.textSub, lineHeight: 1.75, fontWeight: 400 }}>{content}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "48px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: T.textFaint, marginBottom: "12px" }}>Questions about your data?</p>
          <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", borderRadius: "10px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textSub, fontWeight: 500, fontSize: "13px", textDecoration: "none" }}>
            Contact Us
          </Link>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}
