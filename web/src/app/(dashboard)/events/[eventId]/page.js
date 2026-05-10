"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users, UserCheck, Ticket, QrCode,
  CalendarDays, MapPin, Globe, Tag,
  Pencil, Eye, Layout, ArrowRight, Clock,
  BarChart3, Heart, Settings, Plus,
  Home, User, ChevronRight, ChevronLeft,
} from "lucide-react";
import { useEventStore }  from "@/store/event.store";
import StatCard           from "@/components/ui/stat-card";
import ShareEventCard     from "@/components/events/ShareEventCard";
import { EVENT_CATEGORIES } from "@/config/event-categories";
import TicketGateModal    from "@/components/events/TicketGateModal";

// ── Cover image fallbacks ─────────────────────────────────────────────────────
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

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  PUBLISHED: { bg: "rgba(16,185,129,0.15)",  text: "#10b981", dot: "#10b981" },
  DRAFT:     { bg: "rgba(245,158,11,0.15)",   text: "#f59e0b", dot: "#f59e0b" },
  CANCELLED: { bg: "rgba(239,68,68,0.15)",    text: "#ef4444", dot: "#ef4444" },
  ARCHIVED:  { bg: "rgba(107,114,128,0.15)",  text: "#9ca3af", dot: "#6b7280" },
};
const sc = (s) => STATUS_CFG[(s ?? "DRAFT").toUpperCase()] ?? STATUS_CFG.DRAFT;

// ── Desktop status badge ──────────────────────────────────────────────────────
const STATUS_STYLES = {
  PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  DRAFT:     "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  CANCELLED: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
  ARCHIVED:  "bg-gray-100   text-gray-600   dark:bg-gray-800      dark:text-gray-400",
};
function StatusBadge({ status }) {
  const s   = (status ?? "DRAFT").toUpperCase();
  const cls = STATUS_STYLES[s] ?? STATUS_STYLES.DRAFT;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {s.charAt(0) + s.slice(1).toLowerCase()}
    </span>
  );
}

// ── Desktop detail row ────────────────────────────────────────────────────────
function Detail({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-gray-800">
        <Icon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

// ── Desktop quick action ──────────────────────────────────────────────────────
function QuickAction({ label, description, href, onClick, icon: Icon, primary }) {
  const baseClass = `group flex items-center gap-3 rounded-xl border px-4 py-3 transition w-full text-left ${
    primary
      ? "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70"
      : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
  }`;
  const iconClass = `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
    primary ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-800 dark:group-hover:bg-gray-700"
  }`;
  const iconColor = primary
    ? "h-4 w-4 text-indigo-600 dark:text-indigo-400"
    : "h-4 w-4 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200";
  const inner = (
    <>
      <div className={iconClass}><Icon className={iconColor} /></div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${primary ? "text-indigo-700 dark:text-indigo-300" : "text-gray-800 dark:text-gray-100"}`}>{label}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <ArrowRight className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${primary ? "text-indigo-400" : "text-gray-300 dark:text-gray-600"}`} />
    </>
  );
  if (href) return <Link href={href} className={baseClass}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={baseClass}>{inner}</button>;
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
      {children}
    </h3>
  );
}

// ── Feature modules with toggles ──────────────────────────────────────────────
const MODULE_CFG = {
  allow_rsvp:       { icon: Users,  label: "RSVP",           desc: "Guest list & tracking", activeBg: "bg-indigo-50 dark:bg-indigo-900/20",  activeIcon: "text-indigo-600 dark:text-indigo-400" },
  allow_ticketing:  { icon: Ticket, label: "Stripe Ticketing", desc: "Paid ticket sales",    activeBg: "bg-amber-50 dark:bg-amber-900/20",    activeIcon: "text-amber-600 dark:text-amber-400"   },
  allow_qr_checkin: { icon: QrCode, label: "Express Entry",   desc: "QR scan at the door",  activeBg: "bg-cyan-50 dark:bg-cyan-900/20",      activeIcon: "text-cyan-600 dark:text-cyan-400"     },
  allow_donations:  { icon: Heart,  label: "Donations",       desc: "Accept contributions",  activeBg: "bg-pink-50 dark:bg-pink-900/20",      activeIcon: "text-pink-600 dark:text-pink-400"     },
};
const MODULE_HREFS = (eventId) => ({
  allow_rsvp:       `/events/${eventId}/guests`,
  allow_ticketing:  `/events/${eventId}/tickets`,
  allow_qr_checkin: `/events/${eventId}/scanner`,
  allow_donations:  `/events/${eventId}/donations`,
});

function FeatureModules({ event, eventId }) {
  const { updateEvent } = useEventStore();
  const hrefs = MODULE_HREFS(eventId);
  const [local,  setLocal]  = useState(() =>
    Object.fromEntries(Object.keys(MODULE_CFG).map((k) => [k, !!event?.[k]]))
  );
  const [saving, setSaving] = useState({});

  const toggle = async (e, key) => {
    e.preventDefault(); e.stopPropagation();
    if (saving[key]) return;
    const next = !local[key];
    setLocal((s) => ({ ...s, [key]: next }));
    setSaving((s) => ({ ...s, [key]: true }));
    await updateEvent(eventId, { [key]: next });
    setSaving((s) => ({ ...s, [key]: false }));
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle>Active Modules</SectionTitle>
        <Link href={`/events/${eventId}/settings`} className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200">
          <Settings className="h-3 w-3" /> All settings
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(MODULE_CFG).map(([key, cfg]) => {
          const active = local[key];
          const busy   = !!saving[key];
          const Icon   = cfg.icon;
          return (
            <div key={key} className="relative">
              <Link
                href={active ? hrefs[key] : `/events/${eventId}/settings`}
                className={`flex flex-col gap-2.5 rounded-xl border p-3.5 pr-12 transition ${
                  active ? `${cfg.activeBg} border-transparent hover:shadow-sm` : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? cfg.activeBg : "bg-gray-100 dark:bg-gray-800"}`}>
                  <Icon className={`h-4 w-4 ${active ? cfg.activeIcon : "text-gray-300 dark:text-gray-600"}`} />
                </div>
                <div>
                  <p className={`text-xs font-bold leading-tight ${active ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>{cfg.label}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{active ? cfg.desc : "Disabled"}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={(e) => toggle(e, key)}
                disabled={busy}
                aria-label={`${active ? "Disable" : "Enable"} ${cfg.label}`}
                className="absolute right-3 top-3 flex items-center focus:outline-none"
              >
                {busy ? (
                  <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <div className={`relative h-5 w-9 rounded-full transition-colors duration-300 ${active ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`}>
                    <div className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${active ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Entertainment detection ───────────────────────────────────────────────────
const ENTERTAINMENT_SUBS = EVENT_CATEGORIES.find((c) => c.id === "entertainment")?.subcategories ?? [];
const ENTERTAINMENT_DASHBOARD_MODES = new Set(ENTERTAINMENT_SUBS.map((s) => s.id.toUpperCase()));
const ENTERTAINMENT_EVENT_TYPES     = new Set(ENTERTAINMENT_SUBS.map((s) => s.eventType.toUpperCase()));

function isEntertainmentEvent(event) {
  if (!event) return false;
  if (event.allow_ticketing === true) return true;
  const mode = String(event.dashboard_mode ?? "").toUpperCase().trim();
  const type = String(event.event_type ?? "").toUpperCase().trim();
  return (mode && ENTERTAINMENT_DASHBOARD_MODES.has(mode)) || (type && ENTERTAINMENT_EVENT_TYPES.has(type));
}

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
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
      style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.08)", paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-end justify-around">
        {tabs.map((tab) => {
          if (!tab) {
            return (
              <Link key="create" href="/events/create" className="-mt-5 flex flex-col items-center gap-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px]" style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", boxShadow: "0 4px 20px rgba(99,102,241,0.45)" }}>
                  <Plus size={24} className="text-white" />
                </div>
                <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>Create</span>
              </Link>
            );
          }
          const { href, label, Icon, active } = tab;
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-3 py-1">
              <Icon size={22} style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }} />
              <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileStat({ value, label, color, href }) {
  const inner = (
    <div
      className="flex flex-1 flex-col gap-1 rounded-[16px] border p-3.5"
      style={{ background: `${color}10`, borderColor: `${color}22` }}
    >
      <span className="text-[22px] font-black leading-none" style={{ color }}>{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-[0.4px]" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</span>
    </div>
  );
  if (href) return <Link href={href} className="flex flex-1">{inner}</Link>;
  return <div className="flex flex-1">{inner}</div>;
}

function MobileModuleToggle({ moduleKey, cfg, active, busy, onToggle, href }) {
  const MODULE_COLORS = {
    allow_rsvp:       { icon: "#6366f1", bg: "rgba(99,102,241,0.12)"  },
    allow_ticketing:  { icon: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
    allow_qr_checkin: { icon: "#06b6d4", bg: "rgba(6,182,212,0.12)"   },
    allow_donations:  { icon: "#ec4899", bg: "rgba(236,72,153,0.12)"  },
  };
  const col  = MODULE_COLORS[moduleKey] ?? { icon: "#6366f1", bg: "rgba(99,102,241,0.12)" };
  const Icon = cfg.icon;

  return (
    <div
      className="flex flex-col gap-3 rounded-[16px] border p-3.5"
      style={{
        background: active ? col.bg : "rgba(255,255,255,0.03)",
        borderColor: active ? `${col.icon}30` : "rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: active ? `${col.icon}20` : "rgba(255,255,255,0.06)" }}>
          <Icon size={16} style={{ color: active ? col.icon : "rgba(255,255,255,0.25)" }} />
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className="relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none"
          style={{ background: active ? "#6366f1" : "rgba(255,255,255,0.12)" }}
        >
          {busy ? (
            <span className="absolute left-0.5 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <span
              className="absolute h-4 w-4 rounded-full bg-white shadow transition-transform duration-300"
              style={{ left: active ? "calc(100% - 18px)" : 2 }}
            />
          )}
        </button>
      </div>
      <div>
        <p className="text-[12px] font-extrabold text-white">{cfg.label}</p>
        <p className="mt-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
          {active ? cfg.desc : "Disabled"}
        </p>
      </div>
      {active && (
        <Link
          href={href}
          className="flex items-center gap-1 text-[10px] font-bold"
          style={{ color: col.icon }}
        >
          Open <ChevronRight size={10} />
        </Link>
      )}
    </div>
  );
}

function MobileModules({ event, eventId }) {
  const { updateEvent } = useEventStore();
  const hrefs = MODULE_HREFS(eventId);
  const [local,  setLocal]  = useState(() =>
    Object.fromEntries(Object.keys(MODULE_CFG).map((k) => [k, !!event?.[k]]))
  );
  const [saving, setSaving] = useState({});

  const toggle = async (key) => {
    if (saving[key]) return;
    const next = !local[key];
    setLocal((s) => ({ ...s, [key]: next }));
    setSaving((s) => ({ ...s, [key]: true }));
    await updateEvent(eventId, { [key]: next });
    setSaving((s) => ({ ...s, [key]: false }));
  };

  return (
    <div className="px-4">
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.5px]" style={{ color: "rgba(255,255,255,0.35)" }}>
        Modules
      </p>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(MODULE_CFG).map(([key, cfg]) => (
          <MobileModuleToggle
            key={key}
            moduleKey={key}
            cfg={cfg}
            active={local[key]}
            busy={!!saving[key]}
            onToggle={() => toggle(key)}
            href={hrefs[key]}
          />
        ))}
      </div>
    </div>
  );
}

function MobileQuickAction({ Icon, label, desc, href, onClick, accent }) {
  const inner = (
    <div
      className="flex items-center gap-3 rounded-[14px] border px-4 py-3.5"
      style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
        style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
      >
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-extrabold text-white">{label}</p>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{desc}</p>
      </div>
      <ChevronRight size={15} style={{ color: "rgba(255,255,255,0.20)" }} />
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return <button type="button" onClick={onClick} className="w-full text-left">{inner}</button>;
}

function MobileEventDetail({ event, stats, eventId, hasFullTicketing, location, isPublic, onTicketGate }) {
  const cfg = sc(event.status);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: "#07070f" }}>
      <div className="flex-1 overflow-y-auto">

        {/* Hero cover */}
        <div className="relative" style={{ height: 240 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImg(event)} alt={event.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,7,15,0.5) 0%, transparent 40%, rgba(7,7,15,0.85) 100%)" }} />

          {/* Header row */}
          <div
            className="absolute left-0 right-0 top-0 flex items-center justify-between px-4"
            style={{ paddingTop: "max(48px, env(safe-area-inset-top))" }}
          >
            <Link
              href="/events"
              className="flex h-9 w-9 items-center justify-center rounded-[11px] border"
              style={{ background: "rgba(0,0,0,0.45)", borderColor: "rgba(255,255,255,0.12)" }}
            >
              <ChevronLeft size={18} className="text-white" />
            </Link>
            <Link
              href={`/events/${eventId}/edit`}
              className="flex h-9 items-center gap-1.5 rounded-[11px] border px-3"
              style={{ background: "rgba(0,0,0,0.45)", borderColor: "rgba(255,255,255,0.12)" }}
            >
              <Pencil size={13} className="text-white" />
              <span className="text-[12px] font-bold text-white">Edit</span>
            </Link>
          </div>

          {/* Bottom overlay: title + status */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ background: cfg.bg }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
                <span className="text-[11px] font-extrabold" style={{ color: cfg.text }}>
                  {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
                </span>
              </div>
              {event.event_type && (
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.3px]"
                  style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.60)" }}
                >
                  {event.event_type}
                </span>
              )}
            </div>
            <p className="text-[20px] font-black leading-tight tracking-tight text-white line-clamp-2">
              {event.title}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 pb-8 pt-5">

          {/* Stats 2×2 */}
          <div className="px-4">
            <div className="grid grid-cols-2 gap-3">
              <MobileStat value={stats.guest_count    ?? 0} label="Guests"    color="#6366f1" href={`/events/${eventId}/guests`} />
              <MobileStat value={stats.attending_count ?? 0} label="Attending" color="#10b981" />
              <MobileStat value={stats.ticket_count   ?? 0} label="Tickets"   color="#a78bfa" href={hasFullTicketing ? `/events/${eventId}/tickets` : undefined} />
              <MobileStat value={stats.checkin_count  ?? 0} label="Check-ins" color="#f59e0b" href={`/events/${eventId}/scanner`} />
            </div>
          </div>

          {/* Event details row */}
          <div className="px-4">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.5px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Details
            </p>
            <div
              className="flex flex-col gap-2.5 rounded-[18px] border p-4"
              style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.07)" }}
            >
              {event.starts_at_local && (
                <div className="flex items-center gap-2.5">
                  <CalendarDays size={14} style={{ color: "#6366f1" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.70)" }}>
                    {formatDate(event.starts_at_local)}
                  </span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-2.5">
                  <MapPin size={14} style={{ color: "#10b981" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.70)" }}>{location}</span>
                </div>
              )}
              {event.visibility && (
                <div className="flex items-center gap-2.5">
                  <Globe size={14} style={{ color: "#f59e0b" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.70)" }}>{event.visibility}</span>
                </div>
              )}
            </div>
          </div>

          {/* Modules */}
          <MobileModules event={event} eventId={eventId} />

          {/* Quick actions */}
          <div className="px-4">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.5px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Quick Actions
            </p>
            <div className="flex flex-col gap-2.5">
              <MobileQuickAction Icon={Layout}   label="Event Builder"   desc="Design your event page"    href={`/events/${eventId}/builder`}   accent="#6366f1" />
              <MobileQuickAction Icon={BarChart3} label="Analytics"       desc="Views & conversions"       href={`/events/${eventId}/analytics`} accent="#a78bfa" />
              <MobileQuickAction Icon={Users}     label="Manage Guests"   desc="Invite & track attendees"  href={`/events/${eventId}/guests`}    accent="#10b981" />
              {hasFullTicketing
                ? <MobileQuickAction Icon={Ticket} label="Tickets"        desc="Ticket tiers & sales"      href={`/events/${eventId}/tickets`}   accent="#f59e0b" />
                : <MobileQuickAction Icon={Ticket} label="Tickets"        desc="Not available for this type" onClick={onTicketGate}              accent="#6b7280" />
              }
              <MobileQuickAction Icon={QrCode}   label="QR Scanner"      desc="Check in on arrival"       href={`/events/${eventId}/scanner`}   accent="#06b6d4" />
              <MobileQuickAction
                Icon={Eye}
                label={isPublic ? "View Event Page" : "Preview"}
                desc={isPublic ? "Public page" : "Draft preview"}
                href={isPublic ? `/e/${event.slug}` : `/e/${event.slug}?preview=1`}
                accent="#ec4899"
              />
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function EventDetailPage() {
  const { eventId } = useParams();
  const { fetchEventDashboard, dashboard, loading } = useEventStore();
  const [ticketGateOpen, setTicketGateOpen] = useState(false);

  useEffect(() => {
    if (eventId) fetchEventDashboard(eventId);
  }, [eventId, fetchEventDashboard]);

  const event    = dashboard?.event;
  const stats    = dashboard?.stats ?? {};
  const hasFullTicketing = isEntertainmentEvent(event);
  const location = [event?.venue_name, event?.city, event?.country].filter(Boolean).join(", ") || null;
  const isPublic = event?.visibility === "PUBLIC";

  if (loading || !event) {
    return (
      <>
        {/* Mobile skeleton */}
        <div className="sm:hidden">
          <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#07070f" }}>
            <div className="h-[240px] animate-pulse" style={{ background: "#0e0e16" }} />
            <div className="flex flex-col gap-4 p-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-[16px]" style={{ background: "#0e0e16" }} />
              ))}
            </div>
          </div>
        </div>
        {/* Desktop loading */}
        <div className="hidden sm:flex min-h-[40vh] items-center justify-center text-sm text-gray-400">
          Loading…
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Mobile layout ── */}
      <div className="sm:hidden">
        <MobileEventDetail
          event={event}
          stats={stats}
          eventId={eventId}
          hasFullTicketing={hasFullTicketing}
          location={location}
          isPublic={isPublic}
          onTicketGate={() => setTicketGateOpen(true)}
        />
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden sm:block">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">{event.title}</h1>
                <StatusBadge status={event.status} />
              </div>
              {event.short_description && (
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{event.short_description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/events/${eventId}/edit`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
              <Link
                href={isPublic ? `/e/${event.slug}` : `/e/${event.slug}?preview=1`}
                target="_blank"
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                  isPublic
                    ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                {isPublic ? "View page" : "Preview"}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard title="Guests"    value={stats.guest_count    ?? 0} subtitle="Total invited"    icon={Users}    color="indigo"  href={`/events/${eventId}/guests`} />
            <StatCard title="Attending" value={stats.attending_count ?? 0} subtitle="Confirmed RSVPs" icon={UserCheck} color="emerald" />
            <StatCard title="Tickets"   value={stats.ticket_count   ?? 0} subtitle="Issued"           icon={Ticket}   color="violet"  href={hasFullTicketing ? `/events/${eventId}/tickets` : undefined} />
            <StatCard title="Check-ins" value={stats.checkin_count  ?? 0} subtitle="Scanned entries"  icon={QrCode}   color="amber"   href={`/events/${eventId}/scanner`} />
          </div>

          <FeatureModules event={event} eventId={eventId} />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <ShareEventCard slug={event.slug} customDomain={event.custom_domain} />
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <SectionTitle>Event details</SectionTitle>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Detail icon={CalendarDays} label="Starts"     value={formatDate(event.starts_at_local ?? event.starts_at_utc)} />
                  <Detail icon={Clock}        label="Ends"       value={formatDate(event.ends_at_local   ?? event.ends_at_utc)}   />
                  <Detail icon={MapPin}       label="Location"   value={location}         />
                  <Detail icon={Globe}        label="Visibility" value={event.visibility} />
                  <Detail icon={Tag}          label="Status"     value={event.status}     />
                  <Detail icon={Clock}        label="Timezone"   value={event.timezone}   />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <SectionTitle>Quick actions</SectionTitle>
              <div className="space-y-2">
                <QuickAction label="Open builder"  description="Design your event page"      href={`/events/${eventId}/builder`}   icon={Layout}   primary />
                <QuickAction label="Manage guests" description="Invite & track attendees"    href={`/events/${eventId}/guests`}    icon={Users}           />
                {hasFullTicketing ? (
                  <QuickAction label="Tickets"     description="Manage ticket tiers & sales" href={`/events/${eventId}/tickets`}   icon={Ticket}          />
                ) : (
                  <QuickAction label="Tickets"     description="Not available for this event type" icon={Ticket} onClick={() => setTicketGateOpen(true)} />
                )}
                <QuickAction label="QR Scanner"   description="Check in on arrival"          href={`/events/${eventId}/scanner`}   icon={QrCode}         />
                <QuickAction label="Analytics"    description="Views & conversions"           href={`/events/${eventId}/analytics`} icon={BarChart3}      />
              </div>
            </div>
          </div>
        </div>
      </div>

      <TicketGateModal
        open={ticketGateOpen}
        onClose={() => setTicketGateOpen(false)}
        event={event}
      />
    </>
  );
}
