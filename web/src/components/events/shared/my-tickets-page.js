/**
 * TicketStubCard.jsx
 * 
 * Drop-in replacement for the TicketStub component in my-tickets-page.js
 * 
 * Renders completely different designs based on ticket KIND:
 *   PAID / FREE → Ticket stub aesthetic (perforations, date column, QR button)
 *   DONATION    → Donation receipt card (heart, amount, thank-you design)
 *   RSVP        → RSVP confirmation card (check, name, event info)
 */

"use client";
import { useState } from "react";
import { motion }   from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return { day:"—", month:"—", year:"", full:"TBA", time:"" };
  const dt = new Date(d);
  return {
    day:   dt.toLocaleDateString("en-US",{ day:"2-digit" }),
    month: dt.toLocaleDateString("en-US",{ month:"short" }).toUpperCase(),
    year:  String(dt.getFullYear()),
    full:  dt.toLocaleDateString("en-US",{ weekday:"long", month:"long", day:"numeric", year:"numeric" }),
    time:  dt.toLocaleTimeString("en-US",{ hour:"2-digit", minute:"2-digit" }),
  };
}
function fmtShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" });
}
function fmtCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US",{ style:"currency", currency, maximumFractionDigits:2 }).format(amount);
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme system — same 5 themes as before
// ─────────────────────────────────────────────────────────────────────────────

const THEMES = [
  { bg:"linear-gradient(135deg,#1a1535 0%,#0f0d1f 100%)", accent:"#7c6ff7", text:"#c4bfff", muted:"rgba(196,191,255,0.45)", border:"rgba(124,111,247,0.22)", dateBg:"rgba(124,111,247,0.13)", stub:"rgba(124,111,247,0.07)", glow:"rgba(124,111,247,0.18)", pattern:"dots" },
  { bg:"linear-gradient(135deg,#1f1505 0%,#110c02 100%)", accent:"#e8a000", text:"#ffd060", muted:"rgba(255,208,96,0.45)",  border:"rgba(232,160,0,0.22)",   dateBg:"rgba(232,160,0,0.11)",   stub:"rgba(232,160,0,0.06)",   glow:"rgba(232,160,0,0.2)",   pattern:"lines" },
  { bg:"linear-gradient(135deg,#071a18 0%,#030f0e 100%)", accent:"#2dd4bf", text:"#7fffd4", muted:"rgba(127,255,212,0.45)", border:"rgba(45,212,191,0.22)",  dateBg:"rgba(45,212,191,0.11)", stub:"rgba(45,212,191,0.06)", glow:"rgba(45,212,191,0.18)", pattern:"grid" },
  { bg:"linear-gradient(135deg,#1f0810 0%,#110406 100%)", accent:"#f43f5e", text:"#fda4af", muted:"rgba(253,164,175,0.45)", border:"rgba(244,63,94,0.22)",  dateBg:"rgba(244,63,94,0.11)",  stub:"rgba(244,63,94,0.06)",  glow:"rgba(244,63,94,0.18)",  pattern:"diagonal" },
  { bg:"linear-gradient(135deg,#04111f 0%,#020a14 100%)", accent:"#38bdf8", text:"#7dd3fc", muted:"rgba(125,211,252,0.45)", border:"rgba(56,189,248,0.22)",  dateBg:"rgba(56,189,248,0.11)", stub:"rgba(56,189,248,0.06)", glow:"rgba(56,189,248,0.18)", pattern:"waves" },
];

function resolveTheme(ticket, idx) {
  const n = (ticket.ticket_type_name || "").toLowerCase();
  if (n.includes("vip") || n.includes("premium")) return THEMES[1];
  if (n.includes("early"))                         return THEMES[2];
  if (n.includes("student") || n.includes("group"))return THEMES[4];
  return THEMES[idx % THEMES.length];
}

// Status chip
const STATUS_CFG = {
  ACTIVE:  { label:"Active",     c:"#34d399", bg:"rgba(52,211,153,0.11)",  b:"rgba(52,211,153,0.22)"  },
  USED:    { label:"Checked In", c:"#818cf8", bg:"rgba(129,140,248,0.11)", b:"rgba(129,140,248,0.22)" },
  EXPIRED: { label:"Expired",    c:"#94a3b8", bg:"rgba(148,163,184,0.09)", b:"rgba(148,163,184,0.18)" },
  REVOKED: { label:"Cancelled",  c:"#f87171", bg:"rgba(248,113,113,0.09)", b:"rgba(248,113,113,0.18)" },
};
function StatusChip({ status }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG.ACTIVE;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
      style={{ background:s.bg, border:`1px solid ${s.b}`, color:s.c }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background:s.c }} />{s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PAID / FREE — Classic ticket stub
// ─────────────────────────────────────────────────────────────────────────────

export function TicketStub({ ticket, index, email, onShowQr, dimmed }) {
  const theme = resolveTheme(ticket, index);
  const date  = fmtDate(ticket.starts_at_local);
  const venue = [ticket.venue_name, ticket.venue_city, ticket.venue_country].filter(Boolean).join(", ") || "Venue TBA";

  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
      transition={{ type:"spring", damping:22, stiffness:240, delay:index*0.06 }}
      className="relative overflow-hidden"
      style={{ background:theme.bg, border:`1px solid ${theme.border}`, borderRadius:22, opacity:dimmed?0.55:1 }}>

      {/* Top glow */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background:`linear-gradient(90deg,transparent,${theme.accent}70,transparent)` }} />
      <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full blur-3xl pointer-events-none" style={{ background:theme.glow }} />

      <div className="relative flex">
        {/* Date column */}
        <div className="flex flex-col items-center justify-center px-4 py-6 shrink-0 gap-0.5"
          style={{ background:theme.dateBg, borderRight:`2px dashed ${theme.accent}28`, minWidth:76 }}>
          <span className="text-[28px] font-black leading-none" style={{ color:theme.accent }}>{date.day}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:`${theme.accent}99` }}>{date.month}</span>
          <span className="text-[10px] mt-1" style={{ color:theme.muted }}>{date.year}</span>
          {date.time && (
            <><div className="h-px w-8 my-1.5" style={{ background:`${theme.accent}28` }} />
            <span className="text-[9px] font-mono" style={{ color:theme.muted }}>{date.time}</span></>
          )}
        </div>

        {/* Notch */}
        <div className="absolute left-[72px] top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full z-10" style={{ background:"#07070f" }} />

        {/* Info */}
        <div className="flex-1 px-5 py-5 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color:theme.accent }}>
            {ticket.ticket_type_name || "General Admission"}
          </p>
          <h3 className="text-[15px] font-black leading-tight truncate" style={{ color:theme.text }}>{ticket.event_title}</h3>

          <div className="mt-3 space-y-1.5">
            {venue && (
              <div className="flex items-start gap-2">
                <svg className="shrink-0 mt-0.5" width="10" height="10" fill="none" stroke={theme.muted} strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <p className="text-[11px] leading-tight truncate" style={{ color:theme.muted }}>{venue}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg className="shrink-0" width="10" height="10" fill="none" stroke={theme.muted} strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <p className="text-[10px] font-mono" style={{ color:theme.muted }}>{ticket.ticket_number}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
            <StatusChip status={ticket.qr_status} />
            {ticket.qr_status !== "REVOKED" && (
              <button onClick={() => onShowQr({ ticket, theme })}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition active:scale-95 shrink-0"
                style={{ background:`${theme.accent}18`, border:`1px solid ${theme.accent}30`, color:theme.accent }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h3v3h-3v-3h-3z"/>
                </svg>
                View QR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer perforation */}
      <div className="relative mx-4 border-t border-dashed" style={{ borderColor:`${theme.accent}18` }} />
      <div className="relative flex items-center justify-between px-5 py-2.5" style={{ background:theme.stub }}>
        <p className="text-[9px] font-mono truncate max-w-[55%]" style={{ color:theme.muted }}>{ticket.buyer_email}</p>
        <p className="text-[9px] font-mono" style={{ color:theme.muted }}>{fmtShort(ticket.issued_at)}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DONATION — receipt card design (completely different look)
// ─────────────────────────────────────────────────────────────────────────────

export function DonationCard({ ticket, index, dimmed }) {
  const date = fmtDate(ticket.starts_at_local);
  const amount = ticket.total || ticket.price || 0;
  const currency = ticket.currency || "USD";

  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
      transition={{ type:"spring", damping:22, stiffness:240, delay:index*0.06 }}
      className="relative overflow-hidden"
      style={{
        background:"linear-gradient(135deg,#1f0a1a 0%,#120610 100%)",
        border:"1px solid rgba(244,114,182,0.22)",
        borderRadius:22,
        opacity:dimmed?0.55:1,
      }}>

      {/* Top glow */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background:"linear-gradient(90deg,transparent,#f472b6,transparent)" }} />
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full blur-3xl pointer-events-none" style={{ background:"rgba(244,114,182,0.15)" }} />

      {/* Heart watermark */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-[0.04]">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="#f472b6">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>

      <div className="relative flex items-stretch">
        {/* Amount column */}
        <div className="flex flex-col items-center justify-center px-4 py-6 shrink-0 gap-1"
          style={{ background:"rgba(244,114,182,0.1)", borderRight:"2px dashed rgba(244,114,182,0.2)", minWidth:80 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#f472b6">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span className="text-xs font-black leading-none mt-1" style={{ color:"#f472b6" }}>
            {fmtCurrency(amount, currency)}
          </span>
          <span className="text-[9px] mt-0.5 uppercase tracking-widest" style={{ color:"rgba(244,114,182,0.5)" }}>
            Donated
          </span>
        </div>

        {/* Notch */}
        <div className="absolute left-[72px] top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full z-10" style={{ background:"#07070f" }} />

        {/* Info */}
        <div className="flex-1 px-5 py-5 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color:"#f472b6" }}>
            Donation · {ticket.ticket_type_name || "Support"}
          </p>
          <h3 className="text-[15px] font-black leading-tight truncate" style={{ color:"#fda4af" }}>{ticket.event_title}</h3>

          <div className="mt-3 space-y-1.5">
            {date.full !== "TBA" && (
              <div className="flex items-center gap-2">
                <svg className="shrink-0" width="10" height="10" fill="none" stroke="rgba(253,164,175,0.45)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <p className="text-[11px]" style={{ color:"rgba(253,164,175,0.45)" }}>{date.full}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg className="shrink-0" width="10" height="10" fill="none" stroke="rgba(253,164,175,0.45)" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>
              <p className="text-[10px]" style={{ color:"rgba(253,164,175,0.45)" }}>
                Receipt #{ticket.order_id?.slice(0,8).toUpperCase() || "—"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
              style={{ background:"rgba(244,114,182,0.1)", border:"1px solid rgba(244,114,182,0.25)", color:"#f472b6" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
              {ticket.qr_status === "USED" ? "Verified" : "Received"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative mx-4 border-t border-dashed" style={{ borderColor:"rgba(244,114,182,0.12)" }} />
      <div className="relative flex items-center justify-between px-5 py-2.5" style={{ background:"rgba(244,114,182,0.04)" }}>
        <p className="text-[9px] font-mono truncate max-w-[55%]" style={{ color:"rgba(253,164,175,0.4)" }}>{ticket.buyer_email}</p>
        <p className="text-[9px] font-mono" style={{ color:"rgba(253,164,175,0.4)" }}>
          {fmtShort(ticket.issued_at)} · Thank you 💛
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RSVP — confirmation card
// ─────────────────────────────────────────────────────────────────────────────

export function RsvpCard({ ticket, index, dimmed }) {
  const date  = fmtDate(ticket.starts_at_local);
  const venue = [ticket.venue_name, ticket.venue_city, ticket.venue_country].filter(Boolean).join(", ") || "Venue TBA";

  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
      transition={{ type:"spring", damping:22, stiffness:240, delay:index*0.06 }}
      className="relative overflow-hidden"
      style={{
        background:"linear-gradient(135deg,#0d1a0f 0%,#060e07 100%)",
        border:"1px solid rgba(52,211,153,0.22)",
        borderRadius:22,
        opacity:dimmed?0.55:1,
      }}>

      <div className="absolute inset-x-0 top-0 h-px" style={{ background:"linear-gradient(90deg,transparent,#34d399,transparent)" }} />
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full blur-3xl pointer-events-none" style={{ background:"rgba(52,211,153,0.12)" }} />

      {/* Check watermark */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.04]">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <div className="relative flex items-stretch">
        {/* Date column */}
        <div className="flex flex-col items-center justify-center px-4 py-6 shrink-0 gap-0.5"
          style={{ background:"rgba(52,211,153,0.1)", borderRight:"2px dashed rgba(52,211,153,0.2)", minWidth:76 }}>
          <span className="text-[28px] font-black leading-none" style={{ color:"#34d399" }}>{date.day}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:"rgba(52,211,153,0.7)" }}>{date.month}</span>
          <span className="text-[10px] mt-1" style={{ color:"rgba(52,211,153,0.4)" }}>{date.year}</span>
          {date.time && (
            <><div className="h-px w-8 my-1.5" style={{ background:"rgba(52,211,153,0.2)" }} />
            <span className="text-[9px] font-mono" style={{ color:"rgba(52,211,153,0.4)" }}>{date.time}</span></>
          )}
        </div>

        {/* Notch */}
        <div className="absolute left-[72px] top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full z-10" style={{ background:"#07070f" }} />

        {/* Info */}
        <div className="flex-1 px-5 py-5 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color:"#34d399" }}>RSVP Confirmed</p>
          <h3 className="text-[15px] font-black leading-tight truncate" style={{ color:"#a7f3d0" }}>{ticket.event_title}</h3>

          <div className="mt-3 space-y-1.5">
            {venue && (
              <div className="flex items-start gap-2">
                <svg className="shrink-0 mt-0.5" width="10" height="10" fill="none" stroke="rgba(167,243,208,0.4)" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <p className="text-[11px] leading-tight truncate" style={{ color:"rgba(167,243,208,0.4)" }}>{venue}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg className="shrink-0" width="10" height="10" fill="none" stroke="rgba(167,243,208,0.4)" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <p className="text-[10px]" style={{ color:"rgba(167,243,208,0.4)" }}>{ticket.buyer_name || ticket.buyer_email}</p>
            </div>
          </div>

          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
              style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", color:"#34d399" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background:"#34d399" }} />
              {ticket.checked_in_at ? "Attended" : "Going"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative mx-4 border-t border-dashed" style={{ borderColor:"rgba(52,211,153,0.12)" }} />
      <div className="relative flex items-center justify-between px-5 py-2.5" style={{ background:"rgba(52,211,153,0.04)" }}>
        <p className="text-[9px] font-mono truncate max-w-[55%]" style={{ color:"rgba(167,243,208,0.35)" }}>{ticket.buyer_email}</p>
        <p className="text-[9px] font-mono" style={{ color:"rgba(167,243,208,0.35)" }}>{fmtShort(ticket.issued_at)}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart dispatcher — render the right card based on ticket kind
// Use this everywhere instead of <TicketStub>
// ─────────────────────────────────────────────────────────────────────────────

export default function SmartTicketCard({ ticket, index, email, onShowQr, dimmed }) {
  const kind = (ticket.kind || ticket.ticket_type_kind || "").toUpperCase();

  if (kind === "DONATION") {
    return <DonationCard ticket={ticket} index={index} dimmed={dimmed} />;
  }

  // RSVP tickets have no price and no QR checkout — treat FREE with no QR as RSVP
  const isRsvp = kind === "RSVP" || (!ticket.qr_token && !ticket.price);
  if (isRsvp) {
    return <RsvpCard ticket={ticket} index={index} dimmed={dimmed} />;
  }

  // Default: PAID or FREE ticket stub
  return <TicketStub ticket={ticket} index={index} email={email} onShowQr={onShowQr} dimmed={dimmed} />;
}
