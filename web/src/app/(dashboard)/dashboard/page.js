"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Zap, Bell, Layers, Globe, FileEdit, DollarSign,
  PlusCircle, CalendarDays, Ticket, User, Plus,
  Home, Calendar, MapPin, ChevronRight, Check,
  Activity, Users, Search, X, Star, ArrowRight,
  UserCheck, Camera, ClipboardList, Layout, QrCode,
} from "lucide-react";

import BillingModal from "@/components/layout/BillingModal";

import { useAuthStore }         from "@/store/auth.store";
import { useEventStore }        from "@/store/event.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import { useNotifications }     from "@/hooks/useNotifications";

// Desktop-only components
import PageHeader    from "@/components/ui/page-header";
import StatCard      from "@/components/ui/stat-card";
import EmptyState    from "@/components/ui/empty-state";
import EventActions  from "@/components/events/event-actions";

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

// Role badge config
const ROLE_CFG = {
  ADMIN:   { bg: "rgba(99,102,241,0.15)",  text: "#818cf8", label: "Admin"   },
  MANAGER: { bg: "rgba(16,185,129,0.15)",  text: "#10b981", label: "Manager" },
  STAFF:   { bg: "rgba(245,158,11,0.15)",  text: "#f59e0b", label: "Staff"   },
  VIEWER:  { bg: "rgba(107,114,128,0.15)", text: "#9ca3af", label: "Viewer"  },
};

function RoleBadge({ role, className = "" }) {
  if (!role || role === "OWNER") return null;
  const cfg = ROLE_CFG[role] ?? ROLE_CFG.ADMIN;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <Users size={8} />
      {cfg.label}
    </span>
  );
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
  const cfg    = sc(event.status);
  const isTeam = event.user_role && event.user_role !== "OWNER";
  const role   = (event.user_role ?? "ADMIN").replace("_", " ");
  const date   = fmtDate(event.starts_at_utc ?? event.starts_at ?? event.starts_at_local);
  const loc    = event.location || event.city;

  return (
    <Link
      href={`/events/${event.id}`}
      className="relative block overflow-hidden rounded-[22px] border"
      style={{
        height: 220,
        borderColor: isTeam ? "rgba(251,191,36,0.50)" : "rgba(255,255,255,0.06)",
        background: "#0e0e16",
      }}
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

      {/* Top row: status/role pill + arrow */}
      <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between">
        {isTeam ? (
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: "rgba(251,191,36,0.90)" }}
          >
            <Users size={9} style={{ color: "#000" }} />
            <span className="text-[10px] font-black" style={{ color: "#000" }}>{role}</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: cfg.bg }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
            <span className="text-[11px] font-extrabold" style={{ color: cfg.text }}>
              {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
            </span>
          </div>
        )}
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full border"
          style={{ background: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.12)" }}
        >
          <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.6)" }} />
        </div>
      </div>

      {/* Bottom: title + meta */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 p-4"
        style={isTeam ? { background: "rgba(42,29,0,0.85)" } : undefined}
      >
        <p className="text-[20px] font-black leading-[1.3] tracking-tight text-white line-clamp-2">
          {event.title}
        </p>
        <div className="flex flex-wrap gap-3.5">
          <div className="flex items-center gap-1.5">
            <Calendar size={11} style={{ color: isTeam ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.55)" }} />
            <span className="text-[11px] font-semibold" style={{ color: isTeam ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.55)" }}>
              {date}
            </span>
          </div>
          {isTeam && event.owner_name ? (
            <span className="text-[11px] font-semibold" style={{ color: "rgba(251,191,36,0.45)" }}>
              · by {event.owner_name}
            </span>
          ) : loc && (
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
  const cfg    = sc(event.status);
  const isTeam = event.user_role && event.user_role !== "OWNER";
  const role   = (ROLE_CFG[event.user_role] ?? ROLE_CFG.ADMIN).label;
  const date   = fmtDate(event.starts_at_utc ?? event.starts_at ?? event.starts_at_local);

  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center overflow-hidden rounded-[18px] border text-left"
      style={{
        background: isTeam ? "#2a1d00" : "#0e0e16",
        borderColor: isTeam ? "rgba(251,191,36,0.35)" : "rgba(255,255,255,0.06)",
      }}
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
        <span
          className="truncate text-[14px] font-extrabold tracking-tight"
          style={{ color: isTeam ? "#fef3c7" : "#fff" }}
        >
          {event.title}
        </span>
        <div className="flex items-center gap-1.5">
          <Calendar size={10} style={{ color: isTeam ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.25)" }} />
          <span className="text-[11px] font-semibold" style={{ color: isTeam ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.25)" }}>
            {date}
          </span>
        </div>
        {isTeam ? (
          <div
            className="inline-flex self-start items-center gap-1 rounded-full px-2 py-0.5"
            style={{ background: "rgba(251,191,36,0.18)" }}
          >
            <Users size={9} style={{ color: "#fbbf24" }} />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.5px]" style={{ color: "#fbbf24" }}>
              {role}
            </span>
          </div>
        ) : (
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
        )}
      </div>

      {/* Arrow */}
      <div className="pr-3.5">
        <ChevronRight size={16} style={{ color: isTeam ? "rgba(251,191,36,0.45)" : "rgba(255,255,255,0.25)" }} />
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
        Join thousands of organizers using LiteEvent to run seamless events — from gatherings to conferences.
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
    router.replace("/login");
    await logoutFn().catch(() => {});
  }

  const tabs = [
    { href: "/dashboard", label: "Home",    Icon: Home,          active: pathname === "/dashboard" },
    { href: "/events",    label: "Events",  Icon: CalendarDays,  active: pathname.startsWith("/events") && !pathname.includes("create") },
    null, // center Scan FAB
    { href: "/planner",   label: "Planner", Icon: ClipboardList, active: pathname.startsWith("/planner") },
    { href: "/settings",  label: "Profile", Icon: User,          active: pathname === "/settings" },
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
              <Link key="scan" href="/events" className="relative z-10 -mt-5 flex flex-col items-center gap-1 transition-transform active:scale-95">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-[18px]"
                  style={{
                    background: "linear-gradient(135deg, #059669, #10b981)",
                    boxShadow: "0 4px 20px rgba(16,185,129,0.50)",
                  }}
                >
                  <QrCode size={22} className="text-white" />
                </div>
                <span
                  className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide"
                  style={{ color: "rgba(255,255,255,0.40)" }}
                >
                  Scan
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
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.72)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-t-[28px] border sm:rounded-[24px]"
        style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.10)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Event cover image strip */}
        <div className="relative h-[110px] w-full overflow-hidden" style={{ background: "#14141f" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImg(pending)} alt={pending.title} className="h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(14,14,22,0.95) 100%)" }}
          />
          {/* Drag handle */}
          <div className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full" style={{ background: "rgba(255,255,255,0.20)" }} />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-5">
          {/* Icon bubble */}
          <div
            className="flex h-14 w-14 items-center justify-center rounded-[18px] border"
            style={{ background: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.30)" }}
          >
            <Zap size={22} style={{ color: "#6366f1" }} />
          </div>

          {/* Heading */}
          <p className="text-center text-[20px] font-black tracking-tight text-white" style={{ letterSpacing: "-0.4px" }}>
            Switch Active Event?
          </p>

          {/* Event name row */}
          <div
            className="flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-[9px]"
            style={{ background: "#14141f", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <Calendar size={13} style={{ color: "rgba(255,255,255,0.45)" }} />
            <span className="flex-1 text-[13px] font-bold leading-tight" style={{ color: "rgba(255,255,255,0.85)" }}>
              {pending.title}
            </span>
          </div>

          {/* Body */}
          <p className="text-center text-[13px] leading-[19px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            The scanner, builder, and guest tools will switch to this event.
            Any in-progress actions on the current event will not be affected.
          </p>

          {/* Confirm button */}
          <button
            onClick={onConfirm}
            className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-[14px] py-[15px] text-[15px] font-extrabold text-white"
            style={{ background: "linear-gradient(90deg, #6366f1, #818cf8)" }}
          >
            <Check size={15} className="text-white" />
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
  const { unreadCount, refresh: fetchNotifs } = useNotifications();
  const [pendingSwitch,    setPendingSwitch]    = useState(null);
  const [switchTitle,      setSwitchTitle]      = useState(null);
  const [pendingNavEvent,  setPendingNavEvent]  = useState(null);
  const [activeIdx,        setActiveIdx]        = useState(0);
  const [greeting,         setGreeting]         = useState("Welcome");
  const bannerTimer  = useRef(null);
  const carouselRef  = useRef(null);

  useEffect(() => { fetchEvents(); fetchNotifs(); }, [fetchEvents, fetchNotifs]);
  useEffect(() => { setGreeting(getGreeting()); }, []);

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
    // Only switch active event for owned events
    if (!pendingNavEvent.user_role || pendingNavEvent.user_role === "OWNER") {
      setActiveEvent(pendingNavEvent.id);
    }
    const id = pendingNavEvent.id;
    setPendingNavEvent(null);
    router.push(`/events/${id}`);
  }

  const name      = user?.name ?? user?.full_name ?? "";
  const firstName = name.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const initials  = name
    ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "U");

  const isTeamActiveMob = (e) => {
    const status = (e.status ?? '').toUpperCase();
    if (status === 'ARCHIVED' || status === 'CANCELLED') return false;
    if (e.runtime_status === 'COMPLETED' && e.ends_at_utc) return false;
    return true;
  };
  const ownEvents     = useMemo(() => events.filter(e => !e.user_role || e.user_role === "OWNER"), [events]);
  const teamEventsMob = useMemo(() => events.filter(e => e.user_role && e.user_role !== "OWNER" && isTeamActiveMob(e)), [events]);
  const activeEvent     = ownEvents.find(e => e.id === activeEventId) ?? ownEvents[0] ?? null;
  const activeStats     = dashboard?.event?.id === activeEventId ? dashboard.stats : null;
  const guestCount      = activeStats?.guest_count     ?? 0;
  const attendingCount  = activeStats?.attending_count ?? 0;
  const ticketCount     = activeStats?.ticket_count    ?? 0;
  const checkinCount    = activeStats?.checkin_count   ?? 0;
  const recent          = events.slice(0, 6);

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
                {greeting}
              </p>
              <p className="text-[18px] font-black tracking-tight text-white">
                {firstName} 👋
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Bell with dynamic unread badge */}
            <Link
              href="/settings"
              className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl border"
              style={{ background: "#14141f", borderColor: "rgba(255,255,255,0.10)" }}
            >
              <Bell size={18} style={{ color: "rgba(255,255,255,0.45)" }} />
              {unreadCount > 0 ? (
                <span
                  className="absolute right-[5px] top-[5px] flex h-[16px] min-w-[16px] items-center justify-center rounded-full border-[1.5px] px-[3px] text-[9px] font-extrabold text-white"
                  style={{ background: "#6366f1", borderColor: "#07070f" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : (
                <span
                  className="absolute right-[9px] top-[9px] h-[7px] w-[7px] rounded-full border-[1.5px]"
                  style={{ background: "#f59e0b", borderColor: "#07070f" }}
                />
              )}
            </Link>
            {/* Avatar circle — image if available, else initials (hidden on mobile, visible on desktop) */}
            <Link
              href="/settings"
              className="hidden md:flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-full"
              style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)" }}
            >
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={firstName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[14px] font-black tracking-wide text-white select-none">
                  {initials}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ── Super Admin Banner ──────────────────────────────────────────── */}
        {user?.is_super_admin && (
          <div
            className="relative mx-5 mt-2 flex items-center justify-between overflow-hidden rounded-[14px] border px-3 py-3"
            style={{ background: "rgba(201,169,110,0.10)", borderColor: "rgba(201,169,110,0.30)" }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(90deg, rgba(201,169,110,0.14), rgba(245,158,11,0.05))" }}
              aria-hidden
            />
            <div className="relative flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-[10px] border"
                style={{ background: "rgba(201,169,110,0.15)", borderColor: "rgba(201,169,110,0.25)" }}
              >
                <Star size={14} style={{ color: "#c9a96e" }} />
              </div>
              <div>
                <p className="text-[13px] font-extrabold" style={{ color: "#c9a96e" }}>Super Admin Mode</p>
                <p className="text-[10px]" style={{ color: "rgba(201,169,110,0.60)" }}>Full platform access</p>
              </div>
            </div>
            <span
              className="relative rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[1.2px]"
              style={{ background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.30)", color: "#c9a96e" }}
            >
              ADMIN
            </span>
          </div>
        )}

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
          events={ownEvents}
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
            <MobileQuickAction Icon={Layout}       label="Builder" href="/events"         fromColor="#4f46e5" toColor="#6366f1" />
            <MobileQuickAction Icon={Ticket}       label="Tickets" href="/tickets"        fromColor="#d97706" toColor="#f59e0b" />
          </div>
        </div>

        {/* ── Team events ─────────────────────────────────────────────────── */}
        {teamEventsMob.length > 0 && (
          <div className="px-5 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Users size={13} style={{ color: "#fbbf24" }} />
              <p className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>
                Events you&apos;re managing
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}
              >
                {teamEventsMob.length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {teamEventsMob.map((ev) => {
                const date = ev.starts_at_local ?? ev.starts_at_utc;
                const dateStr = date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
                const roleCfg = ROLE_CFG[ev.user_role] ?? ROLE_CFG.ADMIN;
                return (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="flex items-center gap-3 overflow-hidden rounded-[16px] border py-2.5 pr-3.5"
                    style={{ background: "#2a1d00", borderColor: "rgba(251,191,36,0.25)" }}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-[50px] w-[50px] shrink-0 overflow-hidden rounded-l-[14px]" style={{ background: "#14141f" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImg(ev)} alt={ev.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))" }} />
                      <div
                        className="absolute bottom-1 right-1 flex h-[14px] w-[14px] items-center justify-center rounded-[3px]"
                        style={{ background: "rgba(42,29,0,0.85)" }}
                      >
                        <Users size={8} style={{ color: "#fbbf24" }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-extrabold text-white truncate">{ev.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {dateStr && (
                          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{dateStr}</span>
                        )}
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{ background: "rgba(251,191,36,0.18)", color: "#fbbf24" }}
                        >
                          {roleCfg.label}
                        </span>
                      </div>
                      {ev.owner_name && (
                        <p className="mt-0.5 text-[10px] truncate" style={{ color: "rgba(251,191,36,0.35)" }}>
                          by {ev.owner_name}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={14} style={{ color: "rgba(251,191,36,0.35)" }} />
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
            {events.length > 5 && (
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
  const planAccent = isStarter ? "#6366f1" : "#9ca3af";

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: isStarter
          ? "linear-gradient(135deg, rgba(15,12,41,0.95) 0%, rgba(10,9,30,0.98) 100%)"
          : "linear-gradient(135deg, rgba(9,9,20,0.97) 0%, rgba(15,12,41,0.95) 100%)",
        border: `1px solid ${isStarter ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-30"
        style={{ background: isStarter ? "rgba(99,102,241,0.4)" : "rgba(139,92,246,0.3)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full blur-3xl opacity-20"
        style={{ background: isStarter ? "rgba(201,169,110,0.5)" : "rgba(99,102,241,0.4)" }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-0 lg:flex-row lg:items-center">

        {/* ── Left: current plan + usage ───────────────────────────── */}
        <div className="flex flex-1 items-center gap-3 px-5 py-4">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${planAccent}22`, border: `1px solid ${planAccent}38` }}
          >
            <Zap className="h-3.5 w-3.5" style={{ color: planAccent }} fill="currentColor" />
          </div>

          <div className="min-w-0 flex-1">
            {/* Name + badge + events count on one line */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white">{cfg.currentLabel}</span>
              <span
                className="rounded-full px-1.5 py-px text-[9px] font-black uppercase tracking-widest"
                style={{ background: `${planAccent}22`, color: planAccent, border: `1px solid ${planAccent}35` }}
              >
                {isFree ? "Free" : "Starter"}
              </span>
              {eventsLimit != null && (
                <span
                  className="text-[11px] tabular-nums"
                  style={{ color: usePct >= 90 ? "#f87171" : "rgba(255,255,255,0.4)" }}
                >
                  {eventsUsed}/{eventsLimit} events
                </span>
              )}
              <Link
                href="/settings/billing"
                className="text-[11px] transition hover:underline"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                See plans →
              </Link>
            </div>
            {/* Usage bar */}
            {eventsLimit != null && (
              <div className="mt-1.5 h-1 w-36 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${usePct}%`,
                    background: usePct >= 90
                      ? "linear-gradient(90deg,#ef4444,#f97316)"
                      : isStarter ? "linear-gradient(90deg,#4f46e5,#818cf8)" : "linear-gradient(90deg,#6b7280,#9ca3af)",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────────── */}
        <div className="hidden lg:block h-12 w-px shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="lg:hidden h-px mx-5" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* ── Right: plan card(s) ───────────────────────────────────── */}
        <div className={`flex gap-3 p-4 ${cfg.plans.length === 1 ? "lg:w-[440px]" : "lg:w-[580px]"}`}>
          {cfg.plans.map((p) => (
            <div
              key={p.key}
              className="relative flex flex-1 overflow-hidden rounded-xl"
              style={{
                background: `linear-gradient(145deg, ${p.gradFrom}12 0%, ${p.gradTo}08 100%)`,
                border:     `1px solid ${p.gradFrom}30`,
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${p.gradFrom}70, transparent)` }}
              />

              <div className="flex flex-1 items-center gap-4 px-4 py-3">
                {/* Icon + name + price */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: `linear-gradient(135deg,${p.gradFrom},${p.gradTo})`, boxShadow: `0 3px 10px ${p.shadowHex}` }}
                  >
                    <Star className="h-3 w-3 fill-white text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold leading-none" style={{ color: "rgba(255,255,255,0.4)" }}>Upgrade to</p>
                    <p className="text-sm font-black text-white leading-snug">{p.label}</p>
                  </div>
                  <div className="pl-1">
                    <span className="text-base font-black text-white">{p.price}</span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>/mo</span>
                  </div>
                </div>

                {/* Perks — 2 columns */}
                <div className="hidden sm:grid flex-1 grid-cols-2 gap-x-3 gap-y-1 min-w-0">
                  {p.perks.slice(0, 4).map((perk) => (
                    <div key={perk} className="flex items-center gap-1.5 min-w-0">
                      <Check className="h-2.5 w-2.5 shrink-0" style={{ color: p.gradFrom }} />
                      <span className="truncate text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{perk}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={onUpgrade}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition hover:opacity-90 active:scale-[0.97]"
                  style={{
                    background: `linear-gradient(135deg,${p.gradFrom},${p.gradTo})`,
                    color:      p.ctaText,
                    boxShadow:  `0 4px 14px ${p.shadowHex}`,
                  }}
                >
                  <Zap className="h-3 w-3" fill="currentColor" />
                  {p.ctaLabel}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function EventGrid({ events: evList, updatingId, onToggleVisibility, showRoleBadge = false }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {evList.map(event => {
        const cfg = sc(event.status);
        const isTeam = showRoleBadge;
        return (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={isTeam ? { borderColor: "rgba(251,191,36,0.35)" } : { borderColor: "var(--border)" }}
            onMouseEnter={isTeam ? e => e.currentTarget.style.borderColor = "rgba(251,191,36,0.65)" : undefined}
            onMouseLeave={isTeam ? e => e.currentTarget.style.borderColor = "rgba(251,191,36,0.35)" : undefined}
          >
            {/* Cover image */}
            <div className="relative h-40 shrink-0 overflow-hidden bg-(--bg-elevated)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImg(event)}
                alt={event.title}
                className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isTeam ? "opacity-80" : ""}`}
              />
              <div className={`absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/50 ${isTeam ? "from-purple-900/25" : ""}`} />

              {/* Role badge (team) or Status pill (owned) */}
              {isTeam ? (
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm"
                  style={{ background: "rgba(139,92,246,0.9)", color: "#fff" }}>
                  <Users size={9} className="shrink-0" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wide">
                    {ROLE_CFG[event.user_role]?.label ?? event.user_role ?? "Team"}
                  </span>
                </div>
              ) : (
                <div
                  className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm"
                  style={{ background: cfg.bg }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
                  <span className="text-[11px] font-bold" style={{ color: cfg.text }}>
                    {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
                  </span>
                </div>
              )}

              {/* Visibility toggle — only for owned events (team members can't change it) */}
              {!isTeam && (
                <button
                  onClick={e => onToggleVisibility(e, event)}
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
              )}
              {/* Team events: show status in top-right */}
              {isTeam && (
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 backdrop-blur-sm"
                  style={{ background: cfg.bg }}>
                  <span className="h-1 w-1 rounded-full" style={{ background: cfg.dot }} />
                  <span className="text-[10px] font-bold" style={{ color: cfg.text }}>
                    {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Card body */}
            <div className="flex flex-1 flex-col gap-2.5 p-4" style={isTeam
              ? { background: "#2a1d00" }
              : {}}>
              {/* Event type chip */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${!isTeam ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400" : ""}`}
                  style={isTeam ? { background: "rgba(251,191,36,0.16)", color: "#fbbf24" } : {}}>
                  {(event.event_type ?? "EVENT").replace(/_/g, " ")}
                </span>
              </div>

              {/* Title */}
              <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-white"
                style={{ transition: "color 0.2s" }}
                onMouseEnter={isTeam ? e => e.currentTarget.style.color = "#fde68a" : undefined}
                onMouseLeave={isTeam ? e => e.currentTarget.style.color = "#fff" : undefined}>
                {event.title}
              </h3>

              {/* Owner attribution (team events only) */}
              {isTeam && event.owner_name && (
                <p className="flex items-center gap-1 text-xs" style={{ color: "#fbbf24" }}>
                  <User className="h-3 w-3 shrink-0" />
                  Owner: <span className="font-semibold">{event.owner_name}</span>
                </p>
              )}

              {/* Date + city */}
              <div
                className={`flex flex-wrap items-center gap-3 text-xs ${!isTeam ? "text-(--text-muted)" : ""}`}
                style={isTeam ? { color: "rgba(251,191,36,0.55)" } : {}}
              >
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

              {/* Action buttons — only for owned events */}
              {!isTeam && <EventActions event={event} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DESKTOP DASHBOARD
// ═══════════════════════════════════════════════════════════════════════

function DesktopDashboard() {
  const { events, fetchEvents, loading, updateEvent } = useEventStore();
  const { plan, isSubscribed, usage, limits, fetchSubscription } = useSubscriptionStore();
  const [updatingId,  setUpdatingId]  = useState(null);
  const [query,       setQuery]       = useState("");
  const [billingOpen, setBillingOpen] = useState(false);
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => { fetchEvents(); },        [fetchEvents]);
  useEffect(() => { fetchSubscription(); },  [fetchSubscription]);
  useEffect(() => { setMounted(true); },     []);

  const isPro     = isSubscribed && (plan === "pro" || plan === "premium" || plan === "enterprise");
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

  const isTeamActive = (e) => {
    const status = (e.status ?? '').toUpperCase();
    if (status === 'ARCHIVED' || status === 'CANCELLED') return false;
    if (e.runtime_status === 'COMPLETED' && e.ends_at_utc) return false;
    return true;
  };
  const ownEvents  = useMemo(() => filteredEvents.filter(e => !e.user_role || e.user_role === "OWNER"), [filteredEvents]);
  const teamEvents = useMemo(() => filteredEvents.filter(e => e.user_role && e.user_role !== "OWNER" && isTeamActive(e)), [filteredEvents]);

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
        <StatCard title="My events"   value={ownEvents.length}          subtitle="Events you own"      icon={CalendarDays} />
        <StatCard title="Team events" value={teamEvents.length}         subtitle="Events you manage"   icon={Users}        />
        <StatCard title="Tickets"     value="—"                         subtitle="Sales overview"      icon={Ticket}       />
        <StatCard title="Activity"    value={loading ? "..." : "Live"}  subtitle="Connected to API"    icon={Activity}     />
      </div>

      {mounted && showBanner && (
        <PlanUpgradeBanner
          plan={plan}
          eventsUsed={eventsUsed}
          eventsLimit={eventsLimit}
          onUpgrade={() => setBillingOpen(true)}
        />
      )}

      {/* Hide "My Events" section if user has no owned events but has team events */}
      {!(ownEvents.length === 0 && teamEvents.length > 0) && (
      <div className="rounded-3xl border border-border bg-(--bg-surface) p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-(--text-primary)">My Events</h2>
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
              suppressHydrationWarning
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
        ) : ownEvents.length === 0 && query ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Search className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-(--text-secondary)">No events match &ldquo;{query}&rdquo;</p>
            <button onClick={() => setQuery("")} className="text-xs text-indigo-500 hover:underline">Clear search</button>
          </div>
        ) : ownEvents.length === 0 ? (
          <p className="py-6 text-sm text-(--text-muted)">No events yet. Create one to get started.</p>
        ) : (
          <EventGrid events={ownEvents} updatingId={updatingId} onToggleVisibility={toggleVisibility} />
        )}
      </div>
      )}

      {/* ── Team events section ── */}
      {teamEvents.length > 0 && (
        <div className="rounded-3xl border bg-(--bg-surface) p-6" style={{ borderColor: "rgba(139,92,246,0.2)" }}>
          <div className="mb-5 flex items-center gap-2">
            <Users size={16} className="text-violet-400" />
            <h2 className="text-lg font-semibold text-(--text-primary)">Team Events</h2>
            <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-bold text-violet-400">{teamEvents.length}</span>
            <p className="ml-2 text-sm text-(--text-muted)">Events you&apos;ve been added to manage.</p>
          </div>
          <EventGrid events={teamEvents} updatingId={updatingId} onToggleVisibility={toggleVisibility} showRoleBadge />
        </div>
      )}

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
