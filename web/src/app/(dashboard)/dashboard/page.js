"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Zap, Bell, Layers, Globe, FileEdit, DollarSign,
  PlusCircle, CalendarDays, Ticket, User, Plus,
  Home, Calendar, MapPin, ChevronRight, Check,
  Activity, Users, Search, X, Star, ArrowRight,
  UserCheck, Camera,
} from "lucide-react";

import BillingModal from "@/components/layout/BillingModal";

import { useAuthStore }         from "@/store/auth.store";
import { useEventStore }        from "@/store/event.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import { useTeamStore }         from "@/store/team.store";

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
      month: "short", day: "numeric", year: "numeric",
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

const PLAN_DISPLAY = { free: "Free", starter: "Starter", pro: "Pro", premium: "Pro", enterprise: "Enterprise" };

function MobileUpgradeBanner({ plan, onUpgrade }) {
  const isStarter = plan === "starter";
  const title    = isStarter ? "Upgrade to Pro" : "Unlock Your Plan";
  const subtitle = isStarter
    ? "Unlimited events, guests & custom domain"
    : "Start with Starter ($19) or go Pro ($49)";
  return (
    <div
      className="mx-5 mt-3.5 flex items-center justify-between overflow-hidden rounded-2xl border px-3.5 py-3.5"
      style={{ borderColor: "rgba(245,158,11,0.30)", background: "rgba(245,158,11,0.12)" }}
    >
      <div className="flex flex-1 items-center gap-2.5">
        <span className="text-[22px] leading-none select-none">⚡</span>
        <div>
          <p className="text-[13px] font-extrabold text-white">{title}</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{subtitle}</p>
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
        {isStarter ? "Go Pro" : "Upgrade"}
      </button>
    </div>
  );
}

function MobilePremiumBadge({ plan }) {
  const isPro      = plan === "pro" || plan === "premium" || plan === "enterprise";
  const label      = PLAN_DISPLAY[plan] ?? "Pro";
  const accentHex  = isPro ? "#c9a96e" : "#6366f1";
  const glowHex    = isPro ? "rgba(201,169,110,0.25)" : "rgba(99,102,241,0.25)";
  const borderHex  = isPro ? "rgba(201,169,110,0.30)" : "rgba(99,102,241,0.30)";
  const bgHex      = isPro ? "rgba(201,169,110,0.10)" : "rgba(99,102,241,0.10)";
  const gradFrom   = isPro ? "#c9a96e" : "#6366f1";
  const gradTo     = isPro ? "#f59e0b" : "#a78bfa";
  const badgeBg    = isPro ? "rgba(201,169,110,0.30)" : "rgba(99,102,241,0.30)";
  const badgeColor = isPro ? "#f59e0b" : "#a78bfa";
  const subtitle   = isPro
    ? "All features unlocked — unlimited events & more"
    : "5 events · 500 guests · All themes & ticket selling";

  return (
    <div
      className="relative mx-5 mt-3.5 flex items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3.5"
      style={{ borderColor: borderHex, background: bgHex }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl"
        style={{ background: glowHex }}
        aria-hidden
      />
      <div
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
        style={{
          background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
          boxShadow: `0 4px 14px ${glowHex}`,
        }}
      >
        <span className="text-[16px] leading-none select-none">✦</span>
      </div>
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-extrabold text-white">{label} Active</p>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
            style={{ background: badgeBg, color: badgeColor }}
          >
            {label.toUpperCase()}
          </span>
        </div>
        <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
          {subtitle}
        </p>
      </div>
      <div
        className="relative shrink-0 rounded-[10px] px-3 py-2 text-[11px] font-extrabold"
        style={{
          background: `${accentHex}20`,
          border: `1px solid ${accentHex}35`,
          color: accentHex,
        }}
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

function MobileRecentCard({ event, onPress }) {
  const cfg  = sc(event.status);
  const date = fmtDate(event.starts_at_utc ?? event.starts_at ?? event.starts_at_local);

  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center overflow-hidden rounded-[18px] border text-left"
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
    </button>
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

function MobileSwitchConfirmSheet({ pending, onConfirm, onCancel }) {
  if (!pending) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.72)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-3xl border p-6 flex flex-col items-center gap-4"
        style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon bubble */}
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl border"
          style={{ background: "rgba(99,102,241,0.12)", borderColor: "rgba(99,102,241,0.25)" }}
        >
          <Zap size={22} style={{ color: "#6366f1" }} />
        </div>

        {/* Heading */}
        <p className="text-center text-[20px] font-black tracking-tight text-white">
          Switch Active Event?
        </p>

        {/* Event name chip */}
        <div
          className="flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-3"
          style={{ background: "#14141f", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <Calendar size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
          <span className="flex-1 truncate text-[13px] font-bold text-white">
            {pending.title}
          </span>
        </div>

        {/* Body */}
        <p className="text-center text-[13px] leading-5" style={{ color: "rgba(255,255,255,0.45)" }}>
          The scanner, builder, and guest tools will switch to this event.
          Any in-progress actions on the current event will not be affected.
        </p>

        {/* Confirm */}
        <button
          onClick={onConfirm}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-extrabold text-white"
          style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}
        >
          <Check size={16} className="text-white" />
          Yes, Switch Event
        </button>

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="py-2 text-[14px] font-semibold"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MobileActiveEventToggle({ events, activeEventId, onRequestSwitch }) {
  if (events.length < 2) return null;
  return (
    <div
      className="mx-5 mt-3.5 flex flex-col gap-[10px] rounded-[16px] border p-3"
      style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.08)" }}
    >
      {/* Label row */}
      <div className="flex items-center gap-[5px]">
        <Zap size={10} style={{ color: "#6366f1" }} />
        <span
          className="text-[9px] font-extrabold uppercase"
          style={{ color: "#6366f1", letterSpacing: "1.2px" }}
        >
          ACTIVE EVENT
        </span>
        <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>
          · scanner &amp; builder use this
        </span>
      </div>
      {/* Pills */}
      <div className="flex gap-2">
        {events.map(ev => {
          const isActive = ev.id === activeEventId;
          const cfg = sc(ev.status);
          return (
            <button
              key={ev.id}
              onClick={() => { if (!isActive) onRequestSwitch(ev); }}
              className="relative flex flex-1 items-center gap-[7px] overflow-hidden rounded-[12px] border px-[10px] py-[9px]"
              style={{
                background: "#14141f",
                borderColor: isActive ? "rgba(99,102,241,0.50)" : "rgba(255,255,255,0.08)",
                cursor: isActive ? "default" : "pointer",
              }}
            >
              {isActive && (
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))" }}
                />
              )}
              <span
                className="relative h-[7px] w-[7px] shrink-0 rounded-full"
                style={{ background: isActive ? "#6366f1" : cfg.dot }}
              />
              <span
                className="relative flex-1 truncate text-[12px] font-bold"
                style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.45)", letterSpacing: "-0.1px" }}
              >
                {ev.title}
              </span>
              {isActive && (
                <div
                  className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                  style={{ background: "#6366f1" }}
                >
                  <Check size={10} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileSwitchBanner({ title }) {
  if (!title) return null;
  return (
    <div
      className="fixed bottom-20 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-2xl"
      style={{
        background: "rgba(10,10,20,0.92)",
        borderColor: "rgba(99,102,241,0.35)",
        backdropFilter: "blur(12px)",
        minWidth: 200,
        maxWidth: "calc(100vw - 40px)",
      }}
    >
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{ background: "rgba(99,102,241,0.30)" }}
      >
        <Check size={12} style={{ color: "#a78bfa" }} />
      </div>
      <div className="min-w-0">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.5px]"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Now managing
        </p>
        <p
          className="truncate text-[13px] font-extrabold text-white"
          style={{ maxWidth: "calc(100vw - 120px)" }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}

function MobileDashboard() {
  const router = useRouter();
  const { events, fetchEvents, loading, activeEventId, setActiveEvent, dashboard, fetchEventDashboard } = useEventStore();
  const user          = useAuthStore(s => s.user);
  const { isSubscribed, plan } = useSubscriptionStore();
  const { myEvents, fetchMyTeamEvents } = useTeamStore();
  const [pendingSwitch,    setPendingSwitch]    = useState(null);
  const [switchTitle,      setSwitchTitle]      = useState(null);
  const [pendingNavEvent,  setPendingNavEvent]  = useState(null);
  const [activeIdx,        setActiveIdx]        = useState(0);
  const bannerTimer  = useRef(null);
  const carouselRef  = useRef(null);

  useEffect(() => { fetchEvents(); },        [fetchEvents]);
  useEffect(() => { fetchMyTeamEvents(); },  [fetchMyTeamEvents]);

  useEffect(() => {
    if (!activeEventId && events.length > 0) setActiveEvent(events[0].id);
  }, [events, activeEventId, setActiveEvent]);

  useEffect(() => {
    if (activeEventId) fetchEventDashboard(activeEventId).catch(() => {});
  }, [activeEventId, fetchEventDashboard]);

  function handleRequestSwitch(ev) { setPendingSwitch(ev); }

  function handleConfirmSwitch() {
    if (!pendingSwitch) return;
    setActiveEvent(pendingSwitch.id);
    clearTimeout(bannerTimer.current);
    setSwitchTitle(pendingSwitch.title);
    bannerTimer.current = setTimeout(() => setSwitchTitle(null), 2500);
    setPendingSwitch(null);
  }

  function handleConfirmNavEvent() {
    if (!pendingNavEvent) return;
    setActiveEvent(pendingNavEvent.id);
    const id = pendingNavEvent.id;
    setPendingNavEvent(null);
    router.push(`/events/${id}`);
  }

  const name      = user?.name ?? user?.full_name ?? "";
  const firstName = name.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const initials  = name
    ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "U");

  const activeEvent     = events.find(e => e.id === activeEventId) ?? events[0] ?? null;
  const activeStats     = dashboard?.event?.id === activeEventId ? dashboard.stats : null;
  const guestCount      = activeStats?.guest_count     ?? 0;
  const attendingCount  = activeStats?.attending_count ?? 0;
  const ticketCount     = activeStats?.ticket_count    ?? 0;
  const checkinCount    = activeStats?.checkin_count   ?? 0;
  const recent          = events.slice(0, 5);

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

        {/* ── Active event banner ───────────────────────────────────────── */}
        {activeEvent && (
          <div className="flex items-center gap-2 px-5 pb-0.5 pt-2">
            <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: "#6366f1" }} />
            <p
              className="flex-1 truncate text-[13px] font-extrabold text-white"
              style={{ letterSpacing: "-0.2px" }}
            >
              {activeEvent.title}
            </p>
            <Link
              href={`/events/${activeEvent.id}`}
              className="shrink-0 text-[12px] font-bold"
              style={{ color: "#6366f1" }}
            >
              Open →
            </Link>
          </div>
        )}

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <div
          className="flex gap-2 overflow-x-auto px-5 pb-1 pt-1.5"
          style={{ scrollbarWidth: "none" }}
        >
          <MobileStatTile value={guestCount}     label="Guests"    Icon={Users}      accent="#6366f1" />
          <MobileStatTile value={attendingCount} label="Attending" Icon={UserCheck}  accent="#10b981" />
          <MobileStatTile value={ticketCount}    label="Tickets"   Icon={Ticket}     accent="#f59e0b" />
          <MobileStatTile value={checkinCount}   label="Scanned"   Icon={Camera}     accent="#a78bfa" />
        </div>

        {/* ── Active event switcher ──────────────────────────────────────── */}
        <MobileActiveEventToggle
          events={events}
          activeEventId={activeEventId}
          onRequestSwitch={handleRequestSwitch}
        />

        {/* ── Plan banner ────────────────────────────────────────────────── */}
        {isSubscribed && plan !== "free"
          ? <MobilePremiumBadge plan={plan} />
          : <MobileUpgradeBanner plan={plan} onUpgrade={() => router.push("/settings/billing")} />
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

        {/* ── Events I'm managing ─────────────────────────────────────────── */}
        {myEvents.length > 0 && (
          <div className="px-5 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Users size={13} style={{ color: "#a78bfa" }} />
              <p className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>
                Events you&apos;re managing
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              {myEvents.map((ev) => {
                const date = ev.starts_at_local ?? ev.starts_at_utc;
                const dateStr = date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
                return (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="flex items-center gap-3 overflow-hidden rounded-[16px] border px-3.5 py-3"
                    style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.18)" }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(99,102,241,0.15)" }}>
                      <Users size={16} style={{ color: "#a78bfa" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-extrabold text-white truncate">{ev.title}</p>
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {dateStr ? `${dateStr} · ` : ""}By {ev.owner_name}
                      </p>
                    </div>
                    <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.20)" }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Featured events carousel ───────────────────────────────────── */}
        <div className="mt-6">
          <div className="mb-3.5 flex items-center justify-between px-5">
            <p className="text-[17px] font-black tracking-tight text-white">
              {events.length > 1 ? "Your Events" : "Featured Event"}
            </p>
            <Link href="/events" className="text-[13px] font-bold" style={{ color: "#6366f1" }}>
              See all →
            </Link>
          </div>
          {loading && events.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#6366f1] border-t-transparent" />
            </div>
          ) : events.length > 0 && (
            <>
              <div
                ref={carouselRef}
                className="flex overflow-x-auto pb-1"
                style={{
                  scrollSnapType: "x mandatory",
                  scrollbarWidth: "none",
                  paddingLeft: 20,
                  paddingRight: 20,
                  gap: 12,
                }}
                onScroll={(e) => {
                  const cardW = window.innerWidth - 40;
                  const idx = Math.round(e.currentTarget.scrollLeft / (cardW + 12));
                  setActiveIdx(Math.min(Math.max(idx, 0), events.length - 1));
                }}
              >
                {events.map(ev => (
                  <div
                    key={ev.id}
                    style={{ width: "calc(100vw - 40px)", flexShrink: 0, scrollSnapAlign: "start" }}
                  >
                    <MobileFeaturedCard event={ev} />
                  </div>
                ))}
              </div>
              {events.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-[5px]">
                  {events.map((_, i) => (
                    <div
                      key={i}
                      className="h-[6px] rounded-full transition-all duration-200"
                      style={{
                        width: i === activeIdx ? 18 : 6,
                        background: i === activeIdx ? "#6366f1" : "rgba(255,255,255,0.2)",
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

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
              {recent.map(ev => (
                <MobileRecentCard
                  key={ev.id}
                  event={ev}
                  onPress={() => setPendingNavEvent(ev)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Switch event banner ─────────────────────────────────────────── */}
      <MobileSwitchBanner title={switchTitle} />

      {/* ── Switch event confirm sheet (active toggle) ──────────────────── */}
      <MobileSwitchConfirmSheet
        pending={pendingSwitch}
        onConfirm={handleConfirmSwitch}
        onCancel={() => setPendingSwitch(null)}
      />

      {/* ── Switch event confirm sheet (recent row → navigate) ───────────── */}
      <MobileSwitchConfirmSheet
        pending={pendingNavEvent}
        onConfirm={handleConfirmNavEvent}
        onCancel={() => setPendingNavEvent(null)}
      />

      {/* ── Bottom tab bar ──────────────────────────────────────────────── */}
      <MobileBottomNav />

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PLAN UPGRADE BANNER (desktop only)
// ═══════════════════════════════════════════════════════════════════════

const UPGRADE_CFG = {
  free: {
    currentLabel: "Free Plan",
    currentHex:   "#9ca3af",
    tagline:      "You're limited to 1 event & 50 guests. Upgrade to unlock the full platform.",
    plans: [
      {
        key:        "starter",
        label:      "Starter",
        price:      "$19",
        badge:      null,
        gradFrom:   "#4f46e5",
        gradTo:     "#818cf8",
        shadowHex:  "rgba(99,102,241,0.35)",
        ctaText:    "#fff",
        ctaLabel:   "Upgrade to Starter",
        perks:      ["5 events", "500 guests / event", "All themes", "Ticket selling", "QR scanner", "3 team members"],
      },
      {
        key:        "pro",
        label:      "Pro",
        price:      "$49",
        badge:      "Most popular",
        gradFrom:   "#c9a96e",
        gradTo:     "#f59e0b",
        shadowHex:  "rgba(201,169,110,0.35)",
        ctaText:    "#000",
        ctaLabel:   "Go Pro",
        perks:      ["Unlimited events", "Unlimited guests", "Custom domain", "Advanced analytics", "Priority support", "Unlimited team"],
      },
    ],
  },
  starter: {
    currentLabel: "Starter Plan",
    currentHex:   "#6366f1",
    tagline:      "Ready to go unlimited? Pro removes all limits and unlocks every feature.",
    plans: [
      {
        key:        "pro",
        label:      "Pro",
        price:      "$49",
        badge:      "Unlimited everything",
        gradFrom:   "#c9a96e",
        gradTo:     "#f59e0b",
        shadowHex:  "rgba(201,169,110,0.35)",
        ctaText:    "#000",
        ctaLabel:   "Upgrade to Pro",
        perks:      ["Unlimited events", "Unlimited guests", "Custom domain", "Advanced analytics", "Priority support", "Unlimited team members"],
      },
    ],
  },
};

function PlanUpgradeBanner({ plan, eventsUsed, eventsLimit, onUpgrade }) {
  const isFree    = plan === "free" || !plan;
  const isStarter = plan === "starter";
  if (!isFree && !isStarter) return null;

  const cfg    = UPGRADE_CFG[isFree ? "free" : "starter"];
  const usePct = eventsLimit ? Math.min((eventsUsed / eventsLimit) * 100, 100) : 0;
  const accent = isFree ? "#9ca3af" : "#6366f1";

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 py-4"
      style={{
        border:     `1px solid ${isFree ? "rgba(99,102,241,0.22)" : "rgba(201,169,110,0.28)"}`,
        background: isFree
          ? "linear-gradient(135deg,rgba(99,102,241,0.06) 0%,rgba(139,92,246,0.03) 100%)"
          : "linear-gradient(135deg,rgba(201,169,110,0.07) 0%,rgba(245,158,11,0.03) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
        style={{ background: isFree ? "rgba(99,102,241,0.12)" : "rgba(201,169,110,0.14)" }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">

        {/* ── Left: label + tagline + compact usage bar ──────────────── */}
        <div className="flex flex-1 min-w-0 items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${accent}22`, border: `1px solid ${accent}33` }}
          >
            <Zap className="h-3.5 w-3.5" style={{ color: accent }} fill="currentColor" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-(--text-primary)">{cfg.currentLabel}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
                style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}
              >
                {isFree ? "FREE" : "STARTER"}
              </span>
              {eventsLimit != null && (
                <span className="text-xs text-(--text-muted)">{eventsUsed}/{eventsLimit} events used</span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-(--text-muted)">{cfg.tagline}</p>
            {eventsLimit != null && (
              <div className="mt-1.5 h-1 w-40 overflow-hidden rounded-full bg-(--bg-base)">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${usePct}%`,
                    background: usePct >= 90
                      ? "linear-gradient(90deg,#ef4444,#f97316)"
                      : isFree ? "linear-gradient(90deg,#4f46e5,#818cf8)" : "linear-gradient(90deg,#c9a96e,#f59e0b)",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className="hidden lg:block h-16 w-px bg-border shrink-0" />

        {/* ── Plan cards ─────────────────────────────────────────────── */}
        <div className={`flex gap-3 ${cfg.plans.length === 1 ? "lg:w-64" : "lg:w-[480px]"}`}>
          {cfg.plans.map((p) => (
            <div
              key={p.key}
              className="relative flex flex-1 flex-col gap-2 overflow-hidden rounded-xl p-3"
              style={{
                border:     `1px solid ${p.shadowHex.replace("0.35", "0.25")}`,
                background: `linear-gradient(135deg,${p.gradFrom}0d 0%,${p.gradTo}06 100%)`,
              }}
            >
              {p.badge && (
                <span
                  className="absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest"
                  style={{ background: `linear-gradient(135deg,${p.gradFrom},${p.gradTo})`, color: p.ctaText }}
                >
                  {p.badge}
                </span>
              )}

              {/* Header: icon + name + price in one row */}
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `linear-gradient(135deg,${p.gradFrom},${p.gradTo})`, boxShadow: `0 2px 8px ${p.shadowHex}` }}
                >
                  <Star className="h-3 w-3 fill-white text-white" />
                </div>
                <span className="text-xs font-bold text-(--text-primary)">{p.label}</span>
                <span className="ml-auto text-sm font-black text-(--text-primary)">{p.price}<span className="text-[10px] font-normal text-(--text-muted)">/mo</span></span>
              </div>

              {/* Perks: 2-col, max 4 */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {p.perks.slice(0, 4).map((perk) => (
                  <div key={perk} className="flex items-center gap-1 text-[11px] text-(--text-secondary)">
                    <Check className="h-2.5 w-2.5 shrink-0" style={{ color: p.gradFrom }} />
                    {perk}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={onUpgrade}
                className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg,${p.gradFrom},${p.gradTo})`, color: p.ctaText, boxShadow: `0 3px 10px ${p.shadowHex}` }}
              >
                <Zap className="h-3 w-3" fill="currentColor" />
                {p.ctaLabel}
              </button>
            </div>
          ))}
        </div>

      </div>

      <div className="relative mt-2 text-right">
        <Link href="/settings/billing" className="text-[11px] font-medium text-(--text-muted) transition hover:text-(--text-primary)">
          See all plans →
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DESKTOP DASHBOARD
// ═══════════════════════════════════════════════════════════════════════

function DesktopDashboard() {
  const { events, fetchEvents, loading, updateEvent } = useEventStore();
  const { plan, isSubscribed, usage, limits, fetchSubscription } = useSubscriptionStore();
  const { myEvents, fetchMyTeamEvents } = useTeamStore();
  const [updatingId,  setUpdatingId]  = useState(null);
  const [query,       setQuery]       = useState("");
  const [billingOpen, setBillingOpen] = useState(false);

  useEffect(() => { fetchEvents(); },        [fetchEvents]);
  useEffect(() => { fetchSubscription(); },  [fetchSubscription]);
  useEffect(() => { fetchMyTeamEvents(); },  [fetchMyTeamEvents]);

  const isPro     = isSubscribed && (plan === "pro" || plan === "premium" || plan === "enterprise");
  const isStarter = plan === "starter";
  const showBanner = !isPro;

  const eventsUsed  = usage?.events  ?? events.length ?? 0;
  const eventsLimit = limits?.events ?? null;

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      e.title?.toLowerCase().includes(q) ||
      e.city?.toLowerCase().includes(q) ||
      e.event_type?.toLowerCase().includes(q)
    );
  }, [events, query]);

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
    <>
    <BillingModal open={billingOpen} onClose={() => setBillingOpen(false)} />
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Dashboard"
        description="Manage your events, monitor activity, and jump into guests, tickets, builder, and analytics."
        action={
          <Link
            href="/events/create"
            className="inline-flex items-center gap-2 rounded-2xl bg-(--text-primary) px-4 py-3 text-sm font-medium text-(--bg-base)"
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

      {showBanner && (
        <PlanUpgradeBanner
          plan={plan}
          eventsUsed={eventsUsed}
          eventsLimit={eventsLimit}
          onUpgrade={() => setBillingOpen(true)}
        />
      )}

      {/* ── Events I'm managing ── */}
      {myEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-400" />
            <h2 className="text-sm font-bold text-(--text-primary)">Events you&apos;re managing</h2>
            <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-bold text-indigo-400">{myEvents.length}</span>
          </div>
          <div className="rounded-3xl border border-border bg-(--bg-surface) p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {myEvents.map((ev) => {
                const dateStr = ev.starts_at_local ?? ev.starts_at_utc
                  ? new Date(ev.starts_at_local ?? ev.starts_at_utc).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : null;
                return (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="group flex items-center gap-3.5 rounded-2xl border border-border bg-(--bg-elevated) p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-(--border-hover)"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15">
                      <Users size={18} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-(--text-primary) truncate group-hover:text-indigo-400 transition-colors">{ev.title}</p>
                      <p className="text-[11px] text-(--text-muted) truncate">
                        {dateStr ? `${dateStr} · ` : ""}By {ev.owner_name}
                      </p>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-(--text-muted) group-hover:text-indigo-400 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-border bg-(--bg-surface) p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-(--text-primary)">Recent events</h2>
            <p className="text-sm text-(--text-muted)">Click an event to manage everything.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="Search events…"
              autoComplete="off"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/40"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Create your first event to get started."
            action={
              <Link
                href="/events/create"
                className="inline-flex rounded-2xl bg-(--text-primary) px-4 py-3 text-sm font-medium text-(--bg-surface)"
              >
                Create event
              </Link>
            }
          />
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Search className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-(--text-secondary)">No events match &ldquo;{query}&rdquo;</p>
            <button onClick={() => setQuery("")} className="text-xs text-indigo-500 hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map(event => {
              const cfg = sc(event.status);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-(--bg-surface) shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-(--border-hover)"
                >
                  {/* Cover image */}
                  <div className="relative h-40 shrink-0 overflow-hidden bg-(--bg-elevated)">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroImg(event)}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/50" />

                    {/* Status pill */}
                    <div
                      className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm"
                      style={{ background: cfg.bg }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
                      <span className="text-[11px] font-bold" style={{ color: cfg.text }}>
                        {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
                      </span>
                    </div>

                    {/* Visibility toggle */}
                    <button
                      onClick={e => toggleVisibility(e, event)}
                      disabled={updatingId === event.id}
                      className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm transition hover:scale-105 disabled:opacity-60"
                      style={{
                        background: event.visibility === "PUBLIC"
                          ? "rgba(16,185,129,0.80)"
                          : "rgba(0,0,0,0.45)",
                      }}
                    >
                      {updatingId === event.id ? "…" : event.visibility === "PUBLIC" ? "Public" : "Private"}
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col gap-2.5 p-4">
                    {/* Event type chip */}
                    <span className="self-start rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {(event.event_type ?? "EVENT").replace(/_/g, " ")}
                    </span>

                    {/* Title */}
                    <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-(--text-primary)">
                      {event.title}
                    </h3>

                    {/* Date + city */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-(--text-muted)">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {fmtDate(event.starts_at_local ?? event.starts_at_utc ?? event.starts_at)}
                      </span>
                      {event.city && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {event.city}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-1">
                      <EventActions event={event} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
    </>
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
