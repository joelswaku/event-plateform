"use client";

import { useState } from "react";
import { Mail, X, Lock } from "lucide-react";

export default function InviteOnlyRsvpBadge() {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9997,
        width: "calc(100% - 32px)",
        maxWidth: 480,
      }}
    >
      {expanded ? (
        /* Expanded panel */
        <div
          style={{
            background: "#fffdf9",
            borderRadius: 20,
            boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(201,169,110,0.2)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 20px 12px",
              borderBottom: "1px solid #f0e8d8",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#fdf5e8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Lock size={16} style={{ color: "#c9a96e" }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1c1917", margin: 0 }}>
                  RSVP by invitation only
                </p>
                <p style={{ fontSize: 11, color: "#9a8c7e", margin: 0 }}>
                  This event manages attendance privately
                </p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(false)}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(0,0,0,0.06)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#78716c",
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "#78716c", lineHeight: 1.6, margin: 0 }}>
              The organiser is managing RSVPs through personal email invitations. If you were invited,
              check your inbox for an email with your unique RSVP link.
            </p>

            <div
              style={{
                background: "#fdf8f0",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <Mail size={15} style={{ color: "#c9a96e", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#78716c", margin: 0, lineHeight: 1.55 }}>
                Look for an email from the organiser with the subject line containing{" "}
                <strong style={{ color: "#1c1917" }}>your invitation</strong>. The link in that email
                will let you RSVP directly.
              </p>
            </div>

            <button
              onClick={() => setDismissed(true)}
              style={{
                background: "none", border: "1px solid #e8e0d5",
                borderRadius: 10, padding: "10px 16px",
                fontSize: 12, fontWeight: 600, color: "#9a8c7e",
                cursor: "pointer",
              }}
            >
              Got it, dismiss
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed pill */
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 20px",
            background: "#1c1917",
            borderRadius: 50,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            color: "#fff",
            width: "auto",
            margin: "0 auto",
          }}
        >
          <Lock size={14} style={{ color: "#c9a96e", flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.03em", color: "#fff" }}>
            RSVP by invitation only
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 2 }}>
            · Learn more
          </span>
        </button>
      )}
    </div>
  );
}
