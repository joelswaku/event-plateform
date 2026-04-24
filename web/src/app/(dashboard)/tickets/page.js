"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Settings2, X, ChevronRight, ChevronLeft,
  Ticket, ArrowRight, CalendarDays, Sparkles,
} from "lucide-react";
import { useEventStore } from "@/store/event.store";
import { EVENT_CATEGORIES } from "@/config/event-categories";
import { api } from "@/lib/api";

const ENTERTAINMENT_SUBS = EVENT_CATEGORIES.find((c) => c.id === "entertainment")?.subcategories ?? [];

/* set of eventType values that belong to the entertainment category */
const ENTERTAINMENT_EVENT_TYPES = new Set(
  ENTERTAINMENT_SUBS.map((s) => s.eventType.toUpperCase())
);

/* ── per-type accent colours ─────────────────────────────── */
const TYPE_ACCENTS = {
  CONCERT:   { from: "#f59e0b", to: "#ef4444", glow: "#f59e0b" },
  FESTIVAL:  { from: "#a855f7", to: "#ec4899", glow: "#a855f7" },
  LIVE_SHOW: { from: "#06b6d4", to: "#6366f1", glow: "#06b6d4" },
  NIGHTCLUB: { from: "#6366f1", to: "#8b5cf6", glow: "#6366f1" },
  THEATER:   { from: "#ef4444", to: "#f97316", glow: "#ef4444" },
  COMEDY:    { from: "#f97316", to: "#facc15", glow: "#f97316" },
  SPORTS:    { from: "#22c55e", to: "#06b6d4", glow: "#22c55e" },
  EXHIBITION:{ from: "#14b8a6", to: "#6366f1", glow: "#14b8a6" },
};

function getAccent(sub) {
  return TYPE_ACCENTS[sub?.id?.toUpperCase()] ?? { from: "#f59e0b", to: "#fbbf24", glow: "#f59e0b" };
}

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Type card (dark, glowing) ───────────────────────────── */
function TypeCard({ sub, onClick, index }) {
  const accent = getAccent(sub);
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onClick(sub)}
      className="relative flex flex-col items-center gap-2.5 rounded-2xl p-3.5 sm:p-4 md:p-5 text-center overflow-hidden group"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* glow blob */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${accent.glow}28 0%, transparent 70%)`,
        }}
      />
      {/* top gradient border on hover */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${accent.from}, transparent)` }}
      />
      {/* icon */}
      <div
        className="relative z-10 flex h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-xl sm:rounded-2xl text-2xl sm:text-3xl leading-none transition-transform duration-200 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${accent.from}22, ${accent.to}11)`,
          border: `1px solid ${accent.from}30`,
          boxShadow: `0 0 14px ${accent.glow}20`,
        }}
      >
        {sub.icon}
      </div>
      <p className="relative z-10 text-[11px] sm:text-xs font-bold text-white/70 group-hover:text-white/95 leading-tight transition-colors duration-200">
        {sub.label}
      </p>
    </motion.button>
  );
}

/* ── Event row (dark) ────────────────────────────────────── */
function EventRow({ event, onClick, showStats = false }) {
  return (
    <button
      onClick={() => onClick(event.id)}
      className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors group"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.07)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/85 truncate group-hover:text-amber-300 transition-colors">
          {event.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
            style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}
          >
            {event.event_type}
          </span>
          {fmtDate(event.starts_at_local) && (
            <span className="text-[10px] text-white/30">{fmtDate(event.starts_at_local)}</span>
          )}
          {showStats && event.ticket_count != null && (
            <span className="text-[10px] text-white/30">
              · {event.ticket_count} type{event.ticket_count !== 1 ? "s" : ""}
              {event.total_sold > 0 ? ` · ${event.total_sold} sold` : ""}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={14} className="shrink-0 text-white/20 group-hover:text-amber-400 transition-colors" />
    </button>
  );
}

/* ── Create Ticket modal ─────────────────────────────────── */
function CreateTicketModal({ allEvents, eventsLoading, onClose }) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(null);

  const navigate = useCallback((eventId) => {
    router.push(`/events/${eventId}/tickets`);
    onClose();
  }, [router, onClose]);

  const handleCreateNew = useCallback(() => {
    router.push(`/events/create`);
    onClose();
  }, [router, onClose]);

  const matchingEvents = selectedType
    ? allEvents.filter((e) =>
        String(e.event_type).toUpperCase() === String(selectedType.eventType).toUpperCase()
      )
    : [];

  const accent = selectedType ? getAccent(selectedType) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl"
        style={{
          background: "linear-gradient(160deg, #12121e 0%, #0d0d18 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* top accent glow line */}
        <div
          className="h-px w-full"
          style={{
            background: accent
              ? `linear-gradient(90deg, transparent, ${accent.from}, ${accent.to}, transparent)`
              : "linear-gradient(90deg, transparent, #f59e0b80, transparent)",
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            {selectedType && (
              <motion.button
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedType(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
              >
                <ChevronLeft size={14} />
              </motion.button>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={9} style={{ color: "#f59e0b" }} />
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-400">
                  Create Ticket
                </p>
              </div>
              <p className="mt-0.5 text-sm font-bold text-white/90">
                {selectedType
                  ? `${selectedType.icon} ${selectedType.label}`
                  : "Select event type"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl transition"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* step dots */}
        <div className="flex items-center justify-center gap-1.5 pb-1">
          {[0, 1].map((i) => {
            const active = selectedType ? i === 1 : i === 0;
            return (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: active ? 20 : 5,
                  height: 5,
                  background: active ? "#f59e0b" : "rgba(255,255,255,0.12)",
                }}
              />
            );
          })}
        </div>

        {/* divider */}
        <div className="mx-5 mt-3" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

        <AnimatePresence mode="wait">
          {/* Step 1 — type grid */}
          {!selectedType && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="p-4 sm:p-5 pt-3"
            >
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                Choose your event category
              </p>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {ENTERTAINMENT_SUBS.map((sub, i) => (
                  <TypeCard key={sub.id} sub={sub} index={i} onClick={setSelectedType} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2 — events list */}
          {selectedType && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
            >
              {eventsLoading ? (
                <div className="space-y-2 p-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-xl"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    />
                  ))}
                </div>
              ) : matchingEvents.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl"
                    style={{
                      background: `linear-gradient(135deg, ${accent.from}18, ${accent.to}10)`,
                      border: `1px solid ${accent.from}28`,
                    }}
                  >
                    {selectedType.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/80">
                      No {selectedType.label} events yet
                    </p>
                    <p className="mt-1 text-xs text-white/35">
                      Create a new {selectedType.label} event to start adding tickets.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreateNew}
                    className="mt-1 flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-black"
                    style={{
                      background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                      boxShadow: `0 8px 24px ${accent.glow}40`,
                    }}
                  >
                    <Plus size={14} /> Create {selectedType.label} event
                  </motion.button>
                </div>
              ) : (
                <div>
                  <p className="px-5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                    Your {selectedType.label} events
                  </p>
                  <div className="max-h-52 overflow-y-auto">
                    {matchingEvents.map((event) => (
                      <EventRow key={event.id} event={event} onClick={navigate} />
                    ))}
                  </div>
                  <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <button
                      onClick={handleCreateNew}
                      className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
                      style={{ color: accent.from }}
                      onMouseEnter={(e) => e.currentTarget.style.background = `${accent.from}12`}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <Plus size={14} /> Create new {selectedType.label} event
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* bottom safe area */}
        <div className="h-2" />
      </motion.div>
    </div>
  );
}

/* ── Manage Tickets modal (dark) ─────────────────────────── */
function ManageTicketsModal({ onClose }) {
  const router = useRouter();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/ticket-types/events-with-tickets")
      .then((r) => {
        const all = r.data.events ?? [];
        setEvents(all.filter((e) =>
          ENTERTAINMENT_EVENT_TYPES.has(String(e.event_type ?? "").toUpperCase())
        ));
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const navigate = useCallback((eventId) => {
    router.push(`/events/${eventId}/tickets`);
    onClose();
  }, [router, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl"
        style={{
          background: "linear-gradient(160deg, #12121e 0%, #0d0d18 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, #0ea5e980, transparent)" }}
        />
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={9} style={{ color: "#0ea5e9" }} />
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-sky-400">
                Manage Tickets
              </p>
            </div>
            <p className="mt-0.5 text-sm font-bold text-white/90">Events with tickets</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl transition"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="mx-5" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)" }}
              >
                <Ticket size={24} style={{ color: "#0ea5e9" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/70">No ticketed events yet</p>
                <p className="mt-1 text-xs text-white/30">
                  Use &ldquo;Create Ticket&rdquo; to add tickets to a Concert, Festival, or other entertainment event.
                </p>
              </div>
            </div>
          ) : (
            events.map((event) => (
              <EventRow key={event.id} event={event} onClick={navigate} showStats />
            ))
          )}
        </div>
        <div className="h-2" />
      </motion.div>
    </div>
  );
}

/* ── Action card ─────────────────────────────────────────── */
function ActionCard({ icon: Icon, label, description, accent, gradient, onClick, delay }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex flex-col items-start gap-5 overflow-hidden rounded-3xl p-7 text-left w-full"
      style={{
        background: "linear-gradient(160deg, #14141f 0%, #0f0f1a 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* background glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full blur-3xl transition-all duration-700 group-hover:scale-150 opacity-60"
        style={{ background: `${accent}20` }}
        aria-hidden
      />
      {/* top border glow on hover */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-400"
        style={{ background: gradient }}
      />

      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
          border: `1px solid ${accent}30`,
          boxShadow: `0 0 20px ${accent}15`,
        }}
      >
        <Icon size={22} style={{ color: accent }} />
      </div>

      <div className="relative">
        <p className="text-lg font-bold text-white/90">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-white/40">{description}</p>
      </div>

      <div
        className="relative flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] transition-transform duration-200 group-hover:translate-x-1"
        style={{ color: accent }}
      >
        Get started <ArrowRight size={11} />
      </div>
    </motion.button>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function TicketsPage() {
  const { events, fetchEvents, loading } = useEventStore();
  const [modal, setModal] = useState(null);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={12} style={{ color: "#f59e0b" }} />
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-500">Ticketing</p>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Tickets</h1>
        <p className="mt-1 text-sm text-gray-400">What would you like to do?</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          icon={Plus}
          label="Create Ticket"
          description="Choose your event type — Concert, Festival, Live Show and more — then add ticket tiers with custom pricing."
          accent="#f59e0b"
          gradient="linear-gradient(90deg, transparent, #f59e0b80, transparent)"
          delay={0.05}
          onClick={() => setModal("create")}
        />
        <ActionCard
          icon={Settings2}
          label="Manage Tickets"
          description="View and edit tickets you've already created, track orders and revenue, monitor attendance."
          accent="#0ea5e9"
          gradient="linear-gradient(90deg, transparent, #0ea5e980, transparent)"
          delay={0.12}
          onClick={() => setModal("manage")}
        />
      </div>

      <AnimatePresence>
        {modal === "create" && (
          <CreateTicketModal
            allEvents={events}
            eventsLoading={loading}
            onClose={() => setModal(null)}
          />
        )}
        {modal === "manage" && (
          <ManageTicketsModal onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
