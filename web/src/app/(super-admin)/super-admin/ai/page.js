"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSuperAdminStore } from "@/store/superAdmin.store";

const TYPE_COLORS = {
  opportunity: { bg: "rgba(201,169,110,0.15)", text: "#c9a96e" },
  warning:     { bg: "rgba(239,68,68,0.15)",  text: "#ef4444" },
  insight:     { bg: "rgba(99,102,241,0.15)", text: "#6366f1" },
  growth:      { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
  alert:       { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
};

const PRIORITY_DOTS = {
  high:   "#ef4444",
  medium: "#f59e0b",
  low:    "#10b981",
};

export default function AiInsightsPage() {
  const { aiInsights, fetchAiInsights, loading } = useSuperAdminStore();
  const [rawOpen, setRawOpen] = useState(false);

  useEffect(() => { fetchAiInsights(); }, []);

  const insights = aiInsights?.insights ?? [];
  const aiPowered = aiInsights?.ai_powered ?? false;
  const raw = aiInsights?.raw ?? "";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p style={{ color: "rgba(201,169,110,0.60)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Super Admin
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
            AI Insights
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1"
            style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
              background: aiPowered ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.07)",
              color: aiPowered ? "#6366f1" : "rgba(255,255,255,0.40)",
              border: `1px solid ${aiPowered ? "rgba(99,102,241,0.30)" : "rgba(255,255,255,0.10)"}`,
            }}
          >
            {aiPowered ? "AI POWERED" : "RULE-BASED"}
          </span>
          <button
            onClick={() => fetchAiInsights()}
            disabled={loading}
            style={{
              padding: "7px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: "rgba(201,169,110,0.12)", color: "#c9a96e",
              border: "1px solid rgba(201,169,110,0.25)", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Generating…" : "Regenerate"}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && !insights.length ? (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 animate-pulse"
              style={{ background: "rgba(255,255,255,0.05)", height: 130 }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 mb-6">
          {insights.map((ins, i) => {
            const typeStyle = TYPE_COLORS[ins.type] ?? TYPE_COLORS.insight;
            const dotColor = PRIORITY_DOTS[ins.priority] ?? "#fff";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-6"
                style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="rounded-full px-2.5 py-0.5"
                        style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", background: typeStyle.bg, color: typeStyle.text }}
                      >
                        {(ins.type ?? "").toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: dotColor }} />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {ins.priority} priority
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: "-0.02em" }}>
                      {ins.title}
                    </p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                      {ins.description}
                    </p>
                  </div>
                  <div
                    className="shrink-0 rounded-xl px-4 py-3 text-center"
                    style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.15)", minWidth: 110 }}
                  >
                    <p style={{ fontSize: 16, fontWeight: 900, color: "#c9a96e", letterSpacing: "-0.02em" }}>
                      {ins.metric}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.30)", marginTop: 2 }}>key metric</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Raw Data */}
      {raw && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl"
          style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            className="flex items-center justify-between w-full px-6 py-4"
            onClick={() => setRawOpen(o => !o)}
            style={{ cursor: "pointer", background: "none", border: "none" }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.40)" }}>
              Raw Platform Data
            </p>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", transform: rawOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
          </button>
          {rawOpen && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px" }}>
              <code style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {raw}
              </code>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
