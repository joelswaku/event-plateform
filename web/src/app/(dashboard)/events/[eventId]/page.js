"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users, UserCheck, Ticket, QrCode,
  CalendarDays, MapPin, Globe, Tag,
  Pencil, Eye, Layout, ArrowRight, Clock,
  BarChart3, Heart, Settings, Plus, UserPlus,
  Home, User, ChevronRight, Shield, Mail, Crown,
  Share2, MoreHorizontal, ArrowLeft, Camera, ExternalLink,
  Send, EyeOff, Archive, Trash2, RotateCcw, CreditCard,
  LayoutGrid, CheckCircle, Copy, Check, X as XIcon, Link2,
  ClipboardList, Sparkles,
} from "lucide-react";
import { useEventStore }  from "@/store/event.store";
import { useTeamStore }   from "@/store/team.store";
import { useAuthStore }   from "@/store/auth.store";
import StatCard           from "@/components/ui/stat-card";
import ShareEventCard     from "@/components/events/ShareEventCard";
import { EVENT_CATEGORIES } from "@/config/event-categories";
import dynamic from "next/dynamic";
const PerformancePredictionWidget = dynamic(() => import("@/components/ai/PerformancePredictionWidget"), { ssr: false });
import AIInsightCard          from "@/components/ai/AIInsightCard";
import { useAIStore }         from "@/store/ai.store";
import { usePlannerStore }    from "@/store/planner.store";
import PostEventSummaryModal  from "@/components/ai/PostEventSummaryModal";

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

// ── AI Guest Insights (desktop) ───────────────────────────────────────────────
function DesktopGuestInsights({ eventId, guestCount }) {
  const { analyzeGuestList, loading } = useAIStore();
  const [insights, setInsights] = React.useState(null);

  useEffect(() => {
    if (guestCount >= 5 && !insights) {
      analyzeGuestList(eventId).then((res) => {
        if (res.success) setInsights(res.data?.insights ?? []);
      });
    }
  }, [eventId, guestCount]);

  if (!insights || insights.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <SectionTitle>AI Guest Insights</SectionTitle>
      <div className="space-y-2">
        {insights.slice(0, 5).map((ins, i) => (
          <AIInsightCard key={i} type={ins.type} message={ins.message} count={ins.count} />
        ))}
      </div>
    </div>
  );
}

// ── Event Planner card ────────────────────────────────────────────────────────
function EventPlannerCard({ eventId, project, loading }) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
            <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Event Planner</h3>
        </div>
        {project && (
          <Link
            href={`/planner/${project.id}`}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Open <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {loading && !project && (
        <div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      )}

      {!loading && !project && (
        <div className="flex flex-col items-center text-center py-4 gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20">
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No planner yet</p>
            <p className="text-xs text-gray-500 mt-0.5">Let AI build a full plan — tasks, timeline, vendors.</p>
          </div>
          <button
            onClick={() => router.push(`/planner/new?eventId=${eventId}`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Create AI Planner
          </button>
        </div>
      )}

      {project && (
        <Link href={`/planner/${project.id}`} className="block group">
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{project.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {project.task_count ?? 0} tasks · {project.status ?? "active"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
          </div>
        </Link>
      )}
    </div>
  );
}

// ── Feature modules with toggles (desktop) ───────────────────────────────────
const MODULE_CFG = {
  allow_rsvp:      { icon: Users,  label: "RSVP",            desc: "Guest list & tracking", activeBg: "bg-indigo-50 dark:bg-indigo-900/20", activeIcon: "text-indigo-600 dark:text-indigo-400" },
  allow_ticketing: { icon: Ticket, label: "Stripe Ticketing", desc: "Paid ticket sales",    activeBg: "bg-amber-50 dark:bg-amber-900/20",   activeIcon: "text-amber-600 dark:text-amber-400"   },
  allow_donations: { icon: Heart,  label: "Donations",        desc: "Accept contributions", activeBg: "bg-pink-50 dark:bg-pink-900/20",     activeIcon: "text-pink-600 dark:text-pink-400"     },
};
const MODULE_HREFS = (eventId) => ({
  allow_rsvp:      `/events/${eventId}/guests`,
  allow_ticketing: `/events/${eventId}/tickets`,
  allow_donations: `/events/${eventId}/donations`,
});

function FeatureModules({ event, eventId, readOnly = false }) {
  const { updateEvent } = useEventStore();
  const router = useRouter();
  const hrefs = MODULE_HREFS(eventId);
  const [local,  setLocal]  = useState(() =>
    Object.fromEntries(Object.keys(MODULE_CFG).map((k) => [k, !!event?.[k]]))
  );
  const [saving, setSaving] = useState({});
  const [confirmModal, setConfirmModal] = useState(null); // { key, label, desc, otherModules }

  const EXCLUSIVE = ['allow_rsvp', 'allow_ticketing', 'allow_donations'];

  const toggle = async (e, key) => {
    e.preventDefault(); e.stopPropagation();
    if (saving[key]) return;
    const next = !local[key];

    let payload;
    let newLocal;
    if (next && EXCLUSIVE.includes(key)) {
      payload = {
        allow_rsvp:      key === 'allow_rsvp',
        allow_ticketing: key === 'allow_ticketing',
        allow_donations: key === 'allow_donations',
        open_rsvp:       false,
      };
      newLocal = { ...local, ...payload };
    } else if (!next && key === 'allow_rsvp') {
      payload = { allow_rsvp: false, open_rsvp: false };
      newLocal = { ...local, allow_rsvp: false, open_rsvp: false };
    } else {
      payload = { [key]: next };
      newLocal = { ...local, [key]: next };
    }

    const affectedKeys = Object.keys(payload);
    setLocal(newLocal);
    setSaving((s) => ({ ...s, ...Object.fromEntries(affectedKeys.map((k) => [k, true])) }));
    await updateEvent(eventId, payload);
    setSaving((s) => ({ ...s, ...Object.fromEntries(affectedKeys.map((k) => [k, false])) }));
  };

  const handleCardClick = async (e, key) => {
    e.preventDefault();
    if (readOnly) return;

    const active = local[key];
    const cfg = MODULE_CFG[key];

    // If already active, navigate directly
    if (active) {
      router.push(hrefs[key]);
      return;
    }

    // If disabled, show confirmation modal
    const otherActiveModules = EXCLUSIVE
      .filter(k => k !== key && local[k])
      .map(k => MODULE_CFG[k]?.label)
      .filter(Boolean);

    setConfirmModal({
      key,
      label: cfg.label,
      desc: cfg.desc,
      otherModules: otherActiveModules,
    });
  };

  const confirmEnableModule = async () => {
    if (!confirmModal) return;

    const { key } = confirmModal;
    setConfirmModal(null);

    // Create a synthetic event for toggle
    const syntheticEvent = { preventDefault: () => {}, stopPropagation: () => {} };
    await toggle(syntheticEvent, key);

    // Wait for state to update, then navigate
    setTimeout(() => {
      router.push(hrefs[key]);
    }, 300);
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle>Active Modules</SectionTitle>
          {!readOnly && (
            <Link href={`/events/${eventId}/settings`} className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200">
              <Settings className="h-3 w-3" /> All settings
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Object.entries(MODULE_CFG).map(([key, cfg]) => {
          const active = local[key];
          const busy   = !!saving[key];
          const Icon   = cfg.icon;
          return (
            <div key={key} className="relative">
              <button
                type="button"
                onClick={(e) => handleCardClick(e, key)}
                disabled={busy || readOnly}
                className={`w-full flex flex-col gap-2.5 rounded-xl border p-3.5 pr-12 transition text-left ${
                  active ? `${cfg.activeBg} border-transparent hover:shadow-sm` : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700 cursor-pointer"
                } ${(busy || readOnly) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? cfg.activeBg : "bg-gray-100 dark:bg-gray-800"}`}>
                  <Icon className={`h-4 w-4 ${active ? cfg.activeIcon : "text-gray-300 dark:text-gray-600"}`} />
                </div>
                <div>
                  <p className={`text-xs font-bold leading-tight ${active ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>{cfg.label}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{active ? cfg.desc : "Click to enable"}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => toggle(e, key)}
                disabled={busy || readOnly}
                aria-label={`${active ? "Disable" : "Enable"} ${cfg.label}`}
                className={`absolute right-3 top-3 flex items-center focus:outline-none ${readOnly ? "pointer-events-none opacity-40" : ""}`}
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

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setConfirmModal(null)}>
          <div
            className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                {confirmModal.key === 'allow_rsvp' ? <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /> :
                 confirmModal.key === 'allow_ticketing' ? <Ticket className="h-6 w-6 text-amber-600 dark:text-amber-400" /> :
                 <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Enable {confirmModal.label}?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {confirmModal.desc}
                </p>
              </div>
            </div>

            {confirmModal.otherModules.length > 0 && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex gap-2">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">!</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      This will disable {confirmModal.otherModules.join(' & ')}
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      Only one module can be active at a time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEnableModule}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Enable & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
        <div className="mx-auto h-[5px] w-10 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
        <p className="text-center text-[18px] font-black text-white" style={{ letterSpacing: "-0.3px" }}>{title}</p>
        <p className="text-center text-[13px] leading-[20px]" style={{ color: "rgba(255,255,255,0.50)" }}>{desc}</p>
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-[52px] items-center justify-center rounded-[14px] text-[15px] font-extrabold transition-transform active:scale-[0.97]"
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
            className="flex h-[48px] items-center justify-center rounded-[14px] text-[14px] font-bold transition-opacity active:opacity-60"
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
  const eventIdMatch = pathname.match(/\/events\/([^/]+)/);
  const scanHref = eventIdMatch ? `/events/${eventIdMatch[1]}/scanner` : "/events";

  const tabs = [
    { href: "/dashboard", label: "Home",    Icon: Home,          active: pathname === "/dashboard" },
    { href: "/events",    label: "Events",  Icon: CalendarDays,  active: pathname.startsWith("/events") && !pathname.includes("create") },
    null,
    { href: "/planner",   label: "Planner", Icon: ClipboardList, active: pathname.startsWith("/planner") },
    { href: "/settings",  label: "Profile", Icon: User,          active: pathname === "/settings" },
  ];
  return (
    <div
      className="relative z-50 shrink-0 border-t px-1 pt-2"
      style={{ background: "rgba(10,10,18,0.98)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-end justify-around">
        {tabs.map((tab) => {
          if (!tab) {
            return (
              <Link key="scan" href={scanHref} className="relative z-10 -mt-5 flex flex-col items-center gap-1 transition-transform active:scale-95">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px]" style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 20px rgba(16,185,129,0.50)" }}>
                  <QrCode size={22} className="text-white" />
                </div>
                <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>Scan</span>
              </Link>
            );
          }
          const { href, label, Icon, active } = tab;
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-3 py-1 transition-opacity active:opacity-60">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-[10px] transition-all"
                style={active ? { background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.28)" } : {}}
              >
                <Icon size={20} style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }} />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileActionSheet({ event, eventId, status, isPublic, onShare, onAction, onClose, permissions = null, userRole = null }) {
  const router = useRouter();
  const perms = permissions ?? { canEdit: false, canDelete: false, canPublish: false };
  const isOwner = userRole === 'OWNER';

  const ITEMS = [];
  if (perms.canEdit) {
    ITEMS.push({
      Icon: Pencil, label: "Edit Event", sub: "Update details & settings",
      accent: "#6366f1",
      onPress: () => { onClose(); router.push(`/events/${eventId}/edit`); },
    });
  }
  if (event.slug) {
    ITEMS.push({
      Icon: Globe, label: "See Website",
      sub: isPublic ? "View live event page" : "Preview your event page",
      accent: "#06b6d4",
      onPress: () => { onClose(); window.open(isPublic ? `/e/${event.slug}` : `/e/${event.slug}?preview=1`, "_blank"); },
    });
    ITEMS.push({
      Icon: Share2, label: "Share Event", sub: "Copy or share the link",
      accent: "#10b981",
      onPress: () => { onClose(); onShare(); },
    });
  }
  if (perms.canPublish && status === "DRAFT") {
    ITEMS.push({
      Icon: Send, label: "Publish Event", sub: "Make it publicly visible",
      accent: "#6366f1",
      onPress: () => { onClose(); onAction("publish"); },
    });
  }
  if (perms.canPublish && status === "PUBLISHED") {
    ITEMS.push({
      Icon: EyeOff, label: "Unpublish", sub: "Move back to draft",
      accent: "#f59e0b",
      onPress: () => { onClose(); onAction("unpublish"); },
    });
  }
  if (isOwner && perms.canDelete && (status === "DRAFT" || status === "PUBLISHED")) {
    ITEMS.push({
      Icon: Archive, label: "Archive", sub: "Hide from dashboard, restorable later",
      accent: "rgba(255,255,255,0.35)",
      onPress: () => { onClose(); onAction("archive"); },
    });
  }
  if (isOwner && perms.canDelete) {
    ITEMS.push({
      Icon: Trash2, label: "Delete Event", sub: "Permanently erase all data",
      accent: "#ef4444",
      danger: true,
      onPress: () => { onClose(); onAction("delete"); },
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="slide-up w-full max-w-md overflow-hidden rounded-t-[24px] border-t"
        style={{
          background: "#1a1b1f",
          borderColor: "rgba(255,255,255,0.08)",
          paddingBottom: "max(36px, env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-[5px] w-10 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
        <p className="mt-4 truncate px-5 text-center text-[15px] font-extrabold text-white" style={{ letterSpacing: "-0.3px" }}>
          {event.title}
        </p>
        <p className="mb-3 mt-0.5 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </p>

        <div className="px-3">
          {ITEMS.map((item, i) => {
            const Icon = item.Icon;
            return (
              <React.Fragment key={item.label}>
                {item.danger && i > 0 && (
                  <div className="mx-3 my-1.5 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                )}
                <button
                  type="button"
                  onClick={item.onPress}
                  className="flex w-full items-center gap-3 rounded-[14px] px-3 py-[13px] text-left transition-opacity active:opacity-60"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                    style={{ background: `${item.accent}18` }}
                  >
                    <Icon size={17} style={{ color: item.accent }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold" style={{ color: item.danger ? item.accent : "#fff" }}>
                      {item.label}
                    </p>
                    <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {item.sub}
                    </p>
                  </div>
                  <ChevronRight size={14} className="shrink-0" style={{ color: "rgba(255,255,255,0.15)" }} />
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mx-3 mt-2 mb-1 flex h-[50px] w-[calc(100%-24px)] items-center justify-center rounded-[14px] border text-[15px] font-bold transition-opacity active:opacity-60"
          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Share sheet ───────────────────────────────────────────────────────────────

function MShareSheet({ event, onClose }) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/e/${event.slug}`
    : `/e/${event.slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const enc = encodeURIComponent;
  const socials = [
    {
      label: "Twitter / X",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      accent: "#e7e7e7", bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.15)",
      href: `https://twitter.com/intent/tweet?text=${enc(event.title)}&url=${enc(url)}`,
    },
    {
      label: "WhatsApp",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      accent: "#25D366", bg: "rgba(37,211,102,0.12)", border: "rgba(37,211,102,0.28)",
      href: `https://wa.me/?text=${enc(event.title + " " + url)}`,
    },
    {
      label: "Facebook",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      accent: "#1877F2", bg: "rgba(24,119,242,0.12)", border: "rgba(24,119,242,0.28)",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      label: "LinkedIn",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      accent: "#0A66C2", bg: "rgba(10,102,194,0.12)", border: "rgba(10,102,194,0.28)",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    },
    {
      label: "Email",
      icon: <Send size={17} />,
      accent: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.28)",
      href: `mailto:?subject=${enc(event.title)}&body=${enc("You're invited! " + url)}`,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-[28px] border-t"
        style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.10)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-[5px] w-10 rounded-full" style={{ background: "rgba(255,255,255,0.20)" }} />
        </div>

        <div className="flex flex-col gap-5 px-5 pb-10 pt-3" style={{ paddingBottom: "max(40px, env(safe-area-inset-bottom))" }}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[18px] font-black text-white">Share Event</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Send this link to your guests
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <XIcon size={14} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>
          </div>

          {/* URL row */}
          <div className="flex items-center gap-2">
            <div
              className="flex min-w-0 flex-1 items-center gap-2 rounded-[14px] border px-3.5 py-3"
              style={{ background: "#14141f", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <Link2 size={12} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
              <span className="truncate font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                {url}
              </span>
            </div>
            <button
              onClick={copyLink}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] border transition-all active:scale-95"
              style={{
                background:   copied ? "rgba(16,185,129,0.18)" : "#14141f",
                borderColor:  copied ? "rgba(16,185,129,0.40)" : "rgba(255,255,255,0.10)",
              }}
              title={copied ? "Copied!" : "Copy link"}
            >
              {copied
                ? <Check size={16} style={{ color: "#10b981" }} />
                : <Copy size={16} style={{ color: "rgba(255,255,255,0.55)" }} />
              }
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] border active:scale-95"
              style={{ background: "#14141f", borderColor: "rgba(255,255,255,0.10)" }}
              title="Open event page"
            >
              <ExternalLink size={16} style={{ color: "rgba(255,255,255,0.55)" }} />
            </a>
          </div>

          {/* Social options */}
          <div>
            <p
              className="mb-3 text-[10px] font-bold uppercase tracking-[0.7px]"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              Share on
            </p>
            <div className="grid grid-cols-5 gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="flex flex-col items-center gap-2 transition-transform active:scale-90"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-[16px] border transition-transform"
                    style={{ background: s.bg, borderColor: s.border, color: s.accent }}
                  >
                    {s.icon}
                  </div>
                  <span
                    className="text-center text-[9px] font-semibold leading-tight"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {s.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Native share fallback */}
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              onClick={async () => {
                onClose();
                await new Promise((r) => setTimeout(r, 200));
                try { await navigator.share({ title: event.title, url }); } catch {}
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[16px] border py-3.5 active:opacity-70"
              style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}
            >
              <Share2 size={14} style={{ color: "rgba(255,255,255,0.55)" }} />
              <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                More options…
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileEventDetail({ event, stats, eventId, hasFullTicketing, isPublic, plannerProject, userRole = 'OWNER', permissions = null }) {
  const perms = permissions ?? { canEdit: false, canDelete: false, canManageTeam: false, canManageGuests: false, canCheckin: false, canViewAnalytics: false, canPublish: false };
  const cfg      = sc(event.status);
  const router   = useRouter();
  const status   = (event.status ?? "DRAFT").toUpperCase();
  const countdown = useMobileCountdown(event.starts_at_utc);
  const { updateEvent, publishEvent, unpublishEvent, archiveEvent, restoreEvent, deleteEvent } = useEventStore();
  const [loading,    setLoading]   = useState(false);
  const [modal,      setModal]     = useState(null);
  const [menuOpen,   setMenuOpen]  = useState(false);
  const [shareOpen,  setShareOpen] = useState(false);

  /* ── Module toggle state ── */
  const [modLocal, setModLocal] = useState({
    allow_rsvp:      !!event.allow_rsvp,
    allow_ticketing: !!event.allow_ticketing,
    allow_donations: !!event.allow_donations,
  });
  const [modSaving,  setModSaving]  = useState({});
  const [pendingMod, setPendingMod] = useState(null);

  const MOD_ROWS = [
    { key: 'allow_rsvp',      Icon: Users,       label: 'RSVP',       desc: 'Guest list & RSVP',   color: '#6366f1' },
    { key: 'allow_ticketing', Icon: CreditCard,  label: 'Ticketing',  desc: 'Sell tickets',         color: '#f59e0b' },
    { key: 'allow_donations', Icon: Heart,       label: 'Donations',  desc: 'Accept contributions', color: '#f43f5e' },
  ];
  const EXCL_MOD = ['allow_rsvp', 'allow_ticketing', 'allow_donations'];

  const requestMod = useCallback((key, afterConfirm) => {
    if (modSaving[key]) return;
    const next = !modLocal[key];
    const row  = MOD_ROWS.find(m => m.key === key);
    const conflicts = EXCL_MOD
      .filter(k => k !== key && modLocal[k])
      .map(k => MOD_ROWS.find(m => m.key === k)?.label)
      .filter(Boolean);
    const msg = (next && conflicts.length)
      ? `Enabling ${row.label} will turn off ${conflicts.join(' & ')}. Only one module can be active at a time.`
      : next
      ? `Enable ${row.label} for this event.`
      : `Disable ${row.label} for this event.`;
    setPendingMod({ key, next, title: next ? `Enable ${row.label}?` : `Disable ${row.label}?`, msg, color: row.color, Icon: row.Icon, afterConfirm });
  }, [modLocal, modSaving]);

  const confirmMod = useCallback(async () => {
    if (!pendingMod) return;
    const { key, next, afterConfirm } = pendingMod;
    setPendingMod(null);
    let payload, newLocal;
    if (next && EXCL_MOD.includes(key)) {
      payload  = { allow_rsvp: key === 'allow_rsvp', allow_ticketing: key === 'allow_ticketing', allow_donations: key === 'allow_donations', open_rsvp: false };
      newLocal = { ...modLocal, ...payload };
    } else if (!next && key === 'allow_rsvp') {
      payload  = { allow_rsvp: false, open_rsvp: false };
      newLocal = { ...modLocal, allow_rsvp: false };
    } else {
      payload  = { [key]: next };
      newLocal = { ...modLocal, [key]: next };
    }
    setModLocal(newLocal);
    const affected = Object.keys(payload);
    setModSaving(s => ({ ...s, ...Object.fromEntries(affected.map(k => [k, true])) }));
    await updateEvent(eventId, payload);
    setModSaving(s => ({ ...s, ...Object.fromEntries(affected.map(k => [k, false])) }));
    if (afterConfirm) afterConfirm();
  }, [pendingMod, modLocal, updateEvent, eventId]);

  const run = useCallback(async (fn) => {
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  }, []);

  const handleShare = useCallback(async () => {
    if (!event.slug) return;
    const url = `${window.location.origin}/e/${event.slug}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: event.title, url }); } catch {}
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  }, [event.slug, event.title]);

  const handleMenuAction = useCallback((action) => {
    switch (action) {
      case "publish":
        setModal({ action: () => run(() => publishEvent(eventId)), title: "Publish this event?", desc: "Your event will be publicly visible.", danger: false });
        break;
      case "unpublish":
        setModal({ action: () => run(() => unpublishEvent(eventId)), title: "Unpublish?", desc: "Event goes back to draft.", danger: false });
        break;
      case "archive":
        setModal({ action: () => run(() => archiveEvent(eventId)), title: "Archive event?", desc: "Hidden from dashboard but restorable anytime.", danger: false });
        break;
      case "delete":
        setModal({ action: () => run(async () => { await deleteEvent(eventId); router.push("/events"); }), title: "Delete permanently?", desc: "All guests, tickets, and data will be erased. This cannot be undone.", danger: true });
        break;
    }
  }, [eventId, run, publishEvent, unpublishEvent, archiveEvent, deleteEvent, router]);

  const FEATURES = [
    { FIcon: Layout,        label: "Builder",   sub: "Design event page",      accent: "#6366f1", grad: "linear-gradient(135deg,#4f46e5,#6366f1)", href: `/events/${eventId}/builder`,   show: perms.canEdit         },
    { FIcon: ClipboardList, label: "Planner",   sub: "AI-powered event plan",  accent: "#8b5cf6", grad: "linear-gradient(135deg,#7c3aed,#8b5cf6)", href: plannerProject ? `/planner/${plannerProject.id}` : `/planner/new?eventId=${eventId}`, show: perms.canEdit },
    { FIcon: Users,         label: "Guests",    sub: "Manage attendees",       accent: "#10b981", grad: "linear-gradient(135deg,#059669,#10b981)", href: `/events/${eventId}/guests`,    show: perms.canManageGuests  },
    { FIcon: Ticket,     label: "Tickets",   sub: "Types & orders",      accent: "#f59e0b", grad: "linear-gradient(135deg,#d97706,#f59e0b)", href: `/events/${eventId}/tickets`,   show: perms.canManageGuests  },
    { FIcon: LayoutGrid, label: "Seating",   sub: "Seat assignments",    accent: "#06b6d4", grad: "linear-gradient(135deg,#0891b2,#06b6d4)", href: `/events/${eventId}/seating`,   show: perms.canEdit          },
    { FIcon: Camera,     label: "Scanner",   sub: "QR check-in",         accent: "#10b981", grad: "linear-gradient(135deg,#0891b2,#06b6d4)", href: `/events/${eventId}/scanner`,   show: perms.canCheckin       },
    { FIcon: BarChart3,  label: "Analytics", sub: "Revenue & insights",  accent: "#a78bfa", grad: "linear-gradient(135deg,#7c3aed,#8b5cf6)", href: `/events/${eventId}/analytics`, show: perms.canViewAnalytics },
    { FIcon: Heart,      label: "Donations", sub: "Track contributions", accent: "#f43f5e", grad: "linear-gradient(135deg,#be185d,#f43f5e)", href: `/events/${eventId}/donations`, show: perms.canManageGuests  },
    { FIcon: UserPlus,   label: "Team",      sub: "Manage admins",       accent: "#06b6d4", grad: "linear-gradient(135deg,#0891b2,#06b6d4)", href: `/events/${eventId}/team`,      show: perms.canManageTeam    },
    { FIcon: Settings,   label: "Settings",  sub: "Edit event details",  accent: "#6b7280", grad: "linear-gradient(135deg,#374151,#4b5563)", href: `/events/${eventId}/settings`,  show: perms.canEdit          },
  ].filter(f => f.show !== false);

  const STAT_ITEMS = [
    { SIcon: Users,        label: "Guests",    value: stats.guest_count     ?? 0, accent: "#6366f1", href: `/events/${eventId}/guests`  },
    { SIcon: UserCheck,    label: "Attending", value: stats.attending_count ?? 0, accent: "#10b981"  },
    { SIcon: Ticket,       label: "Tickets",   value: stats.ticket_count    ?? 0, accent: "#f59e0b", href: `/events/${eventId}/tickets` },
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
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] transition-transform active:scale-90"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", pointerEvents: "auto" }}
        >
          <ArrowLeft size={17} className="text-white" />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] transition-transform active:scale-90"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", pointerEvents: "auto" }}
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
            style={{ background: "linear-gradient(to bottom, rgba(14,15,17,0.08) 0%, rgba(14,15,17,0.45) 55%, rgba(14,15,17,0.98) 100%)" }}
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
        <div className="flex flex-col gap-4 px-4 pt-6" style={{ paddingBottom: 120 }}>

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
              className="block overflow-hidden rounded-[20px] border transition-transform active:scale-[0.98]"
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
              if (href) return <Link key={label} href={href} className="block transition-transform active:scale-95">{card}</Link>;
              return <div key={label}>{card}</div>;
            })}
          </div>

          {/* Quick-action pills */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/events/${eventId}/guests`}
              className="flex items-center gap-[6px] rounded-full border px-[14px] py-2 transition-transform active:scale-95"
              style={{ borderColor: "rgba(99,102,241,0.40)", background: "rgba(99,102,241,0.12)" }}
            >
              <Users size={14} style={{ color: "#6366f1" }} />
              <span className="text-[11px] font-extrabold" style={{ color: "#6366f1", letterSpacing: "0.8px" }}>RSVP</span>
            </Link>
            <Link
              href={`/events/${eventId}/scanner`}
              className="flex items-center gap-[6px] rounded-full border px-[14px] py-2 transition-transform active:scale-95"
              style={{ borderColor: "rgba(16,185,129,0.40)", background: "rgba(16,185,129,0.12)" }}
            >
              <Camera size={14} style={{ color: "#10b981" }} />
              <span className="text-[11px] font-extrabold" style={{ color: "#10b981", letterSpacing: "0.8px" }}>QR CHECK-IN</span>
            </Link>
            {event.allow_ticketing && (
              <Link
                href={`/events/${eventId}/tickets`}
                className="flex items-center gap-[6px] rounded-full border px-[14px] py-2 transition-transform active:scale-95"
                style={{ borderColor: "rgba(245,158,11,0.40)", background: "rgba(245,158,11,0.12)" }}
              >
                <Ticket size={14} style={{ color: "#f59e0b" }} />
                <span className="text-[11px] font-extrabold" style={{ color: "#f59e0b", letterSpacing: "0.8px" }}>BUY TICKETS</span>
              </Link>
            )}
            {event.slug && (
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-[6px] rounded-full border px-[14px] py-2 transition-transform active:scale-95"
                style={{ borderColor: "rgba(16,185,129,0.40)", background: "rgba(16,185,129,0.12)" }}
              >
                <Share2 size={14} style={{ color: "#10b981" }} />
                <span className="text-[11px] font-extrabold" style={{ color: "#10b981", letterSpacing: "0.8px" }}>SHARE</span>
              </button>
            )}
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col gap-2">
            {perms.canPublish && status === "DRAFT" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setModal({
                  action: () => run(() => publishEvent(eventId)),
                  title: "Publish this event?",
                  desc: "Your event will be publicly visible.",
                  danger: false,
                })}
                className="relative flex h-[52px] items-center justify-center gap-[9px] overflow-hidden rounded-[14px] transition-transform active:scale-[0.97]"
                style={{ background: "linear-gradient(to right, #4f46e5, #8b5cf6)" }}
              >
                {loading
                  ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <><Send size={16} className="text-white" /><span className="text-[15px] font-extrabold text-white" style={{ letterSpacing: "-0.2px" }}>Publish Event</span></>
                }
              </button>
            )}
            {perms.canPublish && status === "PUBLISHED" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setModal({
                  action: () => run(() => unpublishEvent(eventId)),
                  title: "Unpublish?",
                  desc: "Event goes back to draft.",
                  danger: false,
                })}
                className="flex h-[52px] items-center justify-center gap-[9px] rounded-[14px] border transition-transform active:scale-[0.97]"
                style={{ borderColor: "rgba(245,158,11,0.34)", background: "transparent" }}
              >
                {loading
                  ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
                  : <><EyeOff size={16} style={{ color: "#f59e0b" }} /><span className="text-[15px] font-extrabold" style={{ color: "#f59e0b", letterSpacing: "-0.2px" }}>Unpublish</span></>
                }
              </button>
            )}
            {userRole === 'OWNER' && perms.canDelete && (status === "ARCHIVED" || status === "CANCELLED") && (
              <button
                type="button"
                disabled={loading}
                onClick={() => run(() => restoreEvent(eventId))}
                className="relative flex h-[52px] items-center justify-center gap-[9px] overflow-hidden rounded-[14px] transition-transform active:scale-[0.97]"
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
              className="flex items-center gap-[9px] rounded-[14px] border px-4 py-[13px] transition-opacity active:opacity-70"
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
              <button
                key={label}
                type="button"
                onClick={() => {
                  // Check if module needs to be enabled first
                  if (label === 'Guests' && !modLocal.allow_rsvp) {
                    requestMod('allow_rsvp', () => router.push(href));
                    return;
                  }
                  if (label === 'Tickets' && !modLocal.allow_ticketing) {
                    requestMod('allow_ticketing', () => router.push(href));
                    return;
                  }
                  if (label === 'Donations' && !modLocal.allow_donations) {
                    requestMod('allow_donations', () => router.push(href));
                    return;
                  }
                  // Navigate directly for other features or if module is active
                  router.push(href);
                }}
                className="relative flex min-h-[124px] flex-col gap-[6px] overflow-hidden rounded-[20px] border p-4 text-left transition-transform active:scale-[0.96]"
                style={{ background: "#0d0d18", borderColor: "rgba(255,255,255,0.08)" }}
              >
                {/* gradient wash */}
                <div className="absolute inset-0" style={{ background: `linear-gradient(140deg, ${accent}1a 0%, transparent 60%)` }} />
                {/* top-edge highlight */}
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, ${accent}40, transparent)` }} />
                <div
                  className="relative mb-1 flex h-[44px] w-[44px] items-center justify-center rounded-[14px]"
                  style={{ background: grad, boxShadow: `0 4px 12px ${accent}40` }}
                >
                  <FIcon size={19} className="text-white" />
                </div>
                <span className="relative text-[15px] font-black text-white" style={{ letterSpacing: "-0.3px" }}>{label}</span>
                <span className="relative text-[11px] font-medium leading-[15px]" style={{ color: "rgba(255,255,255,0.42)" }}>{sub}</span>
                <div className="absolute bottom-[13px] right-[13px]">
                  <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.22)" }} />
                </div>
              </button>
            ))}
          </div>

          {/* Archive / Delete */}
          {(userRole === 'OWNER' && perms.canDelete) && (
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
                  className="flex flex-1 items-center justify-center gap-[6px] rounded-[12px] border transition-opacity active:opacity-60"
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
                className="flex flex-1 items-center justify-center gap-[6px] rounded-[12px] border transition-opacity active:opacity-60"
                style={{ height: 44, background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.18)" }}
              >
                <Trash2 size={13} style={{ color: "#ef4444" }} />
                <span className="text-[13px] font-bold" style={{ color: "#ef4444" }}>Delete Event</span>
              </button>
            </div>
          )}

        </div>
      </div>

      <MobileBottomNav />

      {/* Module confirmation sheet */}
      {pendingMod && (
        <div
          className="fixed inset-0 z-[60]"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={() => setPendingMod(null)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 rounded-t-[24px] border-t px-6 pt-3"
            style={{ background: '#0e0e16', borderColor: 'rgba(255,255,255,0.08)', paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-[5px] w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
            <div
              className="mt-2 flex h-[64px] w-[64px] items-center justify-center rounded-[20px]"
              style={{ background: `${pendingMod.color}20`, boxShadow: `0 4px 20px ${pendingMod.color}30` }}
            >
              <pendingMod.Icon size={28} style={{ color: pendingMod.color }} />
            </div>
            <p className="text-center text-[18px] font-extrabold text-white" style={{ letterSpacing: "-0.3px" }}>{pendingMod.title}</p>
            <p className="px-1 text-center text-[13px] leading-[20px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {pendingMod.msg}
            </p>
            <button
              type="button"
              onClick={confirmMod}
              className="mt-1 w-full rounded-[14px] py-[14px] text-[15px] font-extrabold text-white transition-transform active:scale-[0.97]"
              style={{ background: pendingMod.color, boxShadow: `0 4px 16px ${pendingMod.color}50` }}
            >
              {pendingMod.title.replace('?', '')}
            </button>
            <button
              type="button"
              onClick={() => setPendingMod(null)}
              className="w-full py-3 text-[14px] font-semibold transition-opacity active:opacity-60"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {modal && (
        <MobileConfirmDialog
          title={modal.title}
          desc={modal.desc}
          danger={modal.danger}
          onConfirm={async () => { await modal.action(); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}

      {menuOpen && (
        <MobileActionSheet
          event={event}
          eventId={eventId}
          status={status}
          isPublic={isPublic}
          onShare={() => { setMenuOpen(false); setShareOpen(true); }}
          onAction={handleMenuAction}
          onClose={() => setMenuOpen(false)}
          permissions={perms}
          userRole={userRole}
        />
      )}

      {shareOpen && (
        <MShareSheet event={event} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

// ── Helpers for team card ─────────────────────────────────────────────────────
function memberInitials(name = "") {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}
const TEAM_ROLE_CFG = {
  OWNER: { label: "Owner", color: "#f59e0b", Icon: Crown  },
  ADMIN: { label: "Admin", color: "#6366f1", Icon: Shield },
};

// ── Desktop Team Card ─────────────────────────────────────────────────────────
function DesktopTeamCard({ eventId }) {
  const { members, meta, isLoading, isSubmitting, fetchMembers, inviteMember } = useTeamStore();
  const [email,  setEmail]  = useState("");
  const [invErr, setInvErr] = useState("");
  const [notice, setNotice] = useState(""); // "added" | "invited"

  useEffect(() => { if (eventId) fetchMembers(eventId); }, [eventId, fetchMembers]);

  const isOwner    = meta?.currentUserRole === "OWNER";
  const adminCount = (meta?.current ?? 1) - 1;
  const maxAdmins  = meta?.maxAdmins ?? 0;
  const canInvite  = isOwner && meta ? (meta.maxAdmins === null || adminCount < maxAdmins) : false;
  const planLabel  = meta?.plan ? meta.plan.charAt(0).toUpperCase() + meta.plan.slice(1) : "";

  const handleInvite = async () => {
    setInvErr(""); setNotice("");
    if (!email.trim()) { setInvErr("Enter an email address"); return; }
    const res = await inviteMember(eventId, email.trim());
    if (res.success) {
      setEmail("");
      setNotice(res.type === "invited" ? "invited" : "added");
      setTimeout(() => setNotice(""), 4000);
    } else {
      setInvErr(res.error || "Failed to invite");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Team</h3>
          {meta && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                background: (meta.maxAdmins !== null && adminCount >= maxAdmins) ? "rgba(239,68,68,0.10)" : "rgba(99,102,241,0.10)",
                color:      (meta.maxAdmins !== null && adminCount >= maxAdmins) ? "#ef4444"               : "#6366f1",
              }}
            >
              {meta.maxAdmins === null
                ? `Unlimited · ${planLabel}`
                : `${adminCount}/${maxAdmins} admin${maxAdmins === 1 ? "" : "s"} · ${planLabel}`}
            </span>
          )}
        </div>
        <Link
          href={`/events/${eventId}/team`}
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 transition hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <UserPlus className="h-3 w-3" /> Manage
        </Link>
      </div>

      {/* Member list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : members.length === 0 ? (
        <p className="mb-4 text-sm text-gray-400">No admins added yet.</p>
      ) : (
        <div className="mb-4 flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
          {members.map((m) => {
            const cfg = TEAM_ROLE_CFG[m.role] ?? TEAM_ROLE_CFG.ADMIN;
            const { Icon } = cfg;
            return (
              <div key={m.user_id} className="flex items-center gap-3 py-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: cfg.color }}
                >
                  {memberInitials(m.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {m.full_name || m.email}
                  </p>
                  <p className="truncate text-xs text-gray-400">{m.email}</p>
                </div>
                <span
                  className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: `${cfg.color}18`, color: cfg.color }}
                >
                  <Icon size={9} /> {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite form — always visible for owner */}
      {isOwner && canInvite && (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                placeholder="teammate@example.com"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-indigo-400"
              />
            </div>
            <button
              onClick={handleInvite}
              disabled={isSubmitting}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-60"
            >
              <UserPlus size={13} />
              {isSubmitting ? "…" : "Invite"}
            </button>
          </div>
        </div>
      )}
      {invErr && <p className="mt-1.5 text-xs text-red-500">{invErr}</p>}
      {notice === "added" && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
          <Check size={12} /> Added — they can log in now.
        </p>
      )}
      {notice === "invited" && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-indigo-500">
          <Mail size={12} /> Invite sent — they'll get a signup link by email.
        </p>
      )}

      {/* Upgrade prompt when limit hit */}
      {isOwner && !canInvite && meta?.maxAdmins !== null && (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 px-3 py-2.5">
          <Crown size={13} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Admin limit reached.{" "}
            <Link href="/settings/billing" className="font-bold underline">Upgrade</Link>{" "}
            to add more.
          </p>
        </div>
      )}

      {members.length > 1 && (
        <p className="mt-3 text-[10px] text-gray-400 dark:text-gray-500">
          Admins can manage guests, tickets &amp; check-ins but cannot delete the event or change billing.
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function EventDetailPage() {
  const { eventId } = useParams();
  const router      = useRouter();
  const { fetchEventDashboard, dashboard, loading } = useEventStore();
  const { isHydrated, isAuthenticated } = useAuthStore();
  const { projects, fetchProjects, loading: plannerLoading } = usePlannerStore();
  const { generatePostEventSummary, loading: aiLoading } = useAIStore();
  const [fetchError, setFetchError] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryBannerDismissed, setSummaryBannerDismissed] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.replace("/login?redirect=" + encodeURIComponent(`/events/${eventId}`)); return; }
    if (eventId) {
      fetchEventDashboard(eventId).catch(() => setFetchError(true));
      fetchProjects();
    }
  }, [eventId, isHydrated, isAuthenticated]);

  const event    = dashboard?.event;
  const stats    = dashboard?.stats ?? {};
  const userRole = dashboard?.userRole ?? 'OWNER';
  const userPerms = dashboard?.permissions ?? {
    canEdit: false, canDelete: false, canManageTeam: false, canManageGuests: false,
    canCheckin: false, canViewAnalytics: false, canPublish: false,
  };
  const hasFullTicketing = isEntertainmentEvent(event);
  const location = [event?.venue_name, event?.city, event?.country].filter(Boolean).join(", ") || null;
  const isPublic = event?.visibility === "PUBLIC";
  const plannerProject = projects.find((p) => (p.event_id ?? p.eventId) === eventId);
  const eventEnded = event
    ? (event.ends_at_utc && new Date(event.ends_at_utc) < new Date()) ||
      ["ARCHIVED", "CANCELLED"].includes((event.status ?? "").toUpperCase())
    : false;

  if (fetchError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Could not load event</p>
        <p className="text-xs text-gray-400">The event may not exist or you don&apos;t have access.</p>
        <Link href="/events" className="mt-2 text-xs font-semibold text-indigo-600 hover:underline">Back to events</Link>
      </div>
    );
  }

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
      {/* ── Mobile layout (0–767px) ── */}
      <div className="md:hidden">
        <MobileEventDetail
          event={event}
          stats={stats}
          eventId={eventId}
          hasFullTicketing={hasFullTicketing}
          isPublic={isPublic}
          plannerProject={plannerProject}
          userRole={userRole}
          permissions={userPerms}
        />
      </div>

      {/* ── Desktop layout (768px+) ── */}
      <div className="hidden md:block">
        <div className="space-y-4">

          {/* Post-event AI Summary banner */}
          {eventEnded && !summaryBannerDismissed && (
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/8 px-4 py-3">
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
              <p className="flex-1 text-sm font-medium text-indigo-200">
                Your event is over — get your <span className="font-bold">AI Post-Event Summary</span>: attendance insights, highlights & performance grade.
              </p>
              <button
                onClick={async () => {
                  const res = await generatePostEventSummary(eventId);
                  if (res.success) { setSummaryData(res.data); setSummaryOpen(true); }
                }}
                disabled={aiLoading}
                className="shrink-0 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {aiLoading ? "Generating…" : "Generate Summary"}
              </button>
              <button
                onClick={() => setSummaryBannerDismissed(true)}
                className="shrink-0 rounded-lg p-1 text-indigo-400 hover:text-white transition-colors"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">{event.title}</h1>
                <StatusBadge status={event.status} />
                {userRole !== 'OWNER' && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                    {userRole}
                  </span>
                )}
              </div>
              {event.short_description && (
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{event.short_description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {userPerms.canEdit && (
                <Link
                  href={`/events/${eventId}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
              )}
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
            <StatCard title="Tickets"   value={stats.ticket_count   ?? 0} subtitle="Issued"           icon={Ticket}   color="violet"  href={`/events/${eventId}/tickets`} />
            <StatCard title="Check-ins" value={stats.checkin_count  ?? 0} subtitle="Scanned entries"  icon={QrCode}   color="amber"   href={`/events/${eventId}/scanner`} />
          </div>

          <PerformancePredictionWidget eventId={eventId} publishedAt={event.published_at} />

          <DesktopGuestInsights eventId={eventId} guestCount={stats.guest_count ?? 0} />

          <FeatureModules event={event} eventId={eventId} readOnly={!userPerms.canEdit} />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <ShareEventCard slug={event.slug} customDomain={event.custom_domain} />
              {userPerms.canManageTeam && <DesktopTeamCard eventId={eventId} />}
              <EventPlannerCard eventId={eventId} project={plannerProject} loading={plannerLoading} />
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
                {userPerms.canEdit && <QuickAction label="Open builder"  description="Design your event page"      href={`/events/${eventId}/builder`}   icon={Layout}   primary />}
                {userPerms.canManageGuests && <QuickAction label="Manage guests" description="Invite & track attendees"    href={`/events/${eventId}/guests`}    icon={Users}           />}
                {userPerms.canManageGuests && (
                  <QuickAction label="Tickets" description="Manage ticket tiers & sales" href={`/events/${eventId}/tickets`} icon={Ticket} />
                )}
                {userPerms.canCheckin       && <QuickAction label="QR Scanner"   description="Check in on arrival"          href={`/events/${eventId}/scanner`}   icon={QrCode}         />}
                {userPerms.canViewAnalytics && <QuickAction label="Analytics"    description="Views & conversions"           href={`/events/${eventId}/analytics`} icon={BarChart3}      />}
                {userPerms.canManageTeam    && <QuickAction label="Team"         description="Add admins to your event"      href={`/events/${eventId}/team`}      icon={UserPlus}       />}
                {userPerms.canEdit          && <QuickAction label="Planner"      description="AI-powered event planning"     href={plannerProject ? `/planner/${plannerProject.id}` : `/planner/new?eventId=${eventId}`} icon={ClipboardList}  />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PostEventSummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        data={summaryData}
      />
    </>
  );
}
