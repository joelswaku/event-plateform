"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, ArrowRight, Loader2, Lock, Ticket, CheckCircle, Zap } from "lucide-react";
import SharedEventRenderer from "@/components/events/shared/SharedEventRenderer";
import RsvpPanel from "@/components/events/shared/RsvpPanel";
import OpenRsvpModal from "@/components/events/shared/OpenRsvpModal";
import { createPaymentRequestKey } from "@/lib/payment-idempotency";
import { resolveThemeFromSections } from "@/lib/styleThemes";

const API          = process.env.NEXT_PUBLIC_API_URL;
const DON_DEFAULTS = [5, 10, 25];

// ─── Responsive SheetModal ─────────────────────────────────────────────────────
// Mobile  → slides up from bottom as a full-width sheet
// Desktop → fades/scales in as a centered card (max-w-md)
function useIsDesktop() {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const handler = (e) => setDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return desktop;
}

function SheetModal({ onClose, accentBar, children, maxWidth = "max-w-md", palette }) {
  const desktop = useIsDesktop();
  const sheetStyle = palette
    ? { background: palette.background, border: `1px solid ${palette.border}`, boxShadow: "0 32px 80px rgba(0,0,0,0.38)" }
    : { background: "rgba(8,8,18,0.98)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 32px 80px rgba(0,0,0,0.75)" };
  const closeStyle = { background: palette ? palette.surface : "rgba(255,255,255,0.08)" };
  const closeColor = palette ? palette.muted : "rgba(255,255,255,0.55)";

  if (desktop) {
    return (
      <motion.div
        key="desktop-sheet"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-6"
        style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(8px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full ${maxWidth} overflow-hidden rounded-3xl`}
          style={{ ...sheetStyle, maxHeight: "90vh" }}
        >
          {accentBar}
          <button onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl z-10"
            style={closeStyle}>
            <X size={15} color={closeColor} />
          </button>
          <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 4px)" }}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Mobile — bottom sheet
  return (
    <motion.div
      key="mobile-sheet"
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-[60] overflow-hidden rounded-t-3xl"
      style={{ ...sheetStyle, backdropFilter: "blur(24px)", boxShadow: palette ? "0 -24px 64px rgba(0,0,0,0.26)" : "0 -24px 80px rgba(0,0,0,0.60)", maxHeight: "92vh" }}
    >
      {accentBar}
      <div className="flex justify-center pt-3 pb-1">
        <div className="h-1 w-10 rounded-full" style={{ background: palette ? palette.border : "rgba(255,255,255,0.18)" }} />
      </div>
      <button onClick={onClose}
        className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-xl"
        style={closeStyle}>
        <X size={15} color={closeColor} />
      </button>
      <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 40px)" }}>
        {children}
      </div>
    </motion.div>
  );
}

// ─── shared helpers ────────────────────────────────────────────────────────────
function fmtPrice(price, currency = "USD") {
  if (!price || price === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
}

function resolveTier(ticket) {
  const n = (ticket.name ?? "").toLowerCase();
  if (ticket.kind === "FREE")                                                                           return "free";
  if (n.includes("vip") || n.includes("platinum") || n.includes("premium") || n.includes("elite"))    return "vip";
  if (n.includes("pro") || n.includes("diamond") || n.includes("ultra") || n.includes("all-access"))  return "pro";
  if (n.includes("early") || n.includes("bird") || n.includes("presale"))                             return "early";
  return "standard";
}

const TIER = {
  free:     { accent: "#10b981", dark: "#022c22", bg: "linear-gradient(145deg,#022c22,#064e3b)", border: "rgba(16,185,129,0.25)", muted: "rgba(167,243,208,0.65)", icon: "🎁", label: "Free" },
  early:    { accent: "#f59e0b", dark: "#1c1002", bg: "linear-gradient(145deg,#1c1002,#451a03)", border: "rgba(245,158,11,0.3)",  muted: "rgba(253,230,138,0.65)", icon: "⚡", label: "Early Bird" },
  standard: { accent: "#6366f1", dark: "#0f0f1f", bg: "linear-gradient(145deg,#0f0f1f,#1e1b4b)", border: "rgba(99,102,241,0.28)", muted: "rgba(199,210,254,0.65)", icon: "🎟️", label: "Standard" },
  vip:      { accent: "#C9A96E", dark: "#0f0b00", bg: "linear-gradient(145deg,#0f0b00,#2d1f00)", border: "rgba(201,169,110,0.35)", muted: "rgba(253,230,138,0.6)",  icon: "👑", label: "VIP" },
  pro:      { accent: "#a78bfa", dark: "#0d0718", bg: "linear-gradient(145deg,#0d0718,#1e0a3c)", border: "rgba(167,139,250,0.35)", muted: "rgba(221,214,254,0.6)",  icon: "💎", label: "Premium" },
};

// ─── Donation drawer ───────────────────────────────────────────────────────────
function DonationDrawer({ event, onClose, donConfig, theme }) {
  const [freq,       setFreq]       = useState("once");
  const [preset,     setPreset]     = useState(null);
  const [custom,     setCustom]     = useState("");
  const [name,       setName]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");
  const donationRequestKey = useRef(createPaymentRequestKey("donation"));

  const presets    = donConfig?.amounts?.length ? donConfig.amounts : DON_DEFAULTS;
  const amount     = preset === "custom" ? Number(custom) : (preset ?? 0);
  const colors = {
    background: theme?.["--t-bg-alt"] ?? "#FFFFFF",
    surface: theme?.["--t-bg"] ?? "#FAF9F6",
    text: theme?.["--t-text"] ?? "#1C1917",
    muted: theme?.["--t-text-muted"] ?? "#78716C",
    accent: theme?.["--t-accent"] ?? "#C9A96E",
    accentFg: theme?.["--t-accent-fg"] ?? "#111111",
    border: theme?.["--t-border"] ?? "#E7E5E4",
  };

  async function handleDonate(e) {
    e.preventDefault();
    if (!amount || amount <= 0) return setError("Please select or enter an amount");
    setError(""); setSubmitting(true);
    try {
      const res  = await fetch(`${API}/engagement/events/${event.id}/donations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donor_name: name.trim() || null, amount, currency: "USD", frequency: freq, idempotency_key: donationRequestKey.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Donation failed");
      if (data.data?.checkout_url) window.location.href = data.data.checkout_url;
      else setDone(true);
    } catch (err) { setError(err.message); setSubmitting(false); }
  }

  const accentBar = <div className="h-1.5 w-full" style={{ background: colors.accent }} />;

  return (
    <SheetModal onClose={onClose} accentBar={accentBar} palette={colors} maxWidth="max-w-lg">
      <div className="relative isolate overflow-hidden px-5 pb-7 pt-4 sm:px-6 sm:pb-8">
        {/* Gentle, theme-coloured movement gives the sheet depth without competing with the form. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <motion.div
            className="absolute -right-20 -top-24 h-56 w-56 rounded-full blur-3xl"
            style={{ background: colors.accent, opacity: 0.16 }}
            animate={{ x: [0, -24, 8, 0], y: [0, 20, -10, 0], scale: [1, 1.12, 0.96, 1] }}
            transition={{ duration: 11, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-28 -left-20 h-52 w-52 rounded-full blur-3xl"
            style={{ background: colors.accent, opacity: 0.10 }}
            animate={{ x: [0, 22, -8, 0], y: [0, -18, 10, 0], scale: [0.94, 1.08, 1, 0.94] }}
            transition={{ duration: 13, ease: "easeInOut", repeat: Infinity }}
          />
        </div>
        <div className="relative">
        {done ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <Heart size={24} fill={colors.accent} stroke={colors.accent} />
            </div>
            <p className="text-xl font-black" style={{ color: colors.text }}>Thank you</p>
            <p className="text-sm" style={{ color: colors.muted }}>Your {freq === "monthly" ? "monthly " : ""}contribution of ${amount} means a lot.</p>
            <button onClick={onClose} className="mt-2 text-xs font-bold uppercase tracking-widest underline" style={{ color: colors.muted }}>Close</button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-3 rounded-2xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: colors.background, border: `1px solid ${colors.border}` }}>
                <Heart size={16} fill={colors.accent} stroke={colors.accent} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: colors.muted }}>Support this event</p>
                <p className="mt-0.5 text-base font-bold leading-snug" style={{ color: colors.text }}>{donConfig?.title || "Choose an amount to contribute"}</p>
              </div>
            </div>
            {donConfig?.message && <p className="mb-4 text-sm leading-6" style={{ color: colors.muted }}>{donConfig.message}</p>}
            <form onSubmit={handleDonate} className="space-y-3">
              <div className="flex gap-1 rounded-xl p-1" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                {[["once", "One Time"], ["monthly", "Monthly"]].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setFreq(val)}
                    className="flex-1 rounded-lg py-2.5 text-sm font-black transition-all"
                    style={freq === val ? { background: colors.accent, color: colors.accentFg } : { color: colors.muted }}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, presets.length))}, minmax(0, 1fr))` }}>
                {presets.map((a) => (
                  <button key={a} type="button" onClick={() => { setPreset(a); setCustom(""); setError(""); }}
                    className="py-4 text-base font-black transition-all active:scale-95"
                    style={{ borderRadius: 14, border: preset === a ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`, background: preset === a ? colors.accent : colors.surface, color: preset === a ? colors.accentFg : colors.text, boxShadow: preset === a ? "0 5px 16px rgba(0,0,0,0.12)" : "none" }}>
                    ${a}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: colors.surface, border: preset === "custom" ? `1.5px solid ${colors.accent}` : `1.5px solid ${colors.border}` }}>
                <span className="text-base font-bold" style={{ color: colors.muted }}>$</span>
                <input type="number" min="1" value={preset === "custom" ? custom : ""} placeholder="Other amount"
                  onFocus={() => setPreset("custom")} onChange={(e) => { setPreset("custom"); setCustom(e.target.value); setError(""); }}
                  className="flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-stone-400" style={{ color: colors.text }} />
              </div>
              <input type="text" value={name} placeholder="Your name (optional)" onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-base font-medium outline-none placeholder:text-stone-400" style={{ background: colors.surface, border: `1.5px solid ${colors.border}`, color: colors.text }} />
              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
              <button type="submit" disabled={submitting}
                className="w-full rounded-xl py-4 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: colors.accent, boxShadow: "0 8px 22px rgba(0,0,0,0.14)", color: colors.accentFg }}>
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Processing…</span>
                  : <span className="flex items-center justify-center gap-2">{freq === "monthly" ? "Give Monthly" : "Donate"}{amount > 0 ? ` — $${amount}` : ""}<ArrowRight size={16} strokeWidth={2.5} /></span>}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px]" style={{ color: colors.muted }}><Lock size={9} />Secure payment via Stripe</p>
            </form>
          </>
        )}
        </div>
      </div>
    </SheetModal>
  );
}

// ─── Ticket checkout drawer ────────────────────────────────────────────────────
function TicketCheckoutDrawer({ ticket, event, onClose, onBack, theme }) {
  const tierKey  = resolveTier(ticket);
  const cfg      = TIER[tierKey];
  const colors = {
    background: theme?.["--t-bg-alt"] ?? "#FFFFFF",
    surface: theme?.["--t-bg"] ?? "#FAF9F6",
    text: theme?.["--t-text"] ?? "#1C1917",
    muted: theme?.["--t-text-muted"] ?? "#78716C",
    accent: theme?.["--t-accent"] ?? "#C9A96E",
    accentFg: theme?.["--t-accent-fg"] ?? "#111111",
    border: theme?.["--t-border"] ?? "#E7E5E4",
  };
  const available = ticket.quantity_total != null ? ticket.quantity_total - (ticket.quantity_sold ?? 0) : 99;
  const maxQty    = Math.min(available, 10);
  const priceEach = ticket.kind === "FREE" ? 0 : Number(ticket.price);

  const [step,       setStep]       = useState("form");
  const [qty,        setQty]        = useState(1);
  const [form,       setForm]       = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [result,     setResult]     = useState(null);
  const ticketRequestKey = useRef(createPaymentRequestKey("ticket"));

  const total = priceEach * qty;
  const fmt   = (n) => fmtPrice(n, ticket.currency);

  async function submit() {
    if (!form.name.trim())  return setError("Full name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email");
    setError(""); setSubmitting(true);
    try {
      const res  = await fetch(`${API}/public/events/${event.id}/orders`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer_name: form.name.trim(), buyer_email: form.email.trim().toLowerCase(), buyer_phone: form.phone.trim() || undefined, items: [{ ticket_type_id: ticket.id, quantity: qty }], idempotency_key: ticketRequestKey.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");
      setResult(data.data);
      if (data.data.payment_required && data.data.checkout_url) { window.location.href = data.data.checkout_url; }
      else setStep("success");
    } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  }

  return (
    <div className="relative isolate overflow-hidden px-5 pb-7 pt-4 sm:px-6 sm:pb-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute -right-24 -top-28 h-60 w-60 rounded-full blur-3xl"
          style={{ background: colors.accent, opacity: 0.15 }}
          animate={{ x: [0, -26, 6, 0], y: [0, 18, -8, 0], scale: [1, 1.12, 0.96, 1] }}
          transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
      <div className="relative">
      {/* ticket header */}
      <div className="flex items-start gap-3 mb-5">
        {onBack && (
          <button onClick={onBack} className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest mb-1"
            style={{ background: `${cfg.accent}20`, color: cfg.accent, border: `1px solid ${cfg.accent}35` }}>
            {cfg.icon} {cfg.label}
          </span>
          <h3 className="text-xl font-bold" style={{ color: colors.text }}>{ticket.name}</h3>
          <p className="mt-0.5 text-xs" style={{ color: colors.muted }}>{event?.title}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {ticket.kind !== "FREE" && (
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest" style={{ color: colors.muted }}>Quantity</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center rounded-xl font-bold" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}>−</button>
                  <span className="w-8 text-center text-xl font-bold" style={{ color: colors.text }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} className="flex h-9 w-9 items-center justify-center rounded-xl font-bold" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}>+</button>
                  <span className="ml-2 text-sm font-bold" style={{ color: colors.accent }}>{fmt(total)}</span>
                </div>
              </div>
            )}
            {[{ key: "name", label: "Full Name", type: "text", placeholder: "Your full name" }, { key: "email", label: "Email", type: "email", placeholder: "your@email.com" }, { key: "phone", label: "Phone (optional)", type: "tel", placeholder: "+1 234 567 8900" }].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest" style={{ color: colors.muted }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-stone-400"
                  style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}
                  onFocus={e => e.target.style.borderColor = colors.accent}
                  onBlur={e => e.target.style.borderColor = colors.border} />
              </div>
            ))}
            <div className="rounded-xl p-3 text-xs leading-5" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.muted }}>
              ✉️ Your e-ticket and QR entry code will be sent to this email after checkout.
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center justify-between border-t py-3" style={{ borderColor: colors.border }}>
              <span className="text-sm" style={{ color: colors.muted }}>Total</span>
              <span className="text-xl font-bold" style={{ color: colors.text }}>{fmt(total)}</span>
            </div>
            <button onClick={submit} disabled={submitting}
              className="w-full py-4 rounded-xl text-sm font-black transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: colors.accent, color: colors.accentFg, boxShadow: "0 8px 22px rgba(0,0,0,0.14)" }}>
              {submitting ? "Processing…" : ticket.kind === "FREE" ? "Reserve My Free Spot →" : `Pay ${fmt(total)} →`}
            </button>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5 py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: `${cfg.accent}20` }}>
              <CheckCircle size={32} style={{ color: cfg.accent }} />
            </div>
            <div><h3 className="text-2xl font-black" style={{ color: colors.text }}>You&apos;re in! 🎉</h3><p className="mt-1 text-sm" style={{ color: colors.muted }}>Your ticket is confirmed.</p></div>
            {result?.issued_tickets?.[0] && (
              <div className="rounded-2xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                <div className="w-36 h-36 mx-auto rounded-xl overflow-hidden bg-white p-2">
                  <img src={`${API}/public/tickets/qr/${result.issued_tickets[0].qr_token}`} alt="QR" className="w-full h-full" />
                </div>
              </div>
            )}
            <p className="text-xs" style={{ color: colors.muted }}>Confirmation sent to <strong style={{ color: colors.text }}>{form.email}</strong></p>
            <a href={`/my-tickets?email=${encodeURIComponent(form.email)}`}
              className="block w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: colors.surface, color: colors.text, border: `1px solid ${colors.border}` }}>
              View My Ticket Profile →
            </a>
            <button onClick={onClose} className="block w-full py-3 rounded-xl text-sm font-medium" style={{ color: colors.muted }}>Close</button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Ticket selector drawer ────────────────────────────────────────────────────
function TicketDrawer({ event, tickets, onClose, theme }) {
  const [selected, setSelected] = useState(null);
  const colors = {
    background: theme?.["--t-bg-alt"] ?? "#FFFFFF",
    surface: theme?.["--t-bg"] ?? "#FAF9F6",
    text: theme?.["--t-text"] ?? "#1C1917",
    muted: theme?.["--t-text-muted"] ?? "#78716C",
    accent: theme?.["--t-accent"] ?? "#C9A96E",
    accentFg: theme?.["--t-accent-fg"] ?? "#111111",
    border: theme?.["--t-border"] ?? "#E7E5E4",
  };

  const eventDate = event?.starts_at_local || event?.starts_at_utc || event?.starts_at
    ? new Date(event.starts_at_local || event.starts_at_utc || event.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  if (selected) {
    return (
      <SheetModal onClose={onClose} palette={colors} maxWidth="max-w-lg" accentBar={<div className="h-1.5 w-full" style={{ background: colors.accent }} />}>
        <TicketCheckoutDrawer ticket={selected} event={event} theme={theme} onClose={onClose} onBack={() => setSelected(null)} />
      </SheetModal>
    );
  }

  return (
    <SheetModal onClose={onClose} palette={colors} maxWidth="max-w-lg" accentBar={<div className="h-1.5 w-full" style={{ background: colors.accent }} />}>
      <div className="relative isolate overflow-hidden px-5 pb-7 pt-4 sm:px-6 sm:pb-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <motion.div
            className="absolute -right-24 -top-28 h-60 w-60 rounded-full blur-3xl"
            style={{ background: colors.accent, opacity: 0.15 }}
            animate={{ x: [0, -26, 6, 0], y: [0, 18, -8, 0], scale: [1, 1.12, 0.96, 1] }}
            transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-32 -left-24 h-56 w-56 rounded-full blur-3xl"
            style={{ background: colors.accent, opacity: 0.09 }}
            animate={{ x: [0, 22, -6, 0], y: [0, -16, 8, 0], scale: [0.94, 1.08, 1, 0.94] }}
            transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
          />
        </div>

        <div className="relative">
          <div className="mb-5 flex items-center gap-3 rounded-2xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: colors.background, border: `1px solid ${colors.border}`, color: colors.accent }}>
              <Ticket size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: colors.muted }}>Tickets for this event</p>
              <p className="mt-0.5 truncate text-base font-bold" style={{ color: colors.text }}>{event.title}</p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {eventDate && <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.muted }}>{eventDate}</span>}
            {event?.venue_name && <span className="max-w-full truncate rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.muted }}>📍 {event.venue_name}</span>}
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.muted }}>QR entry included</span>
          </div>

          <div className="space-y-3">
          {tickets.map((t) => {
            const cfg      = TIER[resolveTier(t)];
            const available = t.quantity_total != null ? t.quantity_total - (t.quantity_sold ?? 0) : null;
            const soldOut   = available !== null && available <= 0;
            const urgent    = available !== null && available > 0 && available <= 20;
            return (
              <button key={t.id}
                onClick={() => !soldOut && setSelected(t)}
                disabled={soldOut}
                className="relative w-full overflow-hidden rounded-2xl p-4 text-left transition-all active:scale-[0.99] disabled:opacity-40"
                style={{ background: colors.background, border: `1px solid ${soldOut ? colors.border : cfg.accent + "55"}`, boxShadow: `0 6px 20px ${cfg.accent}12` }}
              >
                <div className="absolute inset-y-0 left-0 w-1" style={{ background: cfg.accent }} />
                <div className="flex items-start gap-3 pl-1">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                    <span className="text-base">{cfg.icon}</span>
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: cfg.accent }}>{cfg.label}</span>
                      {urgent && <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600"><Zap size={9} />{available} left</span>}
                      {soldOut && <span className="text-[10px] font-bold" style={{ color: colors.muted }}>Sold out</span>}
                    </div>
                    <p className="text-base font-bold" style={{ color: colors.text }}>{t.name}</p>
                    {t.description && <p className="mt-1 line-clamp-1 text-xs" style={{ color: colors.muted }}>{t.description}</p>}
                    <p className="mt-2 text-[10px] font-bold" style={{ color: colors.muted }}>
                      {available === null ? "Instant email delivery · QR code entry" : `${Math.max(available, 0)} available · Instant email delivery`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-black" style={{ color: t.kind === "FREE" ? cfg.accent : colors.text }}>
                    {fmtPrice(Number(t.price), t.currency)}
                    </p>
                    {!soldOut && <span className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black uppercase" style={{ background: colors.accent, color: colors.accentFg }}>Select <ArrowRight size={11} /></span>}
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </SheetModal>
  );
}

// ─── Sticky bars ───────────────────────────────────────────────────────────────
function StickyBars({ event, donConfig, tickets, theme }) {
  const showDonate  = !!event.allow_donations;
  const showTicket  = !!event.allow_ticketing && tickets.length > 0;
  const hasBoth   = showDonate && showTicket;
  const [donationOpen, setDonationOpen] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);

  const cheapest = tickets.length ? tickets.reduce((a, b) => Number(a.price) <= Number(b.price) ? a : b) : null;
  const colors = {
    bg: theme?.["--t-bg"] ?? "#FAF9F6",
    bgAlt: theme?.["--t-bg-alt"] ?? "#FFFFFF",
    text: theme?.["--t-text"] ?? "#1C1917",
    muted: theme?.["--t-text-muted"] ?? "#78716C",
    accent: theme?.["--t-accent"] ?? "#C9A96E",
    accentFg: theme?.["--t-accent-fg"] ?? "#111111",
    border: theme?.["--t-border"] ?? "#E7E5E4",
  };

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 pt-14"
      >
        <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-14 w-full" viewBox="0 0 1440 112" preserveAspectRatio="none">
          <path d="M0 112V74C350 22 1090 22 1440 74V112H0Z" fill={colors.accent} />
        </svg>
        <div
          className="pointer-events-auto relative w-full"
          style={{ background: colors.bgAlt, color: colors.text, boxShadow: "0 -12px 34px rgba(0,0,0,0.12)", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
        <div className={`mx-auto flex w-full gap-2.5 px-4 pt-2 ${hasBoth ? "max-w-xl" : "max-w-3xl"}`}>
          {showDonate && (
            <button
              type="button"
              onClick={() => setDonationOpen(true)}
              className={`group relative flex min-w-0 flex-1 items-center overflow-hidden rounded-2xl text-left transition duration-200 active:scale-[0.985] ${hasBoth ? "min-h-[68px] gap-2 p-2.5" : "min-h-[70px] gap-3 px-3 py-2.5 sm:px-4"}`}
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
              }}
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-11 sm:w-11"
                style={{ background: colors.accent, color: colors.accentFg, boxShadow: "0 5px 14px rgba(0,0,0,0.14)" }}>
                <Heart size={16} fill="currentColor" stroke="currentColor" />
              </div>
              <div className="relative min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.16em]" style={{ color: colors.accent }}>Support this event</p>
                <p className={`truncate font-bold ${hasBoth ? "mt-0.5 text-sm" : "mt-0.5 text-base"}`} style={{ color: colors.text }}>
                  Choose an amount
                </p>
              </div>
              <div className="relative flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wide"
                style={{ background: colors.accent, color: colors.accentFg, boxShadow: "0 5px 14px rgba(0,0,0,0.14)" }}>
                Donate <ArrowRight size={13} strokeWidth={2.7} />
              </div>
            </button>
          )}

          {showTicket && (
            <button type="button" onClick={() => setTicketsOpen(true)}
              className="group relative flex min-h-[68px] min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-2xl p-2.5 text-left transition duration-200 active:scale-[0.985]"
              style={{ background: colors.bg, border: `1px solid ${colors.border}`, boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }}>
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: colors.accent, color: colors.accentFg, boxShadow: "0 5px 14px rgba(0,0,0,0.14)" }}>
                <Ticket size={16} />
              </div>
              {!hasBoth && (
                <div className="relative min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.accent }}>
                    {tickets.length === 1 ? tickets[0].name : `${tickets.length} ticket types`}
                  </p>
                  {cheapest && <p className="mt-0.5 text-sm font-black" style={{ color: colors.text }}>{fmtPrice(Number(cheapest.price), cheapest.currency)}{tickets.length > 1 ? "+" : ""}</p>}
                </div>
              )}
              <div className="relative ml-auto flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wide"
                style={{ background: colors.accent, color: colors.accentFg, boxShadow: "0 5px 14px rgba(0,0,0,0.14)" }}>
                {hasBoth ? "Tickets" : "Buy Tickets"} <ArrowRight size={13} strokeWidth={2.7} />
              </div>
            </button>
          )}
        </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {donationOpen && (
          <DonationDrawer event={event} donConfig={donConfig} theme={theme} onClose={() => setDonationOpen(false)} />
        )}
        {ticketsOpen && (
          <TicketDrawer event={event} tickets={tickets} theme={theme} onClose={() => setTicketsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function EventPageClient({ event, sections, token }) {
  const eventTheme = useMemo(() => resolveThemeFromSections(sections || []), [sections]);
  const enrichedEvent = {
    ...event,
    starts_at_utc:  event.starts_at_utc ?? event.starts_at ?? null,
    ends_at_utc:    event.ends_at_utc   ?? event.ends_at   ?? null,
    speakers:       event.speakers        || [],
    schedule_items: event.schedule_items  || [],
  };

  const showOpenRsvp  = enrichedEvent.allow_rsvp && enrichedEvent.open_rsvp && !token;
  const showDonate    = !!enrichedEvent.allow_donations;
  const showTicket    = !!enrichedEvent.allow_ticketing;
  const showStickyBar = showDonate || showTicket;

  const [pastHero,  setPastHero]  = useState(false);
  const [donConfig, setDonConfig] = useState({ amounts: [], message: "" });
  const [tickets,   setTickets]   = useState([]);

  useEffect(() => {
    if (!showStickyBar) return;
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 1.1);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showStickyBar]);

  // Prevent automatic scroll on Android WebView load
  useEffect(() => {
    // Detect if running in WebView (React Native)
    const isWebView = typeof navigator !== 'undefined' &&
      (navigator.userAgent.includes('wv') || window.ReactNativeWebView);

    if (isWebView) {
      // Force scroll to top on mount to prevent auto-scroll jump
      window.scrollTo(0, 0);

      // Prevent scroll restoration
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
    }
  }, []);

  useEffect(() => {
    if (!enrichedEvent.id) return;
    if (showDonate) {
      fetch(`${API}/engagement/events/${enrichedEvent.id}/donation-config`)
        .then(r => r.json()).then(d => { if (d?.data) setDonConfig(d.data); }).catch(() => {});
    }
    if (showTicket) {
      fetch(`${API}/public/events/${enrichedEvent.id}/tickets`)
        .then(r => r.json()).then(d => setTickets((d?.data ?? d?.tickets ?? []).filter(t => t.is_active))).catch(() => {});
    }
  }, [enrichedEvent.id, showDonate, showTicket]);

  const hasStickyFooter = token || showOpenRsvp || (showStickyBar && pastHero);

  return (
    <>
      <main className={`min-h-screen bg-white ${hasStickyFooter ? "pb-36" : ""}`}>
        <SharedEventRenderer event={enrichedEvent} sections={sections || []} isEditor={false} />
      </main>

      {token && <RsvpPanel token={token} />}
      {showOpenRsvp && <OpenRsvpModal eventId={enrichedEvent.id} />}

      {showStickyBar && pastHero && (
        <StickyBars event={enrichedEvent} donConfig={donConfig} tickets={tickets} theme={eventTheme} />
      )}
    </>
  );
}
