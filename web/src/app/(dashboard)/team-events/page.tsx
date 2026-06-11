'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface TeamEvent {
  id:              string;
  title:           string;
  status:          string;
  starts_at_local: string | null;
  cover_image_url: string | null;
  event_type:      string;
  role:            string;
  owner_name:      string;
  permissions: {
    canEdit:          boolean;
    canDelete:        boolean;
    canManageTeam:    boolean;
    canManageGuests:  boolean;
    canCheckin:       boolean;
    canViewAnalytics: boolean;
    canPublish:       boolean;
  };
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN:         'text-violet-400 bg-violet-400/10 border-violet-400/20',
  MANAGER:       'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  STAFF:         'text-blue-400 bg-blue-400/10 border-blue-400/20',
  CHECKIN_AGENT: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  VIEWER:        'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: 'text-emerald-400 bg-emerald-400/10',
  DRAFT:     'text-slate-400 bg-slate-400/10',
  ARCHIVED:  'text-red-400 bg-red-400/10',
  CANCELLED: 'text-red-400 bg-red-400/10',
};

export default function TeamEventsPage() {
  const router = useRouter();
  const [events,  setEvents]  = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/team/my-events');
        setEvents(res.data?.data ?? []);
      } catch (e: any) {
        setError(e.response?.data?.message ?? 'Failed to load team events');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-red-400">{error}</p>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Team Events</h1>
        <p className="text-slate-400 mt-1 text-sm">Events you&apos;ve been added to as a team member</p>
      </div>

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onOpen={() => router.push(`/team-events/${event.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, onOpen }: { event: TeamEvent; onOpen: () => void }) {
  const roleClass   = ROLE_COLOR[event.role]    ?? ROLE_COLOR.VIEWER;
  const statusClass = STATUS_COLOR[event.status] ?? STATUS_COLOR.DRAFT;
  const dateStr     = event.starts_at_local
    ? new Date(event.starts_at_local).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Date TBD';

  return (
    <div className="bg-[#111127] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/10 transition-all">
      <div className="h-36 relative bg-linear-to-br from-indigo-950 to-violet-950 overflow-hidden">
        {event.cover_image_url && (
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-[#111127] via-transparent to-transparent" />
        <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-lg border ${roleClass}`}>
          {event.role.replace('_', ' ')}
        </div>
        <div className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-lg ${statusClass}`}>
          {event.status}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 mb-1">{event.title}</h3>
        <p className="text-xs text-slate-500 mb-1">{dateStr}</p>
        <p className="text-xs text-slate-600">Owner: {event.owner_name}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {event.permissions?.canEdit          && <PermChip label="Edit"       color="indigo"  />}
          {event.permissions?.canManageGuests  && <PermChip label="Guests"     color="emerald" />}
          {event.permissions?.canCheckin       && <PermChip label="Check-in"   color="amber"   />}
          {event.permissions?.canViewAnalytics && <PermChip label="Analytics"  color="blue"    />}
          {event.permissions?.canPublish       && <PermChip label="Publish"    color="violet"  />}
        </div>

        <button
          onClick={onOpen}
          className="mt-4 w-full py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold transition-colors border border-indigo-500/20 hover:border-indigo-500/40"
        >
          Open Control Panel →
        </button>
      </div>
    </div>
  );
}

function PermChip({ label, color }: { label: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo:  'text-indigo-400 bg-indigo-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
    amber:   'text-amber-400 bg-amber-400/10',
    blue:    'text-blue-400 bg-blue-400/10',
    violet:  'text-violet-400 bg-violet-400/10',
  };
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${colorMap[color] ?? ''}`}>{label}</span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
        <span className="text-2xl">👥</span>
      </div>
      <h3 className="text-white font-bold text-lg mb-2">No team events yet</h3>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
        When an event owner adds you to their team, the events will appear here with your access controls.
      </p>
    </div>
  );
}
