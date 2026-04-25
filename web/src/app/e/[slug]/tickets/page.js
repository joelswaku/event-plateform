"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Clock, CheckCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// ── Tier resolver ─────────────────────────────────────────────────────────────
function resolveTier(ticket) {
  const n = (ticket.name ?? "").toLowerCase();
  if (ticket.kind === "FREE")                                                                         return "free";
  if (n.includes("vip") || n.includes("platinum") || n.includes("premium") || n.includes("elite"))  return "vip";
  if (n.includes("pro") || n.includes("diamond") || n.includes("ultra") || n.includes("all-access")) return "pro";
  if (n.includes("early") || n.includes("bird") || n.includes("presale"))                           return "early";
  if (n.includes("student") || n.includes("youth") || n.includes("concession"))                     return "discount";
  return "standard";
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

  const [step,       setStep]       = useState("form"); // form | processing | success | paid
  const [qty,        setQty]        = useState(1);
  const [form,       setForm]       = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [result,     setResult]     = useState(null);

  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : 99;
  const maxQty   = Math.min(available, 10);
  const priceEach = ticket.kind === "FREE" ? 0 : Number(ticket.price);
  const total     = priceEach * qty;
  const fmt       = (n) => fmtPrice(n, ticket.currency);

  async function submit() {
    if (!form.name.trim())  return setError("Full name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email");
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
      setStep(data.data.payment_required ? "paid" : "success");
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

              {error && (
                <p className="text-sm text-rose-400 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </p>
              )}

              {/* Order summary */}
              <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Total</span>
                <span className="text-xl font-bold" style={{ color: cfg.accent }}>{fmt(total)}</span>
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

          {/* ── PAID (stripe payment pending) ── */}
          {step === "paid" && (
            <motion.div key="paid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-amber-500/20">
                <span className="text-3xl">✉️</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Order Created!</h3>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  A payment link has been sent to <strong className="text-white">{form.email}</strong>
                </p>
              </div>
              <div className="rounded-2xl p-4 text-left space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Order reference</p>
                <p className="text-sm font-mono font-bold text-white">#{result?.order_id?.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Your ticket QR and ticket number will be issued immediately after payment confirmation.
                </p>
              </div>
              <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-bold text-white transition"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                Done
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Ticket Card ───────────────────────────────────────────────────────────────
function TicketCard({ ticket, event, isFeatured, onBuy }) {
  const tierKey  = resolveTier(ticket);
  const cfg      = TIER[tierKey];
  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : null;
  const isSoldOut = available !== null && available <= 0;
  const pct       = ticket.quantity_total
    ? Math.min(((ticket.quantity_sold ?? 0) / ticket.quantity_total) * 100, 100)
    : 0;
  const isUrgent  = available !== null && available > 0 && available <= 20;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="relative flex flex-col overflow-hidden rounded-2xl"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 8px 40px ${cfg.accent}18, inset 0 1px 0 rgba(255,255,255,0.06)`,
        transform: isFeatured ? "scale(1.02)" : undefined,
      }}
    >
      {cfg.shimmer && (
        <style>{`@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}`}</style>
      )}
      {cfg.shimmer && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(105deg,transparent 40%,${cfg.accent}08 50%,transparent 60%)`, backgroundSize: "200% 100%", animation: "shimmer 3s ease infinite" }} />
      )}

      {isFeatured && (
        <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ background: cfg.accent, color: cfg.dark }}>Most Popular</div>
      )}

      {/* Accent stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${cfg.accent},${cfg.accent}60,transparent)` }} />

      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{cfg.icon}</span>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: `${cfg.accent}20`, color: cfg.accent, border: `1px solid ${cfg.accent}35` }}>
            {cfg.label}
          </span>
          {isUrgent && <span className="text-[10px] font-black text-rose-400 flex items-center gap-1"><Zap size={10} /> {available} left</span>}
        </div>
        <h3 className="text-xl font-bold text-white mb-1">{ticket.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black" style={{ color: ticket.kind === "FREE" ? cfg.accent : "#fff" }}>
            {fmtPrice(Number(ticket.price), ticket.currency)}
          </span>
          {ticket.kind !== "FREE" && <span className="text-xs" style={{ color: cfg.muted }}>/ person</span>}
        </div>
      </div>

      {/* Perf */}
      <div className="mx-5 flex items-center gap-1 py-1.5">
        <div className="flex-1 h-px" style={{ background: `${cfg.accent}20` }} />
        {[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: `${cfg.accent}18` }} />)}
        <div className="flex-1 h-px" style={{ background: `${cfg.accent}20` }} />
      </div>

      {/* Body */}
      <div className="p-5 pt-3 flex flex-col flex-1 gap-3">
        {ticket.description && (
          <div>
            {ticket.description.includes("·")
              ? (
                <ul className="space-y-1.5">
                  {ticket.description.split("·").filter(f => f.trim()).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs" style={{ color: cfg.muted }}>
                      <span style={{ color: cfg.accent, fontWeight: 700 }}>✓</span>{f.trim()}
                    </li>
                  ))}
                </ul>
              )
              : <p className="text-sm leading-relaxed" style={{ color: cfg.muted }}>{ticket.description}</p>
            }
          </div>
        )}

        {ticket.quantity_total != null && (
          <div className="mt-auto">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: cfg.muted }}>
              <span>{isSoldOut ? "Sold out" : isUrgent ? `⚠ Only ${available} left!` : `${available} available`}</span>
              <span style={{ color: cfg.accent, fontWeight: 700 }}>{pct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${cfg.accent}15` }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: isSoldOut ? "rgba(255,255,255,0.15)" : isUrgent ? "#ef4444" : `linear-gradient(90deg,${cfg.accent},${cfg.accent}cc)`,
                }} />
            </div>
          </div>
        )}
      </div>

      {/* Perf */}
      <div className="mx-5 flex items-center gap-1 py-1.5">
        <div className="flex-1 h-px" style={{ background: `${cfg.accent}20` }} />
        {[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: `${cfg.accent}18` }} />)}
        <div className="flex-1 h-px" style={{ background: `${cfg.accent}20` }} />
      </div>

      {/* CTA */}
      <div className="p-5 pt-3">
        <button
          onClick={() => !isSoldOut && onBuy(ticket)}
          disabled={isSoldOut}
          className="w-full py-3.5 rounded-xl text-sm font-black transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: isSoldOut ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg,${cfg.accent},${cfg.accent}cc)`,
            color: isSoldOut ? "rgba(255,255,255,0.25)" : cfg.dark,
            boxShadow: !isSoldOut ? `0 4px 20px ${cfg.accent}30` : "none",
          }}>
          {isSoldOut ? "Sold Out" : ticket.kind === "FREE" ? "Reserve Free Spot →" : `Get ${cfg.label} Ticket →`}
        </button>
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

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    // Fetch event + tickets in parallel
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000"}/api/public/pages/${slug}`)
        .then(r => r.json()).then(d => d.data?.event ?? null).catch(() => null),
      fetch(`${API}/public/events/${slug}/tickets`)
        .then(r => r.json()).then(d => d.tickets ?? []).catch(() => []),
    ]).then(([evt, tix]) => {
      // If we got event by slug we need eventId for tickets
      // Try fetching tickets by eventId if we have it
      if (evt?.id && tix.length === 0) {
        return fetch(`${API}/public/events/${evt.id}/tickets`)
          .then(r => r.json())
          .then(d => { setEvent(evt); setTickets(d.tickets ?? []); });
      }
      setEvent(evt);
      setTickets(tix);
    }).finally(() => setLoading(false));
  }, [slug]);

  const maxPrice = tickets.length ? Math.max(...tickets.map(t => Number(t.price ?? 0))) : 0;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  }) : null;

  return (
    <div className="min-h-screen" style={{ background: "#07070f" }}>
      <style>{`@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}`}</style>

      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%,rgba(99,102,241,0.12),transparent)" }} />

      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b" style={{ background: "rgba(7,7,15,0.85)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium transition"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
            <ArrowLeft size={15} /> Back to event
          </button>
          <a href="/my-tickets" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
            My Tickets
          </a>
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-12 space-y-10">

        {/* Event header */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-8 w-64 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-5 w-48 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        ) : event ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(99,102,241,0.8)" }}>
              🎟 Select Your Tickets
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {fmtDate(event.starts_at_local) && (
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> {fmtDate(event.starts_at_local)}
                </span>
              )}
              {event.venue_name && (
                <span>📍 {event.venue_name}{event.city ? `, ${event.city}` : ""}</span>
              )}
            </div>
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
          <div className={`grid gap-5 ${tickets.length === 1 ? "max-w-sm" : tickets.length === 2 ? "sm:grid-cols-2 max-w-2xl" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {tickets.map((t, i) => (
              <TicketCard
                key={t.id}
                ticket={t}
                event={event}
                isFeatured={Number(t.price ?? 0) === maxPrice && maxPrice > 0}
                onBuy={setCheckout}
              />
            ))}
          </div>
        )}

        {/* Trust bar */}
        {tickets.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            {[["🔒","Secure checkout"],["✉️","Instant e-ticket"],["📲","QR code entry"],["💳","Powered by Stripe"]].map(([icon, label]) => (
              <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                {icon} {label}
              </span>
            ))}
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
