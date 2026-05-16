"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users, UserCheck, Ticket, QrCode,
  CalendarDays, MapPin, Globe, Tag,
  Pencil, Eye, Layout, ArrowRight, Clock,
  BarChart3, Heart, Settings, Plus,
  Home, User, ChevronRight,
  Share2, MoreHorizontal, ArrowLeft, Camera, ExternalLink,
  Send, EyeOff, Archive, Trash2, RotateCcw, CreditCard,
  LayoutGrid, CheckCircle,
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

// ── Feature modules with toggles (desktop) ───────────────────────────────────
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

function useMobileCountdown(iso) {
  const [diff, setDiff] = useState({ d: 0, h: 0, m: 0, s: 0, past: false });
  useEffect(() => {
    if (!iso) return;
    const tick = () => {
      const ms = new Date(iso).getTime() - Date.now();
      if (ms <= 0) { setDiff({ d: 0, h: 0, m: 0, s: 0, past: true }); return; }
      const tot = Math.floor(ms / 1000);
      setDiff({
        d: Math.floor(tot / 86400),
        h: Math.floor((tot % 86400) / 3600),
        m: Math.floor((tot % 3600) / 60),
        s: tot % 60,
        past: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);
  return diff;
}

function MobileConfirmDialog({ title, desc, danger, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md flex flex-col gap-4 rounded-t-[24px] p-6"
        style={{
          background: "#0e0e16",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-10 self-center rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        <p className="text-center text-[18px] font-black text-white" style={{ letterSpacing: "-0.3px" }}>{title}</p>
        <p className="text-center text-[13px]" style={{ color: "rgba(255,255,255,0.50)" }}>{desc}</p>
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-[52px] items-center justify-center rounded-[14px] text-[15px] font-extrabold"
            style={
              danger
                ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }
                : { background: "linear-gradient(135deg,#4f46e5,#8b5cf6)", color: "#fff" }
            }
          >
            {danger ? "Delete" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-[48px] items-center justify-center rounded-[14px] text-[14px] font-bold"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

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
        {tabs.map((tab, idx) => {
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

function MobileEventDetail({ event, stats, eventId, hasFullTicketing, isPublic, onTicketGate }) {
  const cfg      = sc(event.status);
  const router   = useRouter();
  const status   = (event.status ?? "DRAFT").toUpperCase();
  const countdown = useMobileCountdown(event.starts_at_utc);
  const { publishEvent, unpublishEvent, archiveEvent, restoreEvent, deleteEvent } = useEventStore();
  const [loading, setLoading] = useState(false);
  const [modal,   setModal]   = useState(null);

  const run = useCallback(async (fn) => {
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  }, []);

  const FEATURES = [
    { FIcon: Layout,     label: "Builder",   sub: "Design event page",   accent: "#6366f1", grad: "linear-gradient(135deg,#4f46e5,#6366f1)", href: `/events/${eventId}/builder`   },
    { FIcon: Users,      label: "Guests",    sub: "Manage attendees",    accent: "#10b981", grad: "linear-gradient(135deg,#059669,#10b981)", href: `/events/${eventId}/guests`    },
    { FIcon: CreditCard, label: "Tickets",   sub: "Types & orders",      accent: "#f59e0b", grad: "linear-gradient(135deg,#d97706,#f59e0b)", href: `/events/${eventId}/tickets`   },
    { FIcon: LayoutGrid, label: "Seating",   sub: "Seat assignments",    accent: "#06b6d4", grad: "linear-gradient(135deg,#0891b2,#06b6d4)", href: `/events/${eventId}/seating`   },
    { FIcon: Camera,     label: "Scanner",   sub: "QR check-in",         accent: "#10b981", grad: "linear-gradient(135deg,#0891b2,#06b6d4)", href: `/events/${eventId}/scanner`   },
    { FIcon: BarChart3,  label: "Analytics", sub: "Revenue & insights",  accent: "#a78bfa", grad: "linear-gradient(135deg,#7c3aed,#8b5cf6)", href: `/events/${eventId}/analytics` },
    { FIcon: Heart,      label: "Donations", sub: "Track contributions", accent: "#f43f5e", grad: "linear-gradient(135deg,#be185d,#f43f5e)", href: `/events/${eventId}/donations` },
    { FIcon: Settings,   label: "Settings",  sub: "Edit event details",  accent: "#6b7280", grad: "linear-gradient(135deg,#374151,#4b5563)", href: `/events/${eventId}/settings`  },
  ];

  const STAT_ITEMS = [
    { SIcon: Users,        label: "Guests",    value: stats.guest_count     ?? 0, accent: "#6366f1", href: `/events/${eventId}/guests`  },
    { SIcon: UserCheck,    label: "Attending", value: stats.attending_count ?? 0, accent: "#10b981"  },
    { SIcon: CreditCard,   label: "Tickets",   value: stats.ticket_count    ?? 0, accent: "#f59e0b", href: hasFullTicketing ? `/events/${eventId}/tickets` : undefined },
    { SIcon: CheckCircle,  label: "Scanned",   value: stats.checkin_count   ?? 0, accent: "#a78bfa", href: `/events/${eventId}/scanner` },
  ];

  const ticketPct = (stats.ticket_count ?? 0) > 0
    ? Math.min(((stats.checkin_count ?? 0) / (stats.ticket_count ?? 1)) * 100, 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: "#0e0f11" }}>

      {/* Floating topbar — sits above scroll */}
      <div
        className="absolute left-0 right-0 top-0 z-20 flex items-end justify-between px-4 pb-3"
        style={{ paddingTop: "max(48px, env(safe-area-inset-top))", pointerEvents: "none" }}
      >
        <Link
          href="/events"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px]"
          style={{ background: "rgba(0,0,0,0.45)", pointerEvents: "auto" }}
        >
          <ArrowLeft size={17} className="text-white" />
        </Link>
        <button
          type="button"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px]"
          style={{ background: "rgba(0,0,0,0.45)", pointerEvents: "auto" }}
        >
          <MoreHorizontal size={19} className="text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Hero 320px ── */}
        <div className="relative" style={{ height: 320 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImg(event)} alt={event.title} className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(14,15,17,0.12) 0%, rgba(14,15,17,0.5) 60%, rgba(14,15,17,0.97) 100%)" }}
          />
          <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-[10px] px-5 pb-6">
            {/* Status pill */}
            <div
              className="inline-flex items-center gap-1.5 self-start rounded-full px-[10px] py-[5px]"
              style={{ background: cfg.bg }}
            >
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: cfg.dot }} />
              <span className="text-[11px] font-extrabold" style={{ color: cfg.text }}>
                {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
              </span>
            </div>
            {/* Title */}
            <p className="text-[32px] font-black leading-[36px] text-white" style={{ letterSpacing: "-0.8px" }}>
              {event.title}
            </p>
            {/* Type chip */}
            <div
              className="inline-flex self-start rounded-full border px-3 py-[5px]"
              style={{ background: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.18)" }}
            >
              <span className="text-[10px] font-extrabold" style={{ color: "rgba(255,255,255,0.7)", letterSpacing: "1.5px" }}>
                {event.event_type?.replace(/_/g, " ").toUpperCase() ?? "EVENT"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col gap-4 px-4 pt-6" style={{ paddingBottom: 40 }}>

          {/* Countdown */}
          {event.starts_at_utc && !countdown.past && (
            <div className="flex flex-col gap-[10px]">
              <p className="text-[10px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "1.5px" }}>
                EVENT STARTS IN
              </p>
              <div className="flex items-center gap-2">
                {(countdown.d > 0
                  ? [{ v: countdown.d, l: "DAYS" }, { v: countdown.h, l: "HRS" }, { v: countdown.m, l: "MIN" }, { v: countdown.s, l: "SEC" }]
                  : [{ v: countdown.h, l: "HRS" }, { v: countdown.m, l: "MIN" }, { v: countdown.s, l: "SEC" }]
                ).map((u, i) => (
                  <React.Fragment key={u.l}>
                    {i > 0 && (
                      <span className="text-[24px] font-light" style={{ color: "rgba(255,255,255,0.2)", marginBottom: 10 }}>:</span>
                    )}
                    <div
                      className="relative flex flex-1 flex-col items-center gap-[2px] overflow-hidden rounded-[16px] border py-[14px]"
                      style={{ background: "#0e0e16", borderColor: "rgba(108,111,238,0.25)" }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to bottom, rgba(108,111,238,0.12), rgba(108,111,238,0.04))" }}
                      />
                      <span className="relative text-[30px] font-black leading-none text-white" style={{ letterSpacing: "-1px" }}>
                        {String(u.v).padStart(2, "0")}
                      </span>
                      <span className="relative text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "1.5px" }}>
                        {u.l}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Ticket hero card */}
          {(event.allow_ticketing || (stats.ticket_count ?? 0) > 0) && (
            <Link
              href={`/events/${eventId}/tickets`}
              className="block overflow-hidden rounded-[20px] border"
              style={{ background: "rgba(12,12,22,0.88)", borderColor: "rgba(99,102,241,0.28)" }}
            >
              <div className="h-1" style={{ background: "#6366f1" }} />
              <div
                className="flex items-center justify-between border-b px-4 pb-3 pt-[14px]"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="rounded-full border px-3 py-[5px]"
                  style={{ background: "rgba(99,102,241,0.13)", borderColor: "rgba(99,102,241,0.28)" }}
                >
                  <span className="text-[11px] font-extrabold" style={{ color: "#6366f1", letterSpacing: "0.5px" }}>🎟 Tickets</span>
                </div>
                <div
                  className="flex items-center gap-[5px] rounded-full border px-[10px] py-1"
                  style={{ background: "rgba(16,185,129,0.09)", borderColor: "rgba(16,185,129,0.21)" }}
                >
                  <span className="h-[6px] w-[6px] rounded-full" style={{ background: "#10b981" }} />
                  <span className="text-[9px] font-black" style={{ color: "#10b981", letterSpacing: "1px" }}>LIVE</span>
                </div>
              </div>
              <div className="flex items-center px-4 py-4">
                {[
                  { v: stats.ticket_count   ?? 0,             l: "Issued",        c: "#fff"     },
                  { v: stats.checkin_count  ?? 0,             l: "Checked In",    c: "#10b981"  },
                  { v: `${Math.round(ticketPct)}%`,           l: "Check-in Rate", c: "#f59e0b"  },
                ].map((it, i) => (
                  <React.Fragment key={it.l}>
                    {i > 0 && <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />}
                    <div className="flex flex-1 flex-col items-center gap-[3px]">
                      <span className="text-[26px] font-black" style={{ color: it.c, letterSpacing: "-0.8px" }}>{it.v}</span>
                      <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>{it.l}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              {(stats.ticket_count ?? 0) > 0 && (
                <div className="px-4 pb-3">
                  <div className="h-1 overflow-hidden rounded-sm" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-sm"
                      style={{ width: `${ticketPct}%`, background: "linear-gradient(to right, #6366f1, #8b5cf6)" }}
                    />
                  </div>
                </div>
              )}
              <div
                className="flex items-center justify-center gap-[6px] border-t py-3"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <span className="text-[13px] font-bold" style={{ color: "#6366f1" }}>View all tickets</span>
                <ArrowRight size={13} style={{ color: "#6366f1" }} />
              </div>
            </Link>
          )}

          {/* Meta card */}
          <div
            className="flex flex-col rounded-[16px] border p-4"
            style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.07)" }}
          >
            {event.starts_at_local && (
              <div className="flex items-center gap-3 py-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: "rgba(99,102,241,0.12)" }}>
                  <Clock size={14} style={{ color: "#6366f1" }} />
                </div>
                <span className="flex-1 text-[14px] font-medium text-white">{formatDate(event.starts_at_local)}</span>
              </div>
            )}
            {event.venue_name && (
              <>
                <div className="my-2 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="flex items-center gap-3 py-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: "rgba(16,185,129,0.12)" }}>
                    <MapPin size={14} style={{ color: "#10b981" }} />
                  </div>
                  <span className="flex-1 truncate text-[14px] font-medium text-white">
                    {event.venue_name}{event.city ? ` · ${event.city}` : ""}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Stats 4-col grid */}
          <div className="grid grid-cols-4 gap-[10px]">
            {STAT_ITEMS.map(({ SIcon, label, value, accent, href }) => {
              const card = (
                <div
                  className="relative flex flex-col items-center gap-1 overflow-hidden rounded-[16px] border py-4"
                  style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${accent}14, ${accent}06)` }} />
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: `${accent}20` }}>
                    <SIcon size={15} style={{ color: accent }} />
                  </div>
                  <span className="relative text-[24px] font-black leading-none" style={{ color: accent, letterSpacing: "-0.5px" }}>{value}</span>
                  <span className="relative text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px" }}>{label}</span>
                </div>
              );
              if (href) return <Link key={label} href={href} className="block">{card}</Link>;
              return <div key={label}>{card}</div>;
            })}
          </div>

          {/* Quick-action pills */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/events/${eventId}/guests`}
              className="flex items-center gap-[6px] rounded-full border px-[14px] py-2"
              style={{ borderColor: "rgba(99,102,241,0.40)", background: "rgba(99,102,241,0.12)" }}
            >
              <Users size={14} style={{ color: "#6366f1" }} />
              <span className="text-[11px] font-extrabold" style={{ color: "#6366f1", letterSpacing: "0.8px" }}>RSVP</span>
            </Link>
            <Link
              href={`/events/${eventId}/scanner`}
              className="flex items-center gap-[6px] rounded-full border px-[14px] py-2"
              style={{ borderColor: "rgba(16,185,129,0.40)", background: "rgba(16,185,129,0.12)" }}
            >
              <Camera size={14} style={{ color: "#10b981" }} />
              <span className="text-[11px] font-extrabold" style={{ color: "#10b981", letterSpacing: "0.8px" }}>QR CHECK-IN</span>
            </Link>
            {event.allow_ticketing && (
              hasFullTicketing ? (
                <Link
                  href={`/events/${eventId}/tickets`}
                  className="flex items-center gap-[6px] rounded-full border px-[14px] py-2"
                  style={{ borderColor: "rgba(245,158,11,0.40)", background: "rgba(245,158,11,0.12)" }}
                >
                  <CreditCard size={14} style={{ color: "#f59e0b" }} />
                  <span className="text-[11px] font-extrabold" style={{ color: "#f59e0b", letterSpacing: "0.8px" }}>BUY TICKETS</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onTicketGate}
                  className="flex items-center gap-[6px] rounded-full border px-[14px] py-2"
                  style={{ borderColor: "rgba(245,158,11,0.40)", background: "rgba(245,158,11,0.12)" }}
                >
                  <CreditCard size={14} style={{ color: "#f59e0b" }} />
                  <span className="text-[11px] font-extrabold" style={{ color: "#f59e0b", letterSpacing: "0.8px" }}>BUY TICKETS</span>
                </button>
              )
            )}
            {event.slug && (
              <button
                type="button"
                className="flex items-center gap-[6px] rounded-full border px-[14px] py-2"
                style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)" }}
              >
                <Share2 size={14} style={{ color: "rgba(255,255,255,0.45)" }} />
                <span className="text-[11px] font-extrabold" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.8px" }}>SHARE</span>
              </button>
            )}
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col gap-2">
            {status === "DRAFT" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setModal({
                  action: () => run(() => publishEvent(eventId)),
                  title: "Publish this event?",
                  desc: "Your event will be publicly visible.",
                  danger: false,
                })}
                className="relative flex h-[52px] items-center justify-center gap-[9px] overflow-hidden rounded-[14px]"
                style={{ background: "linear-gradient(to right, #4f46e5, #8b5cf6)" }}
              >
                {loading
                  ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <><Send size={16} className="text-white" /><span className="text-[15px] font-extrabold text-white" style={{ letterSpacing: "-0.2px" }}>Publish Event</span></>
                }
              </button>
            )}
            {status === "PUBLISHED" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setModal({
                  action: () => run(() => unpublishEvent(eventId)),
                  title: "Unpublish?",
                  desc: "Event goes back to draft.",
                  danger: false,
                })}
                className="flex h-[52px] items-center justify-center gap-[9px] rounded-[14px] border"
                style={{ borderColor: "rgba(245,158,11,0.34)", background: "transparent" }}
              >
                {loading
                  ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
                  : <><EyeOff size={16} style={{ color: "#f59e0b" }} /><span className="text-[15px] font-extrabold" style={{ color: "#f59e0b", letterSpacing: "-0.2px" }}>Unpublish</span></>
                }
              </button>
            )}
            {(status === "ARCHIVED" || status === "CANCELLED") && (
              <button
                type="button"
                disabled={loading}
                onClick={() => run(() => restoreEvent(eventId))}
                className="relative flex h-[52px] items-center justify-center gap-[9px] overflow-hidden rounded-[14px]"
                style={{ background: "linear-gradient(to right, #4f46e5, #8b5cf6)" }}
              >
                <RotateCcw size={16} className="text-white" />
                <span className="text-[15px] font-extrabold text-white" style={{ letterSpacing: "-0.2px" }}>Restore Event</span>
              </button>
            )}
          </div>

          {/* See Your Website */}
          {event.slug && (
            <Link
              href={isPublic ? `/e/${event.slug}` : `/e/${event.slug}?preview=1`}
              target="_blank"
              className="flex items-center gap-[9px] rounded-[14px] border px-4 py-[13px]"
              style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.18)" }}
            >
              <Globe size={14} style={{ color: "#6366f1" }} />
              <span className="text-[14px] font-bold" style={{ color: "#6366f1" }}>See Your Website</span>
              <ExternalLink size={13} className="ml-auto" style={{ color: "rgba(255,255,255,0.25)" }} />
            </Link>
          )}

          {/* Divider */}
          <div className="h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

          {/* MANAGE */}
          <p className="text-[10px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "1.5px" }}>MANAGE</p>

          {/* Feature grid 2×N */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ FIcon, label, sub, accent, grad, href }) => (
              <Link
                key={label}
                href={href}
                className="relative flex min-h-[120px] flex-col gap-[6px] overflow-hidden rounded-[20px] border p-4"
                style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="absolute inset-0 rounded-[20px]" style={{ background: `linear-gradient(135deg, ${accent}14, transparent)` }} />
                <div
                  className="relative mb-0.5 flex h-[42px] w-[42px] items-center justify-center rounded-[13px]"
                  style={{ background: grad }}
                >
                  <FIcon size={18} className="text-white" />
                </div>
                <span className="relative text-[15px] font-black text-white" style={{ letterSpacing: "-0.3px" }}>{label}</span>
                <span className="relative text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{sub}</span>
                <div className="absolute bottom-[14px] right-[14px]">
                  <ChevronRight size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
                </div>
              </Link>
            ))}
          </div>

          {/* Archive / Delete */}
          <div className="flex gap-[10px] pb-5">
            {(status === "DRAFT" || status === "PUBLISHED") && (
              <button
                type="button"
                onClick={() => setModal({
                  action: () => run(() => archiveEvent(eventId)),
                  title: "Archive event?",
                  desc: "Hidden from dashboard but restorable anytime.",
                  danger: false,
                })}
                className="flex flex-1 items-center justify-center gap-[6px] rounded-[12px] border"
                style={{ height: 44, background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}
              >
                <Archive size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
                <span className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>Archive</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setModal({
                action: () => run(async () => { await deleteEvent(eventId); router.push("/events"); }),
                title: "Delete permanently?",
                desc: "All guests, tickets, and data will be erased. This cannot be undone.",
                danger: true,
              })}
              className="flex flex-1 items-center justify-center gap-[6px] rounded-[12px] border"
              style={{ height: 44, background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.18)" }}
            >
              <Trash2 size={13} style={{ color: "#ef4444" }} />
              <span className="text-[13px] font-bold" style={{ color: "#ef4444" }}>Delete Event</span>
            </button>
          </div>

        </div>
      </div>

      <MobileBottomNav />

      {modal && (
        <MobileConfirmDialog
          title={modal.title}
          desc={modal.desc}
          danger={modal.danger}
          onConfirm={async () => { await modal.action(); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}
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
          <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0e0f11" }}>
            <div className="h-[320px] animate-pulse" style={{ background: "#0e0e16" }} />
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
