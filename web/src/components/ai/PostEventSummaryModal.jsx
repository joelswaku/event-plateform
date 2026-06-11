"use client";
import { useEffect } from "react";
import { X, Award, Share2, Printer, Copy, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

const GRADE_META = {
  A: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/40" },
  B: { bg: "bg-blue-500/20",    text: "text-blue-400",    border: "border-blue-500/40"    },
  C: { bg: "bg-amber-500/20",   text: "text-amber-400",   border: "border-amber-500/40"   },
  D: { bg: "bg-orange-500/20",  text: "text-orange-400",  border: "border-orange-500/40"  },
  F: { bg: "bg-red-500/20",     text: "text-red-400",     border: "border-red-500/40"     },
};

export default function PostEventSummaryModal({ open, onClose, data }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open || !data) return null;

  const grade = data.performanceGrade ?? "B";
  const gradeMeta = GRADE_META[grade] ?? GRADE_META.B;

  function copyCaption() {
    navigator.clipboard.writeText(data.socialCaption ?? "");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 overflow-y-auto py-8 px-4">
      <div className="bg-[#111127] rounded-3xl border border-white/8 w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Post-Event Summary</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/6 hover:bg-white/10 transition-colors">
              <Printer className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/8">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Grade */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl border-2 ${gradeMeta.border} ${gradeMeta.bg} flex items-center justify-center shrink-0`}>
              <span className={`text-3xl font-black ${gradeMeta.text}`}>{grade}</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{data.headline}</h3>
              <p className="text-gray-400 text-sm mt-0.5">{data.executiveSummary}</p>
            </div>
          </div>

          {/* Metrics */}
          {data.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(data.metrics).map(([key, value]) => (
                <div key={key} className="bg-white/4 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-lg">{value}</p>
                  <p className="text-gray-500 text-xs mt-0.5 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Highlights */}
          {data.highlights?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-white">Highlights</h4>
              </div>
              <ul className="space-y-1.5">
                {data.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-emerald-400 mt-1">•</span>{h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {data.improvements?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-semibold text-white">Areas to Improve</h4>
              </div>
              <ul className="space-y-1.5">
                {data.improvements.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-amber-400 mt-1">•</span>{h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Event */}
          {data.nextEventRecommendations?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-semibold text-white">For Your Next Event</h4>
              </div>
              <ul className="space-y-1.5">
                {data.nextEventRecommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-indigo-400 mt-1">•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Social caption */}
          {data.socialCaption && (
            <div className="bg-white/4 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <p className="text-sm font-semibold text-white">Social Caption</p>
                </div>
                <button onClick={copyCaption} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{data.socialCaption}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
