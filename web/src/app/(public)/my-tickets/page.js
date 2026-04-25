"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL;

function fmtDate(d) {
  if (!d) return "TBA";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });
}

function fmtTime(d) {
  if (!d) return null;
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const STATUS = {
  ACTIVE:  { label: "Active",      dot: "#10b981", bg: "rgba(16,185,129,0.12)",  text: "#10b981" },
  USED:    { label: "Checked In",  dot: "#6366f1", bg: "rgba(99,102,241,0.12)",  text: "#6366f1" },
  EXPIRED: { label: "Expired",     dot: "#6b7280", bg: "rgba(107,114,128,0.12)", text: "#6b7280" },
  REVOKED: { label: "Revoked",     dot: "#ef4444", bg: "rgba(239,68,68,0.12)",   text: "#ef4444" },
};

function resolveTier(name = "") {
  const n = name.toLowerCase();
  if (n.includes("vip") || n.includes("platinum") || n.includes("premium")) return { accent: "#C9A96E", icon: "👑", dark: "#0f0b00" };
  if (n.includes("pro") || n.includes("diamond") || n.includes("all-access")) return { accent: "#a78bfa", icon: "💎", dark: "#0d0718" };
  if (n.includes("early") || n.includes("bird")) return { accent: "#f59e0b", icon: "⚡", dark: "#1c1002" };
  if (n.includes("free") || n.includes("general")) return { accent: "#10b981", icon: "🎁", dark: "#022c22" };
  return { accent: "#6366f1", icon: "🎟️", dark: "#0f0f1f" };
}

// ── Individual Ticket Card ────────────────────────────────────────────────────
function TicketCard({ ticket }) {
  const [qrOpen, setQrOpen] = useState(false);
  const status = STATUS[ticket.qr_status] ?? STATUS.ACTIVE;
  const tier   = resolveTier(ticket.ticket_type_name);
  const ticketNumber = ticket.ticket_number || `TKT-${String(ticket.id).slice(0, 8).toUpperCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl"
      style={{
        background: `linear-gradient(145deg,${tier.dark},${tier.dark}ee)`,
        border:     `1px solid ${tier.accent}30`,
        boxShadow:  `0 8px 32px ${tier.accent}15`,
      }}
    >
      {/* Accent top stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${tier.accent},${tier.accent}50,transparent)` }} />

      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-base">{tier.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${tier.accent}20`, color: tier.accent, border: `1px solid ${tier.accent}35` }}>
                {ticket.ticket_type_name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: status.bg, color: status.text }}>
                ● {status.label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white truncate">{ticket.event_title}</h3>
            <p className="text-xs mt-0.5 font-mono font-bold" style={{ color: tier.accent }}>
              {ticketNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Perforated divider */}
      <div className="mx-5 flex items-center gap-1 py-1">
        <div className="flex-1 h-px" style={{ background: `${tier.accent}20` }} />
        {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: `${tier.accent}15` }} />)}
        <div className="flex-1 h-px" style={{ background: `${tier.accent}20` }} />
      </div>

      {/* Event details */}
      <div className="px-5 pb-4 space-y-2">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>Date</p>
            <p className="font-semibold text-white">{fmtDate(ticket.starts_at_local)}</p>
            {fmtTime(ticket.starts_at_local) && <p style={{ color: "rgba(255,255,255,0.4)" }}>{fmtTime(ticket.starts_at_local)}</p>}
          </div>
          <div>
            <p className="uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>Venue</p>
            <p className="font-semibold text-white">{ticket.venue_name || "TBA"}</p>
            {ticket.venue_city && <p style={{ color: "rgba(255,255,255,0.4)" }}>{ticket.venue_city}</p>}
          </div>
          <div>
            <p className="uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>Holder</p>
            <p className="font-semibold text-white">{ticket.buyer_name || "—"}</p>
          </div>
          <div>
            <p className="uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>Ticket No.</p>
            <p className="font-mono font-bold" style={{ color: tier.accent }}>{ticketNumber}</p>
          </div>
        </div>

        {/* Perforated divider */}
        <div className="flex items-center gap-1 py-1 mt-2">
          <div className="flex-1 h-px" style={{ background: `${tier.accent}15` }} />
          {[...Array(6)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full" style={{ background: `${tier.accent}12` }} />)}
          <div className="flex-1 h-px" style={{ background: `${tier.accent}15` }} />
        </div>

        {/* QR section */}
        <AnimatePresence>
          {qrOpen ? (
            <motion.div key="qr" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="space-y-3">
              <div className="mx-auto w-44 h-44 rounded-xl overflow-hidden bg-white p-2 shadow-lg"
                style={{ boxShadow: `0 0 0 4px ${tier.accent}20` }}>
                <img src={`${API}/public/tickets/qr/${ticket.qr_token}`} alt="QR" className="w-full h-full object-cover" />
              </div>
              <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Show this QR at the door for entry</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setQrOpen(false)}
                  className="py-2.5 rounded-xl text-xs font-semibold transition"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Hide QR
                </button>
                <a href={`${API}/public/tickets/qr/${ticket.qr_token}`}
                  download={`ticket-${ticketNumber}.png`}
                  className="py-2.5 rounded-xl text-xs font-semibold text-center transition"
                  style={{ background: `${tier.accent}20`, color: tier.accent, border: `1px solid ${tier.accent}30` }}>
                  ↓ Save QR
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.button key="show" onClick={() => setQrOpen(true)}
              className="w-full py-3 rounded-xl text-sm font-black transition active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg,${tier.accent},${tier.accent}cc)`,
                color: tier.dark,
                boxShadow: `0 4px 16px ${tier.accent}30`,
              }}>
              Show QR Pass →
            </motion.button>
          )}
        </AnimatePresence>

        {ticket.qr_status === "USED" && ticket.checked_in_at && (
          <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            ✓ Checked in {new Date(ticket.checked_in_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────
function MyTicketsContent() {
  const searchParams   = useSearchParams();
  const initEmail      = searchParams.get("email") ?? "";
  const initTicketNum  = searchParams.get("ticket_number") ?? "";

  const [email,        setEmail]       = useState(initEmail);
  const [ticketNumber, setTicketNumber]= useState(initTicketNum);
  const [emailInput,   setEmailInput]  = useState(initEmail);
  const [tnInput,      setTnInput]     = useState(initTicketNum);
  const [tickets,      setTickets]     = useState(null);
  const [loading,      setLoading]     = useState(false);
  const [error,        setError]       = useState("");
  const [mode,         setMode]        = useState("both"); // "both" | "email-only"

  const search = useCallback(async (e) => {
    e?.preventDefault();
    const q  = emailInput.trim().toLowerCase();
    const tn = tnInput.trim().toUpperCase();
    if (!q || !q.includes("@")) { setError("Enter a valid email address"); return; }
    setError("");
    setLoading(true);
    setEmail(q);
    setTicketNumber(tn);
    try {
      const params = new URLSearchParams({ email: q });
      if (tn) params.set("ticket_number", tn);
      const res  = await fetch(`${API}/public/my-tickets?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load tickets");
      setTickets(data.tickets ?? []);
    } catch (err) {
      setError(err.message);
      setTickets(null);
    } finally {
      setLoading(false);
    }
  }, [emailInput, tnInput]);

  // Auto-search if params provided via URL
  useEffect(() => {
    if (initEmail && (initTicketNum || true)) {
      setEmailInput(initEmail);
      setTnInput(initTicketNum);
      // trigger search
      const params = new URLSearchParams({ email: initEmail });
      if (initTicketNum) params.set("ticket_number", initTicketNum);
      setLoading(true);
      fetch(`${API}/public/my-tickets?${params}`)
        .then(r => r.json())
        .then(d => { if (d.success) setTickets(d.tickets ?? []); else setError(d.message); })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen" style={{ background: "#07070f" }}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        input::placeholder{color:rgba(255,255,255,0.2)}
        input{color-scheme:dark}
      `}</style>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%,rgba(99,102,241,0.1),transparent)" }} />

      {/* Header */}
      <div className="relative border-b" style={{ background: "rgba(7,7,15,0.9)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(167,139,250,0.2))", border: "1px solid rgba(99,102,241,0.3)" }}>
            <span className="text-2xl">🎟</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">My Tickets</h1>
          <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Enter your email and ticket number to access your tickets
          </p>
        </div>
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Lookup form */}
        <form onSubmit={search} className="space-y-3">
          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Email Address
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#fff",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.10)"}
            />
          </div>

          {/* Ticket number */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Ticket Number <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(e.g. TKT-001234)</span>
            </label>
            <input
              type="text"
              value={tnInput}
              onChange={e => setTnInput(e.target.value.toUpperCase())}
              placeholder="TKT-000000"
              className="w-full rounded-xl px-4 py-3.5 text-sm font-mono outline-none transition uppercase"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#fff",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.10)"}
            />
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
              Found in your confirmation email. Leave blank to see all tickets for your email.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl text-sm font-black transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg,#6366f1,#a78bfa)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
            }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Searching…
              </span>
            ) : "Find My Tickets →"}
          </button>
        </form>

        {/* Results */}
        <AnimatePresence mode="wait">
          {tickets !== null && (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {tickets.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-3xl mb-3">🎟</p>
                  <p className="text-base font-bold text-white">No tickets found</p>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {tnInput
                      ? `No ticket matching ${tnInput} was found for ${email}.`
                      : `No tickets found for ${email}.`}
                  </p>
                  <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Make sure you use the same email you used when purchasing.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Found <strong className="text-white">{tickets.length}</strong> ticket{tickets.length !== 1 ? "s" : ""} for <strong className="text-white">{email}</strong>
                    {tnInput && <> · <strong className="text-white">{tnInput}</strong></>}
                  </p>
                  {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs pb-8" style={{ color: "rgba(255,255,255,0.15)" }}>
          🔒 Your tickets are private and accessible only with your email + ticket number
        </p>
      </div>
    </div>
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070f" }}>
        <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: "rgba(99,102,241,0.6)" }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    }>
      <MyTicketsContent />
    </Suspense>
  );
}















// "use client";

// import { useState, useCallback, Suspense } from "react";
// import { useSearchParams } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { Ticket, Mail, Search, Calendar, MapPin, CheckCircle2, Clock, AlertCircle, Download } from "lucide-react";

// const API = process.env.NEXT_PUBLIC_API_URL;

// function fmtDate(d) {
//   if (!d) return "TBA";
//   return new Date(d).toLocaleDateString("en-US", {
//     weekday: "short", month: "long", day: "numeric", year: "numeric",
//   });
// }

// const STATUS_CONFIG = {
//   ACTIVE:  { label: "Active",     color: "#10B981", bg: "#ECFDF5" },
//   USED:    { label: "Checked In", color: "#6366F1", bg: "#EEF2FF" },
//   EXPIRED: { label: "Expired",    color: "#9CA3AF", bg: "#F3F4F6" },
//   REVOKED: { label: "Revoked",    color: "#EF4444", bg: "#FEF2F2" },
// };

// function TicketCard({ ticket, apiBase }) {
//   const [qrOpen, setQrOpen] = useState(false);
//   const status = STATUS_CONFIG[ticket.qr_status] ?? STATUS_CONFIG.ACTIVE;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 12 }}
//       animate={{ opacity: 1, y: 0 }}
//       className="overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100"
//     >
//       {/* Top accent bar */}
//       <div className="h-1.5 w-full" style={{
//         background: ticket.ticket_type_name?.toLowerCase().includes("vip")
//           ? "linear-gradient(90deg, #C9A96E, #f0d090)"
//           : ticket.ticket_type_name?.toLowerCase().includes("pro")
//             ? "linear-gradient(90deg, #6366F1, #818CF8)"
//             : "linear-gradient(90deg, #111827, #374151)"
//       }} />

//       <div className="p-5 space-y-4">
//         {/* Header */}
//         <div className="flex items-start justify-between gap-3">
//           <div>
//             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
//               {ticket.ticket_type_name}
//             </p>
//             <h3 className="mt-1 text-lg font-bold text-gray-900 leading-tight">
//               {ticket.event_title}
//             </h3>
//           </div>
//           <span
//             className="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide"
//             style={{ background: status.bg, color: status.color }}
//           >
//             {status.label}
//           </span>
//         </div>

//         {/* Event info */}
//         <div className="space-y-1.5">
//           {ticket.starts_at_local && (
//             <div className="flex items-center gap-2 text-[12px] text-gray-500">
//               <Calendar size={12} className="shrink-0" />
//               {fmtDate(ticket.starts_at_local)}
//             </div>
//           )}
//           {(ticket.venue_name || ticket.venue_city) && (
//             <div className="flex items-center gap-2 text-[12px] text-gray-500">
//               <MapPin size={12} className="shrink-0" />
//               {[ticket.venue_name, ticket.venue_city, ticket.venue_country].filter(Boolean).join(", ")}
//             </div>
//           )}
//           <div className="flex items-center gap-2 text-[12px] text-gray-400">
//             <Clock size={12} className="shrink-0" />
//             Issued {fmtDate(ticket.issued_at)}
//           </div>
//         </div>

//         {/* Ticket holder */}
//         <div className="rounded-2xl bg-gray-50 px-4 py-3">
//           <p className="text-[10px] text-gray-400 uppercase tracking-wide">Ticket holder</p>
//           <p className="text-sm font-semibold text-gray-800 mt-0.5">{ticket.buyer_name || "—"}</p>
//           <p className="text-xs text-gray-400">{ticket.buyer_email}</p>
//         </div>

//         {/* QR section */}
//         {ticket.qr_status === "ACTIVE" && (
//           <div>
//             {!qrOpen ? (
//               <button
//                 onClick={() => setQrOpen(true)}
//                 className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-sm font-bold text-white hover:bg-gray-700 transition active:scale-[0.98]"
//               >
//                 <Ticket size={15} />
//                 Show QR Pass
//               </button>
//             ) : (
//               <div className="space-y-3">
//                 <div className="mx-auto flex w-52 h-52 items-center justify-center overflow-hidden rounded-2xl border-4 border-gray-100 shadow-sm">
//                   <img
//                     src={`${apiBase}/public/tickets/qr/${ticket.qr_token}`}
//                     alt="Ticket QR"
//                     className="w-full h-full object-cover"
//                   />
//                 </div>
//                 <p className="text-center text-[11px] text-gray-400">Present at door for entry</p>
//                 <div className="grid grid-cols-2 gap-2">
//                   <button
//                     onClick={() => setQrOpen(false)}
//                     className="rounded-xl border border-gray-200 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
//                   >
//                     Hide QR
//                   </button>
//                   <a
//                     href={`${apiBase}/public/tickets/qr/${ticket.qr_token}`}
//                     download={`ticket-${ticket.event_title?.replace(/\s+/g, "-")}.png`}
//                     className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-2.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition"
//                   >
//                     <Download size={12} /> Save QR
//                   </a>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </motion.div>
//   );
// }

// function MyTicketsContent() {
//   const searchParams = useSearchParams();
//   const initialEmail = searchParams.get("email") ?? "";

//   const [email, setEmail]     = useState(initialEmail);
//   const [input, setInput]     = useState(initialEmail);
//   const [tickets, setTickets] = useState(null); // null = not searched yet
//   const [loading, setLoading] = useState(false);
//   const [error, setError]     = useState("");

//   const search = useCallback(async (e) => {
//     e?.preventDefault();
//     const q = input.trim();
//     if (!q || !q.includes("@")) { setError("Enter a valid email address"); return; }
//     setError("");
//     setLoading(true);
//     setEmail(q);
//     try {
//       const res  = await fetch(`${API}/public/my-tickets?email=${encodeURIComponent(q)}`);
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Failed to load tickets");
//       setTickets(data.tickets ?? []);
//     } catch (err) {
//       setError(err.message);
//       setTickets(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [input]);

//   // Auto-search if email provided via URL
//   useState(() => {
//     if (initialEmail) search();
//   });

//   return (
//     <div className="min-h-screen" style={{ background: "#f8f9fa" }}>
//       {/* Header */}
//       <div className="bg-gray-900 py-12 px-4 text-center">
//         <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
//           <Ticket size={24} className="text-white" />
//         </div>
//         <h1 className="text-2xl font-black text-white tracking-tight">My Tickets</h1>
//         <p className="mt-1 text-sm text-gray-400">Enter your email to view your event tickets</p>
//       </div>

//       <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
//         {/* Search form */}
//         <form onSubmit={search} className="flex gap-2">
//           <div className="relative flex-1">
//             <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               type="email"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="your@email.com"
//               className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-indigo-400 placeholder-gray-400"
//               required
//             />
//           </div>
//           <button
//             type="submit"
//             disabled={loading}
//             className="flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-gray-700 transition disabled:opacity-60 active:scale-95"
//           >
//             {loading ? (
//               <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
//                 <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
//               </svg>
//             ) : (
//               <Search size={15} />
//             )}
//             Find
//           </button>
//         </form>

//         {error && (
//           <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
//             <AlertCircle size={15} /> {error}
//           </div>
//         )}

//         {/* Results */}
//         <AnimatePresence mode="wait">
//           {tickets !== null && (
//             <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//               {tickets.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-white border border-gray-100 py-16 text-center shadow-sm">
//                   <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
//                     <Ticket size={24} className="text-gray-400" />
//                   </div>
//                   <p className="text-sm font-semibold text-gray-700">No tickets found</p>
//                   <p className="text-xs text-gray-400 max-w-xs">
//                     We couldn&apos;t find any tickets for <strong>{email}</strong>.
//                     Make sure you use the same email you used when purchasing.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <p className="text-[12px] text-gray-400">
//                     Found <strong>{tickets.length}</strong> ticket{tickets.length !== 1 ? "s" : ""} for <strong>{email}</strong>
//                   </p>
//                   {tickets.map((t) => (
//                     <TicketCard key={t.id} ticket={t} apiBase={API} />
//                   ))}
//                 </div>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>

//         <p className="text-center text-xs text-gray-400 mt-4">
//           Powered by MeetCraft · Your tickets are private and secure
//         </p>
//       </div>
//     </div>
//   );
// }

// export default function MyTicketsPage() {
//   return (
//     <Suspense fallback={
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <svg className="h-8 w-8 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
//           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
//         </svg>
//       </div>
//     }>
//       <MyTicketsContent />
//     </Suspense>
//   );
// }
