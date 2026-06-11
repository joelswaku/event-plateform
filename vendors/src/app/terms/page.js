"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import useT from "@/hooks/useT";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing or using EventApp (\"the Platform\"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Platform. These terms apply to all users including vendors, event organizers, and visitors.",
  },
  {
    title: "2. Use of the Platform",
    content: "You agree to use EventApp for lawful purposes only. You may not misrepresent your identity, services, or credentials. Spam, automated scraping, or any activity that disrupts the platform is strictly prohibited. We reserve the right to suspend or terminate accounts that violate these terms.",
  },
  {
    title: "3. Vendor Accounts",
    content: "Vendors must provide accurate business information during registration. All portfolio content, service descriptions, and pricing must be genuine and up to date. EventApp is not responsible for disputes between vendors and organizers — we provide the marketplace infrastructure only.",
  },
  {
    title: "4. Payments and Fees",
    content: "Subscription fees are billed monthly or annually depending on your chosen plan. There are no per-booking fees on organic leads received through your profile. All prices are listed in USD. Refunds are handled on a case-by-case basis — contact support@eventapp.io within 7 days of a charge.",
  },
  {
    title: "5. Intellectual Property",
    content: "Content you upload to EventApp (photos, descriptions, portfolio items) remains yours. By uploading, you grant EventApp a non-exclusive license to display it on the platform. You may not use EventApp's branding, design, or code without written permission.",
  },
  {
    title: "6. Privacy",
    content: "Your use of EventApp is also governed by our Privacy Policy. We collect and use data as described there. We do not sell your personal data to third parties.",
  },
  {
    title: "7. Disclaimers",
    content: "EventApp is provided 'as is' without warranties of any kind. We do not guarantee the accuracy of vendor listings or the outcome of any booking. We are not liable for disputes, losses, or damages arising from interactions between vendors and organizers.",
  },
  {
    title: "8. Changes to Terms",
    content: "We may update these Terms at any time. We will notify users of material changes via email or in-app notice. Continued use of the platform after changes constitutes acceptance of the new terms.",
  },
  {
    title: "9. Contact",
    content: "For questions about these Terms, contact us at legal@eventapp.io or visit our Contact page.",
  },
];

export default function TermsPage() {
  const T = useT();

  return (
    <div style={{ background: T.pageBg, color: T.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minHeight: "100vh" }}>
      <Navbar />

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "120px 32px 96px" }}>
        <div style={{ marginBottom: "48px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>Legal</div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: "14px" }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: "14px", color: T.textFaint, fontWeight: 400 }}>
            Last updated: January 1, 2026 · <Link href="/privacy" style={{ color: "#818cf8", textDecoration: "none" }}>Privacy Policy</Link>
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
          <p style={{ fontSize: "13px", color: T.textFaint, marginBottom: "12px" }}>Questions? We&apos;re here to help.</p>
          <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", borderRadius: "10px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textSub, fontWeight: 500, fontSize: "13px", textDecoration: "none" }}>
            Contact Us
          </Link>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}
