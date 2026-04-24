"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Lock, Zap, CalendarDays, Clock, MapPin, ArrowRight, Sparkles, Search, X } from "lucide-react";
import { useEventStore } from "@/store/event.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import PageHeader from "@/components/ui/page-header";

// ── Free-tier limit banner ────────────────────────────────────────────────────
function EventLimitBanner({ used, limit, onUpgrade }) {
  const pct = Math.min((used / limit) * 100, 100);
  const atLimit = used >= limit;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: atLimit
          ? "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(245,158,11,0.06) 100%)"
          : "linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(249,115,22,0.04) 100%)",
        border: atLimit
          ? "1px solid rgba(239,68,68,0.2)"
          : "1px solid rgba(245,158,11,0.18)",
      }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl"
        style={{ background: atLimit ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)" }} aria-hidden />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: atLimit ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)" }}>
            {atLimit
              ? <Lock size={16} style={{ color: "#EF4444" }} />
              : <CalendarDays size={16} style={{ color: "#F59E0B" }} />
            }
          </div>
          <div>
            <p className="text-[13px] font-bold text-gray-900">
              {atLimit
                ? "You've reached your free event limit"
                : `${used} of ${limit} free event used`}
            </p>
            <p className="mt-0.5 text-[12px] text-gray-500">
              {atLimit
                ? "Upgrade to Premium to create unlimited events."
                : "Free plan includes 1 event. Upgrade for unlimited."}
            </p>
            {/* Progress bar */}
            <div className="mt-2.5 h-1.5 w-40 overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ background: atLimit ? "#EF4444" : "#F59E0B" }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={onUpgrade}
          className="group flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-[12px] font-bold transition-all active:scale-95"
          style={{ background: "#F59E0B", color: "#000" }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(245,158,11,0.4)")}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
        >
          <Zap size={12} fill="currentColor" />
          Upgrade to Premium
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Locked "create event" placeholder ────────────────────────────────────────
function LockedCreateCard({ onUpgrade }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      onClick={onUpgrade}
      className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-200 hover:border-amber-300 hover:bg-amber-50/50"
      style={{ borderColor: "rgba(245,158,11,0.3)" }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110"
        style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
        <Lock size={20} style={{ color: "#F59E0B" }} />
      </div>
      <div>
        <p className="text-[13px] font-bold text-gray-800">Create another event</p>
        <p className="mt-1 text-[12px] text-gray-400">Upgrade to Premium for unlimited events</p>
      </div>
      <button
        className="flex items-center gap-1.5 rounded-full px-5 py-2 text-[11px] font-bold transition-all active:scale-95"
        style={{ background: "#F59E0B", color: "#000" }}
      >
        <Sparkles size={11} />
        Upgrade — $12/mo
      </button>
    </motion.div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ event, index }) {
  const statusColor = {
    DRAFT:     { bg: "bg-gray-100",   text: "text-gray-600"  },
    PUBLISHED: { bg: "bg-green-100",  text: "text-green-700" },
    CANCELED:  { bg: "bg-red-100",    text: "text-red-600"   },
    ARCHIVED:  { bg: "bg-yellow-100", text: "text-yellow-700"},
  }[event.status?.toUpperCase()] ?? { bg: "bg-gray-100", text: "text-gray-600" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <Link
        href={`/events/${event.id}`}
        className="group flex flex-col gap-3 rounded-3xl border border-[#e5e7eb] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
      >
        {/* Type + status row */}
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-600">
            {event.event_type}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColor.bg} ${statusColor.text}`}>
            {event.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold leading-snug text-gray-900 group-hover:text-indigo-600 transition-colors">
          {event.title}
        </h3>

        {/* Meta */}
        <div className="flex flex-col gap-1.5">
          {event.starts_at_local && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Clock size={11} />
              {new Date(event.starts_at_local).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric", year: "numeric",
              })}
            </div>
          )}
          {event.venue_name && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <MapPin size={11} />
              {event.venue_name}
            </div>
          )}
        </div>

        {/* Arrow hint */}
        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-gray-300 transition-colors group-hover:text-indigo-500">
          Open event
          <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const router = useRouter();
  const { events, fetchEvents, loading } = useEventStore();
  const {
    plan, isSubscribed, usage, limits,
    isAtEventLimit, openUpgradeModal, fetchSubscription,
  } = useSubscriptionStore();

  const [query, setQuery] = useState("");

  const isPremium  = isSubscribed && plan === "premium";
  const atLimit    = isAtEventLimit();
  const eventUsage = usage?.events ?? events.length;
  const eventLimit = limits?.events ?? 1;

  useEffect(() => {
    fetchEvents();
    fetchSubscription();
  }, [fetchEvents, fetchSubscription]);

  const handleNewEvent = useCallback(() => {
    if (atLimit) {
      openUpgradeModal("events");
      return;
    }
    router.push("/events/create");
  }, [atLimit, openUpgradeModal, router]);

  const handleUpgrade = useCallback(() => openUpgradeModal("events"), [openUpgradeModal]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      [e.title, e.venue_name, e.event_type, e.status, e.city, e.country]
        .some((v) => v && String(v).toLowerCase().includes(q))
    );
  }, [events, query]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Events"
        title="All events"
        description="Browse and manage all events in your organization."
        action={
          atLimit ? (
            /* Locked state CTA */
            <button
              onClick={handleNewEvent}
              className="group inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all active:scale-95"
              style={{ background: "#F59E0B", color: "#000", boxShadow: "0 4px 16px rgba(245,158,11,0.3)" }}
            >
              <Lock size={15} />
              New event
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
                Premium
              </span>
            </button>
          ) : (
            /* Normal CTA */
            <button
              onClick={handleNewEvent}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-4 py-3 text-sm font-medium text-white transition-all hover:bg-[#1f2937] active:scale-95"
            >
              <Plus size={15} />
              New event
            </button>
          )
        }
      />

      {/* Plan limit banner — shown on free plan */}
      {!isPremium && (
        <EventLimitBanner
          used={eventUsage}
          limit={eventLimit}
          onUpgrade={handleUpgrade}
        />
      )}

      {/* Search */}
      {!loading && events.length > 0 && (
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events by name, venue, type…"
            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Events grid */}
      <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <CalendarDays size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No events yet</p>
            <p className="text-xs text-gray-400">Create your first event to get started.</p>
            <button
              onClick={handleNewEvent}
              className="mt-2 flex items-center gap-2 rounded-2xl bg-[#111827] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#1f2937]"
            >
              <Plus size={14} />
              Create event
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <Search size={24} className="text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No events match &ldquo;{query}&rdquo;</p>
            <button onClick={() => setQuery("")} className="text-xs text-indigo-500 hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}

            {/* Locked "create another" card for free users at limit — only when not filtering */}
            {!isPremium && atLimit && !query && (
              <LockedCreateCard onUpgrade={handleUpgrade} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
