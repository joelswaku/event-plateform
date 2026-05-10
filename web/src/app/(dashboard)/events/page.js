"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus, Lock, Zap, CalendarDays, Clock, MapPin, ArrowRight, Sparkles,
  Search, X, Home, Ticket, User, ChevronRight,
} from "lucide-react";
import { useEventStore }        from "@/store/event.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import PageHeader from "@/components/ui/page-header";

// ── Event cover fallbacks ─────────────────────────────────────────────────────
const EVENT_IMGS = {
  wedding:         "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=70",
  conference:      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=70",
  birthday:        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&q=70",
  concert:         "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=70",
  festival:        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&q=70",
  corporate_event: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=70",
  networking:      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&q=70",
};
const DEFAULT_IMG = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=70";
function heroImg(ev) {
  if (!ev) return DEFAULT_IMG;
  if (ev.cover_image_url) return ev.cover_image_url;
  const key = ev.event_type?.toLowerCase();
  return key && EVENT_IMGS[key] ? EVENT_IMGS[key] : DEFAULT_IMG;
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch { return ""; }
}

// ── Status colors matching the mobile app ────────────────────────────────────
const STATUS_CFG = {
  PUBLISHED: { bg: "rgba(16,185,129,0.15)",  text: "#10b981", dot: "#10b981" },
  DRAFT:     { bg: "rgba(245,158,11,0.15)",   text: "#f59e0b", dot: "#f59e0b" },
  CANCELLED: { bg: "rgba(239,68,68,0.15)",    text: "#ef4444", dot: "#ef4444" },
  ARCHIVED:  { bg: "rgba(107,114,128,0.15)",  text: "#9ca3af", dot: "#6b7280" },
};
const sc = (s) => STATUS_CFG[(s ?? "DRAFT").toUpperCase()] ?? STATUS_CFG.DRAFT;

const CHIP_COLOR = {
  ALL:       "#6366f1",
  DRAFT:     "#f59e0b",
  PUBLISHED: "#10b981",
  ARCHIVED:  "#9ca3af",
  CANCELLED: "#ef4444",
};

// ── Free-tier limit banner (desktop) ─────────────────────────────────────────
function EventLimitBanner({ used, limit, onUpgrade }) {
  const pct     = Math.min((used / limit) * 100, 100);
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
              {atLimit ? "You've reached your free event limit" : `${used} of ${limit} free event used`}
            </p>
            <p className="mt-0.5 text-[12px] text-gray-500">
              {atLimit
                ? "Upgrade to Premium to create unlimited events."
                : "Free plan includes 1 event. Upgrade for unlimited."}
            </p>
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

// ── Locked create card (desktop) ──────────────────────────────────────────────
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

// ── Desktop event card ────────────────────────────────────────────────────────
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
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-600">
            {event.event_type}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColor.bg} ${statusColor.text}`}>
            {event.status}
          </span>
        </div>
        <h3 className="text-[15px] font-semibold leading-snug text-gray-900 group-hover:text-indigo-600 transition-colors">
          {event.title}
        </h3>
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
        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-gray-300 transition-colors group-hover:text-indigo-500">
          Open event
          <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOBILE COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function MobileBottomNav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/dashboard", label: "Home",    Icon: Home,         active: pathname === "/dashboard" },
    { href: "/events",    label: "Events",  Icon: CalendarDays, active: pathname.startsWith("/events") && !pathname.includes("create") },
    null,
    { href: "/tickets",   label: "Tickets", Icon: Ticket,       active: pathname === "/tickets" },
    { href: "/settings",  label: "Account", Icon: User,         active: pathname === "/settings" },
  ];

  return (
    <div
      className="shrink-0 border-t px-1 pt-2"
      style={{
        background: "#0e0e16",
        borderColor: "rgba(255,255,255,0.08)",
        paddingBottom: "max(10px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-end justify-around">
        {tabs.map((tab, i) => {
          if (!tab) {
            return (
              <Link key="create" href="/events/create" className="-mt-5 flex flex-col items-center gap-1">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-[18px]"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", boxShadow: "0 4px 20px rgba(99,102,241,0.45)" }}
                >
                  <Plus size={24} className="text-white" />
                </div>
                <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>
                  Create
                </span>
              </Link>
            );
          }
          const { href, label, Icon, active } = tab;
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-3 py-1">
              <Icon size={22} style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }} />
              <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileEventCard({ event }) {
  const cfg  = sc(event.status);
  const date = fmtDate(event.starts_at_local ?? event.starts_at_utc);

  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-center overflow-hidden rounded-[18px] border"
      style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <div className="relative h-[80px] w-[80px] shrink-0 overflow-hidden" style={{ background: "#14141f" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImg(event)} alt={event.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.45))" }} />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 py-3 px-3">
        <span className="line-clamp-1 text-[14px] font-extrabold tracking-tight text-white">{event.title}</span>
        {date && (
          <div className="flex items-center gap-1">
            <Clock size={10} style={{ color: "rgba(255,255,255,0.30)" }} />
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.30)" }}>{date}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: cfg.bg }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.4px]" style={{ color: cfg.text }}>
              {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
            </span>
          </div>
          {event.event_type && (
            <span className="truncate text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>
              {event.event_type}
            </span>
          )}
        </div>
      </div>

      <div className="pr-3.5">
        <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.20)" }} />
      </div>
    </Link>
  );
}

function MobileEventsPage({
  events, loading, mobileFiltered, query, setQuery,
  filter, setFilter, counts, handleNewEvent,
  isPremium, handleUpgrade, eventUsage, eventLimit,
}) {
  const FILTERS = [
    { key: "ALL",       label: "All" },
    { key: "DRAFT",     label: "Draft" },
    { key: "PUBLISHED", label: "Published" },
    { key: "ARCHIVED",  label: "Archived" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: "#07070f" }}>

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-4"
        style={{ paddingTop: "max(52px, env(safe-area-inset-top))" }}
      >
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.6px]" style={{ color: "rgba(255,255,255,0.40)" }}>
            Dashboard
          </p>
          <p className="text-[22px] font-black tracking-tight text-white">My Events</p>
        </div>
        <button
          onClick={handleNewEvent}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[12px]"
          style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)" }}
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* Search */}
      <div
        className="mx-4 mb-3 flex items-center gap-2.5 rounded-[14px] border px-3.5"
        style={{ height: 44, background: "#14141f", borderColor: "rgba(255,255,255,0.10)" }}
      >
        <Search size={15} style={{ color: "rgba(255,255,255,0.30)" }} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events…"
          className="flex-1 bg-transparent text-[14px] font-medium text-white outline-none placeholder:text-[rgba(255,255,255,0.22)]"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <X size={11} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="mb-3 flex gap-2 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const color  = CHIP_COLOR[f.key];
          const count  = counts[f.key] ?? 0;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold"
              style={{
                height: 32,
                background: active ? `${color}22` : "#14141f",
                borderColor: active ? `${color}55` : "rgba(255,255,255,0.10)",
                color: active ? color : "rgba(255,255,255,0.45)",
              }}
            >
              {f.label}
              {count > 0 && (
                <span
                  className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold"
                  style={{
                    background: active ? `${color}30` : "rgba(255,255,255,0.08)",
                    color: active ? color : "rgba(255,255,255,0.30)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 px-4 pb-6">

          {/* Free plan nudge */}
          {!isPremium && (
            <button
              onClick={handleUpgrade}
              className="flex items-center justify-between overflow-hidden rounded-[16px] border px-4 py-3"
              style={{ background: "rgba(245,158,11,0.10)", borderColor: "rgba(245,158,11,0.25)" }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[16px] leading-none">⚡</span>
                <div className="text-left">
                  <p className="text-[12px] font-extrabold text-white">{eventUsage}/{eventLimit} free events used</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>Upgrade for unlimited events</p>
                </div>
              </div>
              <span
                className="shrink-0 rounded-[9px] px-3 py-1.5 text-[11px] font-extrabold"
                style={{ background: "rgba(245,158,11,0.20)", border: "1px solid rgba(245,158,11,0.38)", color: "#f59e0b" }}
              >
                Upgrade
              </span>
            </button>
          )}

          {loading && events.length === 0 ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-[80px] animate-pulse rounded-[18px]" style={{ background: "#0e0e16" }} />
            ))
          ) : mobileFiltered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div
                className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[22px] border"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(167,139,250,0.10) 100%)",
                  borderColor: "rgba(99,102,241,0.20)",
                }}
              >
                <CalendarDays size={28} style={{ color: "#6366f1" }} />
              </div>
              <p className="text-[18px] font-black tracking-tight text-white">
                {query ? `No results for "${query}"` : filter !== "ALL" ? `No ${filter.toLowerCase()} events` : "No events yet"}
              </p>
              <p className="text-[13px] leading-5" style={{ color: "rgba(255,255,255,0.40)" }}>
                {query
                  ? "Try a different search term."
                  : filter !== "ALL"
                  ? "Events with this status will appear here."
                  : "Create your first event to get started."}
              </p>
              {!query && filter === "ALL" && (
                <button
                  onClick={handleNewEvent}
                  className="mt-1 flex items-center gap-2 overflow-hidden rounded-full px-6 py-3"
                  style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)" }}
                >
                  <Plus size={14} className="text-white" />
                  <span className="text-[14px] font-extrabold text-white">Create Event</span>
                </button>
              )}
            </div>
          ) : (
            mobileFiltered.map((event) => (
              <MobileEventCard key={event.id} event={event} />
            ))
          )}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function EventsPage() {
  const router = useRouter();
  const { events, fetchEvents, loading } = useEventStore();
  const {
    plan, isSubscribed, usage, limits,
    isAtEventLimit, openUpgradeModal, fetchSubscription,
  } = useSubscriptionStore();

  const [query,  setQuery]  = useState("");
  const [filter, setFilter] = useState("ALL");

  const isPremium  = isSubscribed && plan === "premium";
  const atLimit    = isAtEventLimit();
  const eventUsage = usage?.events ?? events.length;
  const eventLimit = limits?.events ?? 1;

  useEffect(() => {
    fetchEvents();
    fetchSubscription();
  }, [fetchEvents, fetchSubscription]);

  const handleNewEvent = useCallback(() => {
    if (atLimit) { openUpgradeModal("events"); return; }
    router.push("/events/create");
  }, [atLimit, openUpgradeModal, router]);

  const handleUpgrade = useCallback(() => openUpgradeModal("events"), [openUpgradeModal]);

  // Desktop: search only
  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      [e.title, e.venue_name, e.event_type, e.status, e.city, e.country]
        .some((v) => v && String(v).toLowerCase().includes(q))
    );
  }, [events, query]);

  // Mobile: search + status filter
  const mobileFiltered = useMemo(() => {
    let list = filter !== "ALL" ? events.filter(e => e.status === filter) : events;
    const q  = query.trim().toLowerCase();
    if (q) list = list.filter(e =>
      [e.title, e.venue_name, e.event_type, e.status, e.city, e.country]
        .some(v => v && String(v).toLowerCase().includes(q))
    );
    return list;
  }, [events, filter, query]);

  const counts = useMemo(() => {
    const c = { ALL: events.length };
    for (const e of events) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [events]);

  return (
    <>
      {/* ── Mobile layout ── */}
      <div className="sm:hidden">
        <MobileEventsPage
          events={events}
          loading={loading}
          mobileFiltered={mobileFiltered}
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          counts={counts}
          handleNewEvent={handleNewEvent}
          isPremium={isPremium}
          handleUpgrade={handleUpgrade}
          eventUsage={eventUsage}
          eventLimit={eventLimit}
        />
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden sm:block">
        <div className="space-y-5">
          <PageHeader
            eyebrow="Events"
            title="All events"
            description="Browse and manage all events in your organization."
            action={
              atLimit ? (
                <button
                  onClick={handleNewEvent}
                  className="group inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all active:scale-95"
                  style={{ background: "#F59E0B", color: "#000", boxShadow: "0 4px 16px rgba(245,158,11,0.3)" }}
                >
                  <Lock size={15} />
                  New event
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">Premium</span>
                </button>
              ) : (
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

          {!isPremium && (
            <EventLimitBanner used={eventUsage} limit={eventLimit} onUpgrade={handleUpgrade} />
          )}

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
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
          )}

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
                {!isPremium && atLimit && !query && (
                  <LockedCreateCard onUpgrade={handleUpgrade} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
