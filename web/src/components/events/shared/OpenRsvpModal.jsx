"use client";

import { useState } from "react";
import { X, Heart, HelpCircle, XCircle, Loader2, CheckCircle2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_OPTIONS = [
  { value: "GOING",    label: "Going",      icon: Heart,      color: "#22c55e" },
  { value: "MAYBE",    label: "Maybe",      icon: HelpCircle, color: "#f59e0b" },
  { value: "DECLINED", label: "Can't make it", icon: XCircle, color: "#ef4444" },
];

export default function OpenRsvpModal({ eventId }) {
  const [open, setOpen]     = useState(false);
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [phone, setPhone]   = useState("");
  const [status, setStatus] = useState("GOING");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]   = useState("");
  const [done, setDone]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/public/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_name: name, email, phone: phone || undefined, rsvp_status: status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to submit RSVP");
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating RSVP button */}
      <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 50 }}>
        <button
          onClick={() => { setOpen(true); setDone(false); setError(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 32px", borderRadius: 100,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff", fontWeight: 700, fontSize: 15,
            border: "none", cursor: "pointer",
            boxShadow: "0 8px 30px rgba(99,102,241,0.4)",
          }}
        >
          <Heart size={18} /> RSVP for this event
        </button>
      </div>

      {/* Modal backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: "28px 28px 0 0",
              width: "100%", maxWidth: 520,
              padding: "32px 28px 40px",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.15)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e1b4b" }}>RSVP to this event</h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "#f3f4f6", border: "none", borderRadius: 10, padding: "6px 8px", cursor: "pointer" }}
              >
                <X size={18} color="#6b7280" />
              </button>
            </div>

            {done ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <CheckCircle2 size={56} color="#22c55e" style={{ margin: "0 auto 16px" }} />
                <p style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>You&apos;re registered!</p>
                <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>
                  {status === "GOING" ? "We'll see you there 🎉" : "Thanks for letting us know."}
                </p>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    marginTop: 24, padding: "12px 32px", borderRadius: 14,
                    background: "#6366f1", color: "#fff", border: "none",
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* RSVP status choice */}
                <div style={{ display: "flex", gap: 10 }}>
                  {STATUS_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const active = status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        style={{
                          flex: 1, display: "flex", flexDirection: "column",
                          alignItems: "center", gap: 6, padding: "12px 6px",
                          borderRadius: 16, border: `2px solid ${active ? opt.color : "#e5e7eb"}`,
                          background: active ? `${opt.color}15` : "#fff",
                          cursor: "pointer", transition: "all 0.2s",
                        }}
                      >
                        <Icon size={20} color={active ? opt.color : "#9ca3af"} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: active ? opt.color : "#9ca3af" }}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Name */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", display: "block", marginBottom: 6 }}>
                    Your Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    style={{ width: "100%", padding: "11px 14px", fontSize: 14, borderRadius: 12, border: "1px solid #e5e7eb", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", display: "block", marginBottom: 6 }}>
                    Email <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{ width: "100%", padding: "11px 14px", fontSize: 14, borderRadius: 12, border: "1px solid #e5e7eb", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Phone (optional) */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", display: "block", marginBottom: 6 }}>
                    Phone <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    style={{ width: "100%", padding: "11px 14px", fontSize: 14, borderRadius: 12, border: "1px solid #e5e7eb", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, padding: "10px 14px", background: "#fef2f2", borderRadius: 10 }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "14px", borderRadius: 16,
                    background: submitting ? "#c7d2fe" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    color: "#fff", border: "none", fontWeight: 700, fontSize: 15,
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : "Confirm RSVP"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
