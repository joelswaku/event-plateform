"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, UserCheck, Ticket, QrCode,
  CalendarDays, MapPin, Globe, Tag,
  Pencil, Eye, Layout, ArrowRight, Clock,
  BarChart3,
} from "lucide-react";
import { useEventStore } from "@/store/event.store";
import StatCard from "@/components/ui/stat-card";
import ShareEventCard from "@/components/events/ShareEventCard";

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

/* ── Quick action link ────────────────────────────────────── */
function QuickAction({ label, description, href, icon: Icon, primary }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
        primary
          ? "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70"
          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
      }`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
        primary
          ? "bg-indigo-100 dark:bg-indigo-900/40"
          : "bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-800 dark:group-hover:bg-gray-700"
      }`}>
        <Icon className={`h-4 w-4 ${
          primary ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"
        }`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${
          primary ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"
        }`}>{label}</p>
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-400 dark:text-gray-600 dark:group-hover:text-gray-500" />
    </Link>
  );
}

/* ── Section header ───────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{children}</h2>
      <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function EventOverviewPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const { dashboard, fetchEventDashboard, loading } = useEventStore();

  useEffect(() => {
    if (eventId) fetchEventDashboard(eventId);
  }, [eventId, fetchEventDashboard]);

  if (loading && !dashboard) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-gray-400">Event not found.</p>
      </div>
    );
  }

  const event = dashboard.event ?? {};
  const stats = dashboard.stats ?? {};

  const locationParts = [event.venue_name, event.city, event.country].filter(Boolean);
  const location = locationParts.join(", ") || null;

  const formatDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Gradient accent strip */}
        <div className="h-1 w-full bg-linear-to-r from-indigo-500 via-violet-500 to-purple-500" />

        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {(event.event_type ?? "Event").replace(/_/g, " ")}
              </span>
              <StatusBadge status={event.status} />
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              {event.title || "Untitled Event"}
            </h1>
            {event.short_description && (
              <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                {event.short_description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/events/${eventId}/edit`}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit event
            </Link>
            <Link
              href={`/events/${eventId}/builder`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Layout className="h-3.5 w-3.5" />
              Builder
            </Link>
            {event.slug && (() => {
              const isPublic =
                event.status === "PUBLISHED" && event.visibility === "PUBLIC";
              return (
                <Link
                  href={isPublic ? `/e/${event.slug}` : `/e/${event.slug}?preview=1`}
                  target="_blank"
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                    isPublic
                      ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                      : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {isPublic ? "View page" : "Preview"}
                </Link>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Stats grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          title="Guests"
          value={stats.guest_count ?? 0}
          subtitle="Total invited"
          icon={Users}
          color="indigo"
          href={`/events/${eventId}/guests`}
        />
        <StatCard
          title="Attending"
          value={stats.attending_count ?? 0}
          subtitle="Confirmed RSVPs"
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Tickets"
          value={stats.ticket_count ?? 0}
          subtitle="Issued"
          icon={Ticket}
          color="violet"
          href={`/events/${eventId}/tickets`}
        />
        <StatCard
          title="Check-ins"
          value={stats.checkin_count ?? 0}
          subtitle="Scanned entries"
          icon={QrCode}
          color="amber"
          href={`/events/${eventId}/scanner`}
        />
      </div>

      {/* ── Main body ────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Left column: share + details */}
        <div className="space-y-4 lg:col-span-2">
          <ShareEventCard slug={event.slug} customDomain={event.custom_domain} />

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <SectionTitle>Event details</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2">
              <Detail icon={CalendarDays} label="Starts"    value={formatDate(event.starts_at_local ?? event.starts_at_utc)} />
              <Detail icon={Clock}        label="Ends"      value={formatDate(event.ends_at_local   ?? event.ends_at_utc)}   />
              <Detail icon={MapPin}       label="Location"  value={location}         />
              <Detail icon={Globe}        label="Visibility" value={event.visibility} />
              <Detail icon={Tag}          label="Status"    value={event.status}     />
              <Detail icon={Clock}        label="Timezone"  value={event.timezone}   />
            </div>
          </div>
        </div>

        {/* Right column: quick actions */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <SectionTitle>Quick actions</SectionTitle>
          <div className="space-y-2">
            <QuickAction
              label="Open builder"
              description="Design your event page"
              href={`/events/${eventId}/builder`}
              icon={Layout}
              primary
            />
            <QuickAction
              label="Manage guests"
              description="Invite & track attendees"
              href={`/events/${eventId}/guests`}
              icon={Users}
            />
            <QuickAction
              label="Tickets"
              description="Create ticket tiers"
              href={`/events/${eventId}/tickets`}
              icon={Ticket}
            />
            <QuickAction
              label="QR Scanner"
              description="Check in on arrival"
              href={`/events/${eventId}/scanner`}
              icon={QrCode}
            />
            <QuickAction
              label="Analytics"
              description="Views & conversions"
              href={`/events/${eventId}/analytics`}
              icon={BarChart3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
