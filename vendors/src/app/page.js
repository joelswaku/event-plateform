"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Zap, ArrowRight, Star, Check, BadgeCheck, BarChart2,
  MessageSquare, Search, Bell, Camera, Music, Utensils,
  Flower, Building, Car, Lightbulb, Speaker, Scissors,
  Mic, Cake, Armchair, Theater, Video, ShieldCheck, Mail,
  ChevronRight, TrendingUp, Globe, Clock, Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import useT from "@/hooks/useT";
import { useVendorStore } from "@/store/vendor.store";

/* ─── Static data ─────────────────────────────────────────────────────────── */

const STATS = [
  { value: "$2.4M+", label: "Vendor Revenue",    color: "#4ade80"                },
  { value: "18,400+",label: "Bookings Done",      color: "rgba(255,255,255,0.9)" },
  { value: "527",    label: "Active Vendors",     color: "#818cf8"               },
  { value: "98%",    label: "Satisfaction Rate",  color: "rgba(255,255,255,0.9)" },
];

const STEPS = [
  {
    step: "01",
    icon: Users,
    title: "Create your profile",
    desc: "Build a beautiful vendor profile in minutes. Add your portfolio, services, pricing, and bio — no design skills needed.",
    color: "#6366f1",
  },
  {
    step: "02",
    icon: Globe,
    title: "Get discovered",
    desc: "Appear in search results when organizers look for your service. Our algorithm surfaces you to the most relevant clients.",
    color: "#a78bfa",
  },
  {
    step: "03",
    icon: MessageSquare,
    title: "Receive inquiries",
    desc: "Organizers contact you directly through your profile. Reply, quote, and close bookings — all from your dashboard.",
    color: "#4ade80",
  },
];

const FEATURES = [
  { icon: BadgeCheck, title: "Verified Badge",       desc: "Earn a verified badge to stand out and receive 3× more inquiries from serious organizers.",       color: "#818cf8" },
  { icon: BarChart2,  title: "Analytics Dashboard",  desc: "See exactly how many views, clicks, and inquiries your profile gets — and how to improve.",       color: "#4ade80" },
  { icon: MessageSquare, title: "Inquiry Inbox",     desc: "All your client messages in one place. Reply with quotes, attachments, and follow-ups easily.",   color: "#f59e0b" },
  { icon: Star,       title: "Review System",        desc: "Collect verified reviews from real clients. More reviews = higher ranking in search results.",    color: "#fb923c" },
  { icon: TrendingUp, title: "Performance Insights", desc: "Track your ranking, response rate, and booking trends. Know exactly what's working.",            color: "#34d399" },
  { icon: Bell,       title: "Instant Notifications",desc: "Get notified the moment an organizer sends an inquiry. Fast response = more bookings.",          color: "#f472b6" },
];

const CATEGORIES = [
  { icon: Camera,      label: "Photography"     },
  { icon: Video,       label: "Videography"     },
  { icon: Music,       label: "Music & DJ"      },
  { icon: Utensils,    label: "Catering"        },
  { icon: Flower,      label: "Flowers & Décor" },
  { icon: Building,    label: "Venue"           },
  { icon: Lightbulb,   label: "Lighting"        },
  { icon: Speaker,     label: "Sound & AV"      },
  { icon: Scissors,    label: "Hair & Makeup"   },
  { icon: Cake,        label: "Cake & Desserts" },
  { icon: Car,         label: "Transportation"  },
  { icon: ShieldCheck, label: "Security"        },
  { icon: Theater,     label: "Entertainment"   },
  { icon: Mic,         label: "Officiant"       },
  { icon: Armchair,    label: "Rentals"         },
  { icon: Mail,        label: "Invitations"     },
];

const TESTIMONIALS = [
  {
    name: "James Okafor",    role: "Photographer · New York",
    text: "I went from 2 inquiries a month to over 20 within 6 weeks of joining. The verification badge changed everything.",
    rating: 5, initial: "J", color: "#818cf8",
  },
  {
    name: "Sofia Reinholt",  role: "Caterer · Los Angeles",
    text: "The dashboard is beautiful and my clients comment on how professional my profile looks. Best investment I've made.",
    rating: 5, initial: "S", color: "#4ade80",
  },
  {
    name: "Marcus Belle",    role: "DJ & Entertainer · Miami",
    text: "I landed 3 corporate gigs in the first month. EventApp Vendors is the only marketplace I use now.",
    rating: 5, initial: "M", color: "#f59e0b",
  },
];

const PLAN_FEATURES = [
  "Unlimited profile views",
  "Appear in marketplace search",
  "Receive unlimited inquiries",
  "Analytics & performance insights",
  "Verified badge eligibility",
  "Review collection tools",
  "Priority support",
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function PulsingDot({ color = "#4ade80", size = 6 }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.4, animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }} />
      <span style={{ position: "relative", width: size, height: size, borderRadius: "50%", background: color }} />
    </span>
  );
}

function StarRow({ count = 5 }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
      ))}
    </span>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const T   = useT();
  const sec = { maxWidth: "1200px", margin: "0 auto", padding: "0 32px" };
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useVendorStore();
  useEffect(() => { setMounted(true); }, []);
  const loggedIn = mounted && isAuthenticated;

  return (
    <div style={{ background: T.pageBg, color: T.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", overflowX: "hidden" }}>
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", paddingTop: "140px", paddingBottom: "100px", overflow: "hidden" }}>

        {/* Ambient glows */}
        <div style={{ position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 65%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "20%", right: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(192,38,211,0.06) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />

        <div style={{ ...sec, textAlign: "center", position: "relative" }}>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "100px", background: T.cardBg, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)", fontSize: "11px", fontWeight: 600, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "36px" }}>
            <PulsingDot color="#4ade80" size={5} />
            The #1 marketplace for event professionals
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: "clamp(38px, 6vw, 72px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "22px", maxWidth: "860px", margin: "0 auto 22px" }}>
            Turn Your Talent Into{" "}
            <span style={{ background: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Consistent Bookings
            </span>
          </h1>

          <p style={{ fontSize: "18px", color: T.textSub, fontWeight: 400, lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 44px" }}>
            Join 500+ event professionals already getting discovered, booked, and paid through EventApp Vendors. Free to join — always.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", marginBottom: "56px" }}>
            {loggedIn ? (
              <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "16px 32px", borderRadius: "13px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", fontSize: "15px", fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 28px rgba(79,70,229,0.35)", letterSpacing: "-0.01em" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(79,70,229,0.45)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(79,70,229,0.35)"; }}>
                Go to My Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link href="/register/vendor" style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "16px 32px", borderRadius: "13px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", fontSize: "15px", fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 28px rgba(79,70,229,0.35)", letterSpacing: "-0.01em", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(79,70,229,0.45)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(79,70,229,0.35)"; }}>
                  Create Your Free Profile <ArrowRight size={16} />
                </Link>
                <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "16px 28px", borderRadius: "13px", background: T.cardBg, border: `1px solid ${T.border}`, color: T.textSub, fontSize: "15px", fontWeight: 600, textDecoration: "none" }}>
                  Sign In to Dashboard
                </Link>
              </>
            )}
          </div>

          {/* Trust row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", flexWrap: "wrap" }}>
            {[
              { icon: Check, text: "Free forever" },
              { icon: Check, text: "No booking commission" },
              { icon: Check, text: "Set up in 5 minutes" },
              { icon: Check, text: "Cancel anytime" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: T.textMuted, fontWeight: 500 }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={10} color="#4ade80" strokeWidth={3} />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: `1px solid ${T.borderSub}`, borderBottom: `1px solid ${T.borderSub}`, padding: "52px 0" }}>
        <div style={{ ...sec, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }} className="stats-grid">
          {STATS.map(({ value, label, color }) => (
            <div key={label} style={{ textAlign: "center", padding: "8px" }}>
              <div style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", color, marginBottom: "6px", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: "100px 0" }}>
        <div style={sec}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>How It Works</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "14px" }}>
              Start getting booked in 3 steps
            </h2>
            <p style={{ fontSize: "16px", color: T.textSub, maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
              The fastest way for event professionals to get online, get found, and grow their business.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }} className="steps-grid">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.step} style={{ padding: "36px 32px", borderRadius: "20px", background: T.cardBg, border: `1px solid ${T.glassBorder}`, position: "relative", overflow: "hidden" }}>
                  {/* Step number watermark */}
                  <div style={{ position: "absolute", top: "16px", right: "20px", fontSize: "64px", fontWeight: 900, color: `${s.color}0a`, lineHeight: 1, letterSpacing: "-0.04em", userSelect: "none" }}>{s.step}</div>

                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: `${s.color}1a`, border: `1px solid ${s.color}33`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                    <Icon size={24} color={s.color} strokeWidth={1.5} />
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Step {s.step}</div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "10px", color: T.text }}>{s.title}</h3>
                  <p style={{ fontSize: "14px", color: T.textSub, lineHeight: 1.7, fontWeight: 400 }}>{s.desc}</p>

                  {/* Connector arrow (not on last) */}
                  {i < 2 && (
                    <div style={{ position: "absolute", right: "-13px", top: "50%", transform: "translateY(-50%)", zIndex: 1, display: "flex" }} className="step-arrow">
                      <ChevronRight size={24} color={T.borderSub} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: "100px 0", borderTop: `1px solid ${T.borderSub}` }}>
        <div style={sec}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Everything You Need</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "14px" }}>
              Your complete vendor toolkit
            </h2>
            <p style={{ fontSize: "16px", color: T.textSub, maxWidth: "460px", margin: "0 auto", lineHeight: 1.7 }}>
              Everything you need to showcase your work, manage client relationships, and grow your bookings.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }} className="feat-grid">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={{ padding: "28px 26px", borderRadius: "18px", background: T.cardBg, border: `1px solid ${T.glassBorder}`, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${f.color}40`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.glassBorder; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${f.color}1a`, border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <Icon size={20} color={f.color} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.015em", marginBottom: "8px", color: T.text }}>{f.title}</h3>
                  <p style={{ fontSize: "13px", color: T.textSub, lineHeight: 1.65, fontWeight: 400 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ CATEGORIES ════════════════════════════════════════════════════════ */}
      <section id="categories" style={{ padding: "100px 0", borderTop: `1px solid ${T.borderSub}` }}>
        <div style={sec}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Who We Serve</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "14px" }}>
              Join your category today
            </h2>
            <p style={{ fontSize: "16px", color: T.textSub, maxWidth: "420px", margin: "0 auto", lineHeight: 1.7 }}>
              From photographers to officiants — we support every kind of event professional.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "8px" }} className="cat-grid">
            {CATEGORIES.map(({ icon: Icon, label }) => (
              <Link key={label} href="/register/vendor"
                style={{ padding: "20px 10px", borderRadius: "14px", background: T.cardBg, border: `1px solid ${T.glassBorder}`, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textDecoration: "none", transition: "all 0.18s", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(129,140,248,0.35)"; e.currentTarget.style.background = "rgba(99,102,241,0.06)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.glassBorder; e.currentTarget.style.background = T.cardBg; e.currentTarget.style.transform = "none"; }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color="#818cf8" strokeWidth={1.5} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 500, color: T.textSub, textAlign: "center", lineHeight: 1.3 }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 0", borderTop: `1px solid ${T.borderSub}` }}>
        <div style={sec}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Vendor Stories</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              Vendors who grew with us
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }} className="test-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{ padding: "28px", borderRadius: "20px", background: T.cardBg, border: `1px solid ${T.glassBorder}` }}>
                <div style={{ marginBottom: "16px" }}>
                  <StarRow />
                </div>
                <p style={{ fontSize: "15px", color: T.textSub, lineHeight: 1.75, fontWeight: 400, marginBottom: "20px", fontStyle: "italic" }}>
                  "{t.text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "16px", borderTop: `1px solid ${T.borderSub}` }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `linear-gradient(135deg, ${t.color}44, ${t.color}22)`, border: `1px solid ${t.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: t.color, flexShrink: 0 }}>
                    {t.initial}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>{t.name}</div>
                    <div style={{ fontSize: "12px", color: T.textMuted, marginTop: "2px" }}>{t.role}</div>
                  </div>
                  <BadgeCheck size={16} color="#818cf8" style={{ marginLeft: "auto", flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING / FINAL CTA ═══════════════════════════════════════════════ */}
      <section style={{ padding: "100px 0", borderTop: `1px solid ${T.borderSub}` }}>
        <div style={{ ...sec, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }} className="cta-grid">

          {/* Left — copy */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Always Free</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "18px" }}>
              Zero cost to<br />join and grow
            </h2>
            <p style={{ fontSize: "16px", color: T.textSub, lineHeight: 1.7, marginBottom: "32px", maxWidth: "400px" }}>
              Create your profile for free. Get discovered, receive inquiries, and build your reputation — no credit card required.
            </p>
            <Link href={loggedIn ? "/dashboard" : "/register/vendor"} style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "16px 32px", borderRadius: "13px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", fontSize: "15px", fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 28px rgba(79,70,229,0.35)", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(79,70,229,0.45)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(79,70,229,0.35)"; }}>
              {loggedIn ? "Go to Dashboard" : "Get Started — It's Free"} <ArrowRight size={16} />
            </Link>
          </div>

          {/* Right — feature checklist */}
          <div style={{ padding: "36px", borderRadius: "22px", background: T.cardBg, border: `1px solid ${T.glassBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={17} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.015em", color: T.text }}>Vendor Pro</div>
                <div style={{ fontSize: "13px", color: "#4ade80", fontWeight: 600 }}>Free — forever</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {PLAN_FEATURES.map((feat) => (
                <div key={feat} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={11} color="#4ade80" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: "14px", color: T.textSub, fontWeight: 500 }}>{feat}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${T.borderSub}` }}>
              <Link href={loggedIn ? "/dashboard" : "/register/vendor"} style={{ display: "block", textAlign: "center", padding: "14px", borderRadius: "11px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
                {loggedIn ? "Go to Dashboard" : "Create My Profile — Free"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: `1px solid ${T.borderSub}`, padding: "56px 32px 32px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }} className="footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={14} color="#fff" strokeWidth={2.2} />
                </div>
                <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.015em", color: T.text }}>EventApp Vendors</span>
              </div>
              <p style={{ fontSize: "13px", color: T.textFaint, lineHeight: 1.75, fontWeight: 400, maxWidth: "220px" }}>
                The professional marketplace for event vendors. Get discovered. Get booked. Grow your business.
              </p>
            </div>
            {[
              { title: "For Vendors",   links: [["Create Profile", "/register/vendor"], ["Sign In", "/login"], ["How It Works", "#how-it-works"], ["Pricing", "/pricing"]] },
              { title: "Product",       links: [["Features", "#features"], ["Categories", "#categories"], ["Dashboard", "/dashboard"], ["Verification", "/dashboard/verification"]] },
              { title: "Company",       links: [["About", "/about"], ["Contact", "/contact"], ["Terms", "/terms"], ["Privacy", "/privacy"]] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: T.textFaint, marginBottom: "16px" }}>{title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {links.map(([label, href]) => (
                    <Link key={label} href={href} style={{ fontSize: "13px", fontWeight: 400, color: T.textMuted, textDecoration: "none", transition: "color 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = T.textSub; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; }}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${T.borderSub}`, paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontSize: "12px", color: T.textFaint }}>© 2026 EventApp Vendors. All rights reserved.</p>
            <div style={{ display: "flex", gap: "24px" }}>
              {[["Privacy", "/privacy"], ["Terms", "/terms"], ["Contact", "/contact"]].map(([l, href]) => (
                <Link key={l} href={href} style={{ fontSize: "12px", color: T.textFaint, textDecoration: "none" }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }
        @media (max-width: 1024px) {
          .cat-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .feat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .steps-grid { grid-template-columns: 1fr !important; }
          .test-grid  { grid-template-columns: 1fr !important; }
          .cta-grid   { grid-template-columns: 1fr !important; }
          .step-arrow { display: none !important; }
        }
        @media (max-width: 768px) {
          .stats-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .feat-grid   { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .cat-grid    { grid-template-columns: repeat(4, 1fr) !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .stats-grid  { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
