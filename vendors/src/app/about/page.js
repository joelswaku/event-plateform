"use client";
import Link from "next/link";
import { Zap, Users, Star, Shield, TrendingUp, Globe, ArrowRight, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import useT from "@/hooks/useT";

const STATS = [
  { label: "Active Vendors",     value: "527+",  color: "#818cf8" },
  { label: "Bookings Completed", value: "18,400+",color: "#4ade80" },
  { label: "Revenue Generated",  value: "$2.4M+", color: "#f59e0b" },
  { label: "Countries Served",   value: "32",     color: "#c084fc" },
];

const VALUES = [
  { icon: Shield,    title: "Trust First",        desc: "Every vendor on the platform goes through a verification process. We put organizers' peace of mind before everything else." },
  { icon: TrendingUp,title: "Vendor Growth",       desc: "We're built for vendors, not just organizers. Our tools, analytics, and AI features are designed to grow your business." },
  { icon: Globe,     title: "Global Marketplace",  desc: "From New York to Dubai — our marketplace connects event professionals across 32 countries and growing." },
  { icon: Star,      title: "Quality Over Volume", desc: "We'd rather have 500 exceptional vendors than 5,000 mediocre ones. Quality is non-negotiable." },
];

export default function AboutPage() {
  const T = useT();

  return (
    <div style={{ background: T.pageBg, color: T.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <div style={{ paddingTop: "128px", paddingBottom: "80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-200px", left: "50%", transform: "translateX(-50%)", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 14px", borderRadius: "100px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", fontSize: "11px", fontWeight: 600, color: "#a78bfa", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "24px" }}>
            <Zap size={11} /> Our Story
          </div>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 56px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px", maxWidth: "700px", margin: "0 auto 20px" }}>
            Built for Event Professionals,{" "}
            <span style={{ background: "linear-gradient(135deg, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              by Event Professionals
            </span>
          </h1>
          <p style={{ fontSize: "17px", color: T.textSub, fontWeight: 400, lineHeight: 1.75, maxWidth: "520px", margin: "0 auto" }}>
            EventApp was born out of frustration — finding reliable vendors for events was slow, opaque, and inconsistent.
            We built the marketplace we always wished existed.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ borderTop: `1px solid ${T.borderSub}`, borderBottom: `1px solid ${T.borderSub}`, background: T.sectionBg }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }} className="stats-grid">
            {STATS.map(({ label, value, color }, i) => (
              <div key={label} style={{ padding: "44px 24px", textAlign: "center", borderRight: i < 3 ? `1px solid ${T.borderSub}` : "none" }}>
                <div style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 700, letterSpacing: "-0.025em", color, marginBottom: "6px" }}>{value}</div>
                <div style={{ fontSize: "11px", fontWeight: 500, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "96px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }} className="two-col">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 14px", borderRadius: "100px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", fontSize: "11px", fontWeight: 600, color: "#a78bfa", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "20px" }}>
              Our Mission
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: "20px" }}>
              Make Event Vendor Hiring as Easy as Ordering Online
            </h2>
            <p style={{ fontSize: "16px", color: T.textSub, lineHeight: 1.8, marginBottom: "16px" }}>
              We believe talented event professionals deserve to be found. And we believe event organizers deserve confidence
              in every vendor they hire.
            </p>
            <p style={{ fontSize: "16px", color: T.textSub, lineHeight: 1.8, marginBottom: "32px" }}>
              EventApp bridges that gap — a transparent, trust-first marketplace where quality vendors get discovered
              and organizers book with confidence.
            </p>
            {[
              "Verified vendor profiles with real reviews",
              "AI-powered tools to help vendors grow",
              "Transparent pricing, no hidden fees",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", fontSize: "14px", color: T.textSub }}>
                <CheckCircle size={14} color="#4ade80" /> {item}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ ...T.glass, padding: "24px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                  <Icon size={17} color="#818cf8" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "6px" }}>{title}</div>
                <div style={{ fontSize: "12px", color: T.textMuted, lineHeight: 1.65, fontWeight: 400 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: `1px solid ${T.borderSub}`, padding: "80px 32px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: "14px" }}>
            Ready to Join the Platform?
          </h2>
          <p style={{ fontSize: "15px", color: T.textMuted, fontWeight: 400, lineHeight: 1.7, marginBottom: "28px" }}>
            List your services for free and get discovered by event organizers today.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 26px", borderRadius: "11px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>
              Join as a Vendor <ArrowRight size={14} />
            </Link>
            <Link href="/marketplace" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 26px", borderRadius: "11px", background: T.hoverBg, border: `1px solid ${T.inputBorder}`, color: T.textSub, fontWeight: 500, fontSize: "14px", textDecoration: "none" }}>
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @media (max-width: 768px) {
          .two-col { grid-template-columns: 1fr !important; gap: 48px !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid > div { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.05); }
        }
      `}</style>
    </div>
  );
}
