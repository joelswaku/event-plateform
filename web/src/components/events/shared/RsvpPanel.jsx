"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, X, ChevronRight, ChevronLeft, Heart, HelpCircle, XCircle, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function Field({ label, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a8c7e" }}>
        {label}{required && <span style={{ color: "#c9a96e", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = {
  width: "100%",
  padding: "11px 14px",
  fontSize: 14,
  borderRadius: 10,
  border: "1px solid #e8e0d5",
  background: "#faf8f5",
  color: "#2c2519",
  outline: "none",
  boxSizing: "border-box",
};

export default function RsvpPanel({ token }) {
  // ── invitation data ───────────────────────────────────────────────────
  const [inv, setInv]         = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState("");

  // ── modal state ───────────────────────────────────────────────────────
  const [open, setOpen]   = useState(false);
  const [step, setStep]   = useState(1); // 1 = contact info, 2 = decision

  // ── form fields ───────────────────────────────────────────────────────
  const [guestName, setGuestName] = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [plusOnes, setPlusOnes]   = useState(0);

  // ── submission ────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [pendingStatus, setPending] = useState(null);
  const [submitted, setSubmitted]   = useState(false);
  const [finalStatus, setFinal]     = useState(null);
  const [submitErr, setSubmitErr]   = useState("");

  // Listen for hero CTA button
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("open-rsvp-panel", h);
    return () => window.removeEventListener("open-rsvp-panel", h);
  }, []);

  // Lock scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Fetch invitation on mount so data is ready when modal opens
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setLoadErr("");
    fetch(`${API}/public/invitations/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) { setLoadErr(json.message || "Invitation not found."); return; }
        const d = json.data;
        setInv(d);
        setGuestName(d.guest?.full_name ?? "");
        setEmail(d.guest?.email ?? "");
        setPhone(d.guest?.phone ?? "");
        if (d.existing_rsvp) {
          setFinal(d.existing_rsvp.rsvp_status);
          setPlusOnes(d.existing_rsvp.plus_one_count ?? 0);
          setSubmitted(true);
        } else {
          setPlusOnes(d.guest?.plus_one_count ?? 0);
        }
      })
      .catch(() => setLoadErr("Could not load invitation. Please try again."))
      .finally(() => setLoading(false));
  }, [token]);

  const close = useCallback(() => {
    setOpen(false);
    setSubmitErr("");
  }, []);

  const submit = useCallback(async (status) => {
    if (submitting) return;
    setSubmitErr("");
    setPending(status);
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/public/invitations/${token}/rsvp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rsvp_status:    status,
          plus_one_count: inv?.guest?.plus_one_allowed ? plusOnes : 0,
          guest_name:     guestName.trim() || null,
          email:          email.trim() || null,
          phone:          phone.trim() || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFinal(status);
        setSubmitted(true);
        setStep(1);
      } else {
        setSubmitErr(json.message || "Could not submit. Please try again.");
        setPending(null);
      }
    } catch {
      setSubmitErr("Network error. Please try again.");
      setPending(null);
    } finally {
      setSubmitting(false);
      setPending(null);
    }
  }, [submitting, token, inv, plusOnes, guestName, email, phone]);

  // Don't render anything without a token
  if (!token) return null;

  const guest        = inv?.guest;
  const event        = inv?.event;
  const maxPlusOnes  = guest?.plus_one_count ?? 0;
  const plusOneAllow = guest?.plus_one_allowed && maxPlusOnes > 0;
  const stepOneValid = guestName.trim().length > 0;

  // ── Confirmation copy ─────────────────────────────────────────────────
  const confMap = {
    GOING:    { emoji: "🎊", headline: "We'll see you there!", sub: "Your RSVP is confirmed. We look forward to celebrating with you." },
    DECLINED: { emoji: "💌", headline: "Sorry you can't make it", sub: "Your response has been recorded. The organiser appreciates you letting them know." },
    MAYBE:    { emoji: "🌸", headline: "We hope you can join us!", sub: "Your response has been noted. Feel free to update anytime before the event." },
  };
  const conf = confMap[finalStatus] ?? confMap.GOING;

  return (
    <>
      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {open && (
        <div
          onClick={submitted ? close : undefined}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(20,16,10,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              maxHeight: "90dvh",
              overflowY: "auto",
              background: "#fffdf9",
              borderRadius: 20,
              boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(201,169,110,0.15)",
            }}
          >
            {/* Close — always visible */}
            <button
              onClick={close}
              style={{
                position: "absolute", top: 14, right: 14, zIndex: 10,
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(0,0,0,0.06)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#78716c",
              }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ornamental header */}
            <div style={{ padding: "32px 32px 24px", textAlign: "center", borderBottom: "1px solid #f0e8d8" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 8 }}>
                {submitted ? "Your Response" : "You're Invited"}
              </p>
              <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(1.3rem,4vw,1.75rem)", fontWeight: 700, fontStyle: "italic", color: "#1c1917", lineHeight: 1.2, margin: 0 }}>
                {event?.title ?? ""}
              </h2>
              {event?.start_at && (
                <p style={{ fontSize: 12, color: "#9a8c7e", marginTop: 8 }}>{fmt(event.start_at)}</p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px auto 0", width: 120 }}>
                <div style={{ flex: 1, height: 1, background: "#e8d9c0" }} />
                <div style={{ width: 6, height: 6, background: "#c9a96e", borderRadius: 1, transform: "rotate(45deg)" }} />
                <div style={{ flex: 1, height: 1, background: "#e8d9c0" }} />
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 32px 28px" }}>

              {/* Loading */}
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0" }}>
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#c9a96e" }} />
                  <p style={{ fontSize: 13, color: "#9a8c7e" }}>Loading your invitation…</p>
                </div>
              )}

              {/* Error */}
              {!loading && loadErr && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "24px 0", textAlign: "center" }}>
                  <AlertCircle className="w-8 h-8" style={{ color: "#ef4444" }} />
                  <p style={{ fontSize: 13, color: "#78716c" }}>{loadErr}</p>
                  <button
                    onClick={() => {
                      setLoadErr("");
                      setLoading(true);
                      fetch(`${API}/public/invitations/${token}`)
                        .then((r) => r.json())
                        .then((json) => {
                          if (!json.success) { setLoadErr(json.message || "Invitation not found."); return; }
                          const d = json.data;
                          setInv(d);
                          setGuestName(d.guest?.full_name ?? "");
                          setEmail(d.guest?.email ?? "");
                          setPhone(d.guest?.phone ?? "");
                          if (d.existing_rsvp) {
                            setFinal(d.existing_rsvp.rsvp_status);
                            setPlusOnes(d.existing_rsvp.plus_one_count ?? 0);
                            setSubmitted(true);
                          } else {
                            setPlusOnes(d.guest?.plus_one_count ?? 0);
                          }
                        })
                        .catch(() => setLoadErr("Could not load invitation. Please try again."))
                        .finally(() => setLoading(false));
                    }}
                    style={{ fontSize: 12, color: "#c9a96e", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Confirmation */}
              {!loading && !loadErr && submitted && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{conf.emoji}</div>
                  <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", fontStyle: "italic", color: "#1c1917", marginBottom: 8 }}>
                    {conf.headline}
                  </h3>
                  <p style={{ fontSize: 13, color: "#78716c", lineHeight: 1.65, marginBottom: 24 }}>{conf.sub}</p>

                  {finalStatus === "GOING" && plusOneAllow && plusOnes > 0 && (
                    <div style={{ background: "#fdf8f0", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#78716c" }}>
                      🥂 You&apos;re bringing <strong style={{ color: "#1c1917" }}>{plusOnes} companion{plusOnes > 1 ? "s" : ""}</strong>
                    </div>
                  )}

                  {event?.location_name && (
                    <p style={{ fontSize: 12, color: "#9a8c7e", marginBottom: 20 }}>📍 {event.location_name}</p>
                  )}

                  <button
                    onClick={() => { setSubmitted(false); setStep(1); setSubmitErr(""); }}
                    style={{ fontSize: 12, color: "#c9a96e", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
                  >
                    Change my response
                  </button>
                </div>
              )}

              {/* Step 1 — contact info */}
              {!loading && !loadErr && !submitted && step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <p style={{ fontSize: 13, color: "#78716c", margin: 0 }}>
                    Please confirm your details below.
                  </p>

                  <Field label="Full Name" required>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Your full name"
                      style={inputCls}
                      onFocus={(e) => { e.target.style.borderColor = "#c9a96e"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "#e8e0d5"; }}
                    />
                  </Field>

                  <Field label="Email Address">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={inputCls}
                      onFocus={(e) => { e.target.style.borderColor = "#c9a96e"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "#e8e0d5"; }}
                    />
                  </Field>

                  <Field label="Phone Number">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      style={inputCls}
                      onFocus={(e) => { e.target.style.borderColor = "#c9a96e"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "#e8e0d5"; }}
                    />
                  </Field>

                  {plusOneAllow && (
                    <Field label={`Companions (up to ${maxPlusOnes})`}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button
                          type="button"
                          onClick={() => setPlusOnes((n) => Math.max(0, n - 1))}
                          style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #e8e0d5", background: "#faf8f5", color: "#78716c", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >−</button>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          <span style={{ fontSize: 22, fontWeight: 700, color: "#1c1917" }}>{plusOnes}</span>
                          <p style={{ fontSize: 10, color: "#9a8c7e", margin: 0 }}>{plusOnes === 0 ? "Just me" : plusOnes === 1 ? "guest" : "guests"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPlusOnes((n) => Math.min(maxPlusOnes, n + 1))}
                          style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #e8e0d5", background: "#faf8f5", color: "#78716c", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >+</button>
                      </div>
                    </Field>
                  )}

                  <button
                    type="button"
                    disabled={!stepOneValid}
                    onClick={() => setStep(2)}
                    style={{
                      width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
                      background: stepOneValid ? "#1c1917" : "#e8e0d5",
                      color: stepOneValid ? "#fff" : "#9a8c7e",
                      fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                      cursor: stepOneValid ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 2 — decision */}
              {!loading && !loadErr && !submitted && step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setSubmitErr(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9a8c7e", fontSize: 12, display: "flex", alignItems: "center", gap: 4, padding: 0, marginBottom: 4 }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>

                  <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, fontWeight: 600, color: "#1c1917", margin: 0 }}>
                    Will you join the celebration?
                  </p>

                  {/* Guest summary */}
                  <div style={{ background: "#f5f0eb", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#78716c" }}>
                    <strong style={{ color: "#1c1917" }}>{guestName}</strong>
                    {plusOneAllow && plusOnes > 0 && <span> + {plusOnes} companion{plusOnes > 1 ? "s" : ""}</span>}
                    {email && <span> · {email}</span>}
                  </div>

                  {/* Accept */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => submit("GOING")}
                    style={{
                      width: "100%", padding: "14px 20px", borderRadius: 12, border: "none",
                      background: "#c9a96e", color: "#fff",
                      fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting && pendingStatus !== "GOING" ? 0.5 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {submitting && pendingStatus === "GOING"
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Heart className="w-4 h-4" />}
                    Joyfully Accept
                  </button>

                  {/* Decline */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => submit("DECLINED")}
                    style={{
                      width: "100%", padding: "14px 20px", borderRadius: 12,
                      border: "1px solid #e8e0d5", background: "#f5f0eb", color: "#78716c",
                      fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting && pendingStatus !== "DECLINED" ? 0.5 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {submitting && pendingStatus === "DECLINED"
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <XCircle className="w-4 h-4" />}
                    Regretfully Decline
                  </button>

                  {/* Maybe */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => submit("MAYBE")}
                    style={{
                      width: "100%", padding: "12px 20px", borderRadius: 12,
                      border: "1px solid #f0e8d5", background: "#fdf8f0", color: "#c9a96e",
                      fontSize: 13, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting && pendingStatus !== "MAYBE" ? 0.5 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {submitting && pendingStatus === "MAYBE"
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <HelpCircle className="w-4 h-4" />}
                    Kindly Check Back
                  </button>

                  {submitErr && (
                    <p style={{ fontSize: 12, color: "#ef4444", textAlign: "center", margin: 0 }}>{submitErr}</p>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: "0 32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 10, color: "#c5b9aa", letterSpacing: "0.05em", margin: 0 }}>Powered by MeetCraft</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating RSVP button — always visible while modal is closed ─── */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9997,
            display: "flex", alignItems: "center", gap: 10,
            padding: "13px 20px",
            background: submitted ? "#1c1917" : "#c9a96e",
            borderRadius: 50,
            border: "none",
            cursor: "pointer",
            boxShadow: submitted
              ? "0 8px 32px rgba(0,0,0,0.25)"
              : "0 8px 32px rgba(201,169,110,0.5)",
            color: "#fff",
          }}
        >
          {submitted ? (
            <>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: finalStatus === "GOING" ? "#3ecf8e" : finalStatus === "DECLINED" ? "#8b8f9a" : "#c9a96e", flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>
                {finalStatus === "GOING" ? "Going ✓" : finalStatus === "DECLINED" ? "Declined" : "Maybe"}
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>· Change</span>
            </>
          ) : (
            <>
              <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }}>
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#fff", opacity: 0.55, animation: "rsvp-ping 1.4s cubic-bezier(0,0,0.2,1) infinite" }} />
                <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>RSVP Now</span>
            </>
          )}
        </button>
      )}

      <style>{`@keyframes rsvp-ping { 75%,100% { transform:scale(2.2); opacity:0; } }`}</style>
    </>
  );
}
