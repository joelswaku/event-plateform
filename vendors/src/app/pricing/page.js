"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Zap, ArrowRight, BadgeCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import useT from "@/hooks/useT";

const PLANS = [
  {
    name: "Free",
    price: { monthly: "$0", annual: "$0" },
    desc: "Perfect for getting started and testing the platform.",
    color: "#6b7280",
    cta: "Start Free",
    ctaLink: "/register",
    perks: [
      "Marketplace listing",
      "Basic vendor profile",
      "5 portfolio images",
      "Receive inquiries",
      "Basic analytics",
      "Community support",
    ],
    muted: true,
  },
  {
    name: "Pro",
    price: { monthly: "$29", annual: "$23" },
    desc: "For vendors serious about growing their business.",
    color: "#6366f1",
    cta: "Start Pro Free",
    ctaLink: "/register?plan=pro",
    popular: true,
    perks: [
      "Everything in Free",
      "Priority marketplace ranking",
      "Unlimited portfolio images",
      "Full analytics dashboard",
      "AI tools (bio, pricing, campaigns)",
      "Verified badge",
      "Custom profile URL",
      "Priority support",
    ],
  },
  {
    name: "Business",
    price: { monthly: "$79", annual: "$63" },
    desc: "For established vendors and agencies at scale.",
    color: "#a78bfa",
    cta: "Contact Sales",
    ctaLink: "/contact",
    perks: [
      "Everything in Pro",
      "Homepage featured placement",
      "Team management (5 users)",
      "API access & webhooks",
      "Custom domain",
      "Dedicated account manager",
      "White-glove onboarding",
      "Enterprise reporting",
    ],
  },
];

const FAQ = [
  { q: "Is there a free trial?", a: "Yes — the Free plan is free forever. The Pro plan includes a 14-day free trial with no credit card required." },
  { q: "Can I cancel anytime?", a: "Absolutely. Cancel your subscription at any time from your account settings. No questions asked." },
  { q: "Are there booking fees?", a: "No per-booking fees on organic leads you receive through your profile. We only charge the flat monthly subscription." },
  { q: "Can I switch plans?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards (Visa, Mastercard, Amex) and PayPal." },
];

export default function PricingPage() {
  const T = useT();
  const [cycle, setCycle] = useState("monthly");

  return (
    <div style={{ background: T.pageBg, color: T.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minHeight: "100vh" }}>
      <Navbar />

      {/* Header */}
      <div style={{ paddingTop: "120px", paddingBottom: "64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-200px", left: "50%", transform: "translateX(-50%)", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 14px", borderRadius: "100px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", fontSize: "11px", fontWeight: 600, color: "#a78bfa", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "24px" }}>
            <Zap size={11} /> Simple, Transparent Pricing
          </div>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "16px" }}>
            Start Free. Scale When Ready.
          </h1>
          <p style={{ fontSize: "17px", color: T.textSub, fontWeight: 400, lineHeight: 1.7, maxWidth: "460px", margin: "0 auto 32px" }}>
            No booking fees on organic leads. No hidden charges. Cancel anytime.
          </p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", background: T.hoverBg, border: `1px solid ${T.border}`, borderRadius: "100px", padding: "4px" }}>
            {["monthly", "annual"].map((c) => (
              <button key={c} onClick={() => setCycle(c)}
                style={{ padding: "8px 20px", borderRadius: "100px", fontSize: "13px", fontWeight: 500, border: "none", cursor: "pointer", background: cycle === c ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "transparent", color: cycle === c ? "#fff" : T.textMuted, transition: "all 0.2s", fontFamily: "inherit" }}>
                {c === "annual" ? "Annual · Save 20%" : "Monthly"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plans */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px 96px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1fr", gap: "16px", maxWidth: "960px", margin: "0 auto", alignItems: "start" }} className="pricing-grid">
          {PLANS.map(({ name, price, desc, color, cta, ctaLink, popular, perks, muted }) =>
            popular ? (
              <div key={name} style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed, #a78bfa)", borderRadius: "22px", padding: "1.5px", position: "relative" }}>
                <div style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)", padding: "4px 16px", borderRadius: "100px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", fontSize: "10px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Most Popular
                </div>
                <div style={{ background: T.pageBg, borderRadius: "21px", padding: "36px 30px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color, marginBottom: "8px" }}>{name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "44px", fontWeight: 700, letterSpacing: "-0.03em" }}>{price[cycle]}</span>
                    {price[cycle] !== "$0" && <span style={{ fontSize: "14px", color: T.textMuted }}>/mo</span>}
                  </div>
                  <p style={{ fontSize: "13px", color: T.textSub, lineHeight: 1.6, marginBottom: "24px" }}>{desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                    {perks.map((p) => (
                      <div key={p} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 500, color: T.textSub }}>
                        <CheckCircle size={13} color={color} /> {p}
                      </div>
                    ))}
                  </div>
                  <Link href={ctaLink} style={{ display: "block", textAlign: "center", padding: "14px", borderRadius: "11px", fontWeight: 600, fontSize: "14px", textDecoration: "none", color: "#fff", background: `linear-gradient(135deg, ${color}, #7c3aed)` }}>
                    {cta}
                  </Link>
                </div>
              </div>
            ) : (
              <div key={name} style={{ ...T.glass, padding: "30px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color, marginBottom: "8px" }}>{name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.03em" }}>{price[cycle]}</span>
                  {price[cycle] !== "$0" && <span style={{ fontSize: "14px", color: T.textMuted }}>/mo</span>}
                </div>
                <p style={{ fontSize: "13px", color: T.textMuted, lineHeight: 1.6, marginBottom: "24px" }}>{desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                  {perks.map((p) => (
                    <div key={p} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 400, color: muted ? T.textMuted : T.textSub }}>
                      <CheckCircle size={13} color={muted ? T.textFaint : color} /> {p}
                    </div>
                  ))}
                </div>
                <Link href={ctaLink} style={{ display: "block", textAlign: "center", padding: "13px", borderRadius: "11px", fontWeight: 500, fontSize: "14px", textDecoration: "none", color: T.textSub, background: T.hoverBg, border: `1px solid ${T.inputBorder}` }}>
                  {cta}
                </Link>
              </div>
            )
          )}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: "640px", margin: "80px auto 0" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", textAlign: "center", marginBottom: "40px" }}>Frequently Asked Questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {FAQ.map(({ q, a }) => (
              <div key={q} style={{ ...T.glass, padding: "22px 24px" }}>
                <div style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "8px" }}>{q}</div>
                <div style={{ fontSize: "14px", color: T.textSub, lineHeight: 1.7, fontWeight: 400 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @media (max-width: 768px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 440px !important; }
        }
      `}</style>
    </div>
  );
}
