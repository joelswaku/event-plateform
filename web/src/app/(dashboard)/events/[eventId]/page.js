
"use client";

import { useEffect } from "react";
import EventHeaderActions from "@/components/EventHeaderActions";
import { useParams, useRouter } from "next/navigation";
import { Users, UserCheck, Ticket, QrCode } from "lucide-react";
import { useEventStore } from "@/store/event.store";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import ShareEventCard from "@/components/events/ShareEventCard";
import Link from "next/link";

export default function EventOverviewPage() {
  const { eventId } = useParams();
  const router = useRouter(); // ✅ FIX
  const { dashboard, fetchEventDashboard, loading } = useEventStore();

  useEffect(() => {
    if (eventId) {
      fetchEventDashboard(eventId);
    }
  }, [eventId, fetchEventDashboard]);

  if (loading && !dashboard) {
    return <div className="p-6">Loading event dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="p-6">Event dashboard not found.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={dashboard.event?.event_type || "Event"}
        title={dashboard.event?.title || "Event"}
        description={
          dashboard.event?.description ||
          "Manage guests, tickets, analytics, builder, and seating."
        }
      />
      <div className="flex items-center justify-between">
  <div>
    <h1 className="text-xl font-semibold">
      {dashboard?.event?.title || "Event"}
    </h1>
    <p className="text-sm text-gray-500">
      Manage guests, tickets, analytics, builder, and seating.
    </p>
  </div>

  <Link href={`/events/${dashboard?.event?.id}/edit`}>
    <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">
      ✏️ Edit Event
    </button>
  </Link>
</div>
      <div className="grid xl:grid-cols-3 gap-4">

     



{/* LEFT: Share */}
<div className="xl:col-span-1">
  <ShareEventCard
    slug={dashboard?.event?.slug}
    customDomain={dashboard?.event?.custom_domain}
  />
</div>

{/* RIGHT: Stats */}
<div className="xl:col-span-2 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  {/* your StatCard components */}
</div>

</div>
        
      {/* 🔥 STATS */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Guests"
          value={dashboard.stats?.guest_count || 0}
          subtitle="Total guests"
          icon={Users}
         // onClick={() => router.push(`/events/${eventId}/guests`)} // ✅ clickable
         href={`/events/${eventId}/guests`}
        
        />
        <StatCard
          title="Attending"
          value={dashboard.stats?.attending_count || 0}
          subtitle="Confirmed attendees"
          icon={UserCheck}
        />
        <StatCard
          title="Tickets"
          value={dashboard.stats?.ticket_count || 0}
          subtitle="Issued tickets"
          icon={Ticket}
          onClick={() => router.push(`/events/${eventId}/tickets`)}
        />
        <StatCard
          title="Check-ins"
          value={dashboard.stats?.checkin_count || 0}
          subtitle="Scanned entries"
          icon={QrCode}
          onClick={() => router.push(`/events/${eventId}/scanner`)}
        />
      </div>


{/*  */}






      <div className="grid gap-4 xl:grid-cols-3">
        {/* 🔥 EVENT DETAILS */}
        <div className="xl:col-span-2 rounded-3xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-lg font-semibold">Event details</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Info label="Status" value={dashboard.event?.status} />
            <Info label="Visibility" value={dashboard.event?.visibility} />
            <Info label="Timezone" value={dashboard.event?.timezone} />
            <Info label="City" value={dashboard.event?.city} />
            <Info label="Country" value={dashboard.event?.country} />
            <Info label="Starts" value={dashboard.event?.starts_at_local} />
            <Info label="Ends" value={dashboard.event?.ends_at_local} />
            <Info
              label="Ticketing"
              value={dashboard.event?.allow_ticketing ? "Enabled" : "Disabled"}
            />
          </div>
        </div>

        {/* 🔥 QUICK ACTIONS */}
        {/* <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-lg font-semibold">Quick actions</h2>

          <div className="mt-5 space-y-3">
            <ActionButton
              text="Manage guests"
              onClick={() => router.push(`/events/${eventId}/guests`)}
            />

            <ActionButton
              text="Set up tickets"
              onClick={() => router.push(`/events/${eventId}/tickets`)}
            />

            <ActionButton
              text="Open builder"
              onClick={() => router.push(`/events/${eventId}/builder`)}
            />

            <ActionButton
              text="View analytics"
              onClick={() => router.push(`/events/${eventId}/analytics`)}
            />
          </div>
        </div> */}
        {/* 🔥 QUICK ACTIONS */}
<div className="rounded-3xl border border-[#e5e7eb] bg-white p-6">
  <h2 className="text-lg font-semibold">Quick actions</h2>

  <div className="mt-5 space-y-3">

    {/* ✅ NEW EDIT BUTTON */}
    <ActionButton
      text="✏️ Edit event"
      onClick={() => router.push(`/events/${eventId}/edit`)}
    />

    <ActionButton
      text="Manage guests"
      onClick={() => router.push(`/events/${eventId}/guests`)}
    />

    <ActionButton
      text="Set up tickets"
      onClick={() => router.push(`/events/${eventId}/tickets`)}
    />

    <ActionButton
      text="Open builder"
      onClick={() => router.push(`/events/${eventId}/builder`)}
    />

    <ActionButton
      text="View analytics"
      onClick={() => router.push(`/events/${eventId}/analytics`)}
    />
  </div>
</div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f9fafb] p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function ActionButton({ text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick} // ✅ FIX
      className="w-full rounded-2xl border border-[#e5e7eb] px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition"
    >
      {text}
    </button>
  );
}
