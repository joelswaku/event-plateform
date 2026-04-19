"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useEventStore } from "@/store/event.store";
import PageHeader from "@/components/ui/page-header";

export default function EventsPage() {
  const { events, fetchEvents, loading } = useEventStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Events"
        title="All events"
        description="Browse and manage all events in your organization."
        action={
          <Link
            href="/events/create"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-4 py-3 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            New event
          </Link>
        }
      />

      <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading events...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="rounded-3xl border border-[#e5e7eb] p-5 hover:bg-gray-50"
              >
                <p className="text-xs uppercase tracking-wide text-indigo-600">
                  {event.event_type}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{event.title}</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {event.status} • {event.visibility}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}