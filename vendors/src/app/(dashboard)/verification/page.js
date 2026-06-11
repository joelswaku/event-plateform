"use client";
import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Shield, Upload, CheckCircle, Clock, ChevronRight, AlertCircle, Zap } from "lucide-react";
import { useVendorStore } from "@/store/vendor.store";
import useT from "@/hooks/useT";

const TIERS = [
  {
    name: "Bronze",
    color: "#cd7f32",
    requirement: "Complete your profile",
    description: "Basic verified listing on the marketplace.",
    steps: ["Create your account", "Add business name", "Add a profile photo"],
    auto: true,
  },
  {
    name: "Silver",
    color: "#c0c0c0",
    requirement: "Submit business documents",
    description: "Business identity confirmed. Priority ranking in search.",
    steps: ["Upload government-issued ID", "Submit business registration", "Provide a valid phone number"],
  },
  {
    name: "Gold",
    color: "#f59e0b",
    requirement: "Track record of 10+ bookings",
    description: "Top-performing vendor. Featured placement & analytics.",
    steps: ["Achieve 10 completed bookings", "Maintain a 4.5+ average rating", "Complete Silver verification"],
  },
  {
    name: "Platinum",
    color: "#a78bfa",
    requirement: "Invitation only",
    description: "Elite verified partner. Homepage featured & white-glove support.",
    steps: ["Achieve 50 completed bookings", "Maintain a 4.8+ average rating", "Approved by EventApp team"],
  },
];

export default function VerificationPage() {
  const T = useT();
  const { vendor } = useVendorStore();
  const currentTier = vendor?.verification_tier || 0;
  const [applyTier, setApplyTier] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setUploading(false);
    setApplied(true);
  };

  return (
    <div style={{ padding: "32px", maxWidth: "880px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={17} color="#818cf8" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", color: T.text }}>Verification Status</h1>
        </div>
        <p style={{ fontSize: "14px", color: T.textFaint, fontWeight: 400, marginTop: "4px" }}>
          Verified vendors receive 3× more inquiries. Upgrade your tier to unlock more bookings.
        </p>
      </div>

      {/* Current status banner */}
      <div style={{ ...T.glass, padding: "24px 28px", marginBottom: "28px", border: `1px solid ${TIERS[currentTier].color}30`, background: `${TIERS[currentTier].color}06`, borderRadius: T.glass.borderRadius }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${TIERS[currentTier].color}14`, border: `1px solid ${TIERS[currentTier].color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BadgeCheck size={22} color={TIERS[currentTier].color} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "3px" }}>Current Tier</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: TIERS[currentTier].color, letterSpacing: "-0.015em" }}>{TIERS[currentTier].name} Vendor</div>
              <div style={{ fontSize: "12px", color: T.textFaint, marginTop: "2px" }}>{TIERS[currentTier].description}</div>
            </div>
          </div>
          {currentTier < 3 && (
            <button onClick={() => setApplyTier(currentTier + 1)}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", borderRadius: "10px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", fontWeight: 600, fontSize: "13px", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              <Zap size={13} /> Upgrade to {TIERS[currentTier + 1].name}
            </button>
          )}
        </div>
      </div>

      {/* Apply modal */}
      {applyTier !== null && (
        <div style={{ ...T.glass, padding: "28px", marginBottom: "28px", border: `1px solid ${TIERS[applyTier].color}30`, borderRadius: T.glass.borderRadius }}>
          {applied ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CheckCircle size={22} color="#4ade80" />
              </div>
              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.015em", marginBottom: "8px", color: T.text }}>Application Submitted</div>
              <div style={{ fontSize: "14px", color: T.textFaint, lineHeight: 1.6 }}>
                We&apos;ll review your documents and respond within 2–3 business days.
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <BadgeCheck size={18} color={TIERS[applyTier].color} />
                <div style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em", color: T.text }}>Apply for {TIERS[applyTier].name} Verification</div>
              </div>
              <p style={{ fontSize: "13px", color: T.textFaint, lineHeight: 1.7, marginBottom: "20px" }}>
                {TIERS[applyTier].description} To qualify, you need to complete the following:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                {TIERS[applyTier].steps.map((step) => (
                  <div key={step} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: T.textSub }}>
                    <CheckCircle size={13} color={TIERS[applyTier].color} /> {step}
                  </div>
                ))}
              </div>
              {!TIERS[applyTier].auto && (
                <div style={{ ...T.glass, padding: "16px", marginBottom: "20px", border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.04)", borderRadius: "12px", display: "flex", gap: "10px" }}>
                  <AlertCircle size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <div style={{ fontSize: "12px", color: T.textFaint, lineHeight: 1.6 }}>
                    Please have your business documents ready before submitting. Incomplete applications may be delayed.
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleApply} disabled={uploading}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", borderRadius: "10px", background: `linear-gradient(135deg, ${TIERS[applyTier].color}cc, ${TIERS[applyTier].color}90)`, color: "#fff", fontWeight: 600, fontSize: "13px", border: "none", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1, fontFamily: "inherit" }}>
                  <Upload size={13} /> {uploading ? "Submitting…" : "Submit Application"}
                </button>
                <button onClick={() => setApplyTier(null)}
                  style={{ padding: "11px 20px", borderRadius: "10px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textSub, fontWeight: 500, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* All tiers */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {TIERS.map((tier, i) => {
          const isCompleted = i < currentTier;
          const isCurrent = i === currentTier;
          return (
            <div key={tier.name} style={{ ...T.glass, padding: "20px 24px", border: isCurrent ? `1px solid ${tier.color}35` : `1px solid ${T.glassBorder}`, background: isCurrent ? `${tier.color}06` : T.cardBg, borderRadius: T.glass.borderRadius, opacity: i > currentTier + 1 ? 0.5 : 1, display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: `${tier.color}12`, border: `1px solid ${tier.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {isCompleted ? <CheckCircle size={18} color={tier.color} /> : isCurrent ? <BadgeCheck size={18} color={tier.color} /> : <Clock size={18} color={T.textFaint} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: isCurrent || isCompleted ? tier.color : T.textMuted, letterSpacing: "-0.01em" }}>{tier.name}</span>
                  {isCurrent && <span style={{ fontSize: "10px", fontWeight: 600, color: tier.color, border: `1px solid ${tier.color}40`, padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current</span>}
                  {isCompleted && <span style={{ fontSize: "10px", fontWeight: 600, color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Completed</span>}
                </div>
                <div style={{ fontSize: "12px", color: T.textFaint }}>{tier.requirement}</div>
              </div>
              {i === currentTier + 1 && (
                <button onClick={() => setApplyTier(i)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "9px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textSub, fontWeight: 500, fontSize: "12px", cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
                  Apply <ChevronRight size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
