"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { usePlannerStore } from "@/store/planner.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import Link from "next/link";
import {
  CheckSquare, Clock, DollarSign, Store, Users, Activity,
  ArrowRight, AlertTriangle, Bot, Sparkles, TrendingUp,
  Heart, Zap, Calendar, Flag, ChevronRight, CheckCircle2,
  Circle, Pause, Ban, Target, FileText, MapPin,
} from "lucide-react";
import AIGenerateButton from "@/components/ai/AIGenerateButton";
import UpgradeNotificationModal from "@/components/planner/UpgradeNotificationModal";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(n) {
  return Number(n || 0).toLocaleString();
}

function isConfirmed(status) {
  return ["booked", "confirmed", "BOOKED", "CONFIRMED"].includes(status);
}

// ── Primitives ────────────────────────────────────────────────────────────────

function ProgressRing({ pct = 0, size = 56, stroke = 5, color = "#6366f1", label, sub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(1, pct / 100) * circ;
  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 absolute inset-0">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.7s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black text-white">{pct}%</span>
        </div>
      </div>
      {label && (
        <div>
          <p className="text-sm font-bold text-white leading-tight">{label}</p>
          {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
        </div>
      )}
    </div>
  );
}

function KPICard({ title, value, sub, color, icon: Icon, href, ring }) {
  const colors = {
    indigo:  { bg: "from-indigo-500/10 to-indigo-500/3",   border: "border-indigo-500/20",  icon: "bg-indigo-500/20 text-indigo-400",  bar: "#6366f1" },
    emerald: { bg: "from-emerald-500/10 to-emerald-500/3", border: "border-emerald-500/20", icon: "bg-emerald-500/20 text-emerald-400", bar: "#10b981" },
    amber:   { bg: "from-amber-500/10 to-amber-500/3",     border: "border-amber-500/20",   icon: "bg-amber-500/20 text-amber-400",    bar: "#f59e0b" },
    red:     { bg: "from-red-500/10 to-red-500/3",         border: "border-red-500/20",     icon: "bg-red-500/20 text-red-400",        bar: "#ef4444" },
    violet:  { bg: "from-violet-500/10 to-violet-500/3",   border: "border-violet-500/20",  icon: "bg-violet-500/20 text-violet-400",  bar: "#8b5cf6" },
  };
  const c = colors[color] ?? colors.indigo;
  const Card = href ? Link : "div";

  return (
    <Card href={href} className={`group relative rounded-2xl border bg-linear-to-br ${c.bg} ${c.border} p-4 transition-all duration-200 ${href ? "hover:scale-[1.02] hover:shadow-lg cursor-pointer active:scale-[0.97] active:brightness-90" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
        {ring !== undefined && <ProgressRing pct={ring} size={36} stroke={3.5} color={c.bar} />}
        {href && ring === undefined && <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 mt-1 transition-colors" />}
      </div>
      <p className="text-2xl font-black text-white tabular-nums leading-none">{value ?? "—"}</p>
      <p className="text-xs text-gray-400 mt-1 font-semibold">{title}</p>
      {sub && <p className="text-[11px] text-gray-600 mt-0.5">{sub}</p>}
    </Card>
  );
}

const PRIORITY_DOT = { HIGH: "bg-red-500", MEDIUM: "bg-amber-500", LOW: "bg-gray-500" };

function TaskRow({ task }) {
  const dot = PRIORITY_DOT[task.priority?.toUpperCase()] ?? "bg-gray-600";
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "DONE";
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/2 active:bg-white/4 transition-colors cursor-default">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <p className="text-sm text-gray-200 flex-1 truncate">{task.title}</p>
      <div className="flex items-center gap-2 shrink-0">
        {task.category && (
          <span className="hidden sm:block text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 uppercase">{task.category}</span>
        )}
        {task.due_date && (
          <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? "text-red-400 font-semibold" : "text-gray-500"}`}>
            {isOverdue && <AlertTriangle className="w-2.5 h-2.5" />}
            {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

const ACTION_LABELS = {
  task_created:     "Created task",
  task_updated:     "Updated task",
  task_deleted:     "Deleted task",
  vendor_created:   "Added vendor",
  vendor_updated:   "Updated vendor",
  timeline_created: "Added timeline item",
  budget_created:   "Added budget item",
  budget_updated:   "Updated budget item",
  project_created:  "Created project",
  project_updated:  "Updated project",
  note_created:     "Added note",
  note_updated:     "Updated note",
  team_invited:     "Invited team member",
  ai_generated:     "AI generated content",
};

const ACTION_ICON = {
  task_created:     { icon: CheckSquare,  color: "text-indigo-400",  bg: "bg-indigo-500/15" },
  task_updated:     { icon: CheckSquare,  color: "text-blue-400",    bg: "bg-blue-500/15"   },
  vendor_created:   { icon: Store,        color: "text-amber-400",   bg: "bg-amber-500/15"  },
  timeline_created: { icon: Clock,        color: "text-violet-400",  bg: "bg-violet-500/15" },
  budget_created:   { icon: DollarSign,   color: "text-emerald-400", bg: "bg-emerald-500/15"},
  project_created:  { icon: Zap,          color: "text-indigo-400",  bg: "bg-indigo-500/15" },
  project_updated:  { icon: Zap,          color: "text-gray-400",    bg: "bg-gray-500/15"   },
  note_created:     { icon: Sparkles,     color: "text-pink-400",    bg: "bg-pink-500/15"   },
  team_invited:     { icon: Users,        color: "text-teal-400",    bg: "bg-teal-500/15"   },
  ai_generated:     { icon: Bot,          color: "text-violet-400",  bg: "bg-violet-500/15" },
};

function ActivityItem({ item }) {
  const m = ACTION_ICON[item.action] ?? { icon: Activity, color: "text-gray-400", bg: "bg-gray-500/15" };
  const Icon = m.icon;
  const label = ACTION_LABELS[item.action] ?? item.action.replace(/_/g, " ");

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${m.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${m.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 leading-snug">
          <span className="font-semibold text-white">{label}</span>
          {item.entity_title && <span className="text-indigo-300"> "{item.entity_title}"</span>}
        </p>
        {item.actor_name && <p className="text-[10px] text-gray-600 mt-0.5">{item.actor_name}</p>}
      </div>
      <span className="text-[10px] text-gray-600 shrink-0">{timeAgo(item.created_at)}</span>
    </div>
  );
}

function EmptyWidget({ icon: Icon, title, desc, href, linkLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <p className="text-sm font-semibold text-gray-400 mb-1">{title}</p>
      <p className="text-xs text-gray-600 mb-3 max-w-[180px]">{desc}</p>
      {href && (
        <Link href={href} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 active:opacity-60 transition-opacity">
          {linkLabel} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="p-5 space-y-5 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white/4" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="h-64 rounded-2xl bg-white/4" />
          <div className="h-48 rounded-2xl bg-white/4" />
          <div className="h-48 rounded-2xl bg-white/4" />
        </div>
        <div className="space-y-5">
          <div className="h-40 rounded-2xl bg-white/4" />
          <div className="h-40 rounded-2xl bg-white/4" />
          <div className="h-40 rounded-2xl bg-white/4" />
          <div className="h-40 rounded-2xl bg-white/4" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlannerOverviewPage() {
  const { projectId } = useParams();
  const { currentProject, tasks, timeline, vendors, budget, team, activity, aiGenerating, generateAIBrief } = usePlannerStore();
  const { isSubscribed, plan } = useSubscriptionStore();

  const base = `/planner/${projectId}`;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // TESTING: Always show modal
  useEffect(() => {
    console.log('TESTING MODE: Always showing upgrade modal');
    setShowUpgradeModal(true);
  }, []);

  /* PRODUCTION CODE - Uncomment when ready for production:
  // Check if we should show upgrade notification
  // Planner requires Pro plan - show for Free and Starter users
  useEffect(() => {
    if (!currentProject) return;

    // Check if user is on Pro plan or higher
    const isPro = isSubscribed && (plan === "pro" || plan === "premium" || plan === "enterprise");
    if (isPro) return;

    const dismissedKey = `planner_upgrade_dismissed_${projectId}`;
    const alreadyDismissed = localStorage.getItem(dismissedKey);
    if (alreadyDismissed) return;

    // Check if project is older than 24 hours
    const createdAt = new Date(currentProject.created_at);
    const now = new Date();
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

    if (hoursSinceCreation >= 24) {
      setShowUpgradeModal(true);
    }
  }, [currentProject, isSubscribed, plan, projectId]);
  */

  const handleDismissUpgrade = () => {
    const dismissedKey = `planner_upgrade_dismissed_${projectId}`;
    localStorage.setItem(dismissedKey, "true");
    setShowUpgradeModal(false);
  };

  async function handleGenerateBrief() {
    const res = await generateAIBrief(projectId);
    if (res.success) toast.success("AI brief generated");
    else toast.error(res.error || "Failed to generate brief");
  }

  if (!currentProject) return <OverviewSkeleton />;

  // ── Computed metrics ──────────────────────────────────────────────────────
  const allTasks     = Object.values(tasks).flat();
  const doneTasks    = tasks.DONE?.length ?? 0;
  const totalTasks   = allTasks.length;
  const blockedTasks = tasks.BLOCKED?.length ?? 0;
  const overdueTasks = allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE").length;
  const taskPct      = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const budgetData   = budget || {};
  const totalBudget  = Number(budgetData.total_budget ?? currentProject.total_budget ?? 0);
  const totalActual  = Number(budgetData.total_actual ?? 0);
  const totalEst     = Number(budgetData.total_estimated ?? 0);
  const spendPct     = totalBudget > 0 ? Math.min(100, Math.round((totalActual / totalBudget) * 100)) : 0;

  const confirmedVendors = vendors.filter(v => isConfirmed(v.booking_status)).length;
  const vendorPct        = vendors.length > 0 ? Math.round((confirmedVendors / vendors.length) * 100) : 0;

  const health      = currentProject.health_score ?? 0;
  const healthColor = health >= 70 ? "#10b981" : health >= 40 ? "#f59e0b" : "#ef4444";

  const daysLeft = currentProject.event_date
    ? Math.ceil((new Date(currentProject.event_date) - new Date()) / 86_400_000)
    : null;

  const upcomingTasks = allTasks
    .filter(t => t.status !== "DONE" && t.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 6);

  const nextTimelineItems = [...timeline]
    .sort((a, b) => (a.position_order ?? 0) - (b.position_order ?? 0))
    .slice(0, 5);

  let parsedBrief = null;
  try { parsedBrief = currentProject.ai_brief ? JSON.parse(currentProject.ai_brief) : null; } catch {}

  const TASK_STATUS_ICON = {
    TODO:        { icon: Circle,       color: "text-gray-500" },
    IN_PROGRESS: { icon: Clock,        color: "text-indigo-400" },
    DONE:        { icon: CheckCircle2, color: "text-emerald-400" },
    BLOCKED:     { icon: Ban,          color: "text-red-400" },
  };

  return (
    <div className="p-3 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto">

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
        <KPICard
          title="Task Progress" value={`${taskPct}%`}
          sub={`${doneTasks} of ${totalTasks} done`}
          color={taskPct >= 70 ? "emerald" : taskPct >= 40 ? "indigo" : "amber"}
          icon={CheckSquare} ring={taskPct}
          href={`${base}/tasks`}
        />
        <KPICard
          title="Budget Used" value={`${spendPct}%`}
          sub={totalBudget > 0 ? `$${fmt(totalActual)} of $${fmt(totalBudget)}` : "No budget set"}
          color={spendPct > 90 ? "red" : spendPct > 70 ? "amber" : "emerald"}
          icon={DollarSign} ring={spendPct}
          href={`${base}/budget`}
        />
        <KPICard
          title="Vendors" value={vendors.length}
          sub={`${confirmedVendors} confirmed`}
          color="amber" icon={Store} ring={vendorPct}
          href={`${base}/vendors`}
        />
        <KPICard
          title="Health Score" value={health}
          sub={health >= 70 ? "Healthy" : health >= 40 ? "Needs attention" : "At risk"}
          color={health >= 70 ? "emerald" : health >= 40 ? "amber" : "red"}
          icon={Heart}
        />
        <KPICard
          title="Overdue" value={overdueTasks}
          sub={`${blockedTasks} blocked`}
          color={overdueTasks > 0 ? "red" : "emerald"}
          icon={AlertTriangle}
          href={`${base}/tasks`}
        />
        <KPICard
          title="Days Left"
          value={daysLeft !== null ? (daysLeft > 0 ? daysLeft : "Past") : "—"}
          sub={currentProject.event_date
            ? new Date(currentProject.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "No date set"}
          color={daysLeft !== null && daysLeft <= 14 ? "red" : daysLeft !== null && daysLeft <= 30 ? "amber" : "indigo"}
          icon={Calendar}
        />
      </div>

      {/* ── Task status breakdown bar ── */}
      {totalTasks > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-2xl px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Task Breakdown</p>
            <Link href={`${base}/tasks`} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 active:opacity-60 transition-opacity">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-px mb-3">
            {[
              { key: "DONE",        pct: Math.round(((tasks.DONE?.length || 0) / totalTasks) * 100), color: "bg-emerald-500" },
              { key: "IN_PROGRESS", pct: Math.round(((tasks.IN_PROGRESS?.length || 0) / totalTasks) * 100), color: "bg-indigo-500" },
              { key: "BLOCKED",     pct: Math.round(((tasks.BLOCKED?.length || 0) / totalTasks) * 100), color: "bg-red-500" },
              { key: "TODO",        pct: Math.round(((tasks.TODO?.length || 0) / totalTasks) * 100), color: "bg-white/15" },
            ].map(s => s.pct > 0 && (
              <div key={s.key} className={`h-full rounded-full transition-all duration-700 ${s.color}`} style={{ width: `${s.pct}%` }} />
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { key: "DONE",        label: "Done",        count: tasks.DONE?.length || 0,        dot: "bg-emerald-500" },
              { key: "IN_PROGRESS", label: "In Progress", count: tasks.IN_PROGRESS?.length || 0, dot: "bg-indigo-500" },
              { key: "BLOCKED",     label: "Blocked",     count: tasks.BLOCKED?.length || 0,     dot: "bg-red-500" },
              { key: "TODO",        label: "To Do",       count: tasks.TODO?.length || 0,         dot: "bg-white/30" },
            ].map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className="text-xs text-gray-400">{s.label}</span>
                <span className="text-xs font-bold text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">

        {/* ── Left (2/3) ── */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-5">

          {/* Upcoming Tasks */}
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-sm font-bold text-white">Upcoming Tasks</p>
                {overdueTasks > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                    {overdueTasks} overdue
                  </span>
                )}
              </div>
              <Link href={`${base}/tasks`} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold active:opacity-60 transition-opacity">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {upcomingTasks.length === 0 ? (
              <EmptyWidget
                icon={CheckSquare}
                title="No upcoming tasks"
                desc="Generate AI tasks or create your first task to get started"
                href={`${base}/tasks`}
                linkLabel="Go to Tasks"
              />
            ) : (
              <div>{upcomingTasks.map(t => <TaskRow key={t.id} task={t} />)}</div>
            )}
          </div>

          {/* Timeline preview */}
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-sm font-bold text-white">Event Timeline</p>
                {timeline.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                    {timeline.length} items
                  </span>
                )}
              </div>
              <Link href={`${base}/timeline`} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold active:opacity-60 transition-opacity">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {nextTimelineItems.length === 0 ? (
              <EmptyWidget
                icon={Clock}
                title="Timeline is empty"
                desc="Generate an AI-powered event schedule based on your event type and details"
                href={`${base}/timeline`}
                linkLabel="Generate Timeline"
              />
            ) : (
              <div className="relative px-4 py-4">
                <div className="absolute left-[22px] top-4 bottom-4 w-px bg-white/6" />
                <div className="space-y-4">
                  {nextTimelineItems.map((item) => {
                    const displayTime = item.start_time || item.item_time;
                    return (
                      <div key={item.id} className="flex items-start gap-4">
                        <div className={`w-3 h-3 rounded-full border-2 border-[#07070f] shrink-0 mt-1 z-10 ${item.is_milestone ? "bg-amber-500" : "bg-indigo-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                            {displayTime && <span className="font-mono">{String(displayTime).slice(0, 5)}</span>}
                            {item.duration_minutes && <span>{item.duration_minutes}min</span>}
                            {item.location && <span>· {item.location}</span>}
                            {item.category && <span className="capitalize">· {item.category}</span>}
                          </div>
                        </div>
                        {item.is_milestone && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                            Milestone
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {timeline.length > 5 && (
                  <Link href={`${base}/timeline`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-400 mt-4 transition-colors">
                    +{timeline.length - 5} more items <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/6">
              <div className="w-7 h-7 rounded-lg bg-gray-500/20 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-sm font-bold text-white">Recent Activity</p>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
            </div>
            {activity.length === 0 ? (
              <EmptyWidget icon={Activity} title="No activity yet" desc="Actions will appear here as you build your event" />
            ) : (
              <div className="px-4 py-1">
                {activity.slice(0, 8).map(a => <ActivityItem key={a.id} item={a} />)}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* Project info */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-white">Project Details</p>
              <Link href={`${base}/settings`} className="text-xs text-indigo-400 hover:text-indigo-300 active:opacity-60 transition-opacity">Edit →</Link>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Type",     value: currentProject.event_type, icon: Target },
                { label: "Venue",    value: currentProject.venue, icon: MapPin },
                { label: "Guests",   value: currentProject.guest_count ? `${Number(currentProject.guest_count).toLocaleString()} expected` : null, icon: Users },
                { label: "Location", value: [currentProject.city, currentProject.country].filter(Boolean).join(", ") || null, icon: MapPin },
                { label: "Currency", value: currentProject.currency, icon: DollarSign },
              ].filter(r => r.value).map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-500 shrink-0">{label}</span>
                  <span className="text-xs font-semibold text-white capitalize truncate text-right">{value}</span>
                </div>
              ))}
              {currentProject.style_notes && (
                <div className="mt-3 pt-3 border-t border-white/6">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Style Notes</p>
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{currentProject.style_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Budget mini */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-sm font-bold text-white">Budget</p>
              </div>
              <Link href={`${base}/budget`} className="text-xs text-indigo-400 hover:text-indigo-300 active:opacity-60 transition-opacity">View →</Link>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, spendPct)}%`,
                  backgroundColor: spendPct > 90 ? "#ef4444" : spendPct > 70 ? "#f59e0b" : "#10b981",
                }}
              />
            </div>
            <div className="space-y-1.5">
              {[
                ["Total Budget", `$${fmt(totalBudget)}`,                                              "text-white"],
                ["Estimated",    `$${fmt(totalEst)}`,                                                 "text-gray-300"],
                ["Spent",        `$${fmt(totalActual)}`,                                               "text-amber-400"],
                ["Remaining",    `$${fmt(Math.max(0, totalBudget - totalActual))}`, totalBudget >= totalActual ? "text-emerald-400" : "text-red-400"],
              ].map(([l, v, cls]) => (
                <div key={l} className="flex justify-between text-xs">
                  <span className="text-gray-500">{l}</span>
                  <span className={`font-bold ${cls}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vendors mini */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-sm font-bold text-white">Vendors</p>
              </div>
              <Link href={`${base}/vendors`} className="text-xs text-indigo-400 hover:text-indigo-300 active:opacity-60 transition-opacity">View →</Link>
            </div>
            {vendors.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-3">No vendors yet</p>
            ) : (
              <div className="space-y-2">
                {vendors.slice(0, 5).map(v => (
                  <div key={v.id} className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-300 truncate flex-1">{v.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      isConfirmed(v.booking_status) ? "bg-emerald-500/20 text-emerald-400" :
                      v.booking_status === "quoted" || v.booking_status === "QUOTED" ? "bg-amber-500/20 text-amber-400" :
                      v.booking_status === "contacted" || v.booking_status === "CONTACTED" ? "bg-blue-500/20 text-blue-400" :
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      {String(v.booking_status || "new").toLowerCase()}
                    </span>
                  </div>
                ))}
                {vendors.length > 5 && (
                  <p className="text-[11px] text-gray-600 text-center pt-1">+{vendors.length - 5} more</p>
                )}
              </div>
            )}
          </div>

          {/* Team mini */}
          {team.length > 0 && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-teal-400" />
                  <p className="text-sm font-bold text-white">Team</p>
                </div>
                <Link href={`${base}/team`} className="text-xs text-indigo-400 hover:text-indigo-300 active:opacity-60 transition-opacity">View →</Link>
              </div>
              <div className="space-y-2">
                {team.slice(0, 4).map(m => (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-600/40 border border-indigo-500/30 flex items-center justify-center text-[9px] font-bold text-indigo-300 shrink-0">
                      {m.avatar_url
                        ? <img src={m.avatar_url} alt={m.name} className="w-full h-full rounded-full object-cover" />
                        : (m.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{m.name}</p>
                      {m.role && <p className="text-[10px] text-gray-500 capitalize">{m.role}</p>}
                    </div>
                  </div>
                ))}
                {team.length > 4 && (
                  <p className="text-[11px] text-gray-600 pt-1">+{team.length - 4} more members</p>
                )}
              </div>
            </div>
          )}

          {/* AI Brief widget */}
          <div className="bg-linear-to-br from-indigo-600/12 to-violet-600/8 border border-indigo-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <p className="text-sm font-bold text-white">AI Brief</p>
              </div>
              <AIGenerateButton
                onClick={handleGenerateBrief}
                loading={aiGenerating}
                label={parsedBrief ? "Refresh" : "Generate"}
                variant="inline"
              />
            </div>
            {aiGenerating && (
              <div className="flex items-center gap-2 py-4 justify-center">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
            {!parsedBrief && !aiGenerating && (
              <div className="text-center py-4">
                <Sparkles className="w-8 h-8 text-indigo-500/50 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Generate an executive AI brief with risk analysis, critical path, and action plan.</p>
              </div>
            )}
            {parsedBrief && !aiGenerating && (
              <div className="space-y-2.5 text-xs text-gray-300">
                {parsedBrief.executiveSummary && (
                  <p className="leading-relaxed line-clamp-4">{parsedBrief.executiveSummary}</p>
                )}
                {parsedBrief.risks?.slice(0, 2).map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/8 border border-amber-500/15">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{typeof r === "string" ? r : r.risk || r.description || JSON.stringify(r)}</span>
                  </div>
                ))}
                {parsedBrief.priorities?.slice(0, 2).map((p, i) => (
                  <div key={i} className="flex items-start gap-1.5 p-2 rounded-lg bg-indigo-500/8 border border-indigo-500/15">
                    <Target className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{typeof p === "string" ? p : p.action || p.title || JSON.stringify(p)}</span>
                  </div>
                ))}
                <Link href={`${base}/ai-brief`} className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold pt-1">
                  Full brief <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Notification Modal */}
      <UpgradeNotificationModal
        isOpen={showUpgradeModal}
        onDismiss={handleDismissUpgrade}
      />
    </div>
  );
}
