"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, UserPlus, Trash2, Crown, Shield,
  Users, Mail, Check, X, Send, Clock,
} from "lucide-react";
import { useTeamStore } from "@/store/team.store";
import { useEventStore } from "@/store/event.store";

/* ── helpers ─────────────────────────────────────────────────────────────────── */
function initials(name = "") {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

const ROLE_CFG = {
  OWNER: { label: "Owner", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", Icon: Crown  },
  ADMIN: { label: "Admin", color: "#6366f1", bg: "rgba(99,102,241,0.12)", Icon: Shield },
};

/* ── Plan badge ──────────────────────────────────────────────────────────────── */
function PlanBadge({ meta }) {
  if (!meta) return null;
  const adminCount = (meta.current ?? 1) - 1;
  const maxAdmins  = meta.maxAdmins;
  const planLabel  = meta.plan ? meta.plan.charAt(0).toUpperCase() + meta.plan.slice(1) : "";
  const full       = maxAdmins !== null && adminCount >= maxAdmins;
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-bold"
      style={{
        background: full ? "rgba(239,68,68,0.10)" : "rgba(99,102,241,0.10)",
        color:      full ? "#ef4444"               : "#6366f1",
      }}
    >
      {maxAdmins === null
        ? `Unlimited admins · ${planLabel}`
        : `${adminCount}/${maxAdmins} admin${maxAdmins === 1 ? "" : "s"} · ${planLabel}`}
    </span>
  );
}

/* ── MemberRow (desktop) ─────────────────────────────────────────────────────── */
function MemberRow({ member, isOwner, onRemove }) {
  const cfg = ROLE_CFG[member.role] ?? ROLE_CFG.ADMIN;
  const { Icon } = cfg;
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: cfg.color }}
      >
        {member.avatar_url
          ? <img src={member.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
          : initials(member.full_name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
          {member.full_name || member.email}
        </p>
        <p className="truncate text-xs text-gray-500">{member.email}</p>
      </div>
      <span
        className="shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        <Icon size={10} /> {cfg.label}
      </span>
      {isOwner && member.role !== "OWNER" && (
        <button
          onClick={() => onRemove(member.user_id)}
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

/* ── MobileMemberCard ────────────────────────────────────────────────────────── */
function MobileMemberCard({ member, isOwner, onRemove }) {
  const cfg = ROLE_CFG[member.role] ?? ROLE_CFG.ADMIN;
  const { Icon } = cfg;
  return (
    <div
      className="flex items-center gap-3 rounded-[16px] border p-3.5"
      style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: cfg.color }}
      >
        {initials(member.full_name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-white">{member.full_name || member.email}</p>
        <p className="truncate text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{member.email}</p>
      </div>
      <span
        className="shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        <Icon size={9} /> {cfg.label}
      </span>
      {isOwner && member.role !== "OWNER" && (
        <button
          onClick={() => onRemove(member.user_id)}
          className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(239,68,68,0.12)" }}
        >
          <X size={14} style={{ color: "#ef4444" }} />
        </button>
      )}
    </div>
  );
}

/* ── Access list ─────────────────────────────────────────────────────────────── */
const ACCESS_ROWS = [
  ["Manage guests & RSVPs",    true],
  ["Scan QR codes (check-in)", true],
  ["View analytics",           true],
  ["Edit event details",       true],
  ["Manage ticket types",      true],
  ["Delete event",             false],
  ["Change billing / plan",    false],
  ["Add or remove team",       false],
];

/* ── Invite form ─────────────────────────────────────────────────────────────── */
function InviteForm({ eventId, canInvite, meta, onSuccess, dark = false }) {
  const { inviteMember, isSubmitting } = useTeamStore();
  const [email,  setEmail]  = useState("");
  const [name,   setName]   = useState("");
  const [err,    setErr]    = useState("");
  const [notice, setNotice] = useState(""); // "added" | "invited"

  const submit = async () => {
    setErr(""); setNotice("");
    if (!email.trim()) { setErr("Enter an email address"); return; }

    const res = await inviteMember(eventId, email.trim(), name.trim());
    if (res.success) {
      setEmail(""); setName("");
      setNotice(res.type === "invited" ? "invited" : "added");
      setTimeout(() => setNotice(""), 4000);
      onSuccess?.();
    } else {
      setErr(res.error || "Failed to invite");
    }
  };

  if (!canInvite) {
    // Show upgrade prompt instead of form
    const planLabel = meta?.plan ? meta.plan.charAt(0).toUpperCase() + meta.plan.slice(1) : "";
    return (
      <div
        className="flex items-center gap-3 rounded-xl border px-4 py-3"
        style={dark
          ? { background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)" }
          : { background: "#fffbeb", borderColor: "#fde68a" }}
      >
        <Crown size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${dark ? "text-white" : "text-amber-800"}`}>
            Admin limit reached · {planLabel}
          </p>
          <p className={`text-xs mt-0.5 ${dark ? "" : "text-amber-600"}`}
             style={dark ? { color: "rgba(255,255,255,0.4)" } : {}}>
            Upgrade your plan to add more admins
          </p>
        </div>
        <Link
          href="/settings/billing"
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
          style={{ background: "#f59e0b" }}
        >
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-col gap-1.5 rounded-xl border p-1"
        style={dark
          ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }
          : { borderColor: "" }}
      >
        <div className="relative">
          <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="teammate@email.com"
            className="w-full rounded-lg pl-8 pr-3 py-2.5 text-sm outline-none"
            style={dark ? { background: "transparent", color: "#fff" } : { background: "transparent" }}
            autoComplete="off"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Their name (optional)"
            className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
            style={dark ? { background: "transparent", color: "#fff" } : { background: "transparent" }}
            autoComplete="off"
          />
          <button
            onClick={submit}
            disabled={isSubmitting}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white transition disabled:opacity-60"
            style={{ background: "#6366f1" }}
          >
            {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send size={14} />}
            {isSubmitting ? "…" : "Invite"}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {err    && <p className="text-xs text-red-500">{err}</p>}
      {notice === "added" && (
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#10b981" }}>
          <Check size={13} /> Added to event — they can log in now.
        </div>
      )}
      {notice === "invited" && (
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#6366f1" }}>
          <Clock size={13} /> Invite sent! They'll get an email with a signup link.
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────────── */
export default function TeamPage() {
  const { eventId } = useParams();
  const router      = useRouter();

  const { members, meta, isLoading, fetchMembers, removeMember } = useTeamStore();
  const { events }  = useEventStore();
  const event       = events?.find((e) => e.id === eventId);

  useEffect(() => { fetchMembers(eventId); }, [eventId, fetchMembers]);

  const isOwner    = meta?.currentUserRole === "OWNER";
  const adminCount = (meta?.current ?? 1) - 1;
  const canInvite  = isOwner && meta
    ? (meta.maxAdmins === null || adminCount < meta.maxAdmins)
    : false;

  const handleRemove = useCallback(async (memberId) => {
    if (!confirm("Remove this admin from the event?")) return;
    await removeMember(eventId, memberId);
  }, [eventId, removeMember]);

  /* ── MOBILE VIEWPORT ─────────────────────────────────────────────── */
  const MobileView = (
    <div className="flex flex-col sm:hidden" style={{ minHeight: "100dvh", background: "#0a0a12" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3" style={{ paddingTop: "max(52px, env(safe-area-inset-top))" }}>
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-[12px]"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <ArrowLeft size={17} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[20px] font-black tracking-tight text-white" style={{ letterSpacing: -0.5 }}>Team</p>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {event?.title ?? "Event"} · Manage admins
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-8">

        {/* Plan badge */}
        {meta && <div><PlanBadge meta={meta} /></div>}

        {/* Invite section — always visible for owner */}
        {isOwner && (
          <div
            className="flex flex-col gap-3 rounded-[16px] border p-4"
            style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-2">
              <UserPlus size={14} style={{ color: "#6366f1" }} />
              <p className="text-[13px] font-bold text-white">Add Admin by Email</p>
            </div>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              Enter your teammate's email. They'll get a link to join — no password sharing needed.
            </p>
            <InviteForm eventId={eventId} canInvite={canInvite} meta={meta} dark />
          </div>
        )}

        {/* Members list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(99,102,241,0.12)" }}>
              <Users size={24} style={{ color: "#6366f1" }} />
            </div>
            <p className="text-[15px] font-bold text-white">No team members yet</p>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              Invite an admin above to help manage this event
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {members.map((m) => (
              <MobileMemberCard key={m.user_id} member={m} isOwner={isOwner} onRemove={handleRemove} />
            ))}
          </div>
        )}

        {/* What admins can do */}
        <div
          className="rounded-[16px] border p-4"
          style={{ background: "#0e0e16", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="mb-3 text-[10px] font-extrabold uppercase" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "1.2px" }}>
            ADMIN ACCESS
          </p>
          {ACCESS_ROWS.map(([label, allowed]) => (
            <div key={label} className="flex items-center gap-2.5 py-1.5">
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: allowed ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: allowed ? "#10b981" : "#ef4444" }}
              >
                {allowed ? "✓" : "✕"}
              </span>
              <span className="text-[12px]" style={{ color: allowed ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );

  /* ── DESKTOP VIEW ────────────────────────────────────────────────────── */
  const DesktopView = (
    <div className="hidden sm:block min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="mx-auto max-w-2xl">

        {/* Back + title */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href={`/events/${eventId}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Team</h1>
            <p className="text-sm text-gray-500">{event?.title ?? "Event"} · Manage admins</p>
          </div>
          <div className="ml-auto"><PlanBadge meta={meta} /></div>
        </div>

        {/* Invite card — always visible for owner */}
        {isOwner && (
          <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus size={15} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Add Admin by Email</h2>
            </div>
            <p className="mb-4 text-xs text-gray-500">
              Enter your teammate's email. If they have an account they're added instantly.
              If not, they'll receive an email with a signup link — no password sharing needed.
            </p>
            <InviteForm eventId={eventId} canInvite={canInvite} meta={meta} />
          </div>
        )}

        {/* Members list */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 mb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Users size={32} className="text-gray-300 dark:text-gray-600" />
              <p className="font-medium text-gray-500">No team members yet</p>
              <p className="text-sm text-gray-400">Use the form above to invite an admin</p>
            </div>
          ) : (
            members.map((m) => (
              <div key={m.user_id} className="px-5">
                <MemberRow member={m} isOwner={isOwner} onRemove={handleRemove} />
              </div>
            ))
          )}
        </div>

        {/* Access info */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield size={14} className="text-indigo-500" /> Admin Permissions
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {ACCESS_ROWS.map(([label, allowed]) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                <span className={`font-bold ${allowed ? "text-emerald-500" : "text-red-400"}`}>{allowed ? "✓" : "✕"}</span>
                <span className={allowed ? "text-gray-700 dark:text-gray-300" : "text-gray-400 line-through"}>{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  return <>{MobileView}{DesktopView}</>;
}
