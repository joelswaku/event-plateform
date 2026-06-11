"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Star, CheckCircle, Heart, ChevronLeft, ChevronRight, X,
  Loader2, FileText, Users, Calendar, Send,
  Phone, Mail, Globe, ExternalLink, ChevronDown, ChevronUp,
  Camera, Download, BadgeCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import useT from "@/hooks/useT";

/*
  VENDOR SCHEMA — plug-and-play with GET /vendors/:slug
  Optional fields marked (*)
  ─────────────────────────────────────────────────────
  id, slug, business_name, category,
  tagline(*), bio(*),
  city, country, service_area(*),
  base_price(*), currency, price_label(*),
  rating, review_count, verification_status,
  logo_url(*), cover_url(*),
  email(*), phone(*), website_url(*),
  social_links: { instagram(*), facebook(*), linkedin(*) },
  portfolio:    [{ id, title, url(*) }],
  services:     [{ id, name, description(*), price(*) }],
  amenities:    [{ category, items: string[] }] (*),
  pricing_guide_url(*), pricing_guide_name(*), pricing_guide_size(*),
  faq:          [{ q, a }] (*),
  reviews:      [{ id, reviewer_name, reviewer_initial, reviewer_color(*),
                   rating, body, event_type(*), created_at, reply(*) }],
*/

const CATEGORY_COLORS = {
  "Photography": "#6366f1", "Videography": "#a78bfa", "Music & DJ": "#10b981",
  "Catering": "#f59e0b", "Flowers & Décor": "#f43f5e", "Venue": "#0ea5e9",
  "Transportation": "#f59e0b", "Security": "#6366f1", "Lighting": "#fbbf24",
  "Sound & AV": "#10b981", "Hair & Makeup": "#ec4899", "Officiant": "#a78bfa",
  "Cake & Desserts": "#f59e0b", "Invitations": "#6366f1", "Rentals": "#0ea5e9",
  "Entertainment": "#f43f5e",
};

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
  "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)",
  "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)",
  "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
  "linear-gradient(135deg,#fa709a 0%,#fee140 100%)",
];

/* ─── Utilities ────────────────────────────────────────────────────────────── */

function photoBg(photo, idx = 0) {
  return photo?.url ? `url(${photo.url}) center/cover no-repeat` : PHOTO_GRADIENTS[idx % PHOTO_GRADIENTS.length];
}

/* ─── Star Rating ──────────────────────────────────────────────────────────── */

function StarRating({ rating, size = 14, T }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size}
          fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
          color={i <= Math.round(rating) ? "#f59e0b" : T.textFaint} />
      ))}
    </span>
  );
}

/* ─── Loading / NotFound ───────────────────────────────────────────────────── */

function LoadingState() {
  const T = useT();
  return (
    <div style={{ minHeight: "100vh", background: T.pageBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Loader2 size={32} color="#6366f1" style={{ animation: "spin 1s linear infinite", margin: "0 auto 14px" }} />
        <p style={{ color: T.textMuted, fontWeight: 600, fontSize: "14px" }}>Loading vendor profile…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function NotFoundState() {
  const T = useT();
  return (
    <div style={{ minHeight: "100vh", background: T.pageBg, color: T.text }}>
      <Navbar />
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "140px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "60px", marginBottom: "18px" }}>🔍</div>
        <h1 style={{ fontSize: "26px", fontWeight: 900, marginBottom: "10px" }}>Vendor Not Found</h1>
        <p style={{ fontSize: "14px", color: T.textSub, marginBottom: "26px" }}>This profile doesn't exist or has been removed.</p>
        <Link href="/marketplace" style={{ display: "inline-block", padding: "12px 28px", borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#a78bfa)", color: "#fff", fontWeight: 700, textDecoration: "none" }}>
          Back to Marketplace
        </Link>
      </div>
    </div>
  );
}

/* ─── Hero Photo Gallery ───────────────────────────────────────────────────── */

function HeroGallery({ vendor, photos, color, T }) {
  const [mobileIdx, setMobileIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);

  const all = photos.length > 0 ? photos
    : vendor.cover_url ? [{ id: "cover", url: vendor.cover_url, title: vendor.business_name }]
    : [];

  const main = all[0] ?? null;
  const side = all.slice(1, 3);
  const extra = Math.max(0, all.length - 3);

  const prev = (e) => { e.stopPropagation(); setMobileIdx((i) => (i - 1 + all.length) % all.length); };
  const next = (e) => { e.stopPropagation(); setMobileIdx((i) => (i + 1) % all.length); };

  const floatBtn = {
    border: "none", cursor: "pointer",
    boxShadow: "0 2px 14px rgba(0,0,0,0.22)",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform 0.15s",
    background: "rgba(255,255,255,0.93)",
  };

  return (
    <>
      {/* ── Desktop asymmetric grid ── */}
      <div className="gallery-desktop" style={{ position: "relative", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "6px", borderRadius: "20px", overflow: "hidden", height: "340px" }}>
        {/* Large main photo */}
        <div onClick={() => { setLbIdx(0); setLbOpen(true); }}
          style={{ background: photoBg(main, 0), cursor: "pointer", position: "relative" }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.22) 0%,transparent 45%)" }} />
        </div>

        {/* Two stacked side photos */}
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: "6px" }}>
          {[0, 1].map((i) => (
            <div key={i} onClick={() => { setLbIdx(i + 1); setLbOpen(true); }}
              style={{ background: side[i] ? photoBg(side[i], i + 1) : PHOTO_GRADIENTS[(i + 1) % PHOTO_GRADIENTS.length], position: "relative", cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
              {i === 1 && extra > 0 && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.54)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <Camera size={20} color="#fff" />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: "15px" }}>+{extra} more</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save button */}
        <button onClick={() => setSaved((s) => !s)}
          style={{ ...floatBtn, position: "absolute", top: "14px", right: "14px", width: "40px", height: "40px", borderRadius: "50%" }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
          <Heart size={16} fill={saved ? "#f43f5e" : "none"} color={saved ? "#f43f5e" : "#374151"} />
        </button>

        {/* See all photos */}
        {all.length > 0 && (
          <button onClick={() => setLbOpen(true)}
            style={{ ...floatBtn, position: "absolute", bottom: "14px", right: "14px", gap: "7px", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, color: "#1f2937" }}>
            <Camera size={13} color="#374151" /> See All Photos ({all.length})
          </button>
        )}
      </div>

      {/* ── Mobile carousel ── */}
      <div className="gallery-mobile" style={{ display: "none", position: "relative", height: "230px", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: all.length > 0 ? photoBg(all[mobileIdx], mobileIdx) : `linear-gradient(135deg,${color}30,${color}10)`, transition: "background 0.3s" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.28) 0%,transparent 50%)" }} />
        </div>
        {all.length > 1 && (
          <>
            <button onClick={prev} style={{ ...floatBtn, position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "34px", height: "34px", borderRadius: "50%" }}>
              <ChevronLeft size={16} color="#374151" />
            </button>
            <button onClick={next} style={{ ...floatBtn, position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "34px", height: "34px", borderRadius: "50%" }}>
              <ChevronRight size={16} color="#374151" />
            </button>
            <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px", zIndex: 10 }}>
              {all.slice(0, 5).map((_, i) => (
                <button key={i} onClick={() => setMobileIdx(i)}
                  style={{ width: mobileIdx === i ? "18px" : "6px", height: "6px", borderRadius: "3px", background: mobileIdx === i ? "#fff" : "rgba(255,255,255,0.45)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s" }} />
              ))}
            </div>
          </>
        )}
        <button onClick={() => setSaved((s) => !s)}
          style={{ ...floatBtn, position: "absolute", top: "12px", right: "12px", width: "36px", height: "36px", borderRadius: "50%", zIndex: 10 }}>
          <Heart size={14} fill={saved ? "#f43f5e" : "none"} color={saved ? "#f43f5e" : "#374151"} />
        </button>
        {all.length > 0 && (
          <div style={{ position: "absolute", bottom: "12px", right: "12px", padding: "3px 9px", borderRadius: "8px", background: "rgba(0,0,0,0.5)", fontSize: "11px", fontWeight: 700, color: "#fff", zIndex: 10 }}>
            {mobileIdx + 1} / {all.length}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lbOpen && all.length > 0 && (
        <div onClick={() => setLbOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.94)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "min(820px,100%)" }}>
            <button onClick={() => setLbOpen(false)}
              style={{ position: "absolute", top: "-42px", right: 0, background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 600 }}>
              <X size={17} /> Close
            </button>

            <div style={{ height: "440px", borderRadius: "16px", background: photoBg(all[lbIdx], lbIdx), position: "relative", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "10px" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 50%)", borderRadius: "16px" }} />
              <span style={{ position: "absolute", bottom: "18px", left: "20px", fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                {all[lbIdx]?.title || `Photo ${lbIdx + 1}`}
              </span>
            </div>

            {all.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setLbIdx((i) => (i - 1 + all.length) % all.length); }}
                  style={{ position: "absolute", left: "-50px", top: "200px", width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setLbIdx((i) => (i + 1) % all.length); }}
                  style={{ position: "absolute", right: "-50px", top: "200px", width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
              {all.map((photo, i) => (
                <div key={photo.id || i} onClick={() => setLbIdx(i)}
                  style={{ width: "64px", height: "48px", flexShrink: 0, borderRadius: "8px", background: photoBg(photo, i), cursor: "pointer", border: lbIdx === i ? "2px solid #fff" : "2px solid rgba(255,255,255,0.18)", transition: "border-color 0.15s" }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Sticky Tab Navigation ────────────────────────────────────────────────── */

function TabNav({ isSticky, activeSection, onTabClick, color, T }) {
  const TABS = [
    { id: "about", label: "About" },
    { id: "pricing", label: "Pricing & Services" },
    { id: "reviews", label: "Reviews" },
    { id: "faq", label: "FAQ" },
  ];
  return (
    <div style={{
      position: isSticky ? "fixed" : "relative",
      top: isSticky ? "64px" : "auto",
      left: 0, right: 0, zIndex: 40,
      background: T.pageBg,
      borderBottom: `1px solid ${T.border}`,
      boxShadow: isSticky ? "0 2px 16px rgba(0,0,0,0.1)" : "none",
    }}>
      <div className="tab-scroll" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", display: "flex", overflowX: "auto" }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => onTabClick(tab.id)}
            style={{
              padding: "14px 22px", background: "none", border: "none", fontFamily: "inherit",
              borderBottom: activeSection === tab.id ? `2px solid ${color}` : "2px solid transparent",
              fontSize: "14px", fontWeight: activeSection === tab.id ? 700 : 500,
              color: activeSection === tab.id ? T.text : T.textSub,
              cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", marginBottom: "-1px",
            }}>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── FAQ Accordion ────────────────────────────────────────────────────────── */

function FaqAccordion({ items, color, T }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ borderRadius: "14px", border: `1px solid ${open === i ? color + "30" : T.border}`, background: T.cardBgSolid, overflow: "hidden", transition: "border-color 0.2s" }}>
          <button onClick={() => setOpen(open === i ? null : i)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "16px 18px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: T.text, lineHeight: 1.4 }}>{item.q}</span>
            {open === i ? <ChevronUp size={16} color={color} style={{ flexShrink: 0 }} /> : <ChevronDown size={16} color={T.textMuted} style={{ flexShrink: 0 }} />}
          </button>
          {open === i && (
            <div style={{ padding: "0 18px 16px" }}>
              <p style={{ fontSize: "13px", lineHeight: 1.75, color: T.textSub, fontWeight: 400 }}>{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Quote Sidebar Card ───────────────────────────────────────────────────── */

function QuoteSidebar({ vendor, slug, color, T }) {
  const [form, setForm] = useState({ date: "", guests: "", message: "Hi! I am interested in your services for my upcoming event..." });
  const [submitting, setSubmitting] = useState(false);

  const upd = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const qs = new URLSearchParams({ date: form.date, guests: form.guests }).toString();
    setTimeout(() => { window.location.href = `/vendor/${slug}/quote?${qs}`; }, 500);
  };

  const inp = {
    width: "100%", padding: "10px 13px",
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: "10px", fontSize: "13px", color: T.text,
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const focusColor = (e) => { e.target.style.borderColor = color; };
  const blurColor = (e) => { e.target.style.borderColor = T.inputBorder; };

  return (
    <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "26px", position: "sticky", top: "120px", boxShadow: "0 4px 28px rgba(0,0,0,0.07)" }}>
      <h3 style={{ fontSize: "17px", fontWeight: 800, color: T.text, marginBottom: "4px" }}>
        Contact {vendor.business_name?.split(" ")[0]}
      </h3>
      <p style={{ fontSize: "12px", color: T.textSub, lineHeight: 1.5, marginBottom: "18px" }}>
        Get a personalized quote for your event
      </p>

      {vendor.base_price != null && (
        <div style={{ padding: "12px 14px", borderRadius: "12px", background: `${color}0f`, border: `1px solid ${color}22`, textAlign: "center", marginBottom: "18px" }}>
          <div style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
            {vendor.price_label || "Starting from"}
          </div>
          <div style={{ fontSize: "22px", fontWeight: 900, color, letterSpacing: "-0.02em" }}>
            {vendor.currency || "USD"} {Number(vendor.base_price).toLocaleString()}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
            <Calendar size={10} /> Event Date
          </label>
          <input type="date" value={form.date} onChange={upd("date")} style={inp} onFocus={focusColor} onBlur={blurColor} />
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
            <Users size={10} /> Guest Count
          </label>
          <input type="number" min="1" placeholder="Estimated guests" value={form.guests} onChange={upd("guests")} style={inp} onFocus={focusColor} onBlur={blurColor} />
        </div>

        <div>
          <label style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px", display: "block" }}>
            Message
          </label>
          <textarea value={form.message} onChange={upd("message")} rows={4}
            style={{ ...inp, resize: "vertical", lineHeight: 1.65 }}
            onFocus={focusColor} onBlur={blurColor} />
        </div>

        <button type="submit" disabled={submitting}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px", border: "none",
            background: submitting ? `${color}70` : `linear-gradient(135deg,${color},${color}cc)`,
            color: "#fff", fontSize: "14px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            boxShadow: `0 4px 18px ${color}28`, fontFamily: "inherit", transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.opacity = "0.86"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
          {submitting
            ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
            : <Send size={14} />}
          {submitting ? "Sending…" : "Get a Personalized Quote"}
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${T.borderSub}` }}>
        {["Response typically within 24 hours", "No commitment required", "Direct contact with vendor"].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={12} color={color} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: T.textSub, fontWeight: 500 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */

export default function VendorProfilePage() {
  const T = useT();
  const { slug } = useParams();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const heroRef = useRef(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await api.get(`/vendors/${slug}`);
        setVendor(res.data.data);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        setIsSticky(heroRef.current.getBoundingClientRect().bottom <= 64);
      }
      const order = ["faq", "reviews", "pricing", "about"];
      for (const id of order) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 130) {
          setActiveSection(id);
          return;
        }
      }
      setActiveSection("about");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = isSticky ? 118 : 60;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
  };

  if (loading) return <LoadingState />;
  if (notFound || !vendor) return <NotFoundState />;

  const color = CATEGORY_COLORS[vendor.category] || "#6366f1";
  const location = [vendor.city, vendor.country].filter(Boolean).join(", ") || "—";
  const verified = vendor.verification_status === "verified";
  const portfolio = Array.isArray(vendor.portfolio) ? vendor.portfolio : [];
  const services = Array.isArray(vendor.services) ? vendor.services : [];
  const amenities = Array.isArray(vendor.amenities) ? vendor.amenities : [];
  const reviews = Array.isArray(vendor.reviews) ? vendor.reviews : [];
  const socialLinks = vendor.social_links || {};
  const avgRating = parseFloat(vendor.rating) || 0;
  const totalReviews = reviews.length;

  const ratingBreakdown = reviews.reduce((acc, r) => {
    acc[r.rating] = (acc[r.rating] || 0) + 1;
    return acc;
  }, {});

  const BIO_LIMIT = 300;
  const bioNeedsExpander = vendor.bio && vendor.bio.length > BIO_LIMIT;

  const faqItems = Array.isArray(vendor.faq) && vendor.faq.length > 0 ? vendor.faq : [
    { q: "What is included in your base price?", a: `Our pricing starts from ${vendor.currency || "USD"} ${vendor.base_price ? Number(vendor.base_price).toLocaleString() : "—"} and covers our standard package. Contact us for a full breakdown tailored to your event.` },
    { q: "How far in advance should I book?", a: "We recommend booking at least 3–6 months in advance to secure your preferred date, especially during peak season (May–October)." },
    { q: "Do you offer consultations or tastings?", a: "Yes — we offer complimentary initial consultations. Reach out through the quote form to schedule yours." },
    { q: "What is your cancellation policy?", a: "A deposit is required to hold your date. Cancellations made 30+ days before the event may be eligible for a partial refund. Full terms are provided in your contract." },
  ];

  const contactItems = [
    vendor.email    && { icon: Mail,  label: vendor.email,         href: `mailto:${vendor.email}`, short: "Email"        },
    vendor.phone    && { icon: Phone, label: vendor.phone,          href: `tel:${vendor.phone}`,   short: "Phone"        },
    vendor.website_url && { icon: Globe, label: "Visit Website",   href: vendor.website_url,       short: "Website"      },
    vendor.service_area && { icon: MapPin, label: vendor.service_area, href: null,                 short: "Service Area" },
  ].filter(Boolean);

  const divider = <div style={{ height: "1px", background: T.borderSub }} />;

  return (
    <div style={{ background: T.pageBg, color: T.text, minHeight: "100vh", fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <Navbar />

      {/* ── HERO ── */}
      <div ref={heroRef} style={{ maxWidth: "1280px", margin: "0 auto", padding: "88px 24px 0" }}>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: T.textMuted, marginBottom: "16px", flexWrap: "wrap" }}>
          {[
            { label: "Home", href: "/" },
            { label: "Vendors", href: "/marketplace" },
            { label: vendor.category, href: `/marketplace?category=${encodeURIComponent(vendor.category)}` },
          ].map(({ label, href }) => (
            <span key={href} style={{ display: "contents" }}>
              <Link href={href} style={{ color: T.textMuted, textDecoration: "none" }}
                onMouseEnter={(e) => e.target.style.color = T.text}
                onMouseLeave={(e) => e.target.style.color = T.textMuted}>
                {label}
              </Link>
              <span style={{ color: T.textFaint }}>/</span>
            </span>
          ))}
          <span style={{ color: T.textSub, fontWeight: 600 }}>{vendor.business_name}</span>
        </nav>

        <HeroGallery vendor={vendor} photos={portfolio} color={color} T={T} />

        {/* Vendor title block */}
        <div style={{ marginTop: "24px", paddingBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
            <h1 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 900, letterSpacing: "-0.03em", color: T.text, lineHeight: 1.1 }}>
              {vendor.business_name}
            </h1>
            {verified && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "100px", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.22)", fontSize: "11px", fontWeight: 700 }}>
                <BadgeCheck size={11} /> Verified
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "10px" }}>
            <span style={{ padding: "3px 12px", borderRadius: "100px", background: `${color}12`, color, border: `1px solid ${color}22`, fontSize: "12px", fontWeight: 700 }}>
              {vendor.category}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: T.textSub, fontWeight: 600 }}>
              <MapPin size={13} color={T.textMuted} /> {location}
            </span>
            {vendor.base_price != null && (
              <span style={{ fontSize: "13px", color: T.textSub, fontWeight: 500 }}>
                From&nbsp;<strong style={{ color, fontWeight: 800 }}>{vendor.currency || "USD"} {Number(vendor.base_price).toLocaleString()}</strong>
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <StarRating rating={avgRating} size={15} T={T} />
            <span style={{ fontSize: "15px", fontWeight: 900, color: "#f59e0b" }}>{avgRating.toFixed(1)}</span>
            <span style={{ fontSize: "13px", color: T.textMuted, fontWeight: 500 }}>({totalReviews} {totalReviews === 1 ? "review" : "reviews"})</span>
          </div>
        </div>
      </div>

      {/* ── STICKY TAB NAV ── */}
      <TabNav isSticky={isSticky} activeSection={activeSection} onTabClick={scrollTo} color={color} T={T} />
      {isSticky && <div style={{ height: "50px" }} />}

      {/* ── MAIN CONTENT GRID ── */}
      <div className="vendor-layout" style={{ maxWidth: "1280px", margin: "0 auto", padding: "44px 24px 80px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "48px", alignItems: "start" }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>

          {/* ABOUT */}
          <section id="about">
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: T.text, letterSpacing: "-0.02em", marginBottom: "14px" }}>
              About {vendor.business_name}
            </h2>
            {vendor.tagline && (
              <p style={{ fontSize: "15px", fontWeight: 600, color, fontStyle: "italic", marginBottom: "12px", lineHeight: 1.5 }}>
                "{vendor.tagline}"
              </p>
            )}
            {vendor.bio && (
              <div style={{ marginBottom: "22px" }}>
                <p style={{ fontSize: "14px", lineHeight: 1.85, color: T.textSub, whiteSpace: "pre-line" }}>
                  {aboutExpanded ? vendor.bio : vendor.bio.slice(0, BIO_LIMIT)}{bioNeedsExpander && !aboutExpanded ? "…" : ""}
                </p>
                {bioNeedsExpander && (
                  <button onClick={() => setAboutExpanded((x) => !x)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "8px", background: "none", border: "none", cursor: "pointer", color, fontSize: "13px", fontWeight: 700, fontFamily: "inherit", padding: 0 }}>
                    {aboutExpanded ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Read More</>}
                  </button>
                )}
              </div>
            )}

            {contactItems.length > 0 && (
              <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px", marginBottom: "12px" }}>
                {contactItems.map((c) => {
                  const Icon = c.icon;
                  const inner = (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", borderRadius: "12px", background: T.cardBgSolid, border: `1px solid ${T.border}`, flex: 1, transition: "border-color 0.15s" }}>
                      <Icon size={14} color={color} style={{ marginTop: "1px", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "9px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>{c.short}</div>
                        <div style={{ fontSize: "12px", color: T.textSub, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</div>
                      </div>
                      {c.href && <ExternalLink size={10} color={T.textFaint} style={{ flexShrink: 0, marginTop: "2px" }} />}
                    </div>
                  );
                  return c.href ? (
                    <a key={c.short} href={c.href} target="_blank" rel="noreferrer" style={{ display: "flex", textDecoration: "none" }}
                      onMouseEnter={(e) => e.currentTarget.firstChild.style.borderColor = `${color}35`}
                      onMouseLeave={(e) => e.currentTarget.firstChild.style.borderColor = T.border}>
                      {inner}
                    </a>
                  ) : (
                    <div key={c.short} style={{ display: "flex" }}>{inner}</div>
                  );
                })}
              </div>
            )}

            {Object.keys(socialLinks).length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                {socialLinks.instagram && (
                  <a href={`https://instagram.com/${socialLinks.instagram.replace("@","")}`} target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", background: T.cardBgSolid, border: `1px solid ${T.border}`, color: T.textSub, textDecoration: "none", fontSize: "12px", fontWeight: 600 }}>
                    📷 Instagram
                  </a>
                )}
                {socialLinks.facebook && (
                  <a href={`https://facebook.com/${socialLinks.facebook}`} target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", background: T.cardBgSolid, border: `1px solid ${T.border}`, color: T.textSub, textDecoration: "none", fontSize: "12px", fontWeight: 600 }}>
                    👥 Facebook
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", background: T.cardBgSolid, border: `1px solid ${T.border}`, color: T.textSub, textDecoration: "none", fontSize: "12px", fontWeight: 600 }}>
                    🔗 LinkedIn
                  </a>
                )}
              </div>
            )}
          </section>

          {divider}

          {/* PRICING & SERVICES */}
          <section id="pricing">
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: T.text, letterSpacing: "-0.02em", marginBottom: "22px" }}>Pricing & Services</h2>

            {amenities.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>
                {amenities.map((grp, gi) => (
                  <div key={gi}>
                    <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted, marginBottom: "10px" }}>{grp.category}</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {grp.items.map((item, ii) => (
                        <span key={ii} style={{ padding: "5px 13px", borderRadius: "100px", background: `${color}0f`, border: `1px solid ${color}22`, fontSize: "12px", fontWeight: 600, color }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {services.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                {services.map((svc, si) => (
                  <div key={svc.id || si}
                    style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", transition: "border-color 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = `${color}30`}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: "15px", fontWeight: 700, color: T.text, marginBottom: svc.description ? "4px" : 0 }}>{svc.name}</h4>
                      {svc.description && <p style={{ fontSize: "13px", color: T.textSub, lineHeight: 1.6, fontWeight: 400 }}>{svc.description}</p>}
                    </div>
                    {svc.price != null && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "18px", fontWeight: 900, color, letterSpacing: "-0.02em" }}>
                          {vendor.currency || "USD"} {Number(svc.price).toLocaleString()}
                        </div>
                        <Link href={`/vendor/${slug}/quote`}
                          style={{ display: "inline-block", marginTop: "6px", fontSize: "11px", fontWeight: 700, color, background: `${color}10`, border: `1px solid ${color}22`, borderRadius: "7px", padding: "4px 10px", textDecoration: "none" }}>
                          Book Now
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {vendor.pricing_guide_url && (
              <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", borderRadius: "14px", background: T.cardBgSolid, border: `1px solid ${T.border}` }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `${color}10`, border: `1px solid ${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={18} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: T.text }}>{vendor.pricing_guide_name || "Pricing Guide"}</div>
                  {vendor.pricing_guide_size && <div style={{ fontSize: "11px", color: T.textMuted, marginTop: "2px" }}>{vendor.pricing_guide_size}</div>}
                </div>
                <a href={vendor.pricing_guide_url} target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "8px 14px", borderRadius: "9px", background: `${color}10`, border: `1px solid ${color}22`, color, fontSize: "12px", fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                  <Download size={12} /> View Guide
                </a>
              </div>
            )}

            {amenities.length === 0 && services.length === 0 && !vendor.pricing_guide_url && (
              <p style={{ fontSize: "14px", color: T.textMuted, textAlign: "center", padding: "36px 0" }}>No services listed yet. Contact the vendor for details.</p>
            )}
          </section>

          {divider}

          {/* REVIEWS */}
          <section id="reviews">
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: T.text, letterSpacing: "-0.02em", marginBottom: "22px" }}>
              Reviews {totalReviews > 0 && <span style={{ fontSize: "15px", color: T.textMuted, fontWeight: 600 }}>({totalReviews})</span>}
            </h2>

            {totalReviews > 0 && (
              <div className="review-summary" style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "18px", padding: "24px", marginBottom: "24px", display: "grid", gridTemplateColumns: "auto 1fr", gap: "28px", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "54px", fontWeight: 900, letterSpacing: "-0.04em", color: T.text, lineHeight: 1 }}>
                    {avgRating.toFixed(1)}
                  </div>
                  <StarRating rating={avgRating} size={16} T={T} />
                  <div style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600, marginTop: "4px" }}>{totalReviews} reviews</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingBreakdown[star] || 0;
                    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={star} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: T.textSub, width: "14px", textAlign: "right" }}>{star}</span>
                        <Star size={10} fill="#f59e0b" color="#f59e0b" />
                        <div style={{ flex: 1, height: "6px", background: T.borderSub, borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "#f59e0b", borderRadius: "3px" }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: T.textMuted, width: "22px" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {totalReviews === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: T.textMuted }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>⭐</div>
                <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px", color: T.textSub }}>No reviews yet</p>
                <p style={{ fontSize: "13px" }}>Be the first to review this vendor.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {reviews.map((rev) => (
                  <div key={rev.id}
                    style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "20px 22px", transition: "border-color 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = `${color}28`}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `linear-gradient(135deg,${rev.reviewer_color || "#6366f1"},${rev.reviewer_color || "#6366f1"}90)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                        {rev.reviewer_initial || rev.reviewer_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "4px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: T.text }}>{rev.reviewer_name}</span>
                          <span style={{ fontSize: "11px", color: T.textMuted }}>
                            {rev.event_type && `${rev.event_type} · `}
                            {new Date(rev.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </span>
                        </div>
                        <StarRating rating={rev.rating} size={12} T={T} />
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", lineHeight: 1.8, color: T.textSub }}>{rev.body}</p>
                    {rev.reply && (
                      <div style={{ marginTop: "14px", padding: "12px 15px", borderRadius: "10px", background: T.sectionBg, border: `1px solid ${T.borderSub}`, borderLeft: `3px solid ${color}` }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color, marginBottom: "5px" }}>Response from {vendor.business_name}</div>
                        <p style={{ fontSize: "12px", lineHeight: 1.7, color: T.textSub }}>{rev.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {divider}

          {/* FAQ */}
          <section id="faq">
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: T.text, letterSpacing: "-0.02em", marginBottom: "20px" }}>Frequently Asked Questions</h2>
            <FaqAccordion items={faqItems} color={color} T={T} />
          </section>
        </div>

        {/* ── RIGHT COLUMN (sticky sidebar) ── */}
        <div className="sidebar-col">
          <QuoteSidebar vendor={vendor} slug={slug} color={color} T={T} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .tab-scroll { scrollbar-width: none; }
        .tab-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 1024px) {
          .vendor-layout { grid-template-columns: 1fr !important; }
          .sidebar-col { order: -1; }
          .gallery-desktop { height: 240px !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .review-summary { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .gallery-desktop { display: none !important; }
          .gallery-mobile { display: block !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
