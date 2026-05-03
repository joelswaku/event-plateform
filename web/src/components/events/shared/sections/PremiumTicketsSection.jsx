"use client";

/**
 * web/src/components/events/shared/sections/PremiumTicketsSection.jsx
 *
 * DROP-IN replacement for TicketsSection in SharedSections.jsx
 *
 * Features:
 *  - Live countdown timer to event start
 *  - Animated ticket cards with shimmer, urgency, capacity bar
 *  - "Tickets selling fast" flash banner when any tier is low
 *  - Social proof counter (X people viewing)
 *  - Checkout modal (unchanged from existing)
 *  - Works in isEditor mode (mocked data)
 *  - Fully responsive
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

/* ─── API ─────────────────────────────────────────────────── */
const API = process.env.NEXT_PUBLIC_API_URL ?? "";

/* ─── MOCK DATA (editor only) ────────────────────────────── */
const TICKET_MOCK = [
  {
    id: "m1", name: "General Admission", kind: "FREE",
    price: 0, currency: "USD",
    description: "Full event access · Doors open 30 min before show",
    quantity_total: 500, quantity_sold: 210,
  },
  {
    id: "m2", name: "Early Bird", kind: "PAID",
    price: 49, currency: "USD",
    description: "Limited early-access pricing · Same great experience",
    quantity_total: 100, quantity_sold: 88,
  },
  {
    id: "m3", name: "VIP Access", kind: "PAID",
    price: 199, currency: "USD",
    description: "Priority entry · Premium seating · Exclusive lounge · Gift bag",
    quantity_total: 40, quantity_sold: 15,
  },
];

/* ─── TIER CONFIG ─────────────────────────────────────────── */
function resolveTier(ticket) {
  const n = (ticket.name ?? "").toLowerCase();
  if (ticket.kind === "FREE")                                                                          return "free";
  if (n.includes("vip") || n.includes("platinum") || n.includes("premium") || n.includes("elite"))   return "vip";
  if (n.includes("pro") || n.includes("diamond") || n.includes("ultra") || n.includes("all-access")) return "pro";
  if (n.includes("early") || n.includes("bird") || n.includes("presale"))                            return "early";
  if (n.includes("student") || n.includes("youth") || n.includes("concession"))                      return "discount";
  return "standard";
}

const TIER = {
  free:     { label:"Free",       icon:"🎁", accent:"#10b981", dark:"#022c22", bg:"linear-gradient(160deg,#052e16,#064e3b)",  border:"rgba(16,185,129,0.3)",  muted:"rgba(167,243,208,0.7)",  glow:"rgba(16,185,129,0.25)",  shimmer:false },
  early:    { label:"Early Bird", icon:"⚡", accent:"#f59e0b", dark:"#1c1002", bg:"linear-gradient(160deg,#1c0a00,#431400)",  border:"rgba(245,158,11,0.35)", muted:"rgba(253,230,138,0.7)",  glow:"rgba(245,158,11,0.28)",  shimmer:false },
  standard: { label:"Standard",   icon:"🎟️",accent:"#6366f1", dark:"#0f0f1f", bg:"linear-gradient(160deg,#0f0f1f,#1e1b4b)", border:"rgba(99,102,241,0.3)",  muted:"rgba(199,210,254,0.7)",  glow:"rgba(99,102,241,0.22)",  shimmer:false },
  discount: { label:"Discount",   icon:"🏷️",accent:"#06b6d4", dark:"#0a1520", bg:"linear-gradient(160deg,#0a1520,#0e4a5a)", border:"rgba(6,182,212,0.3)",   muted:"rgba(165,243,252,0.7)",  glow:"rgba(6,182,212,0.2)",   shimmer:false },
  vip:      { label:"VIP",        icon:"👑", accent:"#C9A96E", dark:"#0f0b00", bg:"linear-gradient(160deg,#0f0b00,#2d1f00)", border:"rgba(201,169,110,0.4)", muted:"rgba(253,230,138,0.65)", glow:"rgba(201,169,110,0.3)",  shimmer:true  },
  pro:      { label:"Premium",    icon:"💎", accent:"#a78bfa", dark:"#0d0718", bg:"linear-gradient(160deg,#0d0718,#1e0a3c)", border:"rgba(167,139,250,0.4)", muted:"rgba(221,214,254,0.65)", glow:"rgba(167,139,250,0.3)",  shimmer:true  },
};

/* ─── HELPERS ────────────────────────────────────────────── */
function fmt(price, currency = "USD") {
  if (!price || price === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(price);
}

function pad(n) { return String(n).padStart(2, "0"); }

/* ─── COUNTDOWN HOOK ──────────────────────────────────────── */
function useCountdown(targetDate) {
  const calc = useCallback(() => {
    if (!targetDate) return null;
    const diff = new Date(targetDate) - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000)  / 60000),
      seconds: Math.floor((diff % 60000)    / 1000),
      ended:   false,
    };
  }, [targetDate]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

/* ─── SHIMMER ANIMATION ───────────────────────────────────── */
const shimmerCSS = `
@keyframes ticketShimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
@keyframes ticketPulse {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.6; }
}
@keyframes floatUp {
  0%   { transform: translateY(0px);  opacity: 1; }
  100% { transform: translateY(-24px); opacity: 0; }
}
@keyframes scanLine {
  0%   { top: 0%; }
  100% { top: 100%; }
}
`;

/* ─── COUNTDOWN UNIT ──────────────────────────────────────── */
function CountUnit({ value, label, accent }) {
  const prev = useRef(value);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      setFlip(true);
      const t = setTimeout(() => setFlip(false), 300);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${accent}30`,
          boxShadow: `0 4px 20px ${accent}15`,
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: flip ? -20 : 0, opacity: flip ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="text-2xl sm:text-3xl font-black tabular-nums"
            style={{ color: "#fff", fontVariantNumeric: "tabular-nums" }}
          >
            {pad(value)}
          </motion.span>
        </AnimatePresence>
        {/* scan line */}
        <div
          className="absolute left-0 w-full h-px opacity-20"
          style={{
            background: accent,
            animation: "scanLine 2s linear infinite",
          }}
        />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
        {label}
      </span>
    </div>
  );
}

/* ─── PERFORATIONS ────────────────────────────────────────── */
function Perf({ color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 20px" }}>
      <div style={{ height:1, flex:1, background:color, opacity:0.15 }} />
      {[...Array(8)].map((_,i) => (
        <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:color, opacity:0.12 }} />
      ))}
      <div style={{ height:1, flex:1, background:color, opacity:0.15 }} />
    </div>
  );
}

/* ─── SOCIAL PROOF COUNTER ────────────────────────────────── */
function ViewerCount({ accent }) {
  const [count, setCount] = useState(() => Math.floor(Math.random() * 40) + 12);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((n) => Math.max(8, n + (Math.random() > 0.5 ? 1 : -1)));
    }, 3500);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div
      className="flex items-center gap-2 rounded-full px-3 py-1.5"
      style={{
        background: `${accent}12`,
        border: `1px solid ${accent}25`,
      }}
    >
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ background: accent }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: accent }} />
      </span>
      <span className="text-[11px] font-bold" style={{ color: accent }}>
        {count} people viewing now
      </span>
    </motion.div>
  );
}

/* ─── TICKET CARD ─────────────────────────────────────────── */
function PremiumTicketCard({ ticket, onBuy, delay = 0, isEditor }) {
  const ref     = useRef(null);
  const inView  = useInView(ref, { once: true, margin: "-60px" });
  const tierKey = resolveTier(ticket);
  const cfg     = TIER[tierKey];

  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : null;
  const isSoldOut = available !== null && available <= 0;
  const pct       = ticket.quantity_total
    ? Math.min(((ticket.quantity_sold ?? 0) / ticket.quantity_total) * 100, 100)
    : 0;
  const isUrgent  = available !== null && available > 0 && available <= 20;
  const isLow     = available !== null && available > 0 && available <= 50;
  const isFeatured = tierKey === "vip" || tierKey === "pro";

  const features = ticket.description?.includes("·")
    ? ticket.description.split("·").map((f) => f.trim()).filter(Boolean)
    : ticket.description
    ? [ticket.description]
    : [];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      className="relative flex flex-col overflow-hidden rounded-2xl"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: isFeatured
          ? `0 0 0 1px ${cfg.border}, 0 20px 60px ${cfg.glow}`
          : `0 8px 32px ${cfg.glow}`,
        transform: isFeatured ? "scale(1.03)" : "scale(1)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = isFeatured ? "scale(1.06) translateY(-6px)" : "translateY(-5px) scale(1.01)";
        e.currentTarget.style.boxShadow = `0 32px 80px ${cfg.glow}, 0 0 0 1px ${cfg.border}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isFeatured ? "scale(1.03)" : "scale(1)";
        e.currentTarget.style.boxShadow = isFeatured
          ? `0 0 0 1px ${cfg.border}, 0 20px 60px ${cfg.glow}`
          : `0 8px 32px ${cfg.glow}`;
      }}
    >
      {/* Shimmer sweep for VIP/Pro */}
      {cfg.shimmer && (
        <div
          className="pointer-events-none absolute inset-0 -z-0 opacity-20"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${cfg.accent}40 50%, transparent 60%)`,
            backgroundSize: "200% 100%",
            animation: "ticketShimmer 3s linear infinite",
          }}
        />
      )}

      {/* Featured crown */}
      {isFeatured && (
        <div
          className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
          style={{ background: cfg.accent }}
        />
      )}

      {/* Urgent badge */}
      {isUrgent && !isSoldOut && (
        <div
          className="absolute -right-1 top-4 flex items-center gap-1 rounded-l-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
          style={{
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(239,68,68,0.5)",
            animation: "ticketPulse 1.5s ease-in-out infinite",
          }}
        >
          🔥 {available} left
        </div>
      )}

      {/* Card header */}
      <div style={{ padding: "20px 22px 14px" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
                style={{
                  background: `${cfg.accent}18`,
                  border: `1px solid ${cfg.accent}35`,
                  color: cfg.accent,
                }}
              >
                {cfg.icon} {cfg.label}
              </span>
            </div>
            <h3
              className="text-lg font-black leading-tight"
              style={{ color: "#fff", letterSpacing: "-0.02em" }}
            >
              {ticket.name}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <p
              className="text-3xl font-black leading-none"
              style={{
                color: ticket.kind === "FREE" ? cfg.accent : "#fff",
                letterSpacing: "-0.04em",
              }}
            >
              {fmt(Number(ticket.price), ticket.currency)}
            </p>
            {ticket.kind !== "FREE" && (
              <p className="text-[11px] mt-0.5" style={{ color: cfg.muted }}>per person</p>
            )}
          </div>
        </div>
      </div>

      {/* Perforation */}
      <Perf color={cfg.accent} />

      {/* Features list */}
      <div style={{ padding: "10px 22px", flex: 1 }}>
        {features.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0">
                  <circle cx="6" cy="6" r="5.5" stroke={cfg.accent} strokeOpacity="0.4" />
                  <path d="M3.5 6l2 2 3-3" stroke={cfg.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[13px] leading-relaxed" style={{ color: cfg.muted }}>{f}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] leading-relaxed" style={{ color: cfg.muted }}>
            {ticket.description ?? "Full event access included."}
          </p>
        )}
      </div>

      {/* Capacity bar */}
      {ticket.quantity_total != null && (
        <div style={{ padding: "12px 22px 0" }}>
          <div className="flex justify-between text-[11px] mb-2" style={{ color: cfg.muted }}>
            <span style={{ color: isSoldOut ? "rgba(255,255,255,0.3)" : isUrgent ? "#ef4444" : cfg.muted }}>
              {isSoldOut ? "Sold out" : isUrgent ? `⚠ Only ${available} spots left!` : isLow ? `${available} remaining` : `${available} available`}
            </span>
            <span style={{ color: pct >= 90 ? "#ef4444" : cfg.accent, fontWeight: 700 }}>
              {Math.round(pct)}% sold
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: `${cfg.accent}15`, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${pct}%` } : {}}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: delay + 0.3 }}
              style={{
                height: "100%",
                borderRadius: 99,
                background: isSoldOut ? "rgba(255,255,255,0.15)"
                  : isUrgent ? "linear-gradient(90deg,#ef4444,#dc2626)"
                  : `linear-gradient(90deg,${cfg.accent},${cfg.accent}bb)`,
                boxShadow: !isSoldOut ? `0 0 8px ${cfg.glow}` : "none",
              }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: "14px 22px 20px" }}>
        <motion.button
          whileHover={!isSoldOut ? { scale: 1.02 } : {}}
          whileTap={!isSoldOut ? { scale: 0.97 } : {}}
          onClick={() => !isSoldOut && !isEditor && onBuy(ticket)}
          disabled={isSoldOut || isEditor}
          className="w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-wide transition-all"
          style={{
            background: isSoldOut
              ? "rgba(255,255,255,0.05)"
              : `linear-gradient(135deg,${cfg.accent},${cfg.accent}bb)`,
            color: isSoldOut ? "rgba(255,255,255,0.2)" : cfg.dark,
            border: "none",
            cursor: isSoldOut ? "not-allowed" : "pointer",
            letterSpacing: "0.05em",
            boxShadow: !isSoldOut ? `0 6px 24px ${cfg.glow}` : "none",
          }}
        >
          {isSoldOut
            ? "Sold Out"
            : ticket.kind === "FREE"
            ? "Reserve Free Spot →"
            : `Get ${cfg.label} Ticket →`}
        </motion.button>

        {!isSoldOut && ticket.kind !== "FREE" && (
          <p className="mt-2 text-center text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            🔒 Secure checkout · Instant e-ticket
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── HEADER SECTION ──────────────────────────────────────── */
function TicketHeroHeader({ event, tickets, accentColor }) {
  const countdown = useCountdown(event?.starts_at_utc ?? event?.starts_at);

  const paidTickets = tickets.filter((t) => t.price > 0);
  const freeTickets = tickets.filter((t) => !t.price || t.price === 0);
  const minPrice    = paidTickets.length ? Math.min(...paidTickets.map((t) => Number(t.price))) : 0;
  const maxPrice    = paidTickets.length ? Math.max(...paidTickets.map((t) => Number(t.price))) : 0;
  const currency    = tickets[0]?.currency ?? "USD";

  const priceLabel  = paidTickets.length === 0
    ? (freeTickets.length ? "Free entry" : "")
    : minPrice === maxPrice
    ? `From ${fmt(minPrice, currency)}`
    : `${fmt(minPrice, currency)} – ${fmt(maxPrice, currency)}`;

  const totalCap    = tickets.reduce((s, t) => s + (t.quantity_total ?? 0), 0);
  const totalSold   = tickets.reduce((s, t) => s + (t.quantity_sold ?? 0), 0);
  const totalLeft   = totalCap > 0 ? totalCap - totalSold : null;
  const anyUrgent   = totalLeft !== null && totalLeft > 0 && totalLeft <= 50;
  const anySoldOut  = tickets.every((t) =>
    t.quantity_total != null && (t.quantity_total - (t.quantity_sold ?? 0)) <= 0
  );

  const showCountdown = countdown && !countdown.ended;

  return (
    <div className="text-center mb-12">
      {/* Urgency flash banner */}
      <AnimatePresence>
        {(anyUrgent || anySoldOut) && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 text-sm font-bold"
            style={{
              background: "linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.08))",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
            }}
          >
            <span style={{ animation: "ticketPulse 1s ease-in-out infinite" }}>🔥</span>
            {anySoldOut
              ? "This event is sold out"
              : `Only ${totalLeft} tickets left across all tiers`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <p
          className="text-[11px] font-black uppercase tracking-[0.3em] mb-3"
          style={{ color: accentColor, opacity: 0.8 }}
        >
          🎟️ &nbsp; Secure Your Spot
        </p>
        <h2
          className="text-4xl sm:text-5xl font-black leading-none mb-3"
          style={{
            color: "#fff",
            letterSpacing: "-0.03em",
            textShadow: `0 0 80px ${accentColor}30`,
          }}
        >
          Get Your Tickets
        </h2>
        {priceLabel && (
          <p className="text-lg font-semibold mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
            {priceLabel}
          </p>
        )}
      </motion.div>

      {/* Social proof */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center mt-4 mb-8"
      >
        <ViewerCount accent={accentColor} />
      </motion.div>

      {/* Countdown */}
      {showCountdown && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex flex-col items-center"
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Event starts in
          </p>
          <div className="flex items-start gap-3 sm:gap-5">
            {countdown.days > 0 && (
              <>
                <CountUnit value={countdown.days}    label="Days"    accent={accentColor} />
                <span className="text-2xl font-black mt-3" style={{ color: "rgba(255,255,255,0.2)" }}>:</span>
              </>
            )}
            <CountUnit value={countdown.hours}   label="Hours"   accent={accentColor} />
            <span className="text-2xl font-black mt-3" style={{ color: "rgba(255,255,255,0.2)" }}>:</span>
            <CountUnit value={countdown.minutes} label="Min"     accent={accentColor} />
            <span className="text-2xl font-black mt-3" style={{ color: "rgba(255,255,255,0.2)" }}>:</span>
            <CountUnit value={countdown.seconds} label="Sec"     accent={accentColor} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── TRUST BAR ───────────────────────────────────────────── */
function TrustBar({ accent }) {
  const items = [
    { icon: "🔒", text: "Secure checkout" },
    { icon: "📧", text: "Instant e-ticket" },
    { icon: "✅", text: "QR code entry" },
    { icon: "💳", text: "Stripe payments" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-12 pt-8"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      {items.map((it) => (
        <div key={it.text} className="flex items-center gap-2">
          <span className="text-base">{it.icon}</span>
          <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>
            {it.text}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

/* ─── CHECKOUT MODAL (from existing code — kept as-is) ─────── */
function CheckoutModal({ ticket, event, onClose }) {
  const tierKey = resolveTier(ticket);
  const cfg     = TIER[tierKey];

  const [step,       setStep]       = useState("form");
  const [qty,        setQty]        = useState(1);
  const [form,       setForm]       = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : 99;
  const maxQty    = Math.min(available, 10);
  const priceEach = ticket.kind === "FREE" ? 0 : Number(ticket.price);
  const total     = priceEach * qty;
  const fmtP      = (n) => new Intl.NumberFormat("en-US", {
    style: "currency", currency: ticket.currency ?? "USD",
  }).format(n);

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required"); return; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError("Enter a valid email address"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/public/events/${event.id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_name:  form.name.trim(),
          buyer_email: form.email.trim(),
          buyer_phone: form.phone.trim() || undefined,
          items: [{ ticket_type_id: ticket.id, quantity: qty }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");
      if (data.data?.payment_required && data.data?.payment_url) {
        window.location.href = data.data.payment_url;
        return;
      }
      setStep("success");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width:       "100%",
    padding:     "12px 14px",
    borderRadius: 12,
    border:       "1px solid rgba(255,255,255,0.1)",
    background:   "rgba(255,255,255,0.05)",
    color:        "#fff",
    fontSize:     14,
    outline:      "none",
    transition:   "border-color 0.2s",
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          boxShadow: `0 32px 80px ${cfg.glow}`,
        }}
      >
        {/* Header */}
        <div className="relative flex items-start justify-between p-6"
          style={{ borderBottom: `1px solid ${cfg.border}` }}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: cfg.accent }}>
              {cfg.icon} {cfg.label} Ticket
            </span>
            <h3 className="text-xl font-black mt-1" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
              {ticket.name}
            </h3>
            <p className="text-2xl font-black mt-1" style={{ color: cfg.accent, letterSpacing: "-0.03em" }}>
              {fmt(priceEach, ticket.currency)}
              {ticket.kind !== "FREE" && <span className="text-sm font-medium ml-1" style={{ color: cfg.muted }}>/ person</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl transition"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
          >
            ✕
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-6 space-y-4">

              {/* Qty selector */}
              {ticket.kind !== "FREE" && maxQty > 1 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: cfg.muted }}>
                    Quantity
                  </p>
                  <div className="flex items-center gap-3">
                    {[...Array(Math.min(maxQty, 5))].map((_, i) => (
                      <button key={i + 1} onClick={() => setQty(i + 1)}
                        className="h-9 w-9 rounded-xl text-sm font-bold transition"
                        style={{
                          background: qty === i + 1 ? cfg.accent : "rgba(255,255,255,0.06)",
                          color:      qty === i + 1 ? cfg.dark    : "rgba(255,255,255,0.5)",
                          border:     `1px solid ${qty === i + 1 ? cfg.accent : "transparent"}`,
                        }}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: cfg.muted }}>Full name *</p>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = cfg.accent)}
                  onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: cfg.muted }}>Email address *</p>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="ticket@example.com"
                  type="email"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = cfg.accent)}
                  onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: cfg.muted }}>Phone (optional)</p>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = cfg.accent)}
                  onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
                  {error}
                </div>
              )}

              {/* Total */}
              {ticket.kind !== "FREE" && (
                <div className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${cfg.border}` }}>
                  <span className="text-sm" style={{ color: cfg.muted }}>Total ({qty} × {fmtP(priceEach)})</span>
                  <span className="text-lg font-black" style={{ color: cfg.accent }}>{fmtP(total)}</span>
                </div>
              )}

              <button
                onClick={submit}
                disabled={submitting}
                className="w-full rounded-xl py-4 text-sm font-black uppercase tracking-wide transition-all"
                style={{
                  background: `linear-gradient(135deg,${cfg.accent},${cfg.accent}cc)`,
                  color: cfg.dark,
                  boxShadow: `0 8px 24px ${cfg.glow}`,
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? "wait" : "pointer",
                }}
              >
                {submitting
                  ? "Processing…"
                  : ticket.kind === "FREE"
                  ? "Reserve My Spot →"
                  : `Pay ${fmtP(total)} →`}
              </button>

              <p className="text-center text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                🔒 Secured by Stripe · Your e-ticket will be emailed instantly
              </p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 flex flex-col items-center text-center gap-5">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl"
                style={{ background: `${cfg.accent}18`, border: `1px solid ${cfg.accent}30` }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={cfg.accent} strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-black" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
                  You&apos;re in! 🎉
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: cfg.muted }}>
                  Your ticket has been issued and sent to{" "}
                  <span className="font-bold" style={{ color: "#fff" }}>{form.email}</span>.
                  Check your inbox!
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full rounded-xl py-3 text-sm font-bold"
                style={{ background: `${cfg.accent}18`, border: `1px solid ${cfg.border}`, color: cfg.accent }}
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ─── MAIN EXPORT ─────────────────────────────────────────── */
export function PremiumTicketsSection({ section, event, isEditor = false, onEdit }) {
  const [tickets,  setTickets]  = useState(isEditor ? TICKET_MOCK : []);
  const [loading,  setLoading]  = useState(!isEditor && !!event?.id);
  const [checkout, setCheckout] = useState(null);

  useEffect(() => {
    if (isEditor || !event?.id || !API) return;
    setLoading(true);
    fetch(`${API}/public/events/${event.id}/tickets`)
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [event?.id, isEditor]);

  const display = isEditor ? TICKET_MOCK : tickets;

  // Pick dominant accent from highest-tier ticket present
  const hasVip  = display.some((t) => resolveTier(t) === "vip");
  const hasPro  = display.some((t) => resolveTier(t) === "pro");
  const accent  = hasPro ? "#a78bfa" : hasVip ? "#C9A96E" : "#6366f1";

  const gridCols = display.length === 1
    ? "max-w-sm mx-auto"
    : display.length === 2
    ? "sm:grid-cols-2 max-w-2xl mx-auto"
    : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      <style>{shimmerCSS}</style>

      <section
        className="relative overflow-hidden py-20 px-4"
        style={{ background: "#07070f" }}
        onClick={isEditor ? onEdit : undefined}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${accent}14, transparent 70%)`,
          }}
        />

        {/* Decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative mx-auto max-w-5xl">

          {/* ── HEADER ── */}
          <TicketHeroHeader event={event} tickets={display} accentColor={accent} />

          {/* ── CARDS ── */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div
                className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: accent, borderTopColor: "transparent" }}
              />
            </div>
          ) : display.length === 0 ? (
            <div
              className="rounded-2xl border py-16 text-center"
              style={{ borderColor: "rgba(255,255,255,0.08)", borderStyle: "dashed" }}
            >
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>
                {isEditor ? "Add ticket tiers to see them here" : "No tickets available"}
              </p>
            </div>
          ) : (
            <div className={`grid gap-5 ${gridCols}`}>
              {display.map((t, i) => (
                <PremiumTicketCard
                  key={t.id ?? i}
                  ticket={t}
                  onBuy={(ticket) => setCheckout(ticket)}
                  delay={i * 0.08}
                  isEditor={isEditor}
                />
              ))}
            </div>
          )}

          {/* ── TRUST BAR ── */}
          <TrustBar accent={accent} />
        </div>

        {/* Editor badge */}
        {isEditor && (
          <div
            className="absolute left-4 top-4 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest"
            style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8" }}
          >
            Tickets
          </div>
        )}
      </section>

      {/* ── CHECKOUT MODAL ── */}
      <AnimatePresence>
        {checkout && !isEditor && (
          <CheckoutModal
            ticket={checkout}
            event={event}
            onClose={() => setCheckout(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default PremiumTicketsSection;
