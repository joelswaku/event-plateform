"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, ArrowRight, Loader2, Lock, Ticket, CheckCircle, Zap } from "lucide-react";
import SharedEventRenderer from "@/components/events/shared/SharedEventRenderer";
import RsvpPanel from "@/components/events/shared/RsvpPanel";
import OpenRsvpModal from "@/components/events/shared/OpenRsvpModal";

const API          = process.env.NEXT_PUBLIC_API_URL;
const DON_DEFAULTS = [5, 10, 25];

// ─── Responsive SheetModal ─────────────────────────────────────────────────────
// Mobile  → slides up from bottom as a full-width sheet
// Desktop → fades/scales in as a centered card (max-w-md)
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setDesktop(mq.matches);
    const handler = (e) => setDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return desktop;
}

function SheetModal({ onClose, accentBar, children, maxWidth = "max-w-md" }) {
  const desktop = useIsDesktop();

  if (desktop) {
    return (
      <motion.div
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
          style={{ background: "rgba(8,8,18,0.98)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 32px 80px rgba(0,0,0,0.75)", maxHeight: "90vh" }}
        >
          {accentBar}
          <button onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl z-10"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <X size={15} color="rgba(255,255,255,0.55)" />
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
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-[60] overflow-hidden rounded-t-3xl"
      style={{ background: "rgba(8,8,18,0.97)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(24px)", boxShadow: "0 -24px 80px rgba(0,0,0,0.60)", maxHeight: "92vh" }}
    >
      {accentBar}
      <div className="flex justify-center pt-3 pb-1">
        <div className="h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
      </div>
      <button onClick={onClose}
        className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-xl"
        style={{ background: "rgba(255,255,255,0.08)" }}>
        <X size={15} color="rgba(255,255,255,0.55)" />
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
function DonationDrawer({ event, onClose, donConfig }) {
  const [freq,       setFreq]       = useState("once");
  const [preset,     setPreset]     = useState(null);
  const [custom,     setCustom]     = useState("");
  const [name,       setName]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");

  const presets    = donConfig?.amounts?.length === 3 ? donConfig.amounts : DON_DEFAULTS;
  const amount     = preset === "custom" ? Number(custom) : (preset ?? 0);
  const inputStyle = { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)" };

  async function handleDonate(e) {
    e.preventDefault();
    if (!amount || amount <= 0) return setError("Please select or enter an amount");
    setError(""); setSubmitting(true);
    try {
      const res  = await fetch(`${API}/engagement/events/${event.id}/donations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donor_name: name.trim() || null, amount, currency: "USD", frequency: freq }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Donation failed");
      if (data.data?.checkout_url) window.location.href = data.data.checkout_url;
      else setDone(true);
    } catch (err) { setError(err.message); setSubmitting(false); }
  }

  const accentBar = <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#be185d,#f43f5e,#fb923c)" }} />;

  return (
    <SheetModal onClose={onClose} accentBar={accentBar}>
      <div className="px-6 pb-10 pt-4">
        {done ? (
          <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
            <div className="text-5xl">💝</div>
            <p className="text-xl font-black text-white">Thank you!</p>
            <p className="text-sm text-white/50">Your {freq === "monthly" ? "monthly" : ""} donation of ${amount} means everything.</p>
            <button onClick={onClose} className="mt-2 text-xs uppercase tracking-widest text-white/30 underline">Close</button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1.5"><Heart size={13} fill="#f43f5e" stroke="#f43f5e" /><p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-400">Support this event</p></div>
              <p className="text-lg font-bold text-white leading-snug">{donConfig?.message || "Every contribution makes a difference."}</p>
            </div>
            <form onSubmit={handleDonate} className="space-y-3">
              <div className="flex rounded-xl p-1 gap-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                {[["once", "One Time"], ["monthly", "Monthly"]].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setFreq(val)}
                    className="flex-1 rounded-lg py-2.5 text-sm font-black transition-all"
                    style={freq === val ? { background: "var(--t-accent,#f43f5e)", color: "#000" } : { color: "rgba(255,255,255,0.45)" }}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((a) => (
                  <button key={a} type="button" onClick={() => { setPreset(a); setCustom(""); setError(""); }}
                    className="py-4 text-base font-black transition-all active:scale-95"
                    style={{ borderRadius: 14, border: preset === a ? "2px solid #f43f5e" : "1px solid rgba(255,255,255,0.13)", background: preset === a ? "#f43f5e" : "rgba(255,255,255,0.05)", color: preset === a ? "#fff" : "rgba(255,255,255,0.80)", boxShadow: preset === a ? "0 4px 20px rgba(244,63,94,0.35)" : "none" }}>
                    ${a}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={preset === "custom" ? { ...inputStyle, border: "1.5px solid #f43f5e" } : inputStyle}>
                <span className="text-base font-bold text-white/35">$</span>
                <input type="number" min="1" value={preset === "custom" ? custom : ""} placeholder="Other amount"
                  onFocus={() => setPreset("custom")} onChange={(e) => { setPreset("custom"); setCustom(e.target.value); setError(""); }}
                  className="flex-1 bg-transparent text-base font-semibold text-white placeholder-white/25 outline-none" />
              </div>
              <input type="text" value={name} placeholder="Your name (optional)" onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-base font-medium text-white placeholder-white/30 outline-none" style={inputStyle} />
              {error && <p className="text-sm font-semibold text-rose-400">{error}</p>}
              <button type="submit" disabled={submitting || !amount || amount <= 0}
                className="w-full rounded-xl py-4 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#be185d,#f43f5e)", boxShadow: "0 8px 28px rgba(244,63,94,0.40)", color: "#fff" }}>
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Processing…</span>
                  : <span className="flex items-center justify-center gap-2">{freq === "monthly" ? "Give Monthly" : "Donate"}{amount > 0 ? ` — $${amount}` : ""}<ArrowRight size={16} strokeWidth={2.5} /></span>}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-white/20"><Lock size={9} />Secure payment via Stripe</p>
            </form>
          </>
        )}
      </div>
    </SheetModal>
  );
}

// ─── Ticket checkout drawer ────────────────────────────────────────────────────
function TicketCheckoutDrawer({ ticket, event, onClose, onBack }) {
  const tierKey  = resolveTier(ticket);
  const cfg      = TIER[tierKey];
  const available = ticket.quantity_total != null ? ticket.quantity_total - (ticket.quantity_sold ?? 0) : 99;
  const maxQty    = Math.min(available, 10);
  const priceEach = ticket.kind === "FREE" ? 0 : Number(ticket.price);

  const [step,       setStep]       = useState("form");
  const [qty,        setQty]        = useState(1);
  const [form,       setForm]       = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [result,     setResult]     = useState(null);

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
        body: JSON.stringify({ buyer_name: form.name.trim(), buyer_email: form.email.trim().toLowerCase(), buyer_phone: form.phone.trim() || undefined, items: [{ ticket_type_id: ticket.id, quantity: qty }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");
      setResult(data.data);
      if (data.data.payment_required && data.data.checkout_url) { window.location.href = data.data.checkout_url; }
      else setStep("success");
    } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  }

  return (
    <div className="px-6 pb-10 pt-4">
      {/* ticket header */}
      <div className="flex items-start gap-3 mb-5">
        {onBack && (
          <button onClick={onBack} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-1" style={{ background: "rgba(255,255,255,0.08)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest mb-1"
            style={{ background: `${cfg.accent}20`, color: cfg.accent, border: `1px solid ${cfg.accent}35` }}>
            {cfg.icon} {cfg.label}
          </span>
          <h3 className="text-xl font-bold text-white">{ticket.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: cfg.muted }}>{event?.title}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {ticket.kind !== "FREE" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Quantity</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl font-bold text-white flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>−</button>
                  <span className="text-xl font-bold text-white w-8 text-center">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} className="w-9 h-9 rounded-xl font-bold text-white flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>+</button>
                  <span className="text-sm ml-2 font-bold" style={{ color: cfg.accent }}>{fmt(total)}</span>
                </div>
              </div>
            )}
            {[{ key: "name", label: "Full Name", type: "text", placeholder: "Your full name" }, { key: "email", label: "Email", type: "email", placeholder: "your@email.com" }, { key: "phone", label: "Phone (optional)", type: "tel", placeholder: "+1 234 567 8900" }].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                  onFocus={e => e.target.style.borderColor = cfg.accent + "80"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
              </div>
            ))}
            <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
              📧 Your ticket number will be emailed to you.
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Total</span>
              <span className="text-xl font-bold" style={{ color: cfg.accent }}>{fmt(total)}</span>
            </div>
            <button onClick={submit} disabled={submitting}
              className="w-full py-4 rounded-xl text-sm font-black transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: `linear-gradient(135deg,${cfg.accent},${cfg.accent}cc)`, color: cfg.dark, boxShadow: `0 4px 20px ${cfg.accent}40` }}>
              {submitting ? "Processing…" : ticket.kind === "FREE" ? "Reserve My Free Spot →" : `Pay ${fmt(total)} →`}
            </button>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5 py-6">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: `${cfg.accent}20` }}>
              <CheckCircle size={32} style={{ color: cfg.accent }} />
            </div>
            <div><h3 className="text-2xl font-black text-white">You&apos;re in! 🎉</h3><p className="text-sm mt-1" style={{ color: cfg.muted }}>Your ticket is confirmed.</p></div>
            {result?.issued_tickets?.[0] && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${cfg.border}` }}>
                <div className="w-36 h-36 mx-auto rounded-xl overflow-hidden bg-white p-2">
                  <img src={`${API}/public/tickets/qr/${result.issued_tickets[0].qr_token}`} alt="QR" className="w-full h-full" />
                </div>
              </div>
            )}
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Confirmation sent to <strong style={{ color: "rgba(255,255,255,0.6)" }}>{form.email}</strong></p>
            <a href={`/my-tickets?email=${encodeURIComponent(form.email)}`}
              className="block w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: `${cfg.accent}20`, color: cfg.accent, border: `1px solid ${cfg.border}` }}>
              View My Ticket Profile →
            </a>
            <button onClick={onClose} className="block w-full py-3 rounded-xl text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Close</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Ticket selector drawer ────────────────────────────────────────────────────
function TicketDrawer({ event, tickets, onClose }) {
  const [selected, setSelected] = useState(null);

  if (selected) {
    const selAccent = TIER[resolveTier(selected)].accent;
    return (
      <SheetModal onClose={onClose} accentBar={<div style={{ height: 3, background: `linear-gradient(90deg,${selAccent},transparent)` }} />}>
        <TicketCheckoutDrawer ticket={selected} event={event} onClose={onClose} onBack={() => setSelected(null)} />
      </SheetModal>
    );
  }

  return (
    <SheetModal onClose={onClose} accentBar={<div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#4f46e5,#6366f1,#8b5cf6)" }} />}>
      <div className="px-6 pb-10 pt-4">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Ticket size={13} style={{ color: "#6366f1" }} />
            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "#818cf8" }}>Get Tickets</p>
          </div>
          <p className="text-lg font-bold text-white leading-snug">{event.title}</p>
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
                className="w-full flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-4 text-left transition-all active:scale-[0.99] disabled:opacity-40"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: `0 4px 20px ${cfg.accent}12` }}
              >
                <div>
                  <div style={{ height: "100%", width: 3, background: cfg.accent, borderRadius: 99, position: "absolute", left: 0, top: 0 }} />
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{cfg.icon}</span>
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: cfg.accent }}>{cfg.label}</span>
                    {urgent && <span className="text-[10px] font-bold text-rose-400 flex items-center gap-0.5"><Zap size={9} />{available} left</span>}
                    {soldOut && <span className="text-[10px] font-bold text-white/30">Sold Out</span>}
                  </div>
                  <p className="text-base font-bold text-white">{t.name}</p>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <p className="text-xl font-black" style={{ color: t.kind === "FREE" ? cfg.accent : "#fff" }}>
                    {fmtPrice(Number(t.price), t.currency)}
                  </p>
                  {!soldOut && <ArrowRight size={14} style={{ color: cfg.accent, marginLeft: "auto" }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </SheetModal>
  );
}

// ─── Sticky bars ───────────────────────────────────────────────────────────────
function StickyBars({ event, donConfig, tickets }) {
  const showDonate  = !!event.allow_donations;
  const showTicket  = !!event.allow_ticketing && tickets.length > 0;
  const hasBoth   = showDonate && showTicket;
  const goDonate  = () => { window.location.href = `/e/${event.slug}/donate`; };
  const goTickets = () => { window.location.href = `/e/${event.slug}/tickets`; };

  const presets = donConfig?.amounts?.length === 3 ? donConfig.amounts : DON_DEFAULTS;
  const cheapest = tickets.length ? tickets.reduce((a, b) => Number(a.price) <= Number(b.price) ? a : b) : null;
  const cfg = cheapest ? TIER[resolveTier(cheapest)] : TIER.standard;

  return (
    <>
      {/* Sticky bar */}
      <AnimatePresence>
        {(
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 z-50"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))", paddingLeft: 16, paddingRight: 16 }}
          >
            <div className="mx-auto w-full max-w-lg" style={{ display: "flex", gap: 10 }}>

              {/* Donation bar — navigates to /donate page */}
              {showDonate && (
                <button onClick={goDonate}
                  className="flex flex-1 items-center gap-2 overflow-hidden rounded-2xl p-2.5 transition-all active:scale-[0.98]"
                  style={{ background: "rgba(8,8,18,0.94)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(20px)", boxShadow: "0 8px 40px rgba(0,0,0,0.55)" }}>
                  {/* icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.30)" }}>
                    <Heart size={15} fill="#f43f5e" stroke="#f43f5e" />
                  </div>
                  {/* "Donate" label */}
                  <p className="shrink-0 text-xs font-black uppercase tracking-widest" style={{ color: "rgba(244,63,94,0.80)" }}>
                    Donate
                  </p>
                  {/* preset amount pills */}
                  {!hasBoth && (
                    <div className="flex flex-1 gap-1.5">
                      {presets.map((a) => (
                        <div key={a}
                          className="flex-1 rounded-xl py-2 text-center text-xs font-black"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)" }}>
                          ${a}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* CTA pill */}
                  <div className="flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-black text-white"
                    style={{ background: "linear-gradient(135deg,#be185d,#f43f5e)", boxShadow: "0 4px 16px rgba(244,63,94,0.40)" }}>
                    Donate <ArrowRight size={13} strokeWidth={2.5} />
                  </div>
                </button>
              )}

              {/* Ticket bar — entire bar navigates to tickets page */}
              {showTicket && (
                <button onClick={goTickets}
                  className="flex flex-1 items-center gap-2 overflow-hidden rounded-2xl p-2.5 transition-all active:scale-[0.98]"
                  style={{ background: "rgba(8,8,18,0.94)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(20px)", boxShadow: "0 8px 40px rgba(0,0,0,0.55)" }}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${cfg.accent}18`, border: `1px solid ${cfg.accent}35` }}>
                    <Ticket size={15} style={{ color: cfg.accent }} />
                  </div>
                  {!hasBoth && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: cfg.accent }}>
                        {tickets.length === 1 ? tickets[0].name : `${tickets.length} ticket types`}
                      </p>
                      {cheapest && (
                        <p className="text-sm font-black text-white">{fmtPrice(Number(cheapest.price), cheapest.currency)}{tickets.length > 1 ? "+" : ""}</p>
                      )}
                    </div>
                  )}
                  <div className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all ml-auto"
                    style={{ background: `linear-gradient(135deg,${cfg.accent},${cfg.accent}cc)`, boxShadow: `0 4px 16px ${cfg.accent}40`, color: cfg.dark }}>
                    {hasBoth ? "Tickets" : "Buy Tickets"} <ArrowRight size={13} strokeWidth={2.5} />
                  </div>
                </button>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function EventPageClient({ event, sections, token }) {
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
        <StickyBars event={enrichedEvent} donConfig={donConfig} tickets={tickets} />
      )}
    </>
  );
}
