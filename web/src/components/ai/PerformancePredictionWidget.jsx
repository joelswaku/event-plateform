"use client";
import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw, Loader2, AlertTriangle, CheckCircle2, TrendingDown, Zap } from "lucide-react";
import { useAIStore } from "@/store/ai.store";

const STATUS_META = {
  on_track: { label: "On Track", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", Icon: CheckCircle2 },
  ahead:    { label: "Ahead",    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", Icon: TrendingUp },
  behind:   { label: "Behind",   color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   Icon: TrendingDown },
  at_risk:  { label: "At Risk",  color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     Icon: AlertTriangle },
};

export default function PerformancePredictionWidget({ eventId, publishedAt }) {
  const [data, setData] = useState(null);
  const { getPerformancePrediction, loading } = useAIStore();

  async function fetch() {
    const res = await getPerformancePrediction(eventId);
    if (res.success) setData(res.data);
  }

  useEffect(() => {
    if (!publishedAt) return;
    const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / 36e5;
    if (hoursAgo >= 48) fetch();
  }, [eventId, publishedAt]);

  const status = data?.status ?? "on_track";
  const meta = STATUS_META[status] ?? STATUS_META.on_track;
  const Icon = meta.Icon;

  return (
    <div className="bg-[#111127] rounded-2xl border border-white/8 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Performance Prediction</h3>
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {!data && !loading && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm mb-3">Get AI-powered performance predictions</p>
          <button
            onClick={fetch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-sm font-semibold hover:bg-indigo-600/30 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" /> Analyze Now
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${meta.bg} ${meta.border}`}>
            <Icon className={`w-4 h-4 ${meta.color}`} />
            <div>
              <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
              <p className="text-xs text-gray-400">{data.predictionStatement}</p>
            </div>
          </div>

          {data.sellThroughRange && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Sell-through</span>
                <span>{data.sellThroughRange.mid}</span>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: data.sellThroughRange.mid?.replace("%", "") + "%" || "0%" }}
                />
              </div>
            </div>
          )}

          {data.immediateActions?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Actions</p>
              {data.immediateActions.slice(0, 3).map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    a.urgency === "high" ? "bg-red-500/20 text-red-400" :
                    a.urgency === "medium" ? "bg-amber-500/20 text-amber-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>{a.urgency}</span>
                  <p className="text-xs text-gray-300">{a.action}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
