"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useSuperAdminStore } from "@/store/superAdmin.store";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 12, padding: 2,
        background: enabled ? "#c9a96e" : "rgba(255,255,255,0.12)",
        border: "none", cursor: "pointer", transition: "background 0.2s",
        display: "flex", alignItems: "center",
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 10, background: "#fff",
        transform: enabled ? "translateX(20px)" : "translateX(0)",
        transition: "transform 0.2s",
      }} />
    </button>
  );
}

export default function FlagsPage() {
  const { flags, fetchFlags, updateFlag, loading } = useSuperAdminStore();

  useEffect(() => { fetchFlags(); }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p style={{ color: "rgba(201,169,110,0.60)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Super Admin
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
          Feature Flags
        </h1>
      </div>

      {loading && !flags.length ? (
        <div className="grid grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="h-3 w-56 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
                  <div className="h-3 w-44 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
                  <div className="h-5 w-20 rounded-full mt-2" style={{ background: "rgba(255,255,255,0.05)" }} />
                </div>
                <div className="h-6 w-11 rounded-full ml-4" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {flags.map((flag, i) => (
            <motion.div
              key={flag.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-6"
              style={{
                background: "#0d0d1a",
                border: flag.enabled
                  ? "1px solid rgba(201,169,110,0.35)"
                  : "1px solid rgba(255,255,255,0.08)",
                boxShadow: flag.enabled ? "0 0 20px rgba(201,169,110,0.06)" : "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{flag.name}</p>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                        background: flag.enabled ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.06)",
                        color: flag.enabled ? "#c9a96e" : "rgba(255,255,255,0.30)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {flag.enabled ? "ON" : "OFF"}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, marginBottom: 12 }}>
                    {flag.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4 }}>
                      {flag.key}
                    </span>
                    {flag.updated_by && (
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                        by {flag.updated_by} · {timeAgo(flag.updated_at)}
                      </span>
                    )}
                  </div>
                </div>
                <Toggle enabled={flag.enabled} onChange={() => updateFlag(flag.key, !flag.enabled)} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
