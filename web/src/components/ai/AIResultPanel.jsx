"use client";
import { useEffect } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";

export default function AIResultPanel({ open, onClose, title, result, onApply, applyLabel = "Apply", loading, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 md:bg-transparent md:pointer-events-none" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 md:bottom-auto md:top-0 md:right-0 md:left-auto md:w-[420px] md:h-screen flex flex-col bg-[#111127] border-t md:border-t-0 md:border-l border-white/10 shadow-2xl transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/8">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm text-gray-400 animate-pulse">AI is generating…</p>
            </div>
          ) : (
            children || (
              result && (
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-white/4 rounded-xl p-4 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )
            )
          )}
        </div>

        {/* Footer */}
        {!loading && result && (
          <div className="shrink-0 flex gap-3 px-5 py-4 border-t border-white/8">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-colors"
            >
              Dismiss
            </button>
            {onApply && (
              <button
                onClick={() => onApply(result)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
              >
                {applyLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
