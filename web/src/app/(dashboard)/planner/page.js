"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus, Calendar, Users, Trash2, ArrowRight, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { usePlannerStore } from "@/store/planner.store";
import { useEventStore } from "@/store/event.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import UpgradeModal from "@/components/ui/UpgradeModal";
import toast from "react-hot-toast";

const EVENT_TYPE_EMOJI = {
  wedding: "💍", conference: "🎤", concert: "🎵", birthday: "🎂",
  corporate: "💼", festival: "🎪", party: "🎉", gala: "✨",
};

function getEmoji(type) {
  return EVENT_TYPE_EMOJI[type?.toLowerCase()] ?? "📋";
}

function TaskRing({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex items-center gap-2">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" className="stroke-gray-200 dark:stroke-white/8" strokeWidth="4" />
        <circle cx="20" cy="20" r={r} fill="none" stroke="#6366f1" strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div>
        <p className="text-gray-900 dark:text-white font-bold text-sm">{pct}%</p>
        <p className="text-gray-500 dark:text-gray-500 text-[10px]">{done}/{total} tasks</p>
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const router = useRouter();
  const { projects, loading, fetchProjects, deleteProject } = usePlannerStore();
  const { events: allEvents, fetchEvents, loading: eventsLoading } = useEventStore();
  const { isSubscribed, features } = useSubscriptionStore();
  const events = allEvents.filter(e => !e.user_role || e.user_role === "OWNER");
  const [deleting, setDeleting] = useState(null);
  const [showNoEventsWarning, setShowNoEventsWarning] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check planner access - show upgrade modal if Free user
  useEffect(() => {
    if (!isSubscribed || !features?.planner) {
      setShowUpgradeModal(true);
    } else {
      fetchProjects();
      fetchEvents();
    }
  }, [isSubscribed, features]);

  async function handleDelete(e, id) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(id);
    const res = await deleteProject(id);
    setDeleting(null);
    if (res.success) toast.success("Project deleted");
    else toast.error(res.error || "Failed to delete");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a14] p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5 sm:mb-8 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">Event Planner</h1>
              <p className="text-gray-600 dark:text-gray-500 text-xs sm:text-sm hidden sm:block">Plan and manage every detail of your events</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (events.length > 0) {
                document.getElementById('event-list')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                setShowNoEventsWarning(true);
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all active:scale-[0.97] shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Add Planner</span>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        )}

        {!loading && !eventsLoading && projects.length === 0 && (
          events.length === 0 ? (
            /* ── No events at all ── */
            <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-2">
              <div className="relative mb-5 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <ClipboardList className="w-7 h-7 sm:w-9 sm:h-9 text-indigo-400" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2">No events yet</h3>
              <p className="text-gray-500 text-sm max-w-sm mb-6 sm:mb-8 leading-relaxed">
                Create your first event, then attach a planner to manage every detail — tasks, vendors, timeline and budget.
              </p>
              <div className="flex flex-col w-full max-w-xs">
                <Link
                  href="/events/create"
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="w-4 h-4" /> Create an Event
                </Link>
              </div>
            </div>
          ) : (
            /* ── Events exist but no planners ── */
            <div className="flex flex-col items-center text-center py-10 sm:py-16 px-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <ClipboardList className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400" />
              </div>
              <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-1">No planner projects yet</h3>
              <p className="text-gray-500 text-sm mb-5 sm:mb-8">
                Add a planner to one of your existing events to get started.
              </p>

              {/* Event quick-link cards */}
              <div id="event-list" className="w-full max-w-lg space-y-2 mb-5 sm:mb-8 text-left">
                {events.slice(0, 5).map(ev => (
                  <Link
                    key={ev.id}
                    href={`/planner/new?eventId=${ev.id}`}
                    className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 rounded-xl bg-gray-100 dark:bg-white/3 border border-gray-200 dark:border-white/8 hover:border-indigo-500/30 hover:bg-indigo-500/5 active:scale-[0.98] active:bg-indigo-500/10 transition-all"
                  >
                    <span className="text-xl shrink-0">{getEmoji(ev.type || ev.event_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ev.title || ev.name}</p>
                      {(ev.start_date || ev.date) && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(ev.start_date || ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-indigo-400">
                      <span className="text-[11px] font-semibold hidden sm:block">Add Planner</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        )}

        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {projects.map((p) => {
              const done = Number(p.done_count || 0);
              const total = Number(p.task_count || 0);
              const budget = Number(p.total_budget || 0);
              return (
                <Link key={p.id} href={`/planner/${p.id}`} className="group bg-white dark:bg-linear-to-br dark:from-[#1a1a2e] dark:to-[#16162a] rounded-2xl border border-gray-200 dark:border-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-500/40 active:scale-[0.98] p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-2xl dark:hover:shadow-indigo-500/25 relative overflow-hidden before:absolute before:inset-0 before:bg-linear-to-br before:from-indigo-500/0 before:to-purple-500/0 dark:before:hover:from-indigo-500/5 dark:before:hover:to-purple-500/5 before:transition-all before:pointer-events-none">
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-60 dark:opacity-80" />

                  <div className="flex items-start justify-between gap-2 relative z-10">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                          <span className="text-lg">{getEmoji(p.event_type)}</span>
                        </div>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">{p.event_type || "Event"}</span>
                      </div>
                      <h3 className="text-gray-900 dark:text-white font-bold text-base line-clamp-2 mt-1">{p.title}</h3>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      disabled={deleting === p.id}
                      className="sm:opacity-0 sm:group-hover:opacity-100 p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100 dark:active:bg-red-500/15 transition-all shrink-0"
                    >
                      {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 flex-wrap relative z-10">
                    {p.event_date && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5">
                        <Calendar className="w-3 h-3" />
                        {new Date(p.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    {p.guest_count && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5">
                        <Users className="w-3 h-3" />
                        {p.guest_count} guests
                      </span>
                    )}
                  </div>

                  {budget > 0 && (
                    <div className="relative z-10">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Budget</span>
                        <span className="text-gray-900 dark:text-white font-bold">{p.currency || "USD"} {budget.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full w-0 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '0%' }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 relative z-10">
                    <TaskRing done={done} total={total} />
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                      <span className="hidden sm:inline">View Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* No Events Warning Modal */}
        {showNoEventsWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#111127] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-500" />
                  <p className="text-sm font-bold text-white">Create Event First</p>
                </div>
                <button onClick={() => setShowNoEventsWarning(false)}>
                  <ExternalLink className="w-4 h-4 text-gray-400 rotate-45" />
                </button>
              </div>
              <p className="text-sm text-gray-400">
                You need to create an event before adding a planner. Events help organize all your planning details.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/events/create"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold text-center transition-colors"
                >
                  Create Event
                </Link>
                <button
                  onClick={() => setShowNoEventsWarning(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          router.push("/dashboard");
        }}
        feature="planner"
        title="Planner Requires Paid Plan"
        description="Access the full event planner with tasks, timeline, vendors, and budget management."
      />
    </div>
  );
}
