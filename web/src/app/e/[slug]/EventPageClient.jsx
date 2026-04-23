"use client";

import SharedEventRenderer from "@/components/events/shared/SharedEventRenderer";
import RsvpPanel from "@/components/events/shared/RsvpPanel";

export default function EventPageClient({ event, sections, token }) {
  const enrichedEvent = {
    ...event,
    speakers: event.speakers || [],
    schedule_items: event.schedule_items || [],
  };

  return (
    <>
      <main className={`min-h-screen bg-white ${token ? "pb-24" : ""}`}>
        <SharedEventRenderer
          event={enrichedEvent}
          sections={sections || []}
          isEditor={false}
        />
      </main>

      {/* RSVP panel — only mounts when a valid invitation token is present */}
      {token && <RsvpPanel token={token} />}
    </>
  );
}
