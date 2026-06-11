"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2, X, ChevronRight, ChevronLeft,
  Heart, HelpCircle, XCircle, AlertCircle,
  MapPin, Calendar, Check, Users,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

const STATUS_CFG = {
  GOING:    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Attending",  emoji: "🎊" },
  DECLINED: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Declined",   emoji: "💌" },
  MAYBE:    { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Tentative",  emoji: "🌸" },
};

/* ── Sub-components ──────────────────────────────────────────────── */

function FieldGroup({ label, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.09em",
        textTransform: "uppercase", color: "#9a8c7e",
      }}>
        {label}
        {required && <span style={{ color: "#c9a96e", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function StyledInput(props) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
      style={{
        width: "100%", padding: "12px 16px",
        fontSize: 14, borderRadius: 12,
        border: `1.5px solid ${focused ? "#c9a96e" : "#e8e0d5"}`,
        background: focused ? "#fff" : "#faf8f5",
        color: "#2c2519", outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.15s, background 0.15s",
      }}
    />
  );
}

/* ── Main component ──────────────────────────────────────────────── */

export default function RsvpPanel({ token }) {
  /* Data */
  const [inv,      setInv]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [loadErr,  setLoadErr]  = useState("");

  /* UI */
  const [open,  setOpen]  = useState(true); // auto-open on arrival from email
  const [step,  setStep]  = useState(1);

  /* Form */
  const [guestName, setGuestName] = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [plusOnes,  setPlusOnes]  = useState(0);

  /* Submission */
  const [submitting,   setSubmitting]   = useState(false);
  const [pendingStatus, setPending]     = useState(null);
  const [submitted,    setSubmitted]    = useState(false);
  const [finalStatus,  setFinal]        = useState(null);
  const [submitErr,    setSubmitErr]    = useState("");

  /* Listen for hero CTA trigger */
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("open-rsvp-panel", h);
    return () => window.removeEventListener("open-rsvp-panel", h);
  }, []);

  /* Lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* Fetch invitation */
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/public/invitations/${token}`)
      .then(r => r.json())
      .then(json => {
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

  const close = useCallback(() => { setOpen(false); setSubmitErr(""); }, []);

  const submit = useCallback(async (status) => {
    if (submitting) return;
    setSubmitErr("");
    setPending(status);
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/public/invitations/${token}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rsvp_status:    status,
          plus_one_count: inv?.guest?.plus_one_allowed ? plusOnes : 0,
          guest_name:     guestName.trim() || null,
          email:          email.trim()     || null,
          phone:          phone.trim()     || null,
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

  if (!token) return null;

  const guest       = inv?.guest;
  const event       = inv?.event;
  const maxPlusOnes = guest?.plus_one_count ?? 0;
  const plusOneAllow = guest?.plus_one_allowed && maxPlusOnes > 0;
  const stepOneValid = guestName.trim().length > 0;
  const cfg          = STATUS_CFG[finalStatus] ?? STATUS_CFG.GOING;

  return (
    <>
      <style>{`
        @keyframes rsvp-ping { 75%,100%{transform:scale(2.2);opacity:0;} }
        @keyframes rsvp-spin  { to{transform:rotate(360deg);} }
        @keyframes rsvp-fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .rsvp-spinner { animation: rsvp-spin 1s linear infinite; }
        .rsvp-section { animation: rsvp-fade-in 0.25s ease both; }
        .rsvp-btn-action:hover:not(:disabled) { filter: brightness(0.93); transform: translateY(-1px); }
        .rsvp-btn-action { transition: filter 0.15s, transform 0.15s, opacity 0.2s; }
      `}</style>

      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, zIndex: 9990,
          background: "rgba(15,12,8,0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.35s ease",
        }}
      />

      {/* ── Slide-in drawer ───────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          zIndex: 9991,
          width: "min(480px, 100vw)",
          background: "#fffdf9",
          boxShadow: "-12px 0 60px rgba(0,0,0,0.18), -1px 0 0 rgba(201,169,110,0.12)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.42s cubic-bezier(0.32,0.72,0,1)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Event cover header ──────────────────────────────────────────── */}
        <div style={{
          position: "relative", flexShrink: 0,
          minHeight: 200,
          background: event?.cover_image_url
            ? `url(${event.cover_image_url}) center/cover no-repeat`
            : "linear-gradient(135deg, #1c1917 0%, #2d2520 60%, #1a110a 100%)",
        }}>
          {/* gradient overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(170deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.72) 100%)",
          }} />

          {/* close button */}
          <button
            onClick={close}
            aria-label="Close"
            style={{
              position: "absolute", top: 16, right: 16, zIndex: 2,
              width: 38, height: 38, borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
            }}
          >
            <X size={16} />
          </button>

          {/* event info */}
          <div style={{ position: "relative", zIndex: 1, padding: "30px 28px 26px" }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.32em",
              textTransform: "uppercase", color: "#c9a96e", margin: "0 0 10px",
            }}>
              {submitted ? "Your Response" : "You're Invited"}
            </p>

            <h2 style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(1.15rem, 4vw, 1.55rem)",
              fontWeight: 700, fontStyle: "italic",
              color: "#fff", lineHeight: 1.25, margin: "0 0 14px",
            }}>
              {event?.title ?? ""}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {event?.start_at && (
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Calendar size={12} color="rgba(255,255,255,0.55)" />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{fmt(event.start_at)}</span>
                </div>
              )}
              {(event?.location_name || event?.venue_name) && (
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <MapPin size={12} color="rgba(255,255,255,0.55)" />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{event.location_name || event.venue_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Step progress bar ───────────────────────────────────────────── */}
        {!loading && !loadErr && !submitted && (
          <div style={{ display: "flex", flexShrink: 0 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                flex: 1, height: 3,
                background: step >= s ? "#c9a96e" : "#f0e8d8",
                transition: "background 0.35s",
              }} />
            ))}
          </div>
        )}

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 20px" }}>

          {/* Loading */}
          {loading && (
            <div className="rsvp-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "52px 0" }}>
              <Loader2 size={30} className="rsvp-spinner" style={{ color: "#c9a96e" }} />
              <p style={{ fontSize: 13, color: "#9a8c7e", margin: 0 }}>Loading your invitation…</p>
            </div>
          )}

          {/* Error */}
          {!loading && loadErr && (
            <div className="rsvp-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 0", textAlign: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertCircle size={26} color="#ef4444" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>Invitation not found</p>
                <p style={{ fontSize: 13, color: "#78716c", margin: 0, lineHeight: 1.65 }}>{loadErr}</p>
              </div>
            </div>
          )}

          {/* ── SUCCESS ─────────────────────────────────────────────────────── */}
          {!loading && !loadErr && submitted && (
            <div className="rsvp-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              {/* Status chip */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "7px 16px", borderRadius: 999,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                marginBottom: 22,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: cfg.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={11} color="#fff" strokeWidth={3} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
              </div>

              <div style={{ fontSize: 54, marginBottom: 16, lineHeight: 1 }}>{cfg.emoji}</div>

              <h3 style={{
                fontFamily: "Georgia, serif", fontStyle: "italic",
                fontSize: "1.3rem", fontWeight: 700, color: "#1c1917",
                margin: "0 0 10px", lineHeight: 1.3,
              }}>
                {finalStatus === "GOING"
                  ? "We'll see you there!"
                  : finalStatus === "DECLINED"
                  ? "Sorry you can't make it"
                  : "We hope you can join us!"}
              </h3>

              <p style={{ fontSize: 13, color: "#78716c", lineHeight: 1.75, margin: "0 0 28px", maxWidth: 340 }}>
                {finalStatus === "GOING"
                  ? "Your RSVP is confirmed. Your entry pass has been sent to your email — present it at the door."
                  : finalStatus === "DECLINED"
                  ? "Your response has been recorded. The organiser appreciates you letting them know."
                  : "Your tentative RSVP has been noted. Feel free to update anytime before the event."}
              </p>

              {/* Guest details card */}
              {finalStatus === "GOING" && (
                <div style={{
                  width: "100%", background: "#fdf8f0",
                  border: "1px solid #ede0c4", borderRadius: 16,
                  padding: "18px 20px", textAlign: "left", marginBottom: 20,
                }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "#9a8c7e", margin: "0 0 12px",
                  }}>
                    Confirmed for
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: "linear-gradient(135deg, #c9a96e, #b8944d)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0,
                    }}>
                      {guestName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1c1917", margin: 0 }}>{guestName}</p>
                      {email && <p style={{ fontSize: 12, color: "#78716c", margin: "2px 0 0" }}>{email}</p>}
                      {plusOneAllow && plusOnes > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                          <Users size={11} color="#9a8c7e" />
                          <p style={{ fontSize: 11, color: "#9a8c7e", margin: 0 }}>
                            +{plusOnes} companion{plusOnes > 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => { setSubmitted(false); setStep(1); setSubmitErr(""); }}
                style={{
                  fontSize: 12, color: "#9a8c7e",
                  background: "none", border: "1px solid #e8e0d5",
                  borderRadius: 10, padding: "9px 20px",
                  cursor: "pointer",
                }}
              >
                Change my response
              </button>
            </div>
          )}

          {/* ── STEP 1: Contact details ─────────────────────────────────────── */}
          {!loading && !loadErr && !submitted && step === 1 && (
            <div className="rsvp-section" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{
                  fontFamily: "Georgia, serif", fontStyle: "italic",
                  fontSize: "1.15rem", color: "#1c1917", margin: "0 0 6px",
                }}>
                  Confirm your details
                </h3>
                <p style={{ fontSize: 13, color: "#78716c", margin: 0, lineHeight: 1.65 }}>
                  Please review and update your information.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
                <FieldGroup label="Full Name" required>
                  <StyledInput
                    type="text"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="Your full name"
                  />
                </FieldGroup>

                <FieldGroup label="Email Address">
                  <StyledInput
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </FieldGroup>

                <FieldGroup label="Phone Number">
                  <StyledInput
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </FieldGroup>

                {plusOneAllow && (
                  <FieldGroup label={`Companions (max ${maxPlusOnes})`}>
                    <div style={{
                      display: "flex", alignItems: "center",
                      background: "#faf8f5", borderRadius: 12,
                      border: "1.5px solid #e8e0d5", overflow: "hidden",
                    }}>
                      <button
                        type="button"
                        onClick={() => setPlusOnes(n => Math.max(0, n - 1))}
                        style={{
                          width: 52, height: 52, border: "none",
                          background: "transparent", color: "#78716c",
                          fontSize: 24, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >−</button>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: "#1c1917" }}>{plusOnes}</span>
                        <p style={{ fontSize: 10, color: "#9a8c7e", margin: 0 }}>
                          {plusOnes === 0 ? "Just me" : plusOnes === 1 ? "guest" : "guests"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlusOnes(n => Math.min(maxPlusOnes, n + 1))}
                        style={{
                          width: 52, height: 52, border: "none",
                          background: "transparent", color: "#78716c",
                          fontSize: 24, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >+</button>
                    </div>
                  </FieldGroup>
                )}
              </div>

              <button
                type="button"
                className="rsvp-btn-action"
                disabled={!stepOneValid}
                onClick={() => setStep(2)}
                style={{
                  width: "100%", padding: "15px 24px",
                  borderRadius: 14, border: "none",
                  background: stepOneValid
                    ? "linear-gradient(135deg, #1c1917 0%, #2d2520 100%)"
                    : "#e8e0d5",
                  color: stepOneValid ? "#fff" : "#9a8c7e",
                  fontSize: 14, fontWeight: 700, letterSpacing: "0.03em",
                  cursor: stepOneValid ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                Continue <ChevronRight size={17} />
              </button>
            </div>
          )}

          {/* ── STEP 2: Decision ────────────────────────────────────────────── */}
          {!loading && !loadErr && !submitted && step === 2 && (
            <div className="rsvp-section" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <button
                type="button"
                onClick={() => { setStep(1); setSubmitErr(""); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#9a8c7e", fontSize: 12,
                  display: "flex", alignItems: "center", gap: 5,
                  padding: 0, marginBottom: 22,
                }}
              >
                <ChevronLeft size={14} /> Back to details
              </button>

              <div style={{ marginBottom: 22 }}>
                <h3 style={{
                  fontFamily: "Georgia, serif", fontStyle: "italic",
                  fontSize: "1.15rem", color: "#1c1917", margin: "0 0 6px",
                }}>
                  Will you be joining us?
                </h3>
                <p style={{ fontSize: 13, color: "#78716c", margin: 0 }}>
                  Select your attendance below.
                </p>
              </div>

              {/* Guest summary pill */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "#fdf8f0", border: "1px solid #ede0c4",
                borderRadius: 12, padding: "12px 16px", marginBottom: 24,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #c9a96e, #b8944d)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                }}>
                  {guestName.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", margin: 0 }}>{guestName}</p>
                  {plusOneAllow && plusOnes > 0 && (
                    <p style={{ fontSize: 11, color: "#9a8c7e", margin: "2px 0 0" }}>
                      + {plusOnes} companion{plusOnes > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Accept */}
                <button
                  type="button"
                  className="rsvp-btn-action"
                  disabled={submitting}
                  onClick={() => submit("GOING")}
                  style={{
                    width: "100%", padding: "16px 20px", borderRadius: 14, border: "none",
                    background: "linear-gradient(135deg, #c9a96e 0%, #b8944d 100%)",
                    color: "#fff", fontSize: 15, fontWeight: 700,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting && pendingStatus !== "GOING" ? 0.45 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: "0 4px 22px rgba(201,169,110,0.38)",
                  }}
                >
                  {submitting && pendingStatus === "GOING"
                    ? <Loader2 size={18} className="rsvp-spinner" />
                    : <Heart size={18} />}
                  Joyfully Accept
                </button>

                {/* Decline */}
                <button
                  type="button"
                  className="rsvp-btn-action"
                  disabled={submitting}
                  onClick={() => submit("DECLINED")}
                  style={{
                    width: "100%", padding: "14px 20px", borderRadius: 14,
                    border: "1px solid #e8e0d5", background: "#faf8f5",
                    color: "#57534e", fontSize: 14, fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting && pendingStatus !== "DECLINED" ? 0.45 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  }}
                >
                  {submitting && pendingStatus === "DECLINED"
                    ? <Loader2 size={16} className="rsvp-spinner" />
                    : <XCircle size={16} />}
                  Regretfully Decline
                </button>

                {/* Maybe */}
                <button
                  type="button"
                  className="rsvp-btn-action"
                  disabled={submitting}
                  onClick={() => submit("MAYBE")}
                  style={{
                    width: "100%", padding: "13px 20px", borderRadius: 14,
                    border: "1px solid #f0e4c8", background: "#fdf8f0",
                    color: "#b8944d", fontSize: 13, fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting && pendingStatus !== "MAYBE" ? 0.45 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  }}
                >
                  {submitting && pendingStatus === "MAYBE"
                    ? <Loader2 size={16} className="rsvp-spinner" />
                    : <HelpCircle size={16} />}
                  Tentatively Accept
                </button>
              </div>

              {submitErr && (
                <div style={{
                  marginTop: 16, padding: "11px 16px", borderRadius: 10,
                  background: "#fef2f2", border: "1px solid #fecaca",
                  fontSize: 12, color: "#dc2626", textAlign: "center",
                }}>
                  {submitErr}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div style={{
          padding: "12px 28px 20px", textAlign: "center", flexShrink: 0,
          borderTop: "1px solid #f0e8d8", background: "#faf8f5",
        }}>
          <p style={{
            fontSize: 10, color: "#c5b9aa",
            letterSpacing: "0.1em", textTransform: "uppercase", margin: 0,
          }}>
            Powered by LiteEvent
          </p>
        </div>
      </div>

      {/* ── Floating reopen button (when drawer is closed) ──────────────── */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9989,
            display: "flex", alignItems: "center", gap: 10,
            padding: "13px 22px",
            background: submitted ? "#1c1917" : "linear-gradient(135deg, #c9a96e, #b8944d)",
            borderRadius: 50, border: "none", cursor: "pointer", color: "#fff",
            boxShadow: submitted
              ? "0 8px 32px rgba(0,0,0,0.3)"
              : "0 8px 32px rgba(201,169,110,0.5)",
            fontSize: 13, fontWeight: 700,
          }}
        >
          {submitted ? (
            <>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: finalStatus === "GOING" ? "#3ecf8e"
                  : finalStatus === "DECLINED" ? "#94a3b8" : "#c9a96e",
                flexShrink: 0,
              }} />
              {finalStatus === "GOING" ? "Going ✓" : finalStatus === "DECLINED" ? "Declined" : "Maybe"}
              <span style={{ fontSize: 10, opacity: 0.55, marginLeft: -4 }}>· Change</span>
            </>
          ) : (
            <>
              <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }}>
                <span style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "#fff", opacity: 0.5,
                  animation: "rsvp-ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
                }} />
                <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
              </span>
              RSVP Now
            </>
          )}
        </button>
      )}
    </>
  );
}
