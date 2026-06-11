"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, CalendarDays, ExternalLink, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useSuperAdminStore } from "@/store/superAdmin.store";

const STATUS_COLORS = {
  PUBLISHED: { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
  DRAFT:     { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  ARCHIVED:  { bg: "rgba(107,114,128,0.15)", text: "#9ca3af" },
  CANCELLED: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n ?? 0);
}

export default function SuperAdminEventsPage() {
  const { events, eventsMeta, fetchEvents, updateEvent, deleteEvent, loading } = useSuperAdminStore();
  const [q,       setQ]       = useState("");
  const [status,  setStatus]  = useState("");
  const [page,    setPage]    = useState(1);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => {
    fetchEvents({ q, status, page, limit: 50 });
  }, [q, status, page, fetchEvents]);

  useEffect(() => { load(); }, [load]);

  async function handleToggleStatus(ev) {
    const next = ev.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await updateEvent(ev.id, { status: next });
  }

  async function handleDelete(ev) {
    if (confirm?.id !== ev.id) { setConfirm(ev); return; }
    await deleteEvent(ev.id);
    setConfirm(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(201,169,110,0.60)" }}>Super Admin</p>
          <h1 className="text-[20px] font-black tracking-tight text-white">All Events</h1>
          {eventsMeta && <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{eventsMeta.total} total</p>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-xl px-3.5 flex-1 max-w-sm"
          style={{ height: 42, background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <Search size={14} style={{ color: "rgba(255,255,255,0.30)" }} />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search events or org…"
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-[rgba(255,255,255,0.25)]"
          />
          {q && <button onClick={() => setQ("")}><X size={12} style={{ color: "rgba(255,255,255,0.40)" }} /></button>}
        </div>
        {["", "PUBLISHED", "DRAFT", "ARCHIVED", "CANCELLED"].map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className="rounded-full px-3 py-1.5 text-[12px] font-bold border transition-all"
            style={{
              background:   status === s ? "rgba(201,169,110,0.15)" : "transparent",
              borderColor:  status === s ? "rgba(201,169,110,0.40)" : "rgba(255,255,255,0.12)",
              color:        status === s ? "#c9a96e" : "rgba(255,255,255,0.45)",
            }}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(201,169,110,0.10)", background: "#0d0d1a" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Event", "Organization", "Status", "Date", "Guests", "Tickets", "Revenue", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                    style={{ color: "rgba(201,169,110,0.50)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && !events.length ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {[200, 140, 60, 80, 40, 40, 70, 60].map((w, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3 rounded animate-pulse" style={{ width: w, background: "rgba(255,255,255,0.07)" }} />
                        {j <= 1 && <div className="h-2.5 rounded animate-pulse mt-1.5" style={{ width: w * 0.7, background: "rgba(255,255,255,0.04)" }} />}
                      </td>
                    ))}
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                        <CalendarDays size={24} style={{ color: "rgba(245,158,11,0.40)" }} />
                      </div>
                      <p className="text-[14px] font-black text-white">No events found</p>
                      <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.30)" }}>
                        {q ? `No results matching "${q}"` : "Events will appear here as organizers publish them"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : events.map((ev, i) => {
                const sc = STATUS_COLORS[ev.status] ?? STATUS_COLORS.DRAFT;
                return (
                  <motion.tr
                    key={ev.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white max-w-50 truncate">{ev.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{ev.event_type ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white truncate max-w-35">{ev.org_name}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.30)" }}>{ev.owner_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: sc.bg, color: sc.text }}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.50)" }}>
                      {fmtDate(ev.starts_at)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-white">{ev.guest_count}</td>
                    <td className="px-4 py-3 tabular-nums text-white">{ev.ticket_count}</td>
                    <td className="px-4 py-3 tabular-nums font-bold" style={{ color: "#c9a96e" }}>{fmtMoney(ev.revenue)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/events/${ev.id}`} target="_blank"
                          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                          style={{ color: "rgba(255,255,255,0.40)" }}>
                          <ExternalLink size={13} />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(ev)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                          style={{ color: ev.status === "PUBLISHED" ? "#10b981" : "rgba(255,255,255,0.40)" }}
                          title={ev.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        >
                          {ev.status === "PUBLISHED" ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                        <button
                          onClick={() => handleDelete(ev)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                          style={{ color: confirm?.id === ev.id ? "#ef4444" : "rgba(255,255,255,0.25)" }}
                          title={confirm?.id === ev.id ? "Click again to confirm delete" : "Delete event"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {eventsMeta && eventsMeta.total > 50 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.30)" }}>
              Page {page} · {eventsMeta.total} total
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}>← Prev</button>
              <button disabled={page * 50 >= eventsMeta.total} onClick={() => setPage(p => p + 1)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-30"
                style={{ background: "rgba(201,169,110,0.15)", color: "#c9a96e" }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
