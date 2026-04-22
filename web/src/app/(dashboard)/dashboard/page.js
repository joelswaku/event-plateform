
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  Users,
  Ticket,
  Activity,
} from "lucide-react";

import { useEventStore } from "@/store/event.store";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import EmptyState from "@/components/ui/empty-state";
import EventActions from "@/components/events/event-actions";

export default function DashboardPage() {
  const { events, fetchEvents, loading, updateEvent } =
    useEventStore();

  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* =========================
     TOGGLE VISIBILITY
  ========================= */
  const toggleVisibility = async (e, event) => {
    e.preventDefault();

    try {
      setUpdatingId(event.id);

      const newVisibility =
        event.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";

      await updateEvent(event.id, {
        visibility: newVisibility,
      });
    } catch (err) {
      console.error("Failed to update visibility");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        eyebrow="Workspace"
        title="Dashboard"
        description="Manage your events, monitor activity, and jump into guests, tickets, builder, and analytics."
        action={
          <Link
            href="/events/create"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-4 py-3 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        }
      />

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total events"
          value={events?.length || 0}
          subtitle="All created events"
          icon={CalendarDays}
        />

        <StatCard
          title="Guests"
          value="—"
          subtitle="Per-event details"
          icon={Users}
        />

        <StatCard
          title="Tickets"
          value="—"
          subtitle="Sales overview"
          icon={Ticket}
        />

        <StatCard
          title="Activity"
          value={loading ? "..." : "Live"}
          subtitle="Connected to API"
          icon={Activity}
        />
      </div>

      {/* EVENTS */}
      <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent events</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click an event to manage everything.
          </p>
        </div>

        {!loading && (!events || events.length === 0) ? (
          <EmptyState
            title="No events yet"
            description="Create your first event to get started."
            action={
              <Link
                href="/events/create"
                className="inline-flex rounded-2xl bg-[#111827] dark:bg-white dark:text-gray-900 px-4 py-3 text-sm font-medium text-white"
              >
                Create event
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* TOP */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase">
                      {event.event_type}
                    </p>

                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {event.title}
                    </h3>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {event.city || "No city"}
                      </span>

                      <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        {event.status}
                      </span>
                    </div>
                  </div>

                  {/* VISIBILITY BUTTON */}
                  <button
                    onClick={(e) => toggleVisibility(e, event)}
                    disabled={updatingId === event.id}
                    className={`text-xs px-3 py-1 rounded-xl font-medium transition
                      ${
                        event.visibility === "PUBLIC"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }
                      ${
                        updatingId === event.id
                          ? "opacity-50"
                          : "hover:scale-105"
                      }
                    `}
                  >
                    {updatingId === event.id
                      ? "Updating..."
                      : event.visibility === "PUBLIC"
                      ? "🌍 Public"
                      : "🔒 Private"}
                  </button>
                </div>

                {/* DATE */}
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Starts:{" "}
                  {event.starts_at_local ||
                    event.starts_at_utc ||
                    "—"}
                </div>

                {/* ACTIONS */}
                <EventActions event={event} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



