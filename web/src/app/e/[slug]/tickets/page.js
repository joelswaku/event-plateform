"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Clock, CheckCircle } from "lucide-react";
import LegalModal from "@/components/legal/LegalModal";

const API = process.env.NEXT_PUBLIC_API_URL;

// ── Tier resolver ─────────────────────────────────────────────────────────────
function resolveTier(ticket, priceRank = 0) {
  const n = (ticket.name ?? "").toLowerCase();
  if (ticket.kind === "FREE")                                                                         return "free";
  if (n.includes("vip") || n.includes("platinum") || n.includes("premium") || n.includes("elite"))  return "vip";
  if (n.includes("pro") || n.includes("diamond") || n.includes("ultra") || n.includes("all-access")) return "pro";
  if (n.includes("early") || n.includes("bird") || n.includes("presale"))                           return "early";
  if (n.includes("student") || n.includes("youth") || n.includes("concession"))                     return "discount";
  // Fallback: differentiate by price rank so multiple generic tickets get distinct designs
  const RANK_TIERS = ["vip", "standard", "early", "discount", "pro"];
  return RANK_TIERS[priceRank % RANK_TIERS.length] ?? "standard";
}

// Build a rank map: highest price = rank 0
function buildPriceRanks(tickets) {
  const sorted = [...tickets].sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
  const map = new Map();
  sorted.forEach((t, i) => map.set(t.id, i));
  return map;
}

const TIER = {
  free:     { label:"Free",       icon:"🎁", accent:"#10b981", dark:"#022c22", bg:"linear-gradient(145deg,#022c22,#064e3b)", border:"rgba(16,185,129,0.25)",  muted:"rgba(167,243,208,0.65)",  shimmer:false },
  early:    { label:"Early Bird", icon:"⚡", accent:"#f59e0b", dark:"#1c1002", bg:"linear-gradient(145deg,#1c1002,#451a03)", border:"rgba(245,158,11,0.3)",   muted:"rgba(253,230,138,0.65)",  shimmer:false },
  standard: { label:"Standard",   icon:"🎟️",accent:"#6366f1", dark:"#0f0f1f", bg:"linear-gradient(145deg,#0f0f1f,#1e1b4b)", border:"rgba(99,102,241,0.28)",  muted:"rgba(199,210,254,0.65)",  shimmer:false },
  discount: { label:"Discount",   icon:"🏷️",accent:"#06b6d4", dark:"#0a1520", bg:"linear-gradient(145deg,#0a1520,#0e4a5a)", border:"rgba(6,182,212,0.25)",   muted:"rgba(165,243,252,0.65)",  shimmer:false },
  vip:      { label:"VIP",        icon:"👑", accent:"#C9A96E", dark:"#0f0b00", bg:"linear-gradient(145deg,#0f0b00,#2d1f00)", border:"rgba(201,169,110,0.35)", muted:"rgba(253,230,138,0.6)",   shimmer:true  },
  pro:      { label:"Premium",    icon:"💎", accent:"#a78bfa", dark:"#0d0718", bg:"linear-gradient(145deg,#0d0718,#1e0a3c)", border:"rgba(167,139,250,0.35)", muted:"rgba(221,214,254,0.6)",   shimmer:true  },
};

function fmtPrice(price, currency = "USD") {
  if (!price || price === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

// ── Checkout Modal ────────────────────────────────────────────────────────────
function CheckoutModal({ ticket, event, onClose }) {
  const tierKey = resolveTier(ticket);
  const cfg     = TIER[tierKey];

  const [step,          setStep]          = useState("form"); // form | success | redirecting
  const [qty,           setQty]           = useState(1);
  const [form,          setForm]          = useState({ name: "", email: "", phone: "" });
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState("");
  const [result,        setResult]        = useState(null);
  const [termsChecked,  setTermsChecked]  = useState(false);
  const [termsTouched,  setTermsTouched]  = useState(false);
  const [legalSlug,     setLegalSlug]     = useState(null);

  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : 99;
  const maxQty   = Math.min(available, 10);
  const priceEach = ticket.kind === "FREE" ? 0 : Number(ticket.price);
  const total     = priceEach * qty;
  const fmt       = (n) => fmtPrice(n, ticket.currency);

  async function submit() {
    setTermsTouched(true);
    if (!form.name.trim())  return setError("Full name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email");
    if (!termsChecked) return setError("Please accept the terms to continue.");
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/public/events/${event.id}/orders`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_name:  form.name.trim(),
          buyer_email: form.email.trim().toLowerCase(),
          buyer_phone: form.phone.trim() || undefined,
          items: [{ ticket_type_id: ticket.id, quantity: qty }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");
      setResult(data.data);
      if (data.data.payment_required && data.data.checkout_url) {
        setStep("redirecting");
        window.location.href = data.data.checkout_url;
      } else {
        setStep("success");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        {/* Top accent */}
        <div style={{ height: 3, background: `linear-gradient(90deg,${cfg.accent},${cfg.accent}60,transparent)` }} />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
              style={{ background: `${cfg.accent}20`, color: cfg.accent, border: `1px solid ${cfg.accent}35` }}>
              {cfg.icon} {cfg.label}
            </span>
            <h3 className="mt-2 text-xl font-bold text-white">{ticket.name}</h3>
            <p className="text-xs mt-0.5" style={{ color: cfg.muted }}>{event?.title}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 transition" style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 flex items-center gap-1.5">
          <div className="flex-1 h-px" style={{ background: `${cfg.accent}20` }} />
          {[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: `${cfg.accent}20` }} />)}
          <div className="flex-1 h-px" style={{ background: `${cfg.accent}20` }} />
        </div>

        <AnimatePresence mode="wait">

          {/* ── FORM STEP ── */}
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Quantity */}
              {ticket.kind !== "FREE" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Quantity</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-xl font-bold text-white flex items-center justify-center transition"
                      style={{ background: "rgba(255,255,255,0.08)", border: `1px solid rgba(255,255,255,0.12)` }}>−</button>
                    <span className="text-xl font-bold text-white w-8 text-center">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                      className="w-9 h-9 rounded-xl font-bold text-white flex items-center justify-center transition"
                      style={{ background: "rgba(255,255,255,0.08)", border: `1px solid rgba(255,255,255,0.12)` }}>+</button>
                    <span className="text-sm ml-2 font-bold" style={{ color: cfg.accent }}>{fmt(total)}</span>
                  </div>
                </div>
              )}

              {/* Name */}
              {[
                { key: "name",  label: "Full Name",  type: "text",  placeholder: "Your full name" },
                { key: "email", label: "Email",       type: "email", placeholder: "your@email.com" },
                { key: "phone", label: "Phone (opt)", type: "tel",   placeholder: "+1 234 567 8900" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: `1px solid rgba(255,255,255,0.12)`,
                    }}
                    onFocus={e => e.target.style.borderColor = cfg.accent + "80"}
                    onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                  />
                </div>
              ))}

              {/* Note about ticket number */}
              <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                📧 Your ticket number will be emailed to you. Use it with your email to access your ticket profile.
              </div>

              {/* Terms acceptance */}
              <div className="flex items-start gap-2.5 select-none">
                <button
                  type="button"
                  onClick={() => { setTermsChecked(v => !v); setTermsTouched(true); }}
                  className="mt-0.5 shrink-0 flex items-center justify-center rounded-[5px] border-2 transition-all"
                  style={{ width: 16, height: 16,
                    background: termsChecked ? cfg.accent : "rgba(255,255,255,0.04)",
                    borderColor: termsTouched && !termsChecked ? "#f43f5e" : termsChecked ? cfg.accent : "rgba(255,255,255,0.2)" }}>
                  {termsChecked && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  I agree to the{" "}
                  <button type="button" onClick={() => setLegalSlug("terms")}
                    className="underline underline-offset-2 transition-colors hover:text-white" style={{ color: cfg.accent }}>
                    Terms of Service
                  </button>
                  {" "}and{" "}
                  <button type="button" onClick={() => setLegalSlug("privacy-policy")}
                    className="underline underline-offset-2 transition-colors hover:text-white" style={{ color: cfg.accent }}>
                    Privacy Policy
                  </button>
                </span>
              </div>
              <LegalModal slug={legalSlug} onClose={() => setLegalSlug(null)} />

              {error && (
                <p className="text-sm text-rose-400 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </p>
              )}

              {/* Order summary with fee breakdown */}
              <div className="py-3 border-t space-y-1.5" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Tickets subtotal</span>
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>{fmt(priceEach * qty)}</span>
                </div>
                {priceEach > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Service fee</span>
                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {fmt(Math.round((priceEach * qty * 0.035 + qty * 0.49) * 100) / 100)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Total charged</span>
                  <span className="text-xl font-bold" style={{ color: cfg.accent }}>{fmt(total)}</span>
                </div>
              </div>

              <button onClick={submit} disabled={submitting}
                className="w-full py-4 rounded-xl text-sm font-black transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg,${cfg.accent},${cfg.accent}cc)`,
                  color: cfg.dark,
                  boxShadow: `0 4px 20px ${cfg.accent}40`,
                }}>
                {submitting
                  ? "Processing…"
                  : ticket.kind === "FREE"
                  ? "Reserve My Free Spot →"
                  : `Pay ${fmt(total)} →`}
              </button>
            </motion.div>
          )}

          {/* ── SUCCESS (free ticket) ── */}
          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: `${cfg.accent}20` }}>
                <CheckCircle size={32} style={{ color: cfg.accent }} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">You&apos;re in! 🎉</h3>
                <p className="text-sm mt-1" style={{ color: cfg.muted }}>Your ticket is confirmed and active.</p>
              </div>
              {result?.issued_tickets?.[0] && (
                <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${cfg.border}` }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.accent }}>Your Ticket</p>
                  <div className="w-40 h-40 mx-auto rounded-xl overflow-hidden bg-white p-2">
                    <img src={`${API}/public/tickets/qr/${result.issued_tickets[0].qr_token}`} alt="QR" className="w-full h-full" />
                  </div>
                </div>
              )}
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Confirmation & ticket number sent to <strong style={{ color: "rgba(255,255,255,0.6)" }}>{form.email}</strong>
              </p>
              <a href={`/my-tickets?email=${encodeURIComponent(form.email)}`}
                className="block w-full py-3 rounded-xl text-sm font-bold transition"
                style={{ background: `${cfg.accent}20`, color: cfg.accent, border: `1px solid ${cfg.border}` }}>
                View My Ticket Profile →
              </a>
              <button onClick={onClose} className="block w-full py-3 rounded-xl text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                Close
              </button>
            </motion.div>
          )}

          {/* ── REDIRECTING to Stripe Checkout ── */}
          {step === "redirecting" && (
            <motion.div key="redirecting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: `${cfg.accent}20` }}>
                <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: cfg.accent }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Redirecting to payment…</h3>
                <p className="text-sm mt-1" style={{ color: cfg.muted }}>You&apos;re being sent to Stripe&apos;s secure checkout.</p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Tier short codes ──────────────────────────────────────────────────────────
function tierCode(ticket, priceRank = 0) {
  const n = (ticket.name ?? "").toLowerCase();
  if (ticket.kind === "FREE")                                               return "FREE";
  if (n.includes("vip") || n.includes("platinum"))                         return "VIP";
  if (n.includes("early") || n.includes("bird"))                           return "EB";
  if (n.includes("pro") || n.includes("premium") || n.includes("diamond")) return "PRO";
  if (n.includes("student") || n.includes("concession"))                   return "STU";
  // Fallback codes by rank
  return ["GA", "T2", "T3", "T4", "T5"][priceRank] ?? "GA";
}

// ── Marketing headline generator ──────────────────────────────────────────────
function marketingLine(event) {
  const t = String(event?.event_type ?? event?.dashboard_mode ?? "").toUpperCase();
  const map = {
    CONCERT:    ["Feel Every Beat.", "Live Every Note."],
    FESTIVAL:   ["Where Moments", "Become Legends."],
    LIVE_SHOW:  ["The Stage Is Set.", "Your Seat Awaits."],
    NIGHTCLUB:  ["The Night Is Young.", "Make It Unforgettable."],
    THEATER:    ["The Curtain Rises.", "Claim Your Seat."],
    COMEDY:     ["Laughter Guaranteed.", "Your Night to Remember."],
    SPORTS:     ["Be There.", "Be Part of History."],
    EXHIBITION: ["Discover the", "Extraordinary."],
    CONFERENCE: ["Ideas That", "Shape Tomorrow."],
    WEDDING:    ["Celebrate Love.", "Cherish Every Moment."],
    BIRTHDAY:   ["The Party of", "a Lifetime."],
    GALA:       ["An Evening", "Unlike Any Other."],
    NETWORKING: ["Connections That", "Change Everything."],
  };
  return map[t] ?? ["Your Night", "Begins Here."];
}

// ── Ticket Card — editorial cream + dark header ────────────────────────────────
function TicketCard({ ticket, event, isFeatured, onBuy, priceRank = 0 }) {
  const tierKey  = resolveTier(ticket, priceRank);
  const cfg      = TIER[tierKey];
  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : null;
  const isSoldOut = available !== null && available <= 0;
  const pct       = ticket.quantity_total
    ? Math.min(((ticket.quantity_sold ?? 0) / ticket.quantity_total) * 100, 100)
    : 0;
  const isUrgent  = available !== null && available > 0 && available <= 20;

  const code     = tierCode(ticket, priceRank);
  const dateStr  = event?.starts_at_local
    ? new Date(event.starts_at_local).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : null;
  const timeStr  = event?.starts_at_local
    ? new Date(event.starts_at_local).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: "0 32px 80px rgba(0,0,0,0.60)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col overflow-hidden rounded-2xl"
      style={{
        boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.08)",
        transform: isFeatured ? "scale(1.03)" : undefined,
      }}
    >
      {/* ── DARK HEADER BAR ── */}
      <div className="relative flex items-center justify-between px-5 py-4"
        style={{ background: "#0c0c12", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {/* left: tier code badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black tracking-wider"
            style={{ background: `${cfg.accent}18`, border: `1.5px solid ${cfg.accent}40`, color: cfg.accent }}>
            {code}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: cfg.accent }}>
              {cfg.label} Access
            </p>
            <p className="text-sm font-bold text-white leading-tight">{ticket.name}</p>
          </div>
        </div>
        {/* right: status */}
        {isSoldOut ? (
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
            Sold Out
          </span>
        ) : isUrgent ? (
          <span className="flex items-center gap-1 text-[10px] font-black text-amber-400">
            <Zap size={10} /> {available} left
          </span>
        ) : isFeatured ? (
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: `${cfg.accent}20`, color: cfg.accent, border: `1px solid ${cfg.accent}35` }}>
            Popular
          </span>
        ) : null}
      </div>

      {/* ── CREAM BODY ── */}
      <div className="flex flex-col flex-1 px-6 pt-7 pb-6 gap-5" style={{ background: "#f0ebe0" }}>

        {/* Large centered price */}
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: "#7a6e5f" }}>
            per person
          </p>
          <p className="leading-none font-black" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(3rem,8vw,4.5rem)", color: "#0f0d0a", letterSpacing: "-0.02em" }}>
            {ticket.kind === "FREE" ? "Free" : fmtPrice(Number(ticket.price), ticket.currency)}
          </p>
          {ticket.kind !== "FREE" && (
            <p className="text-xs mt-1.5 font-semibold" style={{ color: "#9a8c7e" }}>
              {ticket.currency} · incl. fees
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.12)" }} />
          <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          {(dateStr || timeStr) && (
            <div className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: "#4a3f30" }}>
              <Clock size={14} style={{ color: cfg.accent, flexShrink: 0 }} />
              {dateStr}{timeStr ? ` · ${timeStr}` : ""}
            </div>
          )}
          {event?.venue_name && (
            <div className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: "#4a3f30" }}>
              <span style={{ color: cfg.accent, flexShrink: 0, fontSize: 14 }}>📍</span>
              {event.venue_name}{event.city ? `, ${event.city}` : ""}
            </div>
          )}
          {ticket.description && (
            <p className="text-xs leading-relaxed pt-1" style={{ color: "#7a6e5f" }}>{ticket.description}</p>
          )}
        </div>

        {/* Capacity bar */}
        {ticket.quantity_total != null && !isSoldOut && (
          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9a8c7e" }}>
              <span>{isUrgent ? `⚠ ${available} spots left` : `${available} available`}</span>
              <span style={{ color: cfg.accent }}>{pct.toFixed(0)}% filled</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.10)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: isUrgent ? "#ef4444" : cfg.accent }} />
            </div>
          </div>
        )}

        {/* Dual CTA buttons */}
        <div className="flex flex-col gap-2 mt-auto">
          {/* Primary — dark filled */}
          <button
            onClick={() => !isSoldOut && onBuy(ticket)}
            disabled={isSoldOut}
            className="w-full py-3.5 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
            style={{
              background: isSoldOut ? "rgba(0,0,0,0.12)" : "#0f0d0a",
              color: isSoldOut ? "#9a8c7e" : "#f0ebe0",
              letterSpacing: "0.08em",
            }}>
            {isSoldOut ? "Sold Out" : ticket.kind === "FREE" ? "Reserve Free Spot" : "Buy Now →"}
          </button>
          {/* Secondary — outlined */}
          {!isSoldOut && (
            <button
              onClick={() => onBuy(ticket)}
              className="w-full py-3 text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98] rounded-xl"
              style={{
                background: "transparent",
                color: "#4a3f30",
                border: "1.5px solid rgba(0,0,0,0.18)",
                letterSpacing: "0.10em",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = cfg.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.18)"}
            >
              {ticket.kind === "FREE" ? "Learn More" : "Reserve a Spot"}
            </button>
          )}
        </div>

      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EventTicketsPage() {
  const { slug }               = useParams();
  const router                 = useRouter();
  const [event,    setEvent]   = useState(null);
  const [tickets,  setTickets] = useState([]);
  const [loading,  setLoading] = useState(true);
  const [checkout, setCheckout]= useState(null);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const p       = new URLSearchParams(window.location.search).get("payment");
    const orderId = new URLSearchParams(window.location.search).get("order_id");
    if (p === "success" || p === "cancelled") {
      setBanner(p);
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (p === "success" && orderId) {
      fetch(`/api/public/orders/${orderId}/confirm`, { method: "POST" }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!slug) return;

    // Use relative paths so Next.js rewrite proxy handles the target host —
    // avoids "localhost" resolving to the device's own loopback on mobile browsers.
    Promise.all([
      fetch(`/api/public/pages/${slug}`)
        .then(r => r.json()).then(d => d.data?.event ?? null).catch(() => null),
      fetch(`/api/public/events/${slug}/tickets`)
        .then(r => r.json()).then(d => d.tickets ?? []).catch(() => []),
    ]).then(([evt, tix]) => {
      if (evt?.id && tix.length === 0) {
        return fetch(`/api/public/events/${evt.id}/tickets`)
          .then(r => r.json())
          .then(d => { setEvent(evt); setTickets(d.tickets ?? []); });
      }
      setEvent(evt);
      setTickets(tix);
    }).finally(() => setLoading(false));
  }, [slug]);

  const maxPrice   = tickets.length ? Math.max(...tickets.map(t => Number(t.price ?? 0))) : 0;
  const priceRanks = buildPriceRanks(tickets);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  }) : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: "linear-gradient(160deg, #1a0533 0%, #0d0a1e 28%, #061428 60%, #020a18 100%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
      `}</style>

      {/* Fixed gradient layers — always visible behind everything */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0,
        background: "linear-gradient(160deg, #1a0533 0%, #0d0a1e 28%, #061428 60%, #020a18 100%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0,
        background: "radial-gradient(ellipse 70% 55% at 15% 10%, rgba(120,40,200,0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 85% 80%, rgba(6,50,100,0.20) 0%, transparent 55%)" }} />

      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(14,5,28,0.90)", backdropFilter: "blur(22px)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium transition"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
            <ArrowLeft size={15} /> Back
          </button>
          <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: "rgba(201,169,110,0.55)" }}>
            Curated Events & Ticket Première
          </p>
          <a href="/my-tickets" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
            My Tickets
          </a>
        </div>
      </div>

      {/* ── Cover image hero — top half ───────────────────────── */}
      {event?.cover_image_url && (
        <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: "60vh", zIndex: 1 }}>
          <img
            src={event.cover_image_url}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{ filter: "brightness(0.45) saturate(0.8)" }}
          />
          {/* fade to gradient bg at bottom */}
          <div className="absolute inset-x-0 bottom-0" style={{ height: "55%", background: "linear-gradient(to bottom,transparent,#080d1a)" }} />
          {/* subtle dark vignette on sides */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 100% at 50% 0%,transparent 40%,rgba(7,7,15,0.55) 100%)" }} />
        </div>
      )}

      <div className="relative max-w-5xl mx-auto px-4 space-y-12" style={{ paddingTop: event?.cover_image_url ? "min(44vh, 380px)" : "3.5rem", zIndex: 2 }}>

        {/* Payment result banner */}
        {banner === "success" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div className="flex items-center gap-3">
              <CheckCircle size={20} style={{ color: "#10b981", flexShrink: 0 }} />
              <div>
                <p className="text-sm font-bold text-white">Payment successful!</p>
                <p className="text-xs" style={{ color: "rgba(167,243,208,0.7)" }}>Your ticket is being issued — check your email for the QR code.</p>
              </div>
            </div>
            <button onClick={() => setBanner(null)} style={{ color: "rgba(255,255,255,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </motion.div>
        )}
        {banner === "cancelled" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <p className="text-sm" style={{ color: "rgba(252,165,165,0.9)" }}>Payment was cancelled — your order has not been charged.</p>
            <button onClick={() => setBanner(null)} style={{ color: "rgba(255,255,255,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </motion.div>
        )}

        {/* Editorial headline */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 w-32 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-14 w-4/5 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="h-4 w-56 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        ) : event ? (
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>

            {/* eyebrow */}
            <p className="text-[9px] font-black uppercase tracking-[0.32em] mb-5"
              style={{ color: "rgba(201,169,110,0.60)", letterSpacing: "0.30em" }}>
              ✦ Curated Events &amp; Ticket Première
            </p>

            {/* Two-line marketing headline — serif, large */}
            {(() => {
              const [line1, line2] = marketingLine(event);
              return (
                <h1 className="leading-[0.95] mb-6"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, color: "#f5f0e8" }}>
                  <span className="block" style={{ fontSize: "clamp(2.8rem,6.5vw,5.5rem)", letterSpacing: "-0.025em" }}>
                    {line1}
                  </span>
                  <span className="block italic" style={{ fontSize: "clamp(2.8rem,6.5vw,5.5rem)", letterSpacing: "-0.025em", color: "rgba(201,169,110,0.90)" }}>
                    {line2}
                  </span>
                </h1>
              );
            })()}

            {/* Event name — supporting, smaller */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-6 shrink-0" style={{ background: "rgba(201,169,110,0.45)" }} />
              <p className="text-sm font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em" }}>
                {event.title}
              </p>
            </div>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {fmtDate(event.starts_at_local) && (
                <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>
                  <Clock size={13} style={{ color: "rgba(201,169,110,0.55)" }} />
                  {fmtDate(event.starts_at_local)}
                </span>
              )}
              {event.venue_name && (
                <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>
                  <span style={{ color: "rgba(201,169,110,0.55)", fontSize: 13 }}>📍</span>
                  {event.venue_name}{event.city ? `, ${event.city}` : ""}
                </span>
              )}
              {tickets.length > 0 && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(201,169,110,0.08)", color: "rgba(201,169,110,0.65)", border: "1px solid rgba(201,169,110,0.18)" }}>
                  {tickets.length} {tickets.length === 1 ? "Ticket Type" : "Ticket Types"} Available
                </span>
              )}
            </div>

            {/* Gold rule */}
            <div className="mt-8 h-px" style={{ background: "linear-gradient(90deg,rgba(201,169,110,0.35),transparent 70%)" }} />
          </motion.div>
        ) : null}

        {/* Ticket grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border" style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
            <p className="text-4xl mb-3">🎟</p>
            <p className="text-lg font-semibold text-white">Tickets coming soon</p>
            <p className="text-sm mt-1">Check back closer to the event date.</p>
          </div>
        ) : (
          <div className={`grid gap-5 mx-auto w-full ${
            tickets.length === 1 ? "max-w-sm" :
            tickets.length === 2 ? "sm:grid-cols-2 max-w-2xl" :
            "sm:grid-cols-2 lg:grid-cols-3 max-w-5xl"
          }`}>
            {tickets.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                event={event}
                isFeatured={Number(t.price ?? 0) === maxPrice && maxPrice > 0}
                priceRank={priceRanks.get(t.id) ?? 0}
                onBuy={setCheckout}
              />
            ))}
          </div>
        )}

        {/* Trust bar */}
        {tickets.length > 0 && (
          <div>
            <div className="h-px mb-8" style={{ background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.20),transparent)" }} />
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[["🔒","Secure checkout"],["✉️","Instant e-ticket"],["📲","QR code entry"],["💳","Powered by Stripe"]].map(([icon, label]) => (
                <span key={label} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(201,169,110,0.35)", letterSpacing: "0.12em" }}>
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Checkout modal */}
      <AnimatePresence>
        {checkout && (
          <CheckoutModal ticket={checkout} event={event} onClose={() => setCheckout(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
