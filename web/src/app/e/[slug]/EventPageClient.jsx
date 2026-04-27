"use client";

import SharedEventRenderer from "@/components/events/shared/SharedEventRenderer";
import RsvpPanel from "@/components/events/shared/RsvpPanel";
import OpenRsvpModal from "@/components/events/shared/OpenRsvpModal";

export default function EventPageClient({ event, sections, token }) {
  const enrichedEvent = {
    ...event,
    // public-pages API returns raw DB column "starts_at"; normalize to the
    // name the rest of the frontend expects so countdown & SharedEventRenderer work
    starts_at_utc: event.starts_at_utc ?? event.starts_at ?? null,
    ends_at_utc:   event.ends_at_utc   ?? event.ends_at   ?? null,
    speakers: event.speakers || [],
    schedule_items: event.schedule_items || [],
  };

  const showOpenRsvp = enrichedEvent.open_rsvp && enrichedEvent.allow_rsvp && !token;

  return (
    <>
      <main className={`min-h-screen bg-white ${token || showOpenRsvp ? "pb-28" : ""}`}>
        <SharedEventRenderer
          event={enrichedEvent}
          sections={sections || []}
          isEditor={false}
        />
      </main>

      {/* Invitation RSVP panel — only mounts when a valid invitation token is present */}
      {token && <RsvpPanel token={token} />}

      {/* Open RSVP — floats for any visitor when the event has open_rsvp enabled */}
      {showOpenRsvp && <OpenRsvpModal eventId={enrichedEvent.id} />}
    </>
  );
}
