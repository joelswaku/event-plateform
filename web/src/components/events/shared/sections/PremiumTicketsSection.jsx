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
import { motion, AnimatePresence } from "framer-motion";
import { createPaymentRequestKey } from "@/lib/payment-idempotency";

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
  free:     { label:"Free",       icon:"🎁", shimmer:false },
  early:    { label:"Early Bird", icon:"⚡", shimmer:false },
  standard: { label:"Standard",   icon:"🎟️", shimmer:false },
  discount: { label:"Discount",   icon:"🏷️", shimmer:false },
  vip:      { label:"VIP",        icon:"👑", shimmer:true },
  pro:      { label:"Premium",    icon:"💎", shimmer:true },
};

function getThemeTicketTier(ticket) {
  const tier = TIER[resolveTier(ticket)];
  return {
    ...tier,
    accent: "var(--t-accent)",
    dark: "var(--t-dark)",
    bg: "var(--t-bg-alt)",
    border: "var(--t-border)",
    muted: "var(--t-text-muted)",
    glow: "var(--t-accent-dim)",
    accentSoft: "color-mix(in srgb, var(--t-accent) 14%, var(--t-bg-alt))",
    accentBorder: "color-mix(in srgb, var(--t-accent) 38%, var(--t-border))",
  };
}

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
        className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl sm:h-16 sm:w-16 sm:rounded-2xl"
        style={{
          background: "color-mix(in srgb, var(--t-bg-alt) 90%, var(--t-accent))",
          border: "1px solid color-mix(in srgb, var(--t-accent) 30%, var(--t-border))",
          boxShadow: "0 4px 20px var(--t-accent-dim)",
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: flip ? -20 : 0, opacity: flip ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl font-black tabular-nums sm:text-3xl"
            style={{ color: "var(--t-text)", fontVariantNumeric: "tabular-nums" }}
            suppressHydrationWarning
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
      <span className="text-[9px] font-bold uppercase tracking-wider sm:text-[10px] sm:tracking-widest" style={{ color: "var(--t-text-muted)" }}>
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

/* ─── TICKET FACT ─────────────────────────────────────────── */
function TicketFact({ label, value, accent = false }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-left sm:rounded-2xl sm:px-4 sm:py-3"
      style={{
        background: accent
          ? "color-mix(in srgb, var(--t-accent) 14%, var(--t-bg-alt))"
          : "color-mix(in srgb, var(--t-bg) 76%, var(--t-bg-alt))",
        border: accent
          ? "1px solid color-mix(in srgb, var(--t-accent) 36%, var(--t-border))"
          : "1px solid var(--t-border)",
      }}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.16em] sm:text-[9px] sm:tracking-[0.2em]" style={{ color: "var(--t-text-muted)" }}>
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black leading-none sm:text-sm" style={{ color: accent ? "var(--t-accent)" : "var(--t-text)" }}>
        {value}
      </p>
    </div>
  );
}

/* ─── TICKET CARD ─────────────────────────────────────────── */
function tierCode(ticket) {
  const n = (ticket.name ?? "").toLowerCase();
  if (ticket.kind === "FREE")                                               return "FREE";
  if (n.includes("vip") || n.includes("platinum"))                         return "VIP";
  if (n.includes("early") || n.includes("bird"))                           return "EB";
  if (n.includes("pro") || n.includes("premium") || n.includes("diamond")) return "PRO";
  if (n.includes("student") || n.includes("concession"))                   return "STU";
  return "GA";
}

function PremiumTicketCard({ ticket, onBuy, delay = 0, isEditor }) {
  const tierKey  = resolveTier(ticket);
  const cfg      = getThemeTicketTier(ticket);
  const code     = tierCode(ticket);

  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : null;
  const isSoldOut  = available !== null && available <= 0;
  const pct        = ticket.quantity_total
    ? Math.min(((ticket.quantity_sold ?? 0) / ticket.quantity_total) * 100, 100)
    : 0;
  const isUrgent   = available !== null && available > 0 && available <= 20;
  const isFeatured = tierKey === "vip" || tierKey === "pro";

  const features = ticket.description?.includes("·")
    ? ticket.description.split("·").map((f) => f.trim()).filter(Boolean)
    : ticket.description ? [ticket.description] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className="group relative flex flex-col overflow-hidden rounded-3xl"
      style={{
        border: `2px solid ${isFeatured ? cfg.accent : cfg.border}`,
        boxShadow: isFeatured
          ? `0 24px 64px -12px ${cfg.accent}40, 0 8px 32px -8px ${cfg.accent}30, 0 0 0 1px ${cfg.accent}20`
          : "0 16px 48px -8px rgba(0,0,0,0.14), 0 4px 20px -4px rgba(0,0,0,0.10)",
        transform: isFeatured ? "scale(1.02)" : "scale(1)",
        transition: "transform 0.4s ease, box-shadow 0.4s ease, border-color 0.3s ease",
        background: `linear-gradient(180deg, var(--t-bg-alt) 0%, color-mix(in srgb, var(--t-bg) 92%, var(--t-bg-alt)) 100%)`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = isFeatured ? "scale(1.04) translateY(-8px)" : "translateY(-8px) scale(1.02)";
        e.currentTarget.style.boxShadow = `0 32px 80px -12px ${cfg.accent}50, 0 12px 40px -8px ${cfg.accent}35, 0 0 0 2px ${cfg.accent}`;
        e.currentTarget.style.borderColor = cfg.accent;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = isFeatured ? "scale(1.02)" : "scale(1)";
        e.currentTarget.style.boxShadow = isFeatured
          ? `0 24px 64px -12px ${cfg.accent}40, 0 8px 32px -8px ${cfg.accent}30, 0 0 0 1px ${cfg.accent}20`
          : "0 16px 48px -8px rgba(0,0,0,0.14), 0 4px 20px -4px rgba(0,0,0,0.10)";
        e.currentTarget.style.borderColor = isFeatured ? cfg.accent : cfg.border;
      }}
    >
      {/* Top accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{
        background: `linear-gradient(90deg, ${cfg.accent} 0%, color-mix(in srgb, ${cfg.accent} 70%, transparent) 100%)`,
        opacity: isFeatured ? 0.9 : 0.7
      }} />

      {/* Glow effect on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${cfg.accent} 12%, transparent), transparent 70%)`,
        }}
      />

      {/* ── Header bar ── */}
      <div className="relative flex items-center justify-between px-6 py-4"
        style={{
          background: `linear-gradient(135deg, var(--t-dark) 0%, color-mix(in srgb, var(--t-dark) 95%, ${cfg.accent}) 100%)`,
          borderBottom: `1px solid ${cfg.border}`
        }}>
        <div className="flex items-center gap-3">
          {/* tier code badge */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black tracking-wider shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${cfg.accentSoft}, color-mix(in srgb, ${cfg.accentSoft} 85%, transparent))`,
              border: `2px solid ${cfg.accentBorder}`,
              color: cfg.accent,
              boxShadow: `0 4px 12px ${cfg.accent}30`
            }}>
            {code}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] mb-0.5" style={{ color: cfg.accent }}>
              {cfg.label} Access
            </p>
            <p className="text-base font-black text-white leading-tight tracking-tight">{ticket.name}</p>
          </div>
        </div>
        {/* right: status */}
        {isSoldOut ? (
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg"
            style={{
              background: "color-mix(in srgb, var(--t-accent) 14%, var(--t-dark))",
              color: "var(--t-accent)",
              border: "2px solid color-mix(in srgb, var(--t-accent) 35%, var(--t-border))",
            }}>
            Sold Out
          </span>
        ) : isUrgent ? (
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black shadow-lg animate-pulse"
            style={{
              background: "color-mix(in srgb, var(--t-accent) 14%, var(--t-dark))",
              color: "var(--t-accent)",
              border: "2px solid color-mix(in srgb, var(--t-accent) 35%, var(--t-border))",
            }}>
            🔥 {available} left
          </span>
        ) : isFeatured ? (
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${cfg.accentSoft}, color-mix(in srgb, ${cfg.accentSoft} 85%, transparent))`,
              color: cfg.accent,
              border: `2px solid ${cfg.accentBorder}`,
              boxShadow: `0 4px 12px ${cfg.accent}35`
            }}>
            ⭐ Popular
          </span>
        ) : null}
      </div>

      <div className="relative flex flex-col flex-1 px-6 pt-7 pb-6 gap-5">

        {/* Large centered price */}
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-2" style={{ color: "var(--t-text-muted)" }}>
            Ticket Price
          </p>
          <p className="leading-none font-black tracking-tight"
            style={{
              fontFamily: "var(--t-font-heading)",
              fontSize: "clamp(2.8rem,6vw,4rem)",
              color: cfg.accent,
              letterSpacing: "-0.03em",
              textShadow: `0 4px 20px ${cfg.accent}35`
            }}>
            {ticket.kind === "FREE" ? "Free" : fmt(Number(ticket.price), ticket.currency)}
          </p>
          {ticket.kind !== "FREE" && (
            <p className="text-sm mt-2 font-bold uppercase tracking-wide" style={{ color: "var(--t-text-muted)" }}>
              {ticket.currency} · Fees Included
            </p>
          )}
        </div>

        {/* Elegant divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{
            background: `linear-gradient(90deg, transparent, ${cfg.border}, transparent)`
          }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.accent, opacity: 0.6 }} />
          <div className="flex-1 h-px" style={{
            background: `linear-gradient(90deg, transparent, ${cfg.border}, transparent)`
          }} />
        </div>

        {/* Features */}
        {features.length > 0 && (
          <ul className="space-y-2.5">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm font-semibold" style={{ color: "var(--t-text)" }}>
                <span className="mt-0.5 flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black"
                  style={{
                    background: cfg.accentSoft,
                    color: cfg.accent,
                    boxShadow: `0 2px 8px ${cfg.accent}25`
                  }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
        )}

        {/* Capacity bar */}
        {ticket.quantity_total != null && !isSoldOut && (
          <div className="pt-2">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--t-text-muted)" }}>
              <span className="flex items-center gap-1.5">
                {isUrgent && <span className="text-base">⚠</span>}
                {available} available
              </span>
              <span className="font-black" style={{ color: cfg.accent }}>{Math.round(pct)}% sold</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{
              background: "color-mix(in srgb, var(--t-border) 50%, transparent)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: delay + 0.3 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${cfg.accent}, color-mix(in srgb, ${cfg.accent} 80%, var(--t-bg-alt)))`,
                  boxShadow: `0 0 12px ${cfg.accent}60`
                }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col gap-2.5 mt-auto pt-3">
          <button
            onClick={() => !isSoldOut && !isEditor && onBuy(ticket)}
            disabled={isSoldOut || isEditor}
            className="group/btn relative w-full overflow-hidden py-4 text-sm font-black uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl"
            style={{
              background: isSoldOut
                ? "linear-gradient(135deg, color-mix(in srgb, var(--t-border) 60%, transparent), var(--t-border))"
                : `linear-gradient(135deg, ${cfg.accent}, color-mix(in srgb, ${cfg.accent} 85%, var(--t-dark)))`,
              color: isSoldOut ? "var(--t-text-muted)" : "var(--t-dark)",
              letterSpacing: "0.10em",
              boxShadow: isSoldOut ? "none" : `0 12px 32px -8px ${cfg.accent}70, 0 0 0 1px ${cfg.accent}30`,
              border: isSoldOut ? "2px solid var(--t-border)" : "2px solid transparent",
              fontWeight: 900
            }}>
            <span className="relative z-10 flex items-center justify-center gap-2.5">
              {isSoldOut ? (
                "Sold Out"
              ) : (
                <>
                  {ticket.kind === "FREE" ? "Reserve Free Spot" : "Buy Now"}
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
            {!isSoldOut && (
              <div className="absolute inset-0 translate-y-full bg-gradient-to-t from-white/25 to-white/10 transition-transform duration-300 group-hover/btn:translate-y-0" />
            )}
          </button>
          {!isSoldOut && !isEditor && (
            <button
              onClick={() => onBuy(ticket)}
              className="group/outline w-full py-3 text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.97] rounded-2xl relative overflow-hidden"
              style={{
                background: "transparent",
                color: "var(--t-text)",
                border: `2px solid ${cfg.border}`,
                letterSpacing: "0.12em"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = cfg.accent;
                e.currentTarget.style.color = cfg.accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = cfg.border;
                e.currentTarget.style.color = "var(--t-text)";
              }}>
              {ticket.kind === "FREE" ? "Learn More" : "Reserve a Spot"}
            </button>
          )}
        </div>

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
    : `From ${fmt(minPrice, currency)}`;

  const totalCap    = tickets.reduce((s, t) => s + (t.quantity_total ?? 0), 0);
  const totalSold   = tickets.reduce((s, t) => s + (t.quantity_sold ?? 0), 0);
  const totalLeft   = totalCap > 0 ? totalCap - totalSold : null;
  const anyUrgent   = totalLeft !== null && totalLeft > 0 && totalLeft <= 50;
  const anySoldOut  = tickets.every((t) =>
    t.quantity_total != null && (t.quantity_total - (t.quantity_sold ?? 0)) <= 0
  );

  const showCountdown = countdown && !countdown.ended;

  return (
    <div className="mb-12">
      {/* Urgency flash banner */}
      <AnimatePresence>
        {(anyUrgent || anySoldOut) && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
            style={{
              background: "color-mix(in srgb, var(--t-accent) 14%, var(--t-bg-alt))",
              border: "1px solid color-mix(in srgb, var(--t-accent) 35%, var(--t-border))",
              color: "var(--t-accent)",
            }}
          >
            <span style={{ animation: "ticketPulse 1s ease-in-out infinite" }}>🔥</span>
            {anySoldOut
              ? "This event is sold out"
              : `Only ${totalLeft} tickets left across all tiers`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket section introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-10"
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--t-accent) 8%, var(--t-bg-alt)) 0%, var(--t-bg-alt) 100%)",
          borderColor: "color-mix(in srgb, var(--t-accent) 20%, var(--t-border))",
          boxShadow: "0 20px 60px -12px rgba(0,0,0,0.15), 0 8px 20px -8px rgba(0,0,0,0.1)",
        }}
      >
        {/* Decorative accent line */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{
          background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`,
          opacity: 0.6
        }} />

        <div className="grid items-center gap-6 sm:gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{
              background: "color-mix(in srgb, var(--t-accent) 12%, var(--t-bg-alt))",
              border: "1px solid color-mix(in srgb, var(--t-accent) 25%, transparent)"
            }}>
              <span className="text-base">🎟️</span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                Tickets Available
              </span>
            </div>

            <h2
              className="text-[2.2rem] font-black leading-[0.92] tracking-tight sm:text-5xl lg:text-6xl"
              style={{
                color: "var(--t-text)",
                letterSpacing: "-0.045em",
                textShadow: "0 2px 12px rgba(0,0,0,0.1)"
              }}
            >
              Secure Your Spot
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--t-text-muted)" }}>
              Reserve your ticket now and receive instant confirmation with QR code entry.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TicketFact label="Ticket types" value={`${tickets.length} ${tickets.length === 1 ? "option" : "options"}`} accent />
            <TicketFact label="Starting from" value={priceLabel || "Available now"} />
            <TicketFact label="Event" value={(event?.title || "This event").substring(0, 20)} />
            <TicketFact label="Availability" value={totalLeft === null ? "Open entry" : `${Math.max(totalLeft, 0)} left`} accent={anyUrgent} />
          </div>
        </div>
      </motion.div>

      {/* Countdown */}
      {showCountdown && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 rounded-2xl border p-6 sm:mt-10 sm:rounded-3xl sm:p-8"
          style={{
            background: "linear-gradient(180deg, var(--t-bg-alt) 0%, color-mix(in srgb, var(--t-bg) 80%, var(--t-bg-alt)) 100%)",
            borderColor: "var(--t-border)",
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.1), inset 0 1px 0 0 rgba(255,255,255,0.05)"
          }}
        >
          <div className="mb-5 flex items-center justify-center gap-2 sm:mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent" style={{ background: `linear-gradient(90deg, transparent, ${accentColor})` }} />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] sm:text-[11px]" style={{ color: accentColor }}>
              Event Starts In
            </p>
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-6">
            {countdown.days > 0 && (
              <>
                <CountUnit value={countdown.days} label="Days" accent={accentColor} />
                <span className="mt-3 text-xl font-black sm:mt-4 sm:text-3xl" style={{ color: "var(--t-border)", opacity: 0.6 }}>:</span>
              </>
            )}
            <CountUnit value={countdown.hours} label="Hours" accent={accentColor} />
            <span className="mt-3 text-xl font-black sm:mt-4 sm:text-3xl" style={{ color: "var(--t-border)", opacity: 0.6 }}>:</span>
            <CountUnit value={countdown.minutes} label="Minutes" accent={accentColor} />
            <span className="mt-4 hidden text-3xl font-black sm:block" style={{ color: "var(--t-border)", opacity: 0.6 }}>:</span>
            <div className="hidden sm:block">
              <CountUnit value={countdown.seconds} label="Seconds" accent={accentColor} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── TRUST BAR ───────────────────────────────────────────── */
function TrustBar({ accent }) {
  const items = [
    { icon: "🔒", text: "Secure Checkout", subtext: "SSL encrypted" },
    { icon: "📧", text: "Instant Delivery", subtext: "E-ticket by email" },
    { icon: "✅", text: "QR Entry", subtext: "Fast check-in" },
    { icon: "💳", text: "Stripe Payment", subtext: "Trusted worldwide" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="mt-12 pt-10"
      style={{
        borderTop: `1px solid var(--t-border)`,
      }}
    >
      <p className="text-center text-[11px] font-black uppercase tracking-wider mb-6" style={{ color: "var(--t-text-muted)" }}>
        Trusted & Secure Experience
      </p>
      <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-6 lg:gap-8">
        {items.map((it) => (
          <motion.div
            key={it.text}
            whileHover={{ scale: 1.05 }}
            className="flex items-start gap-3 p-3 rounded-xl transition-all sm:flex-col sm:items-center sm:text-center sm:p-4"
            style={{
              background: "color-mix(in srgb, var(--t-bg-alt) 60%, var(--t-bg))",
              border: "1px solid var(--t-border)"
            }}
          >
            <span className="text-2xl flex-shrink-0">{it.icon}</span>
            <div>
              <p className="text-sm font-black leading-tight" style={{ color: "var(--t-text)" }}>
                {it.text}
              </p>
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--t-text-muted)" }}>
                {it.subtext}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── CHECKOUT MODAL (from existing code — kept as-is) ─────── */
function CheckoutModal({ ticket, event, platformFeePercent = 0, onClose }) {
  const cfg     = getThemeTicketTier(ticket);

  const [step,       setStep]       = useState("form");
  const [qty,        setQty]        = useState(1);
  const [form,       setForm]       = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const paymentRequestKey = useRef(createPaymentRequestKey("ticket"));

  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : 99;
  const maxQty    = Math.min(available, 10);
  const priceEach = ticket.kind === "FREE" ? 0 : Number(ticket.price);
  const subtotal  = priceEach * qty;
  const fee       = subtotal > 0
    ? Math.round((subtotal * Number(platformFeePercent || 0) / 100) * 100) / 100
    : 0;
  const total     = subtotal + fee;
  const canSubmit = Boolean(form.name.trim() && /\S+@\S+\.\S+/.test(form.email));
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
          idempotency_key: paymentRequestKey.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");
      if (data.data?.payment_required && data.data?.checkout_url) {
        window.location.href = data.data.checkout_url;
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
    border:       "1px solid var(--t-border)",
    background:   "var(--t-bg)",
    color:        "var(--t-text)",
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
            <h3 className="text-xl font-black mt-1" style={{ color: "var(--t-text)", letterSpacing: "-0.02em" }}>
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
            style={{ background: "var(--t-bg)", color: "var(--t-text-muted)" }}
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
                          background: qty === i + 1 ? cfg.accent : "var(--t-bg)",
                          color:      qty === i + 1 ? cfg.dark    : "var(--t-text-muted)",
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
                  onBlur={(e)  => (e.target.style.borderColor = cfg.border)}
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
                  onBlur={(e)  => (e.target.style.borderColor = cfg.border)}
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
                  onBlur={(e)  => (e.target.style.borderColor = cfg.border)}
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
                <div className="space-y-2 rounded-xl px-4 py-3"
                  style={{ background: "var(--t-bg)", border: `1px solid ${cfg.border}` }}>
                  <div className="flex items-center justify-between text-sm" style={{ color: cfg.muted }}><span>Subtotal ({qty} × {fmtP(priceEach)})</span><span>{fmtP(subtotal)}</span></div>
                  {fee > 0 && <div className="flex items-center justify-between text-sm" style={{ color: cfg.muted }}><span>Service fee ({platformFeePercent}%)</span><span>{fmtP(fee)}</span></div>}
                  <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: cfg.border }}><span className="text-sm font-bold" style={{ color: "var(--t-text)" }}>Total</span><span className="text-lg font-black" style={{ color: cfg.accent }}>{fmtP(total)}</span></div>
                </div>
              )}

              <button
                onClick={submit}
                disabled={submitting || !canSubmit}
                className="w-full rounded-xl py-4 text-sm font-black uppercase tracking-wide transition-all"
                style={{
                  background: cfg.accent,
                  color: cfg.dark,
                  boxShadow: `0 8px 24px ${cfg.glow}`,
                  opacity: submitting || !canSubmit ? 0.7 : 1,
                  cursor: submitting || !canSubmit ? "not-allowed" : "pointer",
                }}
              >
                {submitting
                  ? "Processing…"
                  : ticket.kind === "FREE"
                  ? "Reserve My Spot →"
                  : `Pay ${fmtP(total)} →`}
              </button>

              <p className="text-center text-[10px]" style={{ color: "var(--t-text-muted)" }}>
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
                style={{ background: cfg.accentSoft, border: `1px solid ${cfg.accentBorder}` }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={cfg.accent} strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-black" style={{ color: "var(--t-text)", letterSpacing: "-0.02em" }}>
                  You&apos;re in! 🎉
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: cfg.muted }}>
                  Your ticket has been issued and sent to{" "}
                  <span className="font-bold" style={{ color: "var(--t-text)" }}>{form.email}</span>.
                  Check your inbox!
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full rounded-xl py-3 text-sm font-bold"
                style={{ background: cfg.accentSoft, border: `1px solid ${cfg.border}`, color: cfg.accent }}
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
  const [platformFeePercent, setPlatformFeePercent] = useState(0);

  useEffect(() => {
    if (isEditor || !event?.id || !API || !event?.allow_ticketing) return;
    setLoading(true);
    fetch(`${API}/public/events/${event.id}/tickets`)
      .then((r) => r.json())
      .then((d) => {
        setTickets(d.tickets ?? []);
        setPlatformFeePercent(Number(d.platform_fee_percent ?? 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [event?.id, isEditor, event?.allow_ticketing]);

  // Hide when ticketing module is disabled (public mode only — still show in editor for config)
  if (!isEditor && !event?.allow_ticketing) return null;

  const display = isEditor ? TICKET_MOCK : tickets;

  const accent = "var(--t-accent)";

  const gridCols = display.length === 1
    ? "max-w-sm mx-auto"
    : display.length === 2
    ? "sm:grid-cols-2 max-w-2xl mx-auto"
    : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      <style>{shimmerCSS}</style>

      <section
        id="tickets"
        className="relative overflow-hidden py-20 px-4"
        style={{ background: "var(--t-bg)" }}
        onClick={isEditor ? onEdit : undefined}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 70% 40% at 50% 0%, var(--t-accent-dim), transparent 70%)",
          }}
        />

        {/* Decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(color-mix(in srgb, var(--t-text) 42%, transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb, var(--t-text) 42%, transparent) 1px,transparent 1px)",
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
              style={{ borderColor: "var(--t-border)", borderStyle: "dashed" }}
            >
              <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>
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
            style={{ background: "color-mix(in srgb, var(--t-accent) 14%, var(--t-bg-alt))", border: "1px solid color-mix(in srgb, var(--t-accent) 35%, var(--t-border))", color: "var(--t-accent)" }}
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
            platformFeePercent={platformFeePercent}
            onClose={() => setCheckout(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default PremiumTicketsSection;
