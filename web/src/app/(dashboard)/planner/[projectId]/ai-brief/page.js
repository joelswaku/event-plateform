"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import AIGenerateButton from "@/components/ai/AIGenerateButton";
import {
  AlertTriangle, CheckCircle, Zap, Calendar, TrendingUp,
  ChevronDown, ChevronUp, Loader2, Shield, Activity,
} from "lucide-react";
import toast from "react-hot-toast";

function HealthGauge({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  const r = 54;
  const circ = Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* Background arc */}
        <path
          d="M 14 70 A 56 56 0 0 1 126 70"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 14 70 A 56 56 0 0 1 126 70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div className="text-center -mt-6">
        <p className="text-4xl font-black text-white">{score}</p>
        <p className="text-xs text-gray-500">Health Score</p>
        <p className="text-sm font-semibold mt-1" style={{ color }}>
          {pct >= 70 ? "Healthy" : pct >= 40 ? "Needs Attention" : "At Risk"}
        </p>
      </div>
    </div>
  );
}

function RiskCard({ risk, i }) {
  const [open, setOpen] = useState(false);
  const impact = risk.impact?.toUpperCase();
  const clr = impact === "HIGH" ? "border-red-500/30 bg-red-500/5 text-red-400"
    : impact === "MEDIUM" ? "border-amber-500/30 bg-amber-500/5 text-amber-400"
    : "border-gray-500/30 bg-gray-500/5 text-gray-400";

  return (
    <div className={`border rounded-xl p-4 ${clr}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-start justify-between gap-3 text-left">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-white">{risk.risk || risk}</p>
        </div>
        {risk.mitigation && (open ? <ChevronUp className="w-4 h-4 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 shrink-0 mt-0.5" />)}
      </button>
      {open && risk.mitigation && (
        <p className="text-xs text-gray-300 mt-3 ml-6 leading-relaxed">{risk.mitigation}</p>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, color = "text-indigo-400", children }) {
  return (
    <div className="bg-[#111127] border border-white/8 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-4 h-4 ${color}`} />
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function AIBriefPage() {
  const { projectId } = useParams();
  const { currentProject, aiGenerating, generateAIBrief, fetchRiskAnalysis, loading } = usePlannerStore();
  const [riskData, setRiskData] = useState(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  let brief = null;
  try { brief = currentProject?.ai_brief ? JSON.parse(currentProject.ai_brief) : null; } catch {}

  async function handleGenerate() {
    const res = await generateAIBrief(projectId);
    if (res.success) toast.success("AI brief generated");
    else toast.error(res.error || "Failed to generate brief");
  }

  async function handleRiskAnalysis() {
    setLoadingRisk(true);
    const res = await fetchRiskAnalysis(projectId);
    setLoadingRisk(false);
    if (res.success) setRiskData(res.data);
    else toast.error(res.error || "Failed to fetch risk analysis");
  }

  const health = currentProject?.health_score ?? brief?.health_score ?? 0;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">AI Executive Brief</h2>
          <p className="text-sm text-gray-500">AI-generated insights and planning guidance</p>
        </div>
        <AIGenerateButton
          onClick={handleGenerate}
          loading={aiGenerating}
          label={brief ? "Regenerate Brief" : "Generate Brief"}
        />
      </div>

      {aiGenerating && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm text-gray-400">Analyzing your project and generating insights…</p>
        </div>
      )}

      {!brief && !aiGenerating && (
        <div className="text-center py-16 bg-[#111127] border border-white/8 rounded-2xl">
          <Zap className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-white mb-2">No AI Brief Yet</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Generate an AI brief to get an executive summary, risk analysis, critical path, and personalized action plan for your event.
          </p>
          <AIGenerateButton onClick={handleGenerate} loading={aiGenerating} label="Generate Brief" />
        </div>
      )}

      {brief && !aiGenerating && (
        <div className="space-y-5">
          {/* Health gauge */}
          <div className="bg-[#111127] border border-white/8 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <HealthGauge score={health} />
            <div className="flex-1">
              {brief.executiveSummary && (
                <p className="text-sm text-gray-200 leading-relaxed">{brief.executiveSummary}</p>
              )}
              {brief.eventReadiness && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${brief.eventReadiness}%` }} />
                  </div>
                  <span className="text-xs font-bold text-indigo-400 shrink-0">{brief.eventReadiness}% ready</span>
                </div>
              )}
            </div>
          </div>

          {/* Risks */}
          {brief.risks?.length > 0 && (
            <Section icon={AlertTriangle} title="Risk Analysis" color="text-amber-400">
              <div className="space-y-3">
                {brief.risks.map((r, i) => <RiskCard key={i} risk={r} i={i} />)}
              </div>
            </Section>
          )}

          {/* Critical path */}
          {brief.criticalPath?.length > 0 && (
            <Section icon={Activity} title="Critical Path">
              <ol className="space-y-2">
                {brief.criticalPath.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm text-white font-medium">{typeof item === "string" ? item : item.task}</p>
                      {item.deadline && <p className="text-xs text-gray-500 mt-0.5">{item.deadline}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* Next actions */}
          {brief.nextActions?.length > 0 && (
            <Section icon={CheckCircle} title="Immediate Actions" color="text-emerald-400">
              <div className="space-y-2">
                {brief.nextActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-emerald-400 shrink-0">→</span>
                    <p className="text-sm text-gray-200">{action}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Weekly plan */}
          {brief.weeklyPlan?.length > 0 && (
            <Section icon={Calendar} title="Weekly Plan" color="text-violet-400">
              <div className="space-y-4">
                {brief.weeklyPlan.map((week, i) => (
                  <div key={i}>
                    <p className="text-xs font-bold text-violet-400 mb-2">{week.week || `Week ${i + 1}`}</p>
                    {Array.isArray(week.tasks) ? (
                      <ul className="space-y-1.5">
                        {week.tasks.map((t, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                            <span className="text-violet-500 shrink-0">·</span>
                            {t}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-300">{week.focus || week}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Budget forecast */}
          {brief.budgetForecast && (
            <Section icon={TrendingUp} title="Budget Forecast" color="text-emerald-400">
              <p className="text-sm text-gray-200 leading-relaxed">{brief.budgetForecast}</p>
            </Section>
          )}
        </div>
      )}

      {/* Standalone risk analysis */}
      {!brief && (
        <div className="bg-[#111127] border border-white/8 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-bold text-white">Quick Risk Analysis</p>
            </div>
            <button
              onClick={handleRiskAnalysis}
              disabled={loadingRisk}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs font-semibold transition-colors disabled:opacity-60"
            >
              {loadingRisk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              Analyze Risks
            </button>
          </div>
          {riskData?.risks?.map((r, i) => <RiskCard key={i} risk={r} i={i} />) || (
            <p className="text-xs text-gray-500">Run a quick risk analysis without generating the full brief.</p>
          )}
        </div>
      )}
    </div>
  );
}
