

"use client";

/**
 * /my-tickets — Unified ticket portal
 *
 * Auth flow:
 *   1. Check useAuthStore — if the user is logged in (JWT cookie), auto-load
 *      their tickets using their verified email. No gate shown.
 *   2. If not logged in — show the email-lookup gate (guest checkout flow).
 *   3. If ?email= param in URL (from confirmation email link) — auto-search.
 *
 * Security:
 *   - Registered users: server verifies JWT, no email param needed
 *   - Guests: email + optional ticket number lookup, rate-limited server-side
 *   - QR tokens never in list response — fetched on demand per ticket
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams }                             from "next/navigation";
import { motion, AnimatePresence }                     from "framer-motion";
import { useAuthStore }                                from "@/store/auth.store";
import { api }                                         from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─────────────────────────────────────────────────────────────────────────────
// Ticket theme system — 5 unique visual personalities
// ─────────────────────────────────────────────────────────────────────────────

const THEMES = [
  { bg: "linear-gradient(135deg,#1a1535 0%,#0f0d1f 100%)", accent: "#7c6ff7", accent2: "#4f46e5", text: "#c4bfff", muted: "rgba(196,191,255,0.45)", border: "rgba(124,111,247,0.22)", dateBg: "rgba(124,111,247,0.13)", stub: "rgba(124,111,247,0.07)", glow: "rgba(124,111,247,0.18)", pattern: "dots" },
  { bg: "linear-gradient(135deg,#1f1505 0%,#110c02 100%)", accent: "#e8a000", accent2: "#b87800", text: "#ffd060", muted: "rgba(255,208,96,0.45)",  border: "rgba(232,160,0,0.22)",   dateBg: "rgba(232,160,0,0.11)",   stub: "rgba(232,160,0,0.06)",   glow: "rgba(232,160,0,0.2)",   pattern: "lines" },
  { bg: "linear-gradient(135deg,#071a18 0%,#030f0e 100%)", accent: "#2dd4bf", accent2: "#0d9488", text: "#7fffd4", muted: "rgba(127,255,212,0.45)", border: "rgba(45,212,191,0.22)",  dateBg: "rgba(45,212,191,0.11)", stub: "rgba(45,212,191,0.06)", glow: "rgba(45,212,191,0.18)", pattern: "grid" },
  { bg: "linear-gradient(135deg,#1f0810 0%,#110406 100%)", accent: "#f43f5e", accent2: "#be123c", text: "#fda4af", muted: "rgba(253,164,175,0.45)", border: "rgba(244,63,94,0.22)",  dateBg: "rgba(244,63,94,0.11)",  stub: "rgba(244,63,94,0.06)",  glow: "rgba(244,63,94,0.18)",  pattern: "diagonal" },
  { bg: "linear-gradient(135deg,#04111f 0%,#020a14 100%)", accent: "#38bdf8", accent2: "#0284c7", text: "#7dd3fc", muted: "rgba(125,211,252,0.45)", border: "rgba(56,189,248,0.22)",  dateBg: "rgba(56,189,248,0.11)", stub: "rgba(56,189,248,0.06)", glow: "rgba(56,189,248,0.18)", pattern: "waves" },
];

function resolveTheme(ticket, idx) {
  const n = (ticket.ticket_type_name || "").toLowerCase();
  if (n.includes("vip") || n.includes("premium"))    return THEMES[1];
  if (n.includes("backstage") || n.includes("rose")) return THEMES[3];
  if (n.includes("early"))                           return THEMES[2];
  if (n.includes("student") || n.includes("group"))  return THEMES[4];
  return THEMES[idx % THEMES.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG patterns
// ─────────────────────────────────────────────────────────────────────────────

function BgPattern({ pattern, color }) {
  const base = "absolute inset-0 w-full h-full opacity-[0.038]";
  if (pattern === "lines")
    return <svg className={base} xmlns="http://www.w3.org/2000/svg"><defs><pattern id="pl" width="24" height="24" patternUnits="userSpaceOnUse"><line x1="0" y1="24" x2="24" y2="0" stroke={color} strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#pl)"/></svg>;
  if (pattern === "grid")
    return <svg className={base} xmlns="http://www.w3.org/2000/svg"><defs><pattern id="pg" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0L0 0 0 20" fill="none" stroke={color} strokeWidth="0.8"/></pattern></defs><rect width="100%" height="100%" fill="url(#pg)"/></svg>;
  if (pattern === "diagonal")
    return <svg className={base} xmlns="http://www.w3.org/2000/svg"><defs><pattern id="pd" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 12L12 0" stroke={color} strokeWidth="1" fill="none"/></pattern></defs><rect width="100%" height="100%" fill="url(#pd)"/></svg>;
  if (pattern === "waves")
    return <svg className={base} xmlns="http://www.w3.org/2000/svg"><defs><pattern id="pw" width="40" height="12" patternUnits="userSpaceOnUse"><path d="M0 6Q10 0 20 6Q30 12 40 6" fill="none" stroke={color} strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#pw)"/></svg>;
  return <svg className={base} xmlns="http://www.w3.org/2000/svg"><defs><pattern id="pp" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill={color}/></pattern></defs><rect width="100%" height="100%" fill="url(#pp)"/></svg>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return { day: "—", month: "—", year: "", full: "TBA", time: "" };
  const dt = new Date(d);
  return {
    day:   dt.toLocaleDateString("en-US", { day: "2-digit" }),
    month: dt.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    year:  String(dt.getFullYear()),
    full:  dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    time:  dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

function fmtShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isUpcoming(d) {
  return !d || new Date(d) >= new Date();
}

function partitionTickets(tickets) {
  const active = [], past = [];
  for (const t of tickets) (isUpcoming(t.starts_at_local) ? active : past).push(t);
  return { active, past };
}

function initials(email = "") {
  const p = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : email.slice(0, 2).toUpperCase();
}

function avatarGrad(email = "") {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) & 0xffffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg,hsl(${hue},55%,32%),hsl(${(hue + 40) % 360},65%,22%))`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status chip
// ─────────────────────────────────────────────────────────────────────────────

const STATUS = {
  ACTIVE:  { label: "Active",     c: "#34d399", bg: "rgba(52,211,153,0.11)",  b: "rgba(52,211,153,0.22)"  },
  USED:    { label: "Checked In", c: "#818cf8", bg: "rgba(129,140,248,0.11)", b: "rgba(129,140,248,0.22)" },
  EXPIRED: { label: "Expired",    c: "#94a3b8", bg: "rgba(148,163,184,0.09)", b: "rgba(148,163,184,0.18)" },
  REVOKED: { label: "Cancelled",  c: "#f87171", bg: "rgba(248,113,113,0.09)", b: "rgba(248,113,113,0.18)" },
};

function StatusChip({ status }) {
  const s = STATUS[status] ?? STATUS.ACTIVE;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
      style={{ background: s.bg, border: `1px solid ${s.b}`, color: s.c }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.c }} />
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QR Modal — fetches token on demand only when user clicks "View QR"
// ─────────────────────────────────────────────────────────────────────────────

function QrModal({ ticket, email, theme, onClose }) {
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const date = fmtDate(ticket.starts_at_local);

  useEffect(() => {
    let ok = true;
    async function load() {
      try {
        const res  = await fetch(`${API}/public/tickets/${ticket.id}/qr-token?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (!ok) return;
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load QR");
        setToken(data.qr_token);
      } catch (e) { if (ok) setError(e.message); }
      finally     { if (ok) setLoading(false); }
    }
    load();
    return () => { ok = false; };
  }, [ticket.id, email]);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(14px)" }}
      onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl"
        style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
        onClick={e => e.stopPropagation()}>
        <BgPattern pattern={theme.pattern} color={theme.accent} />
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${theme.accent},transparent)` }} />

        <div className="relative px-6 pt-6 pb-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: theme.accent }}>{ticket.ticket_type_name || "General Admission"}</p>
          <h3 className="text-lg font-black leading-tight" style={{ color: theme.text }}>{ticket.event_title}</h3>
          <p className="text-xs mt-1" style={{ color: theme.muted }}>{date.full}{date.time ? ` · ${date.time}` : ""}</p>
        </div>

        {/* Perforation */}
        <div className="relative flex items-center px-3 my-1">
          <div className="absolute -left-3 h-5 w-5 rounded-full" style={{ background: "#07070f" }} />
          <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: `${theme.accent}28` }} />
          <div className="absolute -right-3 h-5 w-5 rounded-full" style={{ background: "#07070f" }} />
        </div>

        <div className="relative flex flex-col items-center px-6 py-5 gap-3">
          {loading ? (
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
              <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: theme.accent }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : error ? (
            <div className="h-48 w-48 flex items-center justify-center text-center">
              <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>
            </div>
          ) : (
            <div className="rounded-2xl p-3 bg-white" style={{ boxShadow: `0 0 40px ${theme.glow}` }}>
              <img src={`${API}/public/tickets/qr/${token}`} alt="QR Code" className="w-44 h-44 object-contain" />
            </div>
          )}
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-widest" style={{ color: theme.muted }}>Ticket</p>
            <p className="text-sm font-bold font-mono mt-0.5" style={{ color: theme.accent }}>{ticket.ticket_number}</p>
          </div>
          <p className="text-[10px] text-center" style={{ color: theme.muted }}>Show this at the entrance</p>
        </div>

        <div className="relative mx-4 mb-4 rounded-xl px-4 py-2.5 text-center" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${theme.border}` }}>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: theme.muted }}>🔒 Do not share · For your eyes only</p>
        </div>

        <div className="relative grid grid-cols-2 gap-3 px-6 pb-6">
          {token && (
            <a href={`${API}/public/tickets/qr/${token}`} download={`ticket-${ticket.ticket_number}.png`}
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold"
              style={{ background: `${theme.accent}18`, border: `1px solid ${theme.border}`, color: theme.accent }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Save PNG
            </a>
          )}
          <button onClick={onClose} className="rounded-xl py-3 text-xs font-bold col-span-1"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ticket stub card
// ─────────────────────────────────────────────────────────────────────────────

function TicketStub({ ticket, index, email, onShowQr, dimmed }) {
  const theme = resolveTheme(ticket, index);
  const date  = fmtDate(ticket.starts_at_local);
  const venue = [ticket.venue_name, ticket.venue_city, ticket.venue_country].filter(Boolean).join(", ") || "Venue TBA";

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 22, stiffness: 240, delay: index * 0.06 }}
      className="relative overflow-hidden"
      style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: "22px", opacity: dimmed ? 0.55 : 1 }}>
      <BgPattern pattern={theme.pattern} color={theme.accent} />
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${theme.accent}70,transparent)` }} />
      <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full blur-3xl pointer-events-none" style={{ background: theme.glow }} />

      <div className="relative flex">
        {/* Date column */}
        <div className="flex flex-col items-center justify-center px-4 py-6 shrink-0 gap-0.5"
          style={{ background: theme.dateBg, borderRight: `2px dashed ${theme.accent}28`, minWidth: "76px" }}>
          <span className="text-[28px] font-black leading-none" style={{ color: theme.accent }}>{date.day}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${theme.accent}99` }}>{date.month}</span>
          <span className="text-[10px] mt-1" style={{ color: theme.muted }}>{date.year}</span>
          {date.time && (
            <><div className="h-px w-8 my-1.5" style={{ background: `${theme.accent}28` }} />
            <span className="text-[9px] font-mono" style={{ color: theme.muted }}>{date.time}</span></>
          )}
        </div>

        {/* Notch */}
        <div className="absolute left-[72px] top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full z-10" style={{ background: "#07070f" }} />

        {/* Info */}
        <div className="flex-1 px-5 py-5 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: theme.accent }}>
            {ticket.ticket_type_name || "General Admission"}
          </p>
          <h3 className="text-[15px] font-black leading-tight truncate" style={{ color: theme.text }}>{ticket.event_title}</h3>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-start gap-2">
              <svg className="shrink-0 mt-0.5" width="10" height="10" fill="none" stroke={theme.muted} strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <p className="text-[11px] leading-tight truncate" style={{ color: theme.muted }}>{venue}</p>
            </div>
            <div className="flex items-center gap-2">
              <svg className="shrink-0" width="10" height="10" fill="none" stroke={theme.muted} strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <p className="text-[10px] font-mono" style={{ color: theme.muted }}>{ticket.ticket_number}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
            <StatusChip status={ticket.qr_status} />
            {ticket.qr_status !== "REVOKED" && (
              <button onClick={() => onShowQr({ ticket, theme })}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition active:scale-95 shrink-0"
                style={{ background: `${theme.accent}18`, border: `1px solid ${theme.accent}30`, color: theme.accent }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h3v3h-3v-3h-3z"/></svg>
                View QR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative mx-4 border-t border-dashed" style={{ borderColor: `${theme.accent}18` }} />
      <div className="relative flex items-center justify-between px-5 py-2.5" style={{ background: theme.stub }}>
        <p className="text-[9px] font-mono truncate max-w-[55%]" style={{ color: theme.muted }}>{ticket.buyer_email}</p>
        <p className="text-[9px] font-mono" style={{ color: theme.muted }}>{fmtShort(ticket.issued_at)}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton / Empty
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton() {
  return <div className="overflow-hidden rounded-[22px] animate-pulse" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.05)", height: 190 }} />;
}

function Empty({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-2xl text-center"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "rgba(124,111,247,0.08)", border: "1px solid rgba(124,111,247,0.15)" }}>
        <svg width="24" height="24" fill="none" stroke="#7c6ff7" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>
      </div>
      <p className="text-sm font-bold text-white mb-1">{label}</p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Tickets you purchase will appear here</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

function Settings({ email, isRegistered, onLogout }) {
  const grad = avatarGrad(email);
  const ini  = initials(email);
  return (
    <div className="space-y-4 max-w-md">
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white" style={{ background: grad }}>{ini}</div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              {isRegistered ? "Signed in as" : "Viewing tickets for"}
            </p>
            <p className="text-sm font-bold text-white truncate">{email}</p>
            {isRegistered && (
              <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: "#34d399" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Registered account
              </span>
            )}
          </div>
        </div>
        <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button onClick={onLogout} className="flex items-center gap-2 text-xs font-bold" style={{ color: "#f87171" }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {isRegistered ? "Sign out" : "Search different email"}
          </button>
        </div>
      </div>
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Security</p>
        <div className="space-y-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          <p>🔒 QR codes are generated on demand and never stored in your browser.</p>
          <p>🛡 Each ticket carries a cryptographic signature to prevent forgery.</p>
          <p>📧 Tickets are bound to your email and cannot be transferred.</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Guest email-lookup gate (for non-registered users only)
// ─────────────────────────────────────────────────────────────────────────────

function LookupGate({ onAuthenticated, prefillEmail = "" }) {
  const [email,   setEmail]   = useState(prefillEmail);
  const [tn,      setTn]      = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const q = email.trim().toLowerCase();
    if (!q || !q.includes("@")) { setError("Enter a valid email address"); return; }
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams({ email: q });
      if (tn.trim()) params.set("ticket_number", tn.trim().toUpperCase());
      const res  = await fetch(`${API}/public/my-tickets?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lookup failed");
      onAuthenticated({ email: q, tickets: data.tickets ?? [], isRegistered: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20" style={{ background: "#07070f" }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 55% 45% at 50% -5%,rgba(124,111,247,0.11),transparent)" }} />

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px]">
        <div className="overflow-hidden rounded-3xl" style={{ background: "#111120", border: "1px solid rgba(124,111,247,0.2)" }}>
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg,transparent,#7c6ff7,transparent)" }} />

          <div className="px-8 pt-8 pb-6">
            <div className="flex justify-center mb-7">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "rgba(124,111,247,0.12)", border: "1px solid rgba(124,111,247,0.25)" }}>
                <svg width="28" height="28" fill="none" stroke="#7c6ff7" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>
              </div>
            </div>

            <h1 className="text-2xl font-black text-white text-center tracking-tight">My Tickets</h1>
            <p className="text-sm text-center mt-2 mb-7" style={{ color: "rgba(255,255,255,0.35)" }}>
              Enter your checkout email to see your tickets
            </p>

            {/* Sign in link for registered users */}
            <a href="/login?redirect=/my-tickets"
              className="flex items-center justify-center gap-2 w-full rounded-xl py-3 mb-5 text-sm font-bold transition"
              style={{ background: "rgba(124,111,247,0.1)", border: "1px solid rgba(124,111,247,0.25)", color: "#9b8df9" }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Sign in with your account
            </a>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>or continue as guest</span>
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(124,111,247,0.55)")}
                  onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Ticket Number <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "rgba(255,255,255,0.18)" }}>(optional)</span>
                </label>
                <input type="text" value={tn} onChange={e => setTn(e.target.value.toUpperCase())} placeholder="TKT-001234"
                  className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(124,111,247,0.55)")}
                  onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="text-xs px-4 py-3 rounded-xl"
                    style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#fca5a5" }}>
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading}
                className="w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-[0.1em] transition disabled:opacity-50 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#5b21b6,#4f46e5)", color: "#fff", boxShadow: "0 8px 24px rgba(91,33,182,0.28)" }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2"><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Searching…</span>
                  : "Find My Tickets"}
              </button>
            </form>
          </div>
          <div className="px-8 pb-6 text-center">
            <p className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.12)" }}>🔒 Secured · Tickets tied to your email</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────────────────────────────────────

const NAV = [
  { id: "active",   label: "My Tickets",  icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg> },
  { id: "past",     label: "Past Events", icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { id: "settings", label: "Settings",    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main portal shell
// ─────────────────────────────────────────────────────────────────────────────

function Portal({ email, isRegistered, initialTickets, onLogout }) {
  const [tab,       setTab]       = useState("active");
  const [tickets,   setTickets]   = useState(initialTickets);
  const [loading,   setLoading]   = useState(false);
  const [qrState,   setQrState]   = useState(null);
  const [mobileNav, setMobileNav] = useState(false);

  const grad = avatarGrad(email);
  const ini  = initials(email);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/public/my-tickets?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) setTickets(data.tickets ?? []);
    } catch {}
    finally { setLoading(false); }
  }, [email]);

  useEffect(() => { refresh(); }, [refresh]);

  const { active, past } = partitionTickets(tickets);
  const current = tab === "active" ? active : tab === "past" ? past : [];

  return (
    <div className="min-h-screen flex" style={{ background: "#07070f" }}>
      <style>{`* { box-sizing: border-box; } input { color-scheme: dark; } input::placeholder { color: rgba(255,255,255,0.2); } ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }`}</style>
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 40% 60% at 0% 50%,rgba(124,111,247,0.04),transparent)" }} />

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen"
        style={{ background: "rgba(255,255,255,0.018)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="px-4 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white" style={{ background: grad }}>{ini}</div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">{email.split("@")[0]}</p>
              <p className="text-[9px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                {isRegistered
                  ? <span style={{ color: "#34d399" }}>● Registered</span>
                  : <span>Guest</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Stats pills */}
        <div className="px-4 pb-4 flex gap-2">
          <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}>
            <p className="text-base font-black" style={{ color: "#34d399" }}>{active.length}</p>
            <p className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(52,211,153,0.6)" }}>Active</p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.12)" }}>
            <p className="text-base font-black" style={{ color: "#94a3b8" }}>{past.length}</p>
            <p className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.5)" }}>Past</p>
          </div>
        </div>
        <div className="mx-4 h-px mb-3" style={{ background: "rgba(255,255,255,0.05)" }} />

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(item => {
            const isAct = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition"
                style={{ background: isAct ? "rgba(124,111,247,0.12)" : "transparent", color: isAct ? "#9b8df9" : "rgba(255,255,255,0.35)", border: isAct ? "1px solid rgba(124,111,247,0.2)" : "1px solid transparent" }}>
                <span style={{ color: isAct ? "#9b8df9" : "rgba(255,255,255,0.25)" }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout / Sign in */}
        <div className="p-4 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {isRegistered ? (
            <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold" style={{ color: "rgba(255,255,255,0.25)" }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign out
            </button>
          ) : (
            <a href="/login?redirect=/my-tickets"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition"
              style={{ background: "rgba(124,111,247,0.08)", color: "#9b8df9", border: "1px solid rgba(124,111,247,0.18)" }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Sign in for full access
            </a>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-5 py-3.5"
          style={{ background: "rgba(7,7,15,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <button className="lg:hidden p-1.5 -ml-1 rounded-lg" onClick={() => setMobileNav(true)} style={{ color: "rgba(255,255,255,0.4)" }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h2 className="flex-1 text-sm font-black text-white">{NAV.find(n => n.id === tab)?.label}</h2>
          <div className="lg:hidden flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-white shrink-0" style={{ background: grad }}>{ini}</div>
          <button onClick={refresh}
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className={loading ? "animate-spin" : ""}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {loading ? "…" : "Refresh"}
          </button>
        </header>

        <div className="flex-1 p-5 lg:p-8 max-w-2xl w-full mx-auto lg:mx-0">
          <AnimatePresence mode="wait">
            {tab === "settings" ? (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Settings email={email} isRegistered={isRegistered} onLogout={onLogout} />
              </motion.div>
            ) : (
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h3 className="text-xl font-black text-white">{tab === "active" ? "Active Tickets" : "Past Events"}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {tab === "active" ? `${active.length} upcoming ticket${active.length !== 1 ? "s" : ""}` : `${past.length} past event${past.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
                {loading
                  ? <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} />)}</div>
                  : current.length === 0
                  ? <Empty label={tab === "active" ? "No upcoming tickets" : "No past events"} />
                  : <div className="space-y-5">{current.map((t, i) => <TicketStub key={t.id} ticket={t} index={i} email={email} onShowQr={setQrState} dimmed={tab === "past"} />)}</div>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.7)" }}
              onClick={() => setMobileNav(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col lg:hidden"
              style={{ background: "#0f0e1a", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3 px-5 pt-6 pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white" style={{ background: grad }}>{ini}</div>
                <p className="flex-1 text-sm font-black text-white truncate">{email.split("@")[0]}</p>
                <button onClick={() => setMobileNav(false)} style={{ color: "rgba(255,255,255,0.3)" }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <nav className="flex-1 px-3 space-y-0.5">
                {NAV.map(item => (
                  <button key={item.id} onClick={() => { setTab(item.id); setMobileNav(false); }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition"
                    style={{ background: tab === item.id ? "rgba(124,111,247,0.12)" : "transparent", color: tab === item.id ? "#9b8df9" : "rgba(255,255,255,0.35)" }}>
                    <span style={{ color: tab === item.id ? "#9b8df9" : "rgba(255,255,255,0.25)" }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {qrState && <QrModal ticket={qrState.ticket} email={email} theme={qrState.theme} onClose={() => setQrState(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root — detects auth state, then decides which path to take
// ─────────────────────────────────────────────────────────────────────────────

function Content() {
  const searchParams = useSearchParams();
  const initEmail    = searchParams.get("email")         ?? "";
  const initTn       = searchParams.get("ticket_number") ?? "";

  // Zustand auth store
  const { user, isAuthenticated, isHydrated, fetchMe, logout } = useAuthStore();

  const [session, setSession] = useState(null);  // { email, tickets, isRegistered }
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function boot() {
      try {
        // 1. Try to restore the JWT session
        const me = await fetchMe();

        if (me?.email) {
          // Registered user — fetch tickets using their verified email
          const params = new URLSearchParams({ email: me.email });
          if (initTn) params.set("ticket_number", initTn);
          const res  = await fetch(`${API}/public/my-tickets?${params}`);
          const data = await res.json();
          setSession({ email: me.email, tickets: data.tickets ?? [], isRegistered: true });
          return;
        }

        // 2. Not logged in — try URL email param (guest confirmation email link)
        if (initEmail) {
          const params = new URLSearchParams({ email: initEmail });
          if (initTn) params.set("ticket_number", initTn);
          const res  = await fetch(`${API}/public/my-tickets?${params}`);
          const data = await res.json();
          if (data.success) {
            setSession({ email: initEmail.toLowerCase(), tickets: data.tickets ?? [], isRegistered: false });
          }
        }
      } catch {
        // silently fall through to the gate
      } finally {
        setBooting(false);
      }
    }
    boot();
  }, []); // eslint-disable-line

  function handleLogout() {
    if (session?.isRegistered) logout();
    setSession(null);
  }

  // Loading
  if (!isHydrated || booting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070f" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(124,111,247,0.1)", border: "1px solid rgba(124,111,247,0.2)" }}>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" style={{ color: "#7c6ff7" }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Loading your tickets…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LookupGate onAuthenticated={setSession} prefillEmail={initEmail} />;
  }

  return (
    <Portal
      email={session.email}
      isRegistered={session.isRegistered}
      initialTickets={session.tickets}
      onLogout={handleLogout}
    />
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070f" }}>
        <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: "rgba(124,111,247,0.4)" }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    }>
      <Content />
    </Suspense>
  );
}























// "use client";

// import { useState, useEffect, useCallback, Suspense, useRef } from "react";
// import { useSearchParams } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";

// const API = process.env.NEXT_PUBLIC_API_URL;

// // ─────────────────────────────────────────────────────────────────────────────
// // Ticket "personality" system — each ticket gets a unique design DNA
// // based on its type name, kind, price, and index position.
// // ─────────────────────────────────────────────────────────────────────────────

// const TICKET_THEMES = [
//   // 0 — Midnight Indigo (General)
//   {
//     bg:        "linear-gradient(135deg, #1a1535 0%, #0f0d1f 100%)",
//     accent:    "#7c6ff7",
//     accent2:   "#4f46e5",
//     text:      "#c4bfff",
//     muted:     "rgba(196,191,255,0.4)",
//     border:    "rgba(124,111,247,0.25)",
//     dateBg:    "rgba(124,111,247,0.15)",
//     stub:      "rgba(124,111,247,0.08)",
//     glow:      "rgba(124,111,247,0.2)",
//     pattern:   "dots",
//   },
//   // 1 — Ember Gold (VIP)
//   {
//     bg:        "linear-gradient(135deg, #1f1505 0%, #110c02 100%)",
//     accent:    "#f0a500",
//     accent2:   "#c97f00",
//     text:      "#ffd970",
//     muted:     "rgba(255,217,112,0.4)",
//     border:    "rgba(240,165,0,0.3)",
//     dateBg:    "rgba(240,165,0,0.12)",
//     stub:      "rgba(240,165,0,0.06)",
//     glow:      "rgba(240,165,0,0.25)",
//     pattern:   "lines",
//   },
//   // 2 — Teal Jade (Early Bird)
//   {
//     bg:        "linear-gradient(135deg, #071a18 0%, #030f0e 100%)",
//     accent:    "#2dd4bf",
//     accent2:   "#0d9488",
//     text:      "#7fffd4",
//     muted:     "rgba(127,255,212,0.4)",
//     border:    "rgba(45,212,191,0.25)",
//     dateBg:    "rgba(45,212,191,0.12)",
//     stub:      "rgba(45,212,191,0.06)",
//     glow:      "rgba(45,212,191,0.2)",
//     pattern:   "grid",
//   },
//   // 3 — Rose Crimson (Premium / Backstage)
//   {
//     bg:        "linear-gradient(135deg, #1f0810 0%, #110406 100%)",
//     accent:    "#f43f5e",
//     accent2:   "#be123c",
//     text:      "#fda4af",
//     muted:     "rgba(253,164,175,0.4)",
//     border:    "rgba(244,63,94,0.25)",
//     dateBg:    "rgba(244,63,94,0.12)",
//     stub:      "rgba(244,63,94,0.06)",
//     glow:      "rgba(244,63,94,0.2)",
//     pattern:   "diagonal",
//   },
//   // 4 — Ocean Sapphire (Student / Group)
//   {
//     bg:        "linear-gradient(135deg, #04111f 0%, #020a14 100%)",
//     accent:    "#38bdf8",
//     accent2:   "#0284c7",
//     text:      "#7dd3fc",
//     muted:     "rgba(125,211,252,0.4)",
//     border:    "rgba(56,189,248,0.25)",
//     dateBg:    "rgba(56,189,248,0.12)",
//     stub:      "rgba(56,189,248,0.06)",
//     glow:      "rgba(56,189,248,0.2)",
//     pattern:   "waves",
//   },
// ];

// // Assign a theme deterministically based on ticket properties
// function resolveTheme(ticket, index) {
//   const name = (ticket.ticket_type_name || "").toLowerCase();
//   if (name.includes("vip") || name.includes("premium"))  return TICKET_THEMES[1];
//   if (name.includes("backstage") || name.includes("rose")) return TICKET_THEMES[3];
//   if (name.includes("early") || name.includes("teal"))   return TICKET_THEMES[2];
//   if (name.includes("student") || name.includes("group")) return TICKET_THEMES[4];
//   return TICKET_THEMES[index % TICKET_THEMES.length];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // SVG background patterns (rendered inline, no external deps)
// // ─────────────────────────────────────────────────────────────────────────────

// function PatternDots({ color }) {
//   return (
//     <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
//       <defs>
//         <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
//           <circle cx="2" cy="2" r="1.5" fill={color} />
//         </pattern>
//       </defs>
//       <rect width="100%" height="100%" fill="url(#dots)" />
//     </svg>
//   );
// }

// function PatternLines({ color }) {
//   return (
//     <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
//       <defs>
//         <pattern id="lines" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
//           <line x1="0" y1="24" x2="24" y2="0" stroke={color} strokeWidth="1" />
//         </pattern>
//       </defs>
//       <rect width="100%" height="100%" fill="url(#lines)" />
//     </svg>
//   );
// }

// function PatternGrid({ color }) {
//   return (
//     <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
//       <defs>
//         <pattern id="grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
//           <path d="M 20 0 L 0 0 0 20" fill="none" stroke={color} strokeWidth="0.8" />
//         </pattern>
//       </defs>
//       <rect width="100%" height="100%" fill="url(#grid)" />
//     </svg>
//   );
// }

// function PatternDiagonal({ color }) {
//   return (
//     <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
//       <defs>
//         <pattern id="diag" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
//           <path d="M0 12 L12 0" stroke={color} strokeWidth="1" fill="none" />
//         </pattern>
//       </defs>
//       <rect width="100%" height="100%" fill="url(#diag)" />
//     </svg>
//   );
// }

// function PatternWaves({ color }) {
//   return (
//     <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
//       <defs>
//         <pattern id="waves" x="0" y="0" width="40" height="12" patternUnits="userSpaceOnUse">
//           <path d="M0 6 Q10 0 20 6 Q30 12 40 6" fill="none" stroke={color} strokeWidth="1" />
//         </pattern>
//       </defs>
//       <rect width="100%" height="100%" fill="url(#waves)" />
//     </svg>
//   );
// }

// function BgPattern({ pattern, color }) {
//   if (pattern === "lines")    return <PatternLines color={color} />;
//   if (pattern === "grid")     return <PatternGrid color={color} />;
//   if (pattern === "diagonal") return <PatternDiagonal color={color} />;
//   if (pattern === "waves")    return <PatternWaves color={color} />;
//   return <PatternDots color={color} />;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Helpers
// // ─────────────────────────────────────────────────────────────────────────────

// function fmtDate(d) {
//   if (!d) return { day: "—", month: "—", year: "", full: "TBA", time: "" };
//   const dt = new Date(d);
//   return {
//     day:   dt.toLocaleDateString("en-US", { day: "2-digit" }),
//     month: dt.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
//     year:  dt.getFullYear().toString(),
//     full:  dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
//     time:  dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
//   };
// }

// function fmtShort(d) {
//   if (!d) return "—";
//   return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
// }

// function isUpcoming(d) {
//   if (!d) return true;
//   return new Date(d) >= new Date();
// }

// function partitionTickets(tickets) {
//   const active = [], past = [];
//   for (const t of tickets) {
//     (isUpcoming(t.starts_at_local) ? active : past).push(t);
//   }
//   return { active, past };
// }

// // Avatar initials from email
// function initials(email = "") {
//   const parts = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").trim().split(" ");
//   return parts.length >= 2
//     ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
//     : email.slice(0, 2).toUpperCase();
// }

// // Deterministic avatar gradient from email
// function avatarGradient(email = "") {
//   let h = 0;
//   for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) & 0xffffffff;
//   const hue = Math.abs(h) % 360;
//   return `linear-gradient(135deg, hsl(${hue},60%,35%), hsl(${(hue + 40) % 360},70%,25%))`;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Status chip
// // ─────────────────────────────────────────────────────────────────────────────

// const STATUS_CFG = {
//   ACTIVE:  { label: "Active",     color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.25)"  },
//   USED:    { label: "Checked In", color: "#818cf8", bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.25)" },
//   EXPIRED: { label: "Expired",    color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.2)"  },
//   REVOKED: { label: "Cancelled",  color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.2)"  },
// };

// function StatusChip({ status }) {
//   const s = STATUS_CFG[status] ?? STATUS_CFG.ACTIVE;
//   return (
//     <span
//       className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
//       style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
//     >
//       <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: s.color }} />
//       {s.label}
//     </span>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // QR Modal — fetches raw token on demand (never stored client-side until needed)
// // ─────────────────────────────────────────────────────────────────────────────

// function QrModal({ ticket, email, theme, onClose }) {
//   const [token,   setToken]   = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error,   setError]   = useState("");

//   const date = fmtDate(ticket.starts_at_local);

//   // Fetch token on mount — token is NEVER in the list response
//   useEffect(() => {
//     let active = true;
//     async function fetchToken() {
//       try {
//         const res  = await fetch(
//           `${API}/public/tickets/${ticket.id}/qr-token?email=${encodeURIComponent(email)}`
//         );
//         const data = await res.json();
//         if (!active) return;
//         if (!res.ok || !data.success) throw new Error(data.message || "Could not load QR");
//         setToken(data.qr_token);
//       } catch (e) {
//         if (active) setError(e.message);
//       } finally {
//         if (active) setLoading(false);
//       }
//     }
//     fetchToken();
//     return () => { active = false; };
//   }, [ticket.id, email]);

//   useEffect(() => {
//     function onKey(e) { if (e.key === "Escape") onClose(); }
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [onClose]);

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
//       style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
//       onClick={onClose}
//     >
//       <motion.div
//         initial={{ y: 60, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         exit={{ y: 60, opacity: 0 }}
//         transition={{ type: "spring", damping: 28, stiffness: 320 }}
//         className="relative w-full max-w-sm overflow-hidden rounded-3xl"
//         style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <BgPattern pattern={theme.pattern} color={theme.accent} />

//         {/* Glow top */}
//         <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${theme.accent},transparent)` }} />

//         {/* Header */}
//         <div className="relative px-6 pt-6 pb-4">
//           <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: theme.accent }}>
//             {ticket.ticket_type_name || "General Admission"}
//           </p>
//           <h3 className="text-lg font-black leading-tight" style={{ color: theme.text }}>{ticket.event_title}</h3>
//           <p className="text-xs mt-1" style={{ color: theme.muted }}>
//             {date.full}{date.time ? ` · ${date.time}` : ""}
//           </p>
//         </div>

//         {/* Perforation */}
//         <div className="relative flex items-center px-3 my-1">
//           <div className="absolute -left-3 h-5 w-5 rounded-full" style={{ background: "#07070f" }} />
//           <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: `${theme.accent}30` }} />
//           <div className="absolute -right-3 h-5 w-5 rounded-full" style={{ background: "#07070f" }} />
//         </div>

//         {/* QR area */}
//         <div className="relative flex flex-col items-center px-6 py-5 gap-3">
//           {loading ? (
//             <div className="flex h-48 w-48 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
//               <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: theme.accent }}>
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//               </svg>
//             </div>
//           ) : error ? (
//             <div className="h-48 w-48 flex flex-col items-center justify-center gap-2 text-center">
//               <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>
//             </div>
//           ) : (
//             <div className="rounded-2xl p-3 bg-white shadow-2xl" style={{ boxShadow: `0 0 40px ${theme.glow}` }}>
//               <img
//                 src={`${API}/public/tickets/qr/${token}`}
//                 alt="Ticket QR Code"
//                 className="w-44 h-44 object-contain"
//               />
//             </div>
//           )}

//           {/* Ticket number */}
//           <div className="text-center">
//             <p className="text-[9px] uppercase tracking-widest" style={{ color: theme.muted }}>Ticket</p>
//             <p className="text-sm font-bold font-mono mt-0.5" style={{ color: theme.accent }}>
//               {ticket.ticket_number}
//             </p>
//           </div>

//           <p className="text-[10px] text-center" style={{ color: theme.muted }}>
//             Present at the entrance for scanning
//           </p>
//         </div>

//         {/* Security notice */}
//         <div className="relative mx-4 mb-4 rounded-xl px-4 py-2.5 text-center" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${theme.border}` }}>
//           <p className="text-[9px] uppercase tracking-widest" style={{ color: theme.muted }}>
//             🔒 Screenshot-resistant · Do not share
//           </p>
//         </div>

//         {/* Actions */}
//         {token && (
//           <div className="relative grid grid-cols-2 gap-3 px-6 pb-6">
//             <a
//               href={`${API}/public/tickets/qr/${token}`}
//               download={`ticket-${ticket.ticket_number}.png`}
//               className="flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition"
//               style={{ background: `${theme.accent}18`, border: `1px solid ${theme.border}`, color: theme.accent }}
//             >
//               <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
//                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
//               </svg>
//               Save PNG
//             </a>
//             <button
//               onClick={onClose}
//               className="rounded-xl py-3 text-xs font-bold transition"
//               style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
//             >
//               Close
//             </button>
//           </div>
//         )}
//         {!token && (
//           <div className="relative px-6 pb-6">
//             <button onClick={onClose} className="w-full rounded-xl py-3 text-xs font-bold"
//               style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
//               Close
//             </button>
//           </div>
//         )}
//       </motion.div>
//     </motion.div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Ticket Stub Card — each one gets a unique theme
// // ─────────────────────────────────────────────────────────────────────────────

// function TicketStub({ ticket, index, email, onShowQr, dimmed }) {
//   const theme  = resolveTheme(ticket, index);
//   const date   = fmtDate(ticket.starts_at_local);
//   const venue  = [ticket.venue_name, ticket.venue_city, ticket.venue_country].filter(Boolean).join(", ") || "Venue TBA";

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 24 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ type: "spring", damping: 22, stiffness: 240, delay: index * 0.06 }}
//       className="relative overflow-hidden"
//       style={{
//         background: theme.bg,
//         border: `1px solid ${theme.border}`,
//         borderRadius: "22px",
//         opacity: dimmed ? 0.55 : 1,
//       }}
//     >
//       <BgPattern pattern={theme.pattern} color={theme.accent} />

//       {/* Top glow line */}
//       <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${theme.accent}80,transparent)` }} />

//       {/* Glow orb */}
//       <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full blur-3xl pointer-events-none"
//         style={{ background: theme.glow }} />

//       <div className="relative flex">

//         {/* ── Date column ── */}
//         <div
//           className="flex flex-col items-center justify-center px-4 py-6 shrink-0 gap-0.5"
//           style={{
//             background: theme.dateBg,
//             borderRight: `2px dashed ${theme.accent}30`,
//             minWidth: "76px",
//           }}
//         >
//           <span className="text-[28px] font-black leading-none" style={{ color: theme.accent }}>{date.day}</span>
//           <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${theme.accent}99` }}>{date.month}</span>
//           <span className="text-[10px] mt-1" style={{ color: theme.muted }}>{date.year}</span>
//           {date.time && (
//             <>
//               <div className="h-px w-8 my-1.5" style={{ background: `${theme.accent}30` }} />
//               <span className="text-[9px] font-mono" style={{ color: theme.muted }}>{date.time}</span>
//             </>
//           )}
//         </div>

//         {/* Semicircle cutouts */}
//         <div className="absolute left-[72px] top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full z-10" style={{ background: "#07070f" }} />

//         {/* ── Info column ── */}
//         <div className="flex-1 px-5 py-5 min-w-0">
//           {/* Type badge */}
//           <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: theme.accent }}>
//             {ticket.ticket_type_name || "General Admission"}
//           </p>

//           {/* Event name */}
//           <h3 className="text-[15px] font-black leading-tight truncate" style={{ color: theme.text }}>
//             {ticket.event_title}
//           </h3>

//           {/* Details */}
//           <div className="mt-3 space-y-1.5">
//             <div className="flex items-start gap-2">
//               <svg className="shrink-0 mt-0.5" width="10" height="10" fill="none" stroke={theme.muted} strokeWidth="2" viewBox="0 0 24 24">
//                 <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
//               </svg>
//               <p className="text-[11px] leading-tight truncate" style={{ color: theme.muted }}>{venue}</p>
//             </div>
//             <div className="flex items-center gap-2">
//               <svg className="shrink-0" width="10" height="10" fill="none" stroke={theme.muted} strokeWidth="2" viewBox="0 0 24 24">
//                 <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
//               </svg>
//               <p className="text-[10px] font-mono" style={{ color: theme.muted }}>{ticket.ticket_number}</p>
//             </div>
//           </div>

//           {/* Status + CTA */}
//           <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
//             <StatusChip status={ticket.qr_status} />

//             {ticket.qr_status !== "REVOKED" && (
//               <button
//                 onClick={() => onShowQr({ ticket, theme })}
//                 className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition active:scale-95 shrink-0"
//                 style={{
//                   background: `${theme.accent}18`,
//                   border: `1px solid ${theme.accent}35`,
//                   color: theme.accent,
//                 }}
//               >
//                 <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
//                   <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
//                   <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h3v3h-3v-3h-3z"/>
//                 </svg>
//                 View QR
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ── Perforation footer ── */}
//       <div className="relative mx-4 flex items-center">
//         <div className="flex-1 border-t border-dashed" style={{ borderColor: `${theme.accent}20` }} />
//       </div>
//       <div
//         className="relative flex items-center justify-between px-5 py-2.5"
//         style={{ background: theme.stub }}
//       >
//         <p className="text-[9px] font-mono truncate max-w-[55%]" style={{ color: theme.muted }}>
//           {ticket.buyer_email}
//         </p>
//         <p className="text-[9px] font-mono" style={{ color: `${theme.muted}` }}>
//           {fmtShort(ticket.issued_at)}
//         </p>
//       </div>
//     </motion.div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Skeleton
// // ─────────────────────────────────────────────────────────────────────────────

// function Skeleton() {
//   return (
//     <div className="overflow-hidden rounded-[22px] animate-pulse" style={{ background: "#111120", height: 190 }}>
//       <div className="h-0.5 w-full" style={{ background: "rgba(255,255,255,0.05)" }} />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Empty state
// // ─────────────────────────────────────────────────────────────────────────────

// function Empty({ label }) {
//   return (
//     <div className="flex flex-col items-center justify-center py-20 rounded-2xl text-center"
//       style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
//       <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
//         style={{ background: "rgba(124,111,247,0.08)", border: "1px solid rgba(124,111,247,0.15)" }}>
//         <svg width="24" height="24" fill="none" stroke="#7c6ff7" strokeWidth="1.5" viewBox="0 0 24 24">
//           <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
//         </svg>
//       </div>
//       <p className="text-sm font-bold text-white mb-1">{label}</p>
//       <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
//         Tickets you purchase will appear here
//       </p>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Settings panel
// // ─────────────────────────────────────────────────────────────────────────────

// function Settings({ email, onLogout }) {
//   const grad = avatarGradient(email);
//   const ini  = initials(email);

//   return (
//     <div className="space-y-4 max-w-md">
//       <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
//         {/* Avatar */}
//         <div className="flex items-center gap-4">
//           <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white"
//             style={{ background: grad }}>
//             {ini}
//           </div>
//           <div className="min-w-0">
//             <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Signed in as</p>
//             <p className="text-sm font-bold text-white truncate">{email}</p>
//           </div>
//         </div>

//         <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
//           <button onClick={onLogout} className="flex items-center gap-2 text-xs font-bold transition" style={{ color: "#f87171" }}>
//             <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
//               <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
//             </svg>
//             Sign out
//           </button>
//         </div>
//       </div>

//       <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
//         <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Security</p>
//         <div className="space-y-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
//           <p>🔒 QR codes are generated on demand and never stored in your browser.</p>
//           <p>🛡 Each ticket carries a cryptographic signature to prevent forgery.</p>
//           <p>📧 Tickets are bound to your email address and cannot be transferred.</p>
//         </div>
//       </div>

//       <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
//         <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Need help?</p>
//         <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
//           Can't find a ticket? Make sure you use the exact email from checkout. Check your inbox for a confirmation email with your ticket number.
//         </p>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Auth gate
// // ─────────────────────────────────────────────────────────────────────────────

// function LookupGate({ onAuthenticated }) {
//   const [email,   setEmail]   = useState("");
//   const [tn,      setTn]      = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error,   setError]   = useState("");

//   async function handleSubmit(e) {
//     e.preventDefault();
//     const q = email.trim().toLowerCase();
//     if (!q || !q.includes("@")) { setError("Enter a valid email address"); return; }
//     setError("");
//     setLoading(true);
//     try {
//       const params = new URLSearchParams({ email: q });
//       if (tn.trim()) params.set("ticket_number", tn.trim().toUpperCase());
//       const res  = await fetch(`${API}/public/my-tickets?${params}`);
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Lookup failed");
//       onAuthenticated({ email: q, tickets: data.tickets ?? [] });
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 py-20" style={{ background: "#07070f" }}>
//       <div className="pointer-events-none fixed inset-0" style={{
//         background: "radial-gradient(ellipse 55% 45% at 50% -5%, rgba(124,111,247,0.12), transparent)"
//       }} />

//       <motion.div
//         initial={{ opacity: 0, y: 28 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
//         className="relative w-full max-w-[420px]"
//       >
//         {/* Card */}
//         <div className="overflow-hidden rounded-3xl" style={{ background: "#111120", border: "1px solid rgba(124,111,247,0.2)" }}>
//           <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #7c6ff7, transparent)" }} />

//           <div className="px-8 pt-8 pb-6">
//             {/* Icon */}
//             <div className="flex justify-center mb-7">
//               <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
//                 style={{ background: "rgba(124,111,247,0.12)", border: "1px solid rgba(124,111,247,0.25)" }}>
//                 <svg width="28" height="28" fill="none" stroke="#7c6ff7" strokeWidth="1.5" viewBox="0 0 24 24">
//                   <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
//                 </svg>
//               </div>
//             </div>

//             <h1 className="text-2xl font-black text-white text-center tracking-tight">My Tickets</h1>
//             <p className="text-sm text-center mt-2 mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
//               Enter your email to access your tickets
//             </p>

//             <form onSubmit={handleSubmit} className="space-y-3">
//               {/* Email */}
//               <div>
//                 <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
//                   Email Address
//                 </label>
//                 <input
//                   type="email" value={email} onChange={(e) => setEmail(e.target.value)}
//                   placeholder="your@email.com" required
//                   className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
//                   style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
//                   onFocus={(e) => (e.target.style.borderColor = "rgba(124,111,247,0.6)")}
//                   onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
//                 />
//               </div>

//               {/* Ticket number */}
//               <div>
//                 <label className="block text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
//                   Ticket Number <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "rgba(255,255,255,0.18)" }}>(optional)</span>
//                 </label>
//                 <input
//                   type="text" value={tn} onChange={(e) => setTn(e.target.value.toUpperCase())}
//                   placeholder="TKT-001234"
//                   className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition"
//                   style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
//                   onFocus={(e) => (e.target.style.borderColor = "rgba(124,111,247,0.6)")}
//                   onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
//                 />
//               </div>

//               <AnimatePresence>
//                 {error && (
//                   <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
//                     className="text-xs px-4 py-3 rounded-xl"
//                     style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#fca5a5" }}>
//                     {error}
//                   </motion.p>
//                 )}
//               </AnimatePresence>

//               <button type="submit" disabled={loading}
//                 className="w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-[0.1em] transition disabled:opacity-50 active:scale-[0.98] mt-2"
//                 style={{ background: "linear-gradient(135deg, #5b21b6, #4f46e5)", color: "#fff", boxShadow: "0 8px 24px rgba(91,33,182,0.3)" }}>
//                 {loading ? (
//                   <span className="flex items-center justify-center gap-2">
//                     <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
//                       <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
//                     </svg>
//                     Searching…
//                   </span>
//                 ) : "Find My Tickets"}
//               </button>
//             </form>
//           </div>

//           <div className="px-8 pb-6 text-center">
//             <p className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.15)" }}>
//               🔒 Secured · Tickets tied to your email
//             </p>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Nav items
// // ─────────────────────────────────────────────────────────────────────────────

// const NAV = [
//   { id: "active",   label: "My Tickets",  icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg> },
//   { id: "past",     label: "Past Events", icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
//   { id: "settings", label: "Settings",    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // Portal
// // ─────────────────────────────────────────────────────────────────────────────

// function Portal({ email, initialTickets, onLogout }) {
//   const [tab,       setTab]       = useState("active");
//   const [tickets,   setTickets]   = useState(initialTickets);
//   const [loading,   setLoading]   = useState(false);
//   const [qrState,   setQrState]   = useState(null); // { ticket, theme }
//   const [mobileNav, setMobileNav] = useState(false);

//   const grad = avatarGradient(email);
//   const ini  = initials(email);

//   const refresh = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res  = await fetch(`${API}/public/my-tickets?email=${encodeURIComponent(email)}`);
//       const data = await res.json();
//       if (data.success) setTickets(data.tickets ?? []);
//     } catch {}
//     finally { setLoading(false); }
//   }, [email]);

//   useEffect(() => { refresh(); }, [refresh]);

//   const { active, past } = partitionTickets(tickets);
//   const current = tab === "active" ? active : tab === "past" ? past : [];

//   return (
//     <div className="min-h-screen flex" style={{ background: "#07070f" }}>
//       <style>{`
//         * { box-sizing: border-box; }
//         input { color-scheme: dark; }
//         input::placeholder { color: rgba(255,255,255,0.2); }
//         ::-webkit-scrollbar { width: 3px; }
//         ::-webkit-scrollbar-track { background: transparent; }
//         ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
//       `}</style>

//       {/* Ambient */}
//       <div className="pointer-events-none fixed inset-0" style={{
//         background: "radial-gradient(ellipse 40% 60% at 0% 50%, rgba(124,111,247,0.04), transparent)"
//       }} />

//       {/* ── Sidebar ─────────────────────────────────────────────────────── */}
//       <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen"
//         style={{ background: "rgba(255,255,255,0.018)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>

//         {/* Profile */}
//         <div className="px-4 pt-7 pb-5">
//           <div className="flex items-center gap-3">
//             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
//               style={{ background: grad }}>
//               {ini}
//             </div>
//             <div className="min-w-0">
//               <p className="text-xs font-black text-white truncate">{email.split("@")[0]}</p>
//               <p className="text-[9px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>@{email.split("@")[1]}</p>
//             </div>
//           </div>
//         </div>

//         {/* Ticket count pills */}
//         <div className="px-4 pb-4 flex gap-2">
//           <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}>
//             <p className="text-base font-black" style={{ color: "#34d399" }}>{active.length}</p>
//             <p className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(52,211,153,0.6)" }}>Active</p>
//           </div>
//           <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.12)" }}>
//             <p className="text-base font-black" style={{ color: "#94a3b8" }}>{past.length}</p>
//             <p className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.5)" }}>Past</p>
//           </div>
//         </div>

//         <div className="mx-4 h-px mb-3" style={{ background: "rgba(255,255,255,0.05)" }} />

//         {/* Nav */}
//         <nav className="flex-1 px-3 space-y-0.5">
//           {NAV.map((item) => {
//             const active2 = tab === item.id;
//             return (
//               <button key={item.id} onClick={() => setTab(item.id)}
//                 className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition"
//                 style={{
//                   background: active2 ? "rgba(124,111,247,0.12)" : "transparent",
//                   color: active2 ? "#9b8df9" : "rgba(255,255,255,0.35)",
//                   border: active2 ? "1px solid rgba(124,111,247,0.2)" : "1px solid transparent",
//                 }}>
//                 <span style={{ color: active2 ? "#9b8df9" : "rgba(255,255,255,0.25)" }}>{item.icon}</span>
//                 {item.label}
//               </button>
//             );
//           })}
//         </nav>

//         {/* Logout */}
//         <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
//           <button onClick={onLogout}
//             className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition"
//             style={{ color: "rgba(255,255,255,0.2)" }}>
//             <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//               <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
//             </svg>
//             Sign out
//           </button>
//         </div>
//       </aside>

//       {/* ── Main ──────────────────────────────────────────────────────────── */}
//       <main className="flex-1 min-w-0 flex flex-col">
//         {/* Topbar */}
//         <header className="sticky top-0 z-30 flex items-center gap-3 px-5 py-3.5"
//           style={{ background: "rgba(7,7,15,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>

//           {/* Hamburger */}
//           <button className="lg:hidden p-1.5 -ml-1 rounded-lg" onClick={() => setMobileNav(true)}
//             style={{ color: "rgba(255,255,255,0.4)" }}>
//             <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
//               <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
//             </svg>
//           </button>

//           <h2 className="flex-1 text-sm font-black text-white">
//             {NAV.find(n => n.id === tab)?.label}
//           </h2>

//           {/* Mobile avatar */}
//           <div className="lg:hidden flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-white shrink-0"
//             style={{ background: grad }}>{ini}</div>

//           {/* Refresh */}
//           <button onClick={refresh}
//             className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition"
//             style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>
//             <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className={loading ? "animate-spin" : ""}>
//               <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
//             </svg>
//             {loading ? "…" : "Refresh"}
//           </button>
//         </header>

//         {/* Content */}
//         <div className="flex-1 p-5 lg:p-8 max-w-2xl w-full mx-auto lg:mx-0">
//           <AnimatePresence mode="wait">
//             {tab === "settings" ? (
//               <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//                 <Settings email={email} onLogout={onLogout} />
//               </motion.div>
//             ) : (
//               <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
//                 {/* Section header */}
//                 <div>
//                   <h3 className="text-xl font-black text-white">
//                     {tab === "active" ? "Active Tickets" : "Past Events"}
//                   </h3>
//                   <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
//                     {tab === "active"
//                       ? `${active.length} upcoming ticket${active.length !== 1 ? "s" : ""}`
//                       : `${past.length} past event${past.length !== 1 ? "s" : ""}`}
//                   </p>
//                 </div>

//                 {loading ? (
//                   <div className="space-y-4">
//                     {[1, 2].map(i => <Skeleton key={i} />)}
//                   </div>
//                 ) : current.length === 0 ? (
//                   <Empty label={tab === "active" ? "No upcoming tickets" : "No past events"} />
//                 ) : (
//                   <div className="space-y-5">
//                     {current.map((t, i) => (
//                       <TicketStub
//                         key={t.id}
//                         ticket={t}
//                         index={i}
//                         email={email}
//                         onShowQr={setQrState}
//                         dimmed={tab === "past"}
//                       />
//                     ))}
//                   </div>
//                 )}
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </main>

//       {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
//       <AnimatePresence>
//         {mobileNav && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//               className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.7)" }}
//               onClick={() => setMobileNav(false)} />
//             <motion.div
//               initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
//               transition={{ type: "spring", damping: 28, stiffness: 320 }}
//               className="fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col lg:hidden"
//               style={{ background: "#0f0e1a", borderRight: "1px solid rgba(255,255,255,0.07)" }}
//             >
//               <div className="flex items-center gap-3 px-5 pt-6 pb-4">
//                 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
//                   style={{ background: grad }}>{ini}</div>
//                 <p className="flex-1 text-sm font-black text-white truncate">{email.split("@")[0]}</p>
//                 <button onClick={() => setMobileNav(false)} style={{ color: "rgba(255,255,255,0.3)" }}>
//                   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
//                     <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
//                   </svg>
//                 </button>
//               </div>
//               <nav className="flex-1 px-3 space-y-0.5">
//                 {NAV.map(item => (
//                   <button key={item.id} onClick={() => { setTab(item.id); setMobileNav(false); }}
//                     className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition"
//                     style={{
//                       background: tab === item.id ? "rgba(124,111,247,0.12)" : "transparent",
//                       color: tab === item.id ? "#9b8df9" : "rgba(255,255,255,0.35)",
//                     }}>
//                     <span style={{ color: tab === item.id ? "#9b8df9" : "rgba(255,255,255,0.25)" }}>{item.icon}</span>
//                     {item.label}
//                   </button>
//                 ))}
//               </nav>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* QR Modal */}
//       <AnimatePresence>
//         {qrState && (
//           <QrModal
//             ticket={qrState.ticket}
//             email={email}
//             theme={qrState.theme}
//             onClose={() => setQrState(null)}
//           />
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Root — handles booting from URL params
// // ─────────────────────────────────────────────────────────────────────────────

// function Content() {
//   const searchParams = useSearchParams();
//   const initEmail    = searchParams.get("email")         ?? "";
//   const initTn       = searchParams.get("ticket_number") ?? "";

//   const [session, setSession] = useState(null);
//   const [booting, setBooting] = useState(!!initEmail);

//   useEffect(() => {
//     if (!initEmail) return;
//     async function autoAuth() {
//       try {
//         const params = new URLSearchParams({ email: initEmail });
//         if (initTn) params.set("ticket_number", initTn);
//         const res  = await fetch(`${API}/public/my-tickets?${params}`);
//         const data = await res.json();
//         if (data.success) setSession({ email: initEmail.toLowerCase(), tickets: data.tickets ?? [] });
//       } catch {}
//       finally { setBooting(false); }
//     }
//     autoAuth();
//   }, []); // eslint-disable-line

//   if (booting) {
//     return (
//       <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070f" }}>
//         <div className="flex flex-col items-center gap-4">
//           <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
//             style={{ background: "rgba(124,111,247,0.1)", border: "1px solid rgba(124,111,247,0.2)" }}>
//             <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" style={{ color: "#7c6ff7" }}>
//               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
//               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
//             </svg>
//           </div>
//           <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Loading your tickets…</p>
//         </div>
//       </div>
//     );
//   }

//   if (!session) return <LookupGate onAuthenticated={setSession} />;

//   return (
//     <Portal
//       email={session.email}
//       initialTickets={session.tickets}
//       onLogout={() => setSession(null)}
//     />
//   );
// }

// export default function MyTicketsPage() {
//   return (
//     <Suspense fallback={
//       <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070f" }}>
//         <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: "rgba(124,111,247,0.5)" }}>
//           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
//         </svg>
//       </div>
//     }>
//       <Content />
//     </Suspense>
//   );
// }

