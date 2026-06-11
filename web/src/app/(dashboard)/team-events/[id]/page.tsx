'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface RolePermissions {
  canEdit: boolean; canDelete: boolean; canManageTeam: boolean;
  canManageGuests: boolean; canCheckin: boolean;
  canViewAnalytics: boolean; canPublish: boolean;
}

interface EventData {
  id: string; title: string; status: string;
  starts_at_local: string | null; ends_at_local: string | null;
  cover_image_url: string | null;
  allow_rsvp: boolean; allow_ticketing: boolean; allow_donations: boolean;
  description: string | null; venue_name: string | null;
  venue_address: string | null; city: string | null; country: string | null;
  event_type: string | null; visibility: string | null;
  role: string; owner_name: string; permissions: RolePermissions;
}

const ROLE_CFG: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  ADMIN:         { label: 'Admin',          color: '#a78bfa', bg: '#a78bfa1a', border: '#a78bfa33', desc: 'Full event management except deletion' },
  MANAGER:       { label: 'Manager',        color: '#34d399', bg: '#34d3991a', border: '#34d39933', desc: 'Manage guests, check-in, and analytics' },
  STAFF:         { label: 'Staff',          color: '#60a5fa', bg: '#60a5fa1a', border: '#60a5fa33', desc: 'Manage guests and run check-in' },
  CHECKIN_AGENT: { label: 'Check-in Agent', color: '#fbbf24', bg: '#fbbf241a', border: '#fbbf2433', desc: 'Scan tickets and check in attendees' },
  VIEWER:        { label: 'Viewer',         color: '#94a3b8', bg: '#94a3b81a', border: '#94a3b833', desc: 'View analytics only' },
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: 'Published', cls: 'text-emerald-400 bg-emerald-400/10' },
  DRAFT:     { label: 'Draft',     cls: 'text-slate-400 bg-slate-400/10'   },
  ARCHIVED:  { label: 'Archived',  cls: 'text-red-400 bg-red-400/10'       },
  CANCELLED: { label: 'Cancelled', cls: 'text-red-400 bg-red-400/10'       },
};

interface ActionDef {
  id: string; label: string; desc: string; icon: string;
  color: string; href: string; allowed: boolean;
}

export default function TeamEventControlPanelPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [event, setEvent]     = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/team/my-role/${id}`);
        setEvent(res.data?.data);
      } catch (e: any) {
        setError(e.response?.data?.message ?? 'Access denied');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !event) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
      <div className="text-4xl">🔒</div>
      <p className="text-red-400 font-medium">{error ?? 'Access denied'}</p>
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-white transition-colors">← Go back</button>
    </div>
  );

  const perms     = event.permissions;
  const roleCfg   = ROLE_CFG[event.role] ?? ROLE_CFG.VIEWER;
  const statusCfg = STATUS_CFG[event.status] ?? STATUS_CFG.DRAFT;

  const actions: ActionDef[] = [
    { id: 'guests',    label: 'Guests',       desc: 'View & manage guest list',      icon: '👥', color: 'emerald', href: `/events/${id}/guests`,    allowed: perms.canManageGuests  },
    { id: 'scanner',   label: 'Scanner',      desc: 'Scan tickets & check in',       icon: '📷', color: 'amber',   href: `/events/${id}/scanner`,   allowed: perms.canCheckin       },
    { id: 'analytics', label: 'Analytics',    desc: 'View event analytics',          icon: '📊', color: 'indigo',  href: `/events/${id}/analytics`, allowed: perms.canViewAnalytics },
    { id: 'tickets',   label: 'Tickets',      desc: 'View ticket orders',            icon: '🎟',  color: 'pink',    href: `/events/${id}/tickets`,   allowed: perms.canManageGuests  },
    { id: 'builder',   label: 'Page Builder', desc: 'Edit event page',               icon: '🎨', color: 'orange',  href: `/events/${id}/builder`,   allowed: perms.canEdit          },
    { id: 'team',      label: 'Team',         desc: 'Manage team members',           icon: '🛡',  color: 'violet',  href: `/events/${id}/team`,      allowed: perms.canManageTeam    },
    { id: 'settings',  label: 'Settings',     desc: 'Edit event details & settings', icon: '⚙',  color: 'slate',   href: `/events/${id}/settings`,  allowed: perms.canEdit          },
  ];

  const available = actions.filter(a => a.allowed);
  const locked    = actions.filter(a => !a.allowed);

  const fmtDate = (iso: string | null, opts?: Intl.DateTimeFormatOptions) =>
    iso ? new Date(iso).toLocaleDateString('en-US', opts ?? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : null;

  const startStr = fmtDate(event.starts_at_local) ?? 'Date TBD';
  const endStr   = fmtDate(event.ends_at_local, { month: 'short', day: 'numeric', year: 'numeric' });
  const location = [event.venue_name, event.city, event.country].filter(Boolean).join(', ') || null;

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/40 text-emerald-400',
    amber:   'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/40 text-amber-400',
    indigo:  'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15 hover:border-indigo-500/40 text-indigo-400',
    pink:    'bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/15 hover:border-pink-500/40 text-pink-400',
    orange:  'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15 hover:border-orange-500/40 text-orange-400',
    violet:  'bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15 hover:border-violet-500/40 text-violet-400',
    slate:   'bg-slate-500/10 border-slate-500/20 hover:bg-slate-500/15 hover:border-slate-500/40 text-slate-400',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/team-events" className="hover:text-white transition-colors">Team Events</Link>
        <span>/</span>
        <span className="text-slate-300 truncate max-w-xs">{event.title}</span>
      </div>

      {/* Hero */}
      <div className="relative h-52 rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-indigo-950 to-violet-950">
        {event.cover_image_url && (
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">{event.title}</h1>
            <p className="text-sm text-white/60 mt-1">{startStr}{endStr ? ` – ${endStr}` : ''}</p>
            {location && <p className="text-xs text-white/40 mt-0.5">📍 {location}</p>}
            <p className="text-xs text-white/30 mt-0.5">Organized by {event.owner_name}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${statusCfg.cls}`}>
              {statusCfg.label}
            </span>
            <div className="text-xs font-bold px-3 py-1.5 rounded-xl border"
              style={{ color: roleCfg.color, backgroundColor: roleCfg.bg, borderColor: roleCfg.border }}>
              {roleCfg.label}
            </div>
          </div>
        </div>
      </div>

      {/* Event info card */}
      <div className="bg-[#111127] border border-white/[0.06] rounded-xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Description */}
        <div className="sm:col-span-2">
          {event.description ? (
            <>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">About</p>
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{event.description}</p>
            </>
          ) : (
            <p className="text-xs text-slate-700 italic">No description provided.</p>
          )}
        </div>

        {/* Date & time */}
        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Date & Time</p>
          <p className="text-sm text-slate-300">{startStr}</p>
          {endStr && <p className="text-xs text-slate-500 mt-0.5">Ends {endStr}</p>}
        </div>

        {/* Location */}
        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Location</p>
          {location ? (
            <>
              {event.venue_name && <p className="text-sm text-slate-300">{event.venue_name}</p>}
              {event.venue_address && <p className="text-xs text-slate-500 mt-0.5">{event.venue_address}</p>}
              {(event.city || event.country) && (
                <p className="text-xs text-slate-500 mt-0.5">{[event.city, event.country].filter(Boolean).join(', ')}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-600">Location TBD</p>
          )}
        </div>

        {/* Features */}
        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Features</p>
          <div className="flex flex-wrap gap-1.5">
            {event.allow_rsvp       && <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400">RSVP</span>}
            {event.allow_ticketing  && <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-400">Ticketing</span>}
            {event.allow_donations  && <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400">Donations</span>}
            {event.event_type && <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-400">{event.event_type}</span>}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Visibility</p>
          <p className="text-sm text-slate-400">{event.visibility ?? '—'}</p>
        </div>
      </div>

      {/* Role banner */}
      <div className="bg-[#111127] border border-white/[0.06] rounded-xl p-4 mb-8 flex items-center gap-4">
        <div className="text-2xl">🎭</div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: roleCfg.color }}>{roleCfg.label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{roleCfg.desc}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {Object.entries(perms).filter(([, v]) => v).map(([k]) => (
            <span key={k} className="text-[9px] font-bold px-2 py-1 rounded-lg bg-white/6 text-slate-300">
              {k.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
            </span>
          ))}
        </div>
      </div>

      {/* Available actions */}
      <h2 className="text-xs font-bold text-slate-500 tracking-widest mb-4 uppercase">Your Access</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {available.map(action => (
          <Link
            key={action.id}
            href={action.href}
            className={`p-4 rounded-xl border transition-all group ${colorMap[action.color] ?? colorMap.slate}`}
          >
            <div className="text-2xl mb-3">{action.icon}</div>
            <p className="font-bold text-sm text-white">{action.label}</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{action.desc}</p>
            <p className="text-[10px] font-bold mt-3 opacity-0 group-hover:opacity-100 transition-opacity">Open →</p>
          </Link>
        ))}
      </div>

      {/* Locked actions */}
      {locked.length > 0 && (
        <>
          <h2 className="text-xs font-bold text-slate-600 tracking-widest mb-4 uppercase">Restricted</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {locked.map(action => (
              <div
                key={action.id}
                title={`Your role (${roleCfg.label}) cannot access ${action.label}`}
                className="p-4 rounded-xl border border-dashed border-white/[0.04] bg-white/[0.02] cursor-not-allowed opacity-40"
              >
                <div className="text-2xl mb-3 grayscale">{action.icon}</div>
                <p className="font-bold text-sm text-slate-600">{action.label}</p>
                <p className="text-[11px] text-slate-700 mt-1">{action.desc}</p>
                <p className="text-[10px] font-bold mt-3 text-slate-700">🔒 No access</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Permissions table */}
      <div className="bg-[#111127] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">Role Permissions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'canEdit',          label: 'Edit event'     },
            { key: 'canPublish',       label: 'Publish event'  },
            { key: 'canManageGuests',  label: 'Manage guests'  },
            { key: 'canCheckin',       label: 'Run check-in'   },
            { key: 'canViewAnalytics', label: 'View analytics' },
            { key: 'canManageTeam',    label: 'Manage team'    },
            { key: 'canDelete',        label: 'Delete event'   },
          ].map(p => {
            const allowed = (perms as any)[p.key];
            return (
              <div key={p.key} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${allowed ? 'bg-emerald-500/[0.08]' : 'bg-white/[0.02]'}`}>
                <span className={`text-sm ${allowed ? 'text-emerald-400' : 'text-red-400/60'}`}>{allowed ? '✓' : '✕'}</span>
                <span className={`text-xs font-medium ${allowed ? 'text-slate-300' : 'text-slate-600'}`}>{p.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
