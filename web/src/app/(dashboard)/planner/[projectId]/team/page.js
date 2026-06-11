"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePlannerStore } from "@/store/planner.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import { Plus, X, Loader2, Users, Mail, Shield, Trash2, Crown } from "lucide-react";
import toast from "react-hot-toast";

const ROLE_META = {
  OWNER:  { cls: "bg-amber-500/20 text-amber-400",   icon: Crown  },
  ADMIN:  { cls: "bg-red-500/20 text-red-400",        icon: Shield },
  EDITOR: { cls: "bg-blue-500/20 text-blue-400",      icon: Shield },
  VIEWER: { cls: "bg-gray-500/20 text-gray-400",      icon: Users  },
};

function InviteModal({ projectId, onClose }) {
  const { inviteTeamMember } = usePlannerStore();
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!email.trim()) return;
    setSaving(true);
    const res = await inviteTeamMember(projectId, { email: email.trim(), name: "" });
    setSaving(false);
    if (res.success) {
      toast.success(res.type === "invited" ? "Invitation sent! They'll receive a signup link." : "Team member added");
      onClose();
    } else {
      toast.error(res.error || "Failed to invite");
    }
  }

  const input = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111127] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">Invite Team Member</p>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="text-xs text-gray-400 -mt-2">
          If they have an account, they're added instantly. If not, they'll receive a signup link.
        </div>
        <input
          className={input}
          placeholder="teammate@email.com"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          autoFocus
        />
        <button
          onClick={submit}
          disabled={saving || !email.trim()}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Invite Member"}
        </button>
      </div>
    </div>
  );
}

function MemberCard({ member, projectId }) {
  const { updateTeamMember, removeTeamMember } = usePlannerStore();
  const [role, setRole] = useState(member.role?.toUpperCase() || "VIEWER");
  const [removing, setRemoving] = useState(false);
  const memberId = member.user_id || member.id; // user_id for event_members, id for planner_team_members

  async function changeRole(newRole) {
    setRole(newRole);
    await updateTeamMember(projectId, memberId, { role: newRole });
  }

  async function remove() {
    setRemoving(true);
    const res = await removeTeamMember(projectId, memberId);
    setRemoving(false);
    if (!res.success) toast.error(res.error || "Failed to remove member");
  }

  const rm = ROLE_META[role] ?? ROLE_META.VIEWER;
  const RoleIcon = rm.icon;
  const initials = member.name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="bg-[#111127] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        {member.avatar_url ? (
          <img src={member.avatar_url} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{member.name}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <Mail className="w-3 h-3" />
            <span className="truncate">{member.email}</span>
          </div>
        </div>
      </div>

      {/* Role badge (non-editable for now) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RoleIcon className={`w-3.5 h-3.5 ${rm.cls.includes("text-") ? rm.cls.split(" ").find(c => c.startsWith("text-")) : "text-gray-400"}`} />
          <span className="text-sm text-gray-300">{role}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rm.cls}`}>{role}</span>
      </div>

      {/* Status */}
      {member.accepted_at ? (
        <p className="text-[11px] text-emerald-400">Accepted · {new Date(member.accepted_at).toLocaleDateString()}</p>
      ) : (
        <p className="text-[11px] text-amber-400">Pending invitation</p>
      )}

      {role !== "OWNER" && (
        <button
          onClick={remove}
          disabled={removing}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors self-start"
        >
          {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          Remove
        </button>
      )}
    </div>
  );
}

export default function TeamPage() {
  const { projectId } = useParams();
  const { team, fetchTeam } = usePlannerStore();
  const { plan, isSubscribed, fetchSubscription } = useSubscriptionStore();
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    fetchSubscription();
    if (projectId) fetchTeam(projectId);
  }, [fetchSubscription, projectId, fetchTeam]);

  const owners = team.filter(m => m.role?.toUpperCase() === "OWNER");
  const others = team.filter(m => m.role?.toUpperCase() !== "OWNER");

  // Use same team limits as event team page
  // Free: 1 total (owner only), Starter: 2 total, Pro: 4 total, Premium/Enterprise: unlimited
  const isPro = isSubscribed && (plan === "pro" || plan === "premium" || plan === "enterprise");
  const planLimits = {
    free: 1,
    starter: 2,
    pro: 4,
    premium: Infinity,
    enterprise: Infinity
  };
  const maxTotal = isPro && (plan === "premium" || plan === "enterprise")
    ? null
    : (planLimits[plan] ?? 1);
  const currentTotal = team.length;
  const canInvite = maxTotal === null || currentTotal < maxTotal;

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {team.length} members · {team.filter(m => m.accepted_at).length} active
          </p>
          {maxTotal !== null && (
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {currentTotal}/{maxTotal} team {maxTotal === 1 ? 'member' : 'members'}
            </p>
          )}
        </div>
        {canInvite ? (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Invite Member
          </button>
        ) : (
          <Link
            href="/settings/billing"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold"
          >
            <Crown className="w-4 h-4" /> Upgrade Plan
          </Link>
        )}
      </div>

      {!canInvite && (
        <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Team member limit reached</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                You've used all {maxTotal} team {maxTotal === 1 ? 'member' : 'members'} allowed on the {plan} plan. Upgrade to add more collaborators.
              </p>
            </div>
          </div>
        </div>
      )}

      {team.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No team members yet. Invite collaborators to work on this project.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {owners.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-3">Owner</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {owners.map(m => <MemberCard key={m.user_id || m.id || m.email} member={m} projectId={projectId} />)}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Team</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {others.map(m => <MemberCard key={m.user_id || m.id || m.email} member={m} projectId={projectId} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {showInvite && <InviteModal projectId={projectId} onClose={() => setShowInvite(false)} />}
    </div>
  );
}
