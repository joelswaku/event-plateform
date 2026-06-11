"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import {
  Sparkles, X, CheckSquare, Clock, DollarSign, Store,
  FileText, Shield, Zap, ChevronRight, Loader2, Check,
  AlertTriangle, TrendingUp, Lightbulb,
} from "lucide-react";
import toast from "react-hot-toast";

const ACTIONS = [
  {
    id: "tasks",
    label: "Generate Tasks",
    desc: "AI creates a full task checklist for your event type",
    icon: CheckSquare,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    fn: "generateAITasks",
  },
  {
    id: "timeline",
    label: "Generate Timeline",
    desc: "Build a day-of schedule based on your event details",
    icon: Clock,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    fn: "generateAITimeline",
  },
  {
    id: "budget",
    label: "Analyze Budget",
    desc: "AI suggests a budget breakdown by category",
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    fn: "generateAIBudget",
  },
  {
    id: "vendors",
    label: "Suggest Vendors",
    desc: "Recommend vendor categories for your event",
    icon: Store,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    fn: "generateAIVendors",
  },
  {
    id: "brief",
    label: "Generate AI Brief",
    desc: "Full executive strategy with risks and priorities",
    icon: FileText,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    fn: "generateAIBrief",
  },
  {
    id: "risk",
    label: "Risk Analysis",
    desc: "Detect issues, delays, and planning gaps",
    icon: Shield,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    fn: "fetchRiskAnalysis",
  },
];

function ActionButton({ action, projectId, onResult }) {
  const store = usePlannerStore();
  const [state, setState] = useState("idle"); // idle | loading | done | error

  async function run() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await store[action.fn](projectId);
      if (res?.success) {
        setState("done");
        onResult?.({ action: action.label, data: res.data });
        setTimeout(() => setState("idle"), 3000);
      } else {
        setState("error");
        setTimeout(() => setState("idle"), 2000);
        toast.error(res?.error || `${action.label} failed`);
      }
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  const Icon = action.icon;

  return (
    <button
      onClick={run}
      disabled={state === "loading"}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group
        ${state === "done"   ? "border-emerald-500/30 bg-emerald-500/8" :
          state === "error"  ? "border-red-500/30 bg-red-500/8" :
          `${action.bg} hover:brightness-125`}
        disabled:cursor-not-allowed`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.bg}`}>
        {state === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> :
         state === "done"    ? <Check className="w-3.5 h-3.5 text-emerald-400" /> :
         state === "error"   ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> :
         <Icon className={`w-3.5 h-3.5 ${action.color}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white">{action.label}</p>
        <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{action.desc}</p>
      </div>
      {state === "idle" && <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 shrink-0" />}
    </button>
  );
}

function ProjectInsights({ project, tasks }) {
  if (!project) return null;

  const allTasks = Object.values(tasks).flat();
  const overdue = allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE").length;
  const blocked = (tasks.BLOCKED || []).length;
  const donePct = allTasks.length > 0 ? Math.round((tasks.DONE.length / allTasks.length) * 100) : 0;
  const health = project.health_score ?? 0;

  const insights = [];
  if (overdue > 0) insights.push({ type: "warn", msg: `${overdue} task${overdue > 1 ? "s" : ""} overdue` });
  if (blocked > 0) insights.push({ type: "warn", msg: `${blocked} task${blocked > 1 ? "s" : ""} blocked` });
  if (!project.venue) insights.push({ type: "info", msg: "No venue set yet" });
  if (!project.total_budget) insights.push({ type: "info", msg: "No budget defined" });
  if (donePct > 80) insights.push({ type: "good", msg: `${donePct}% tasks complete — excellent!` });
  if (health >= 70) insights.push({ type: "good", msg: "Project health is strong" });
  if (insights.length === 0) insights.push({ type: "info", msg: "Generate AI content to get planning insights" });

  const meta = {
    warn: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/8 border-amber-500/20" },
    info: { icon: Lightbulb,    color: "text-blue-400",   bg: "bg-blue-500/8 border-blue-500/20"  },
    good: { icon: TrendingUp,   color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
  };

  return (
    <div className="space-y-2">
      {insights.slice(0, 4).map((ins, i) => {
        const m = meta[ins.type];
        const Icon = m.icon;
        return (
          <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs ${m.bg}`}>
            <Icon className={`w-3.5 h-3.5 ${m.color} shrink-0 mt-0.5`} />
            <span className="text-gray-300">{ins.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function PlannerAICopilot() {
  const { projectId } = useParams();
  const { currentProject, tasks, aiGenerating } = usePlannerStore();
  const [open, setOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [tab, setTab] = useState("generate");

  function handleResult(r) {
    setLastResult(r);
    toast.success(`${r.action} complete`);
  }

  return (
    <>
      {/* Floating trigger */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Pulse ring when AI is working */}
        {aiGenerating && (
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 animate-ping pointer-events-none" />
        )}
        <button
          onClick={() => setOpen(p => !p)}
          className="relative flex items-center gap-2 px-4 py-3 rounded-2xl bg-linear-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
        >
          {open
            ? <X className="w-4 h-4" />
            : <Sparkles className="w-4 h-4" />}
          <span>{open ? "Close" : "AI Planner"}</span>
          {aiGenerating && (
            <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />
          )}
        </button>
      </div>

      {/* Slide-out panel */}
      <div className={`fixed right-0 top-0 h-full z-40 w-80 bg-[#0b0b18]/95 backdrop-blur-xl border-l border-white/8 shadow-2xl transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-linear-to-br from-indigo-600/20 to-violet-600/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-600/40 border border-indigo-500/40 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">AI Copilot</p>
              <p className="text-[10px] text-indigo-300/70">Powered by Claude</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8">
          {[["generate", "Generate"], ["insights", "Insights"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors ${tab === id ? "text-indigo-400 border-b-2 border-indigo-500" : "text-gray-500 hover:text-gray-300"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(100vh-132px)]">
          {tab === "generate" && (
            <>
              <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wide mb-2">AI Actions</p>
              {ACTIONS.map(action => (
                <ActionButton key={action.id} action={action} projectId={projectId} onResult={handleResult} />
              ))}
              {lastResult && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Last Generated</p>
                  <p className="text-xs text-gray-300">{lastResult.action}</p>
                </div>
              )}
            </>
          )}

          {tab === "insights" && (
            <>
              <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wide mb-2">Smart Insights</p>
              <ProjectInsights project={currentProject} tasks={tasks} />

              {currentProject && (
                <div className="mt-4 space-y-2.5">
                  <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wide">Project Health</p>
                  {[
                    ["Tasks", Object.values(tasks).flat().length > 0 ? Math.round((tasks.DONE?.length / Object.values(tasks).flat().length) * 100) : 0, "#6366f1"],
                    ["Health Score", currentProject.health_score ?? 0, currentProject.health_score >= 70 ? "#10b981" : currentProject.health_score >= 40 ? "#f59e0b" : "#ef4444"],
                  ].map(([label, pct, color]) => (
                    <div key={label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-bold text-white">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-white/8 bg-[#0b0b18]">
          <p className="text-[10px] text-gray-600 text-center">
            {aiGenerating ? "⚡ AI is generating…" : "AI actions affect your project data"}
          </p>
        </div>
      </div>

      {/* Backdrop when panel open */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
