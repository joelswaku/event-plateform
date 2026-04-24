"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Mail, Search, Calendar, MapPin, CheckCircle2, Clock, AlertCircle, Download } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function fmtDate(d) {
  if (!d) return "TBA";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });
}

const STATUS_CONFIG = {
  ACTIVE:  { label: "Active",     color: "#10B981", bg: "#ECFDF5" },
  USED:    { label: "Checked In", color: "#6366F1", bg: "#EEF2FF" },
  EXPIRED: { label: "Expired",    color: "#9CA3AF", bg: "#F3F4F6" },
  REVOKED: { label: "Revoked",    color: "#EF4444", bg: "#FEF2F2" },
};

function TicketCard({ ticket, apiBase }) {
  const [qrOpen, setQrOpen] = useState(false);
  const status = STATUS_CONFIG[ticket.qr_status] ?? STATUS_CONFIG.ACTIVE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100"
    >
      {/* Top accent bar */}
      <div className="h-1.5 w-full" style={{
        background: ticket.ticket_type_name?.toLowerCase().includes("vip")
          ? "linear-gradient(90deg, #C9A96E, #f0d090)"
          : ticket.ticket_type_name?.toLowerCase().includes("pro")
            ? "linear-gradient(90deg, #6366F1, #818CF8)"
            : "linear-gradient(90deg, #111827, #374151)"
      }} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {ticket.ticket_type_name}
            </p>
            <h3 className="mt-1 text-lg font-bold text-gray-900 leading-tight">
              {ticket.event_title}
            </h3>
          </div>
          <span
            className="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
        </div>

        {/* Event info */}
        <div className="space-y-1.5">
          {ticket.starts_at_local && (
            <div className="flex items-center gap-2 text-[12px] text-gray-500">
              <Calendar size={12} className="shrink-0" />
              {fmtDate(ticket.starts_at_local)}
            </div>
          )}
          {(ticket.venue_name || ticket.venue_city) && (
            <div className="flex items-center gap-2 text-[12px] text-gray-500">
              <MapPin size={12} className="shrink-0" />
              {[ticket.venue_name, ticket.venue_city, ticket.venue_country].filter(Boolean).join(", ")}
            </div>
          )}
          <div className="flex items-center gap-2 text-[12px] text-gray-400">
            <Clock size={12} className="shrink-0" />
            Issued {fmtDate(ticket.issued_at)}
          </div>
        </div>

        {/* Ticket holder */}
        <div className="rounded-2xl bg-gray-50 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Ticket holder</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{ticket.buyer_name || "—"}</p>
          <p className="text-xs text-gray-400">{ticket.buyer_email}</p>
        </div>

        {/* QR section */}
        {ticket.qr_status === "ACTIVE" && (
          <div>
            {!qrOpen ? (
              <button
                onClick={() => setQrOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-sm font-bold text-white hover:bg-gray-700 transition active:scale-[0.98]"
              >
                <Ticket size={15} />
                Show QR Pass
              </button>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex w-52 h-52 items-center justify-center overflow-hidden rounded-2xl border-4 border-gray-100 shadow-sm">
                  <img
                    src={`${apiBase}/public/tickets/qr/${ticket.qr_token}`}
                    alt="Ticket QR"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-center text-[11px] text-gray-400">Present at door for entry</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setQrOpen(false)}
                    className="rounded-xl border border-gray-200 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    Hide QR
                  </button>
                  <a
                    href={`${apiBase}/public/tickets/qr/${ticket.qr_token}`}
                    download={`ticket-${ticket.event_title?.replace(/\s+/g, "-")}.png`}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-2.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    <Download size={12} /> Save QR
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MyTicketsContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail]     = useState(initialEmail);
  const [input, setInput]     = useState(initialEmail);
  const [tickets, setTickets] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const search = useCallback(async (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q || !q.includes("@")) { setError("Enter a valid email address"); return; }
    setError("");
    setLoading(true);
    setEmail(q);
    try {
      const res  = await fetch(`${API}/public/my-tickets?email=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load tickets");
      setTickets(data.tickets ?? []);
    } catch (err) {
      setError(err.message);
      setTickets(null);
    } finally {
      setLoading(false);
    }
  }, [input]);

  // Auto-search if email provided via URL
  useState(() => {
    if (initialEmail) search();
  });

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fa" }}>
      {/* Header */}
      <div className="bg-gray-900 py-12 px-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
          <Ticket size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">My Tickets</h1>
        <p className="mt-1 text-sm text-gray-400">Enter your email to view your event tickets</p>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
        {/* Search form */}
        <form onSubmit={search} className="flex gap-2">
          <div className="relative flex-1">
            <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-indigo-400 placeholder-gray-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-gray-700 transition disabled:opacity-60 active:scale-95"
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <Search size={15} />
            )}
            Find
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {tickets !== null && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-white border border-gray-100 py-16 text-center shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                    <Ticket size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No tickets found</p>
                  <p className="text-xs text-gray-400 max-w-xs">
                    We couldn&apos;t find any tickets for <strong>{email}</strong>.
                    Make sure you use the same email you used when purchasing.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[12px] text-gray-400">
                    Found <strong>{tickets.length}</strong> ticket{tickets.length !== 1 ? "s" : ""} for <strong>{email}</strong>
                  </p>
                  {tickets.map((t) => (
                    <TicketCard key={t.id} ticket={t} apiBase={API} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by MeetCraft · Your tickets are private and secure
        </p>
      </div>
    </div>
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="h-8 w-8 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    }>
      <MyTicketsContent />
    </Suspense>
  );
}
