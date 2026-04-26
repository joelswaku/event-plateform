"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Users, UserCheck, Ticket, QrCode,
  CalendarDays, MapPin, Globe, Tag,
  Pencil, Eye, Layout, ArrowRight, Clock,
  BarChart3, Heart, Settings,
} from "lucide-react";
import { useEventStore } from "@/store/event.store";
import StatCard from "@/components/ui/stat-card";
import ShareEventCard from "@/components/events/ShareEventCard";
import { EVENT_CATEGORIES } from "@/config/event-categories";
import TicketGateModal from "@/components/events/TicketGateModal";

/* ── Status badge ─────────────────────────────────────────── */
const STATUS_STYLES = {
  PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  DRAFT:     "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  CANCELLED: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
  ARCHIVED:  "bg-gray-100   text-gray-600   dark:bg-gray-800      dark:text-gray-400",
};

function StatusBadge({ status }) {
  const s = (status ?? "DRAFT").toUpperCase();
  const cls = STATUS_STYLES[s] ?? STATUS_STYLES.DRAFT;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {s.charAt(0) + s.slice(1).toLowerCase()}
    </span>
  );
}

/* ── Detail row ───────────────────────────────────────────── */
function Detail({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-gray-800">
        <Icon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── Quick action — supports both href (Link) and onClick (button) ─────────── */
function QuickAction({ label, description, href, onClick, icon: Icon, primary }) {
  const baseClass = `group flex items-center gap-3 rounded-xl border px-4 py-3 transition w-full text-left ${
    primary
      ? "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70"
      : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
  }`;

  const iconClass = `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
    primary
      ? "bg-indigo-100 dark:bg-indigo-900/40"
      : "bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-800 dark:group-hover:bg-gray-700"
  }`;

  const iconColor = primary
    ? "h-4 w-4 text-indigo-600 dark:text-indigo-400"
    : "h-4 w-4 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200";

  const inner = (
    <>
      <div className={iconClass}>
        <Icon className={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${
          primary ? "text-indigo-700 dark:text-indigo-300" : "text-gray-800 dark:text-gray-100"
        }`}>
          {label}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <ArrowRight className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${
        primary ? "text-indigo-400" : "text-gray-300 dark:text-gray-600"
      }`} />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {inner}
    </button>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
      {children}
    </h3>
  );
}

/* ── Feature modules with inline toggles ─────────────────── */
const MODULE_CFG = {
  allow_rsvp:       { icon: Users,   label: "RSVP",             desc: "Guest list & tracking", activeBg: "bg-indigo-50 dark:bg-indigo-900/20", activeIcon: "text-indigo-600 dark:text-indigo-400" },
  allow_ticketing:  { icon: Ticket,  label: "Stripe Ticketing",  desc: "Paid ticket sales",     activeBg: "bg-amber-50 dark:bg-amber-900/20",   activeIcon: "text-amber-600 dark:text-amber-400"   },
  allow_qr_checkin: { icon: QrCode,  label: "Express Entry",     desc: "QR scan at the door",   activeBg: "bg-cyan-50 dark:bg-cyan-900/20",     activeIcon: "text-cyan-600 dark:text-cyan-400"     },
  allow_donations:  { icon: Heart,   label: "Donations",         desc: "Accept contributions",  activeBg: "bg-pink-50 dark:bg-pink-900/20",     activeIcon: "text-pink-600 dark:text-pink-400"     },
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
    e.preventDefault();
    e.stopPropagation();
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
        <Link
          href={`/events/${eventId}/settings`}
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200"
        >
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
                  active
                    ? `${cfg.activeBg} border-transparent hover:shadow-sm`
                    : "border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? cfg.activeBg : "bg-gray-100 dark:bg-gray-800"}`}>
                  <Icon className={`h-4 w-4 ${active ? cfg.activeIcon : "text-gray-300 dark:text-gray-600"}`} />
                </div>
                <div>
                  <p className={`text-xs font-bold leading-tight ${active ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
                    {cfg.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                    {active ? cfg.desc : "Disabled"}
                  </p>
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

/* ── Entertainment detection ──────────────────────────────── */
const ENTERTAINMENT_SUBS =
  EVENT_CATEGORIES.find((c) => c.id === "entertainment")?.subcategories ?? [];

const ENTERTAINMENT_DASHBOARD_MODES = new Set(
  ENTERTAINMENT_SUBS.map((s) => s.id.toUpperCase())
);

const ENTERTAINMENT_EVENT_TYPES = new Set(
  ENTERTAINMENT_SUBS.map((s) => s.eventType.toUpperCase())
);

function isEntertainmentEvent(event) {
  if (!event) return false;
  if (event.allow_ticketing === true) return true;
  const mode = String(event.dashboard_mode ?? "").toUpperCase().trim();
  const type = String(event.event_type ?? "").toUpperCase().trim();
  return (
    (mode && ENTERTAINMENT_DASHBOARD_MODES.has(mode)) ||
    (type && ENTERTAINMENT_EVENT_TYPES.has(type))
  );
}

/* ── Helpers ──────────────────────────────────────────────── */
function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/* ── Page ─────────────────────────────────────────────────── */
export default function EventDetailPage() {
  const { eventId } = useParams();
  const { fetchEventDashboard, dashboard, loading } = useEventStore();

  const [ticketGateOpen, setTicketGateOpen] = useState(false);

  useEffect(() => {
    if (eventId) fetchEventDashboard(eventId);
  }, [eventId, fetchEventDashboard]);

  const event = dashboard?.event;
  const stats = dashboard?.stats ?? {};

  const hasFullTicketing = isEntertainmentEvent(event);

  const location = [event?.venue_name, event?.city, event?.country]
    .filter(Boolean)
    .join(", ") || null;

  const isPublic = event?.visibility === "PUBLIC";

  if (loading || !event) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Page header */}
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
            <Pencil className="h-3.5 w-3.5" />
            Edit
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="Guests"    value={stats.guest_count    ?? 0} subtitle="Total invited"    icon={Users}    color="indigo"  href={`/events/${eventId}/guests`} />
        <StatCard title="Attending" value={stats.attending_count ?? 0} subtitle="Confirmed RSVPs" icon={UserCheck} color="emerald" />
        <StatCard title="Tickets"   value={stats.ticket_count   ?? 0} subtitle="Issued"           icon={Ticket}   color="violet"  href={hasFullTicketing ? `/events/${eventId}/tickets` : undefined} />
        <StatCard title="Check-ins" value={stats.checkin_count  ?? 0} subtitle="Scanned entries"  icon={QrCode}   color="amber"   href={`/events/${eventId}/scanner`} />
      </div>

      {/* Feature modules */}
      <FeatureModules event={event} eventId={eventId} />

      {/* Main body */}
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
            <QuickAction label="Open builder"   description="Design your event page"      href={`/events/${eventId}/builder`} icon={Layout}   primary />
            <QuickAction label="Manage guests"  description="Invite & track attendees"    href={`/events/${eventId}/guests`}  icon={Users}           />
            {hasFullTicketing ? (
              <QuickAction label="Tickets"      description="Manage ticket tiers & sales"  href={`/events/${eventId}/tickets`} icon={Ticket}          />
            ) : (
              <QuickAction label="Tickets"      description="Not available for this event type" icon={Ticket} onClick={() => setTicketGateOpen(true)} />
            )}
            <QuickAction label="QR Scanner"    description="Check in on arrival"           href={`/events/${eventId}/scanner`}   icon={QrCode}         />
            <QuickAction label="Analytics"     description="Views & conversions"           href={`/events/${eventId}/analytics`} icon={BarChart3}      />
          </div>
        </div>
      </div>

      <TicketGateModal
        open={ticketGateOpen}
        onClose={() => setTicketGateOpen(false)}
        event={event}
      />

    </div>
  );
}
