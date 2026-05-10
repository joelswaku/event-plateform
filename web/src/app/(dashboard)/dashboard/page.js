"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Zap, Bell, Layers, Globe, FileEdit, DollarSign,
  PlusCircle, CalendarDays, Ticket, User, Plus,
  Home, Calendar, MapPin, ChevronRight, Check,
  Activity, Users,
} from "lucide-react";

import { useAuthStore }         from "@/store/auth.store";
import { useEventStore }        from "@/store/event.store";
import { useSubscriptionStore } from "@/store/subscription.store";

// Desktop-only components
import PageHeader  from "@/components/ui/page-header";
import StatCard    from "@/components/ui/stat-card";
import EmptyState  from "@/components/ui/empty-state";
import EventActions from "@/components/events/event-actions";

// ─── Event cover image fallbacks (same as mobile app) ─────────────────
const EVENT_IMGS = {
  wedding:         "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  conference:      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  birthday:        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80",
  concert:         "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80",
  festival:        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
  corporate_event: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  networking:      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80",
  charity:         "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80",
};
const DEFAULT_IMG = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80";

function heroImg(ev) {
  if (!ev) return DEFAULT_IMG;
  if (ev.cover_image_url) return ev.cover_image_url;
  const key = ev.event_type?.toLowerCase();
  return key && EVENT_IMGS[key] ? EVENT_IMGS[key] : DEFAULT_IMG;
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
  } catch { return "—"; }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Status colors matching the mobile app exactly
const STATUS_CFG = {
  PUBLISHED: { bg: "rgba(16,185,129,0.15)",  text: "#10b981", dot: "#10b981" },
  DRAFT:     { bg: "rgba(245,158,11,0.15)",   text: "#f59e0b", dot: "#f59e0b" },
  CANCELLED: { bg: "rgba(239,68,68,0.15)",    text: "#ef4444", dot: "#ef4444" },
  ARCHIVED:  { bg: "rgba(107,114,128,0.15)",  text: "#9ca3af", dot: "#6b7280" },
};
const sc = (status) => STATUS_CFG[status] ?? STATUS_CFG.DRAFT;

// ═══════════════════════════════════════════════════════════════════════
// MOBILE COMPONENTS — pixel-match of the React Native home screen
// ═══════════════════════════════════════════════════════════════════════

function MobileStatTile({ value, label, Icon, accent }) {
  return (
    <div
      className="flex w-[84px] shrink-0 flex-col gap-1 overflow-hidden rounded-[18px] border p-[14px]"
      style={{
        borderColor: `${accent}22`,
        background: `linear-gradient(135deg, ${accent}18 0%, ${accent}06 100%)`,
      }}
    >
      <div
        className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-[9px]"
        style={{ background: `${accent}20` }}
      >
        <Icon size={14} style={{ color: accent }} />
      </div>
      <span
        className="text-[22px] font-black leading-none tracking-tight"
        style={{ color: accent }}
      >
        {value}
      </span>
      <span
        className="text-[10px] font-bold uppercase tracking-[0.4px]"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        {label}
      </span>
    </div>
  );
}

function MobileUpgradeBanner({ onUpgrade }) {
  return (
    <div
      className="mx-5 mt-3.5 flex items-center justify-between overflow-hidden rounded-2xl border px-3.5 py-3.5"
      style={{ borderColor: "rgba(245,158,11,0.30)", background: "rgba(245,158,11,0.12)" }}
    >
      <div className="flex flex-1 items-center gap-2.5">
        <span className="text-[22px] leading-none select-none">⚡</span>
        <div>
          <p className="text-[13px] font-extrabold text-white">Unlock Pro Features</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Unlimited events, custom domains & more
          </p>
        </div>
      </div>
      <button
        onClick={onUpgrade}
        className="ml-3 shrink-0 rounded-[10px] px-3.5 py-2 text-[12px] font-extrabold"
        style={{
          background: "rgba(245,158,11,0.25)",
          border: "1px solid rgba(245,158,11,0.45)",
          color: "#f59e0b",
        }}
      >
        Upgrade
      </button>
    </div>
  );
}

function MobilePremiumBadge() {
  return (
    <div
      className="relative mx-5 mt-3.5 flex items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3.5"
      style={{ borderColor: "rgba(99,102,241,0.30)", background: "rgba(99,102,241,0.10)" }}
    >
      {/* glow */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl"
        style={{ background: "rgba(99,102,241,0.25)" }}
        aria-hidden
      />
      <div
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
        style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)", boxShadow: "0 4px 14px rgba(99,102,241,0.40)" }}
      >
        <span className="text-[16px] leading-none select-none">✦</span>
      </div>
      <div className="relative flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-extrabold text-white">Premium Active</p>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
            style={{ background: "rgba(99,102,241,0.30)", color: "#a78bfa" }}
          >
            PRO
          </span>
        </div>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          All features unlocked — unlimited events &amp; more
        </p>
      </div>
      <div
        className="relative shrink-0 rounded-[10px] px-3 py-2 text-[11px] font-extrabold"
        style={{ background: "rgba(99,102,241,0.20)", border: "1px solid rgba(99,102,241,0.35)", color: "#a78bfa" }}
      >
        ✓ Active
      </div>
    </div>
  );
}

function MobileQuickAction({ Icon, label, href, fromColor, toColor }) {
  return (
    <Link href={href} className="flex flex-1 flex-col items-center gap-2">
      <div
        className="flex h-[64px] w-[64px] items-center justify-center rounded-[20px]"
        style={{ background: `linear-gradient(135deg, ${fromColor}, ${toColor})` }}
      >
        <Icon size={22} className="text-white" />
      </div>
      <span
        className="text-[11px] font-extrabold uppercase tracking-[0.3px]"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        {label}
      </span>
    </Link>
  );
}

function MobileFeaturedCard({ event }) {
  const cfg  = sc(event.status);
  const date = fmtDate(event.starts_at_utc ?? event.starts_at ?? event.starts_at_local);
  const loc  = event.location || event.city;

  return (
    <Link
      href={`/events/${event.id}`}
      className="relative block overflow-hidden rounded-[22px] border"
      style={{ height: 220, borderColor: "rgba(255,255,255,0.06)", background: "#0e0e16" }}
    >
      {/* Cover image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImg(event)}
        alt={event.title}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.88) 100%)" }}
      />

      {/* Top row: status pill + arrow */}
      <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between">
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: cfg.bg }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
          <span className="text-[11px] font-extrabold" style={{ color: cfg.text }}>
            {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
          </span>
        </div>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full border"
          style={{ background: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.12)" }}
        >
          <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.6)" }} />
        </div>
      </div>

      {/* Bottom: title + meta */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 p-4">
        <p className="text-[20px] font-black leading-[1.3] tracking-tight text-white line-clamp-2">
          {event.title}
        </p>
        <div className="flex flex-wrap gap-3.5">
          <div className="flex items-center gap-1.5">
            <Calendar size={11} style={{ color: "rgba(255,255,255,0.55)" }} />
            <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
              {date}
            </span>
          </div>
          {loc && (
            <div className="flex items-center gap-1.5">
              <MapPin size={11} style={{ color: "rgba(255,255,255,0.55)" }} />
              <span
                className="max-w-[140px] truncate text-[11px] font-semibold"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {loc}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function MobileRecentCard({ event }) {
  const cfg  = sc(event.status);
  const date = fmtDate(event.starts_at_utc ?? event.starts_at ?? event.starts_at_local);

  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-center overflow-hidden rounded-[18px] border"
      style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.06)" }}
    >
      {/* Thumbnail */}
      <div className="relative h-[72px] w-[72px] shrink-0" style={{ background: "#14141f" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImg(event)} alt={event.title} className="h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))" }}
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-[5px] px-3.5 py-3">
        <span className="truncate text-[14px] font-extrabold tracking-tight text-white">
          {event.title}
        </span>
        <div className="flex items-center gap-1.5">
          <Calendar size={10} style={{ color: "rgba(255,255,255,0.25)" }} />
          <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>
            {date}
          </span>
        </div>
        <div
          className="inline-flex self-start rounded-full px-2 py-0.5"
          style={{ background: cfg.bg }}
        >
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.5px]"
            style={{ color: cfg.text }}
          >
            {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div className="pr-3.5">
        <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.25)" }} />
      </div>
    </Link>
  );
}

function MobileEmptyState() {
  return (
    <div
      className="relative flex flex-col items-center overflow-hidden rounded-3xl border px-6 py-10 gap-3"
      style={{ background: "#0e0e16", borderColor: "rgba(99,102,241,0.20)" }}
    >
      <div
        className="absolute inset-0 rounded-3xl"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(167,139,250,0.08) 100%)" }}
      />
      <div
        className="relative flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-[22px]"
        style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}
      >
        <Calendar size={28} className="text-white" />
      </div>
      <p className="relative text-center text-[20px] font-black tracking-tight text-white">
        Your first event awaits
      </p>
      <p
        className="relative max-w-[280px] text-center text-[13px] leading-5"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        Join thousands of organizers using EventApp to run seamless events — from gatherings to conferences.
      </p>
      <Link
        href="/events/create"
        className="relative mt-1 flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5"
        style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)" }}
      >
        <Plus size={16} className="text-white" />
        <span className="text-[15px] font-extrabold text-white">Create your first event</span>
      </Link>
      <div className="relative mt-1 flex flex-wrap items-center justify-center gap-2">
        {["Free to start", "QR Check-in", "Ticketing"].map(b => (
          <div
            key={b}
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5"
            style={{ background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.25)" }}
          >
            <Check size={10} style={{ color: "#10b981" }} />
            <span className="text-[11px] font-bold" style={{ color: "#10b981" }}>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileBottomNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const logoutFn  = useAuthStore(s => s.logout);

  async function handleLogout() {
    await logoutFn().catch(() => {});
    router.push("/login");
  }

  const tabs = [
    { href: "/dashboard", label: "Home",   Icon: Home,         active: pathname === "/dashboard" },
    { href: "/events",    label: "Events",  Icon: CalendarDays, active: pathname.startsWith("/events") && !pathname.includes("create") },
    null, // center Create button placeholder
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
                  style={{
                    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
                  }}
                >
                  <Plus size={24} className="text-white" />
                </div>
                <span
                  className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide"
                  style={{ color: "rgba(255,255,255,0.40)" }}
                >
                  Create
                </span>
              </Link>
            );
          }
          const { href, label, Icon, active } = tab;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <Icon size={22} style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }} />
              <span
                className="text-[10px] font-extrabold uppercase tracking-wide"
                style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileDashboard() {
  const { events, fetchEvents, loading } = useEventStore();
  const user          = useAuthStore(s => s.user);
  const { isSubscribed, plan, openUpgradeModal } = useSubscriptionStore();

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const name      = user?.name ?? user?.full_name ?? "";
  const firstName = name.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const initials  = name
    ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "U");

  const published = events.filter(e => e.status === "PUBLISHED").length;
  const drafts    = events.filter(e => e.status === "DRAFT").length;
  const featured  = events.find(e => e.status === "PUBLISHED") ?? events[0] ?? null;
  const recent    = events.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: "#07070f" }}>

      {/* ── Scrollable body ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pb-3.5 pt-14">
          <div className="flex items-center gap-3">
            {/* Gradient ⚡ logo mark */}
            <div
              className="flex h-[38px] w-[38px] items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)" }}
            >
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.6px]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {getGreeting()}
              </p>
              <p className="text-[18px] font-black tracking-tight text-white">
                {firstName} 👋
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Bell with amber dot */}
            <div
              className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl border"
              style={{ background: "#14141f", borderColor: "rgba(255,255,255,0.10)" }}
            >
              <Bell size={18} style={{ color: "rgba(255,255,255,0.45)" }} />
              <span
                className="absolute right-[9px] top-[9px] h-[7px] w-[7px] rounded-full border-[1.5px]"
                style={{ background: "#f59e0b", borderColor: "#07070f" }}
              />
            </div>
            {/* Avatar circle */}
            <div
              className="flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-full"
              style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)" }}
            >
              <span className="text-[14px] font-black tracking-wide text-white select-none">
                {initials}
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <div
          className="flex gap-2.5 overflow-x-auto px-5 pb-1 pt-1.5"
          style={{ scrollbarWidth: "none" }}
        >
          <MobileStatTile value={events.length} label="Total"     Icon={Layers}     accent="#6366f1" />
          <MobileStatTile value={published}     label="Published" Icon={Globe}      accent="#10b981" />
          <MobileStatTile value={drafts}        label="Drafts"    Icon={FileEdit}   accent="#f59e0b" />
          <MobileStatTile value="$0"            label="Revenue"   Icon={DollarSign} accent="#a78bfa" />
        </div>

        {/* ── Plan banner ────────────────────────────────────────────────── */}
        {isSubscribed && plan === "premium"
          ? <MobilePremiumBadge />
          : <MobileUpgradeBanner onUpgrade={() => openUpgradeModal("general")} />
        }

        {/* ── Quick actions ──────────────────────────────────────────────── */}
        <div className="mx-5 mt-6">
          <p className="mb-3.5 text-[17px] font-black tracking-tight text-white">
            Quick Actions
          </p>
          <div className="flex justify-between">
            <MobileQuickAction Icon={PlusCircle}   label="Create"  href="/events/create" fromColor="#4f46e5" toColor="#6366f1" />
            <MobileQuickAction Icon={CalendarDays} label="Events"  href="/events"        fromColor="#0891b2" toColor="#06b6d4" />
            <MobileQuickAction Icon={Ticket}       label="Tickets" href="/tickets"        fromColor="#d97706" toColor="#f59e0b" />
            <MobileQuickAction Icon={Users}        label="Guests"  href="/events"         fromColor="#059669" toColor="#10b981" />
          </div>
        </div>

        {/* ── Featured event ─────────────────────────────────────────────── */}
        {featured && (
          <div className="mx-5 mt-6">
            <div className="mb-3.5 flex items-center justify-between">
              <p className="text-[17px] font-black tracking-tight text-white">Featured Event</p>
              <Link href="/events" className="text-[13px] font-bold" style={{ color: "#6366f1" }}>
                See all →
              </Link>
            </div>
            <MobileFeaturedCard event={featured} />
          </div>
        )}

        {/* ── Recent events ──────────────────────────────────────────────── */}
        <div className="mx-5 mt-6 pb-8">
          <div className="mb-3.5 flex items-center justify-between">
            <p className="text-[17px] font-black tracking-tight text-white">Recent Events</p>
            {events.length > 0 && (
              <Link href="/events" className="text-[13px] font-bold" style={{ color: "#6366f1" }}>
                See all →
              </Link>
            )}
          </div>

          {loading && events.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
            </div>
          ) : events.length === 0 ? (
            <MobileEmptyState />
          ) : (
            <div className="flex flex-col gap-2.5">
              {recent.map(ev => <MobileRecentCard key={ev.id} event={ev} />)}
            </div>
          )}
        </div>

      </div>

      {/* ── Bottom tab bar ──────────────────────────────────────────────── */}
      <MobileBottomNav />

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DESKTOP DASHBOARD — unchanged from original
// ═══════════════════════════════════════════════════════════════════════

function DesktopDashboard() {
  const { events, fetchEvents, loading, updateEvent } = useEventStore();
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const toggleVisibility = async (e, event) => {
    e.preventDefault();
    try {
      setUpdatingId(event.id);
      const newVisibility = event.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
      await updateEvent(event.id, { visibility: newVisibility });
    } catch { console.error("Failed to update visibility"); }
    finally { setUpdatingId(null); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Dashboard"
        description="Manage your events, monitor activity, and jump into guests, tickets, builder, and analytics."
        action={
          <Link
            href="/events/create"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-4 py-3 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total events" value={events?.length || 0} subtitle="All created events"   icon={CalendarDays} />
        <StatCard title="Guests"        value="—"                   subtitle="Per-event details"    icon={Users}        />
        <StatCard title="Tickets"       value="—"                   subtitle="Sales overview"       icon={Ticket}       />
        <StatCard title="Activity"      value={loading ? "..." : "Live"} subtitle="Connected to API" icon={Activity}   />
      </div>

      <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent events</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Click an event to manage everything.</p>
        </div>

        {!loading && (!events || events.length === 0) ? (
          <EmptyState
            title="No events yet"
            description="Create your first event to get started."
            action={
              <Link
                href="/events/create"
                className="inline-flex rounded-2xl bg-[#111827] dark:bg-white dark:text-gray-900 px-4 py-3 text-sm font-medium text-white"
              >
                Create event
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map(event => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase">{event.event_type}</p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{event.city || "No city"}</span>
                      <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{event.status}</span>
                    </div>
                  </div>
                  <button
                    onClick={e => toggleVisibility(e, event)}
                    disabled={updatingId === event.id}
                    className={`text-xs px-3 py-1 rounded-xl font-medium transition ${
                      event.visibility === "PUBLIC"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    } ${updatingId === event.id ? "opacity-50" : "hover:scale-105"}`}
                  >
                    {updatingId === event.id ? "Updating..." : event.visibility === "PUBLIC" ? "🌍 Public" : "🔒 Private"}
                  </button>
                </div>
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Starts: {event.starts_at_local || event.starts_at_utc || "—"}
                </div>
                <EventActions event={event} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  return (
    <>
      {/* Phone viewport: full-screen mobile app experience */}
      <div className="sm:hidden">
        <MobileDashboard />
      </div>

      {/* Desktop: existing layout */}
      <div className="hidden sm:block">
        <DesktopDashboard />
      </div>
    </>
  );
}
