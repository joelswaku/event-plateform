"use client";

import SharedEventRenderer from "@/components/events/shared/SharedEventRenderer";
import RsvpPanel from "@/components/events/shared/RsvpPanel";
import OpenRsvpModal from "@/components/events/shared/OpenRsvpModal";

export default function EventPageClient({ event, sections, token }) {
  const enrichedEvent = {
    ...event,
    starts_at_utc: event.starts_at_utc ?? event.starts_at ?? null,
    ends_at_utc:   event.ends_at_utc   ?? event.ends_at   ?? null,
    speakers: event.speakers || [],
    schedule_items: event.schedule_items || [],
  };

  const showOpenRsvp = enrichedEvent.allow_rsvp && enrichedEvent.open_rsvp && !token;

  return (
    <>
      <main className={`min-h-screen bg-white ${token || showOpenRsvp ? "pb-28" : ""}`}>
        <SharedEventRenderer
          event={enrichedEvent}
          sections={sections || []}
          isEditor={false}
        />
      </main>

      {/* Invitation RSVP panel — token-holder gets personal RSVP flow */}
      {token && <RsvpPanel token={token} />}

      {/* Open RSVP button — only shown when the organiser has enabled open RSVP */}
      {showOpenRsvp && <OpenRsvpModal eventId={enrichedEvent.id} />}
    </>
  );
}
