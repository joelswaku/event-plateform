"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];
const API  = process.env.NEXT_PUBLIC_API_URL;

const DONATION_PRESETS = [10, 25, 50, 100];

const DEFAULT_BG = {
  CLASSIC: "linear-gradient(160deg, #1a1611 0%, #2d2416 50%, #1a1611 100%)",
  ELEGANT: "linear-gradient(160deg, #1a0f0a 0%, #271a14 50%, #1a0f0a 100%)",
  MODERN:  "linear-gradient(135deg, #06060e 0%, #0a0a14 60%, #0f0f24 100%)",
  MINIMAL: "linear-gradient(180deg, #111111 0%, #1a1a1a 100%)",
  LUXURY:  "linear-gradient(160deg, #060504 0%, #0d0c0a 50%, #060504 100%)",
  FUN:     "linear-gradient(135deg, #1c1407 0%, #2d2b08 60%, #1c1407 100%)",
};

const HEADING_STYLE = {
  MODERN:  { fontWeight: 900, fontSize: "clamp(3rem, 8vw, 6.5rem)",    letterSpacing: "-0.03em", lineHeight: 0.95, textTransform: "uppercase" },
  FUN:     { fontWeight: 800, fontSize: "clamp(2.75rem, 7vw, 5.5rem)", letterSpacing: "-0.01em", lineHeight: 1.0  },
  MINIMAL: { fontWeight: 300, fontSize: "clamp(2.5rem, 6vw, 5rem)",    letterSpacing: "0.04em",  lineHeight: 1.2  },
  LUXURY:  { fontWeight: 200, fontSize: "clamp(2.75rem, 6.5vw, 5.5rem)", letterSpacing: "0.12em", lineHeight: 1.15, textTransform: "uppercase", fontStyle: "italic" },
  ELEGANT: { fontWeight: 300, fontSize: "clamp(2.5rem, 6vw, 5rem)",    letterSpacing: "0.08em",  lineHeight: 1.2,  fontStyle: "italic" },
  CLASSIC: { fontWeight: 400, fontSize: "clamp(2.5rem, 6vw, 5rem)",    letterSpacing: "0.06em",  lineHeight: 1.15 },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function EditorBadge() {
  return (
    <div className="absolute top-3 right-3 z-20 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-widest"
      style={{ background: "rgba(99,102,241,0.9)", color: "#fff" }}>
      Hero
    </div>
  );
}

function Ornament({ centered }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
      className={`flex items-center gap-3 w-24 ${centered ? "mx-auto" : ""}`}
      aria-hidden="true"
    >
      <div className="h-px flex-1" style={{ background: "var(--t-accent)", opacity: 0.6 }} />
      <div className="h-1.5 w-1.5 rotate-45" style={{ background: "var(--t-accent)" }} />
      <div className="h-px flex-1" style={{ background: "var(--t-accent)", opacity: 0.6 }} />
    </motion.div>
  );
}

function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 1 }}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      aria-hidden="true"
    >
      <span className="text-[9px] uppercase tracking-[0.5em]" style={{ color: "rgba(255,255,255,0.25)" }}>Scroll</span>
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="h-10 w-px"
        style={{ background: "linear-gradient(to bottom, var(--t-accent), transparent)", opacity: 0.5 }}
      />
    </motion.div>
  );
}

// Shared button style helpers
function ctaBtnStyle() {
  return { border: "1px solid var(--t-accent)", color: "var(--t-accent)", background: "transparent", borderRadius: "var(--t-radius, 2px)" };
}
function onCtaEnter(e) { e.currentTarget.style.background = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-dark, #111)"; }
function onCtaLeave(e) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-accent)"; }


// ─── Ticket CTA ──────────────────────────────────────────────────────────────

function TicketBlock({
  event,
  ctaText,
  isEditor,
  priceLabel,
  spotsLeft,
  hasLimit,
  ticketCount,
  isSoldOut,
  isUrgent,
  delay,
  centered,
  onBuyTickets,
}) {
  const [hovered, setHovered] = useState(false);

  // ── Live countdown from event date ──────────────────────────────────────────
  const targetDate = event?.starts_at_utc || event?.starts_at || null;

  function calcLeft(iso) {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - Date.now();
    if (isNaN(diff) || diff <= 0) return null;
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  }

  const [countdown, setCountdown] = useState(() => calcLeft(targetDate));

  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => setCountdown(calcLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const showCountdown = !isSoldOut && countdown !== null;

  // ── Editor placeholder ──────────────────────────────────────────────────────
  if (isEditor) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay }}
        className={centered ? "mx-auto" : ""}
        style={{
          padding: "16px 24px",
          borderRadius: 14,
          border: "1px dashed rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.3)",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          textAlign: "center",
          maxWidth: 480,
          width: "100%",
        }}
      >
        ðŸŽŸ Ticket Card â€” visible on public page
      </motion.div>
    );
  }

  // ── Public ticket card ──────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes _tb_pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(1.55)} }
        @keyframes _tb_scan   { 0%{top:-2px} 100%{top:102%} }
        @keyframes _tb_glow   { 0%,100%{opacity:.55} 50%{opacity:.95} }
        @keyframes _tb_flip   { 0%{transform:rotateY(0deg)} 50%{transform:rotateY(-8deg)} 100%{transform:rotateY(0deg)} }
        @keyframes _tb_cd_pop { 0%{transform:scaleY(1)} 50%{transform:scaleY(.88)} 100%{transform:scaleY(1)} }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, ease: EASE, delay }}
        className={centered ? "mx-auto" : ""}
        style={{ width: "100%", maxWidth: 500 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* â•â•â•â•â•â•â•â•â•â•â• OUTER CARD â•â•â•â•â•â•â•â•â•â•â• */}
        <div style={{
          position:       "relative",
          borderRadius:   22,
          overflow:       "hidden",
          background:     isSoldOut
            ? "rgba(18,18,26,0.82)"
            : "rgba(12,12,20,0.86)",
          border:         `1px solid ${isSoldOut
            ? "rgba(255,255,255,0.07)"
            : hovered
              ? "rgba(255,255,255,0.2)"
              : "rgba(255,255,255,0.12)"}`,
          backdropFilter: "blur(28px) saturate(160%)",
          boxShadow:      isSoldOut
            ? "none"
            : hovered
              ? "0 40px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.12) inset, 0 0 70px -20px var(--t-accent,#6366f1)"
              : "0 20px 52px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset",
          transition:     "all 0.35s ease",
          transform:      hovered && !isSoldOut ? "translateY(-5px)" : "none",
        }}>

          {/* Scan line */}
          {!isSoldOut && (
            <div style={{
              position:    "absolute",
              left: 0, right: 0,
              height:      2,
              background:  "linear-gradient(90deg, transparent, var(--t-accent,#6366f1), transparent)",
              opacity:     0.3,
              animation:   "_tb_scan 3.5s linear infinite",
              pointerEvents: "none",
              zIndex:      10,
            }} />
          )}

          {/* ── ACCENT TOP BAR ── */}
          <div style={{
            height:     5,
            background: isSoldOut
              ? "rgba(255,255,255,0.07)"
              : "linear-gradient(90deg, transparent 0%, var(--t-accent,#6366f1) 30%, color-mix(in srgb, var(--t-accent,#6366f1) 60%, #fff) 50%, var(--t-accent,#6366f1) 70%, transparent 100%)",
            animation:  !isSoldOut ? "_tb_glow 2.8s ease-in-out infinite" : "none",
          }} />

          {/* ── HEADER ROW ── */}
          <div style={{
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "space-between",
            padding:         "16px 22px 12px",
            borderBottom:    "1px solid rgba(255,255,255,0.06)",
          }}>
            {/* Left: status badge */}
            <div style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           6,
              padding:       "4px 12px",
              borderRadius:  99,
              background:    isSoldOut
                ? "rgba(255,255,255,0.05)"
                : "color-mix(in srgb, var(--t-accent,#6366f1) 18%, transparent)",
              border:        `1px solid ${isSoldOut ? "rgba(255,255,255,0.08)" : "color-mix(in srgb, var(--t-accent,#6366f1) 38%, transparent)"}`,
              fontSize:      10,
              fontWeight:    800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color:         isSoldOut ? "rgba(255,255,255,0.25)" : "var(--t-accent,#6366f1)",
            }}>
              ðŸŽŸ {isSoldOut ? "Event Full" : "Tickets Available"}
            </div>

            {/* Right: urgency OR sold out */}
            {isUrgent && !isSoldOut && (
              <div style={{
                display:    "flex",
                alignItems: "center",
                gap:        6,
                padding:    "4px 11px",
                borderRadius: 99,
                background: "rgba(239,68,68,0.14)",
                border:     "1px solid rgba(239,68,68,0.3)",
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#ef4444",
                  animation: "_tb_pulse 1.2s ease-in-out infinite",
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  color: "#ef4444",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}>
                  {spotsLeft} left!
                </span>
              </div>
            )}
          </div>

          {/* ── PRICE + TRUST ── */}
          <div style={{
            display:    "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap:        16,
            padding:    "20px 22px 16px",
          }}>
            {/* Price */}
            <div>
              {!isSoldOut && (
                <p style={{
                  fontSize: 10, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.22em",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 5,
                }}>
                  Starting from
                </p>
              )}
              <p style={{
                fontSize:      "clamp(34px, 9vw, 54px)",
                fontWeight:    900,
                letterSpacing: "-0.04em",
                lineHeight:    1,
                color:         isSoldOut ? "rgba(255,255,255,0.18)" : "#fff",
              }}>
                {isSoldOut ? "Sold Out" : (priceLabel || "Free")}
              </p>
            </div>

            {/* Trust icons */}
            {!isSoldOut && (
              <div style={{
                display:       "flex",
                flexDirection: "column",
                gap:           6,
                alignItems:    "flex-end",
                flexShrink:    0,
                paddingTop:    4,
              }}>
                {[
                  { icon: "ðŸ”’", text: "Secure checkout" },
                  { icon: "âš¡", text: "Instant e-ticket" },
                  { icon: "ðŸ“²", text: "QR code entry" },
                ].map(({ icon, text }) => (
                  <span key={text} style={{
                    display:    "flex",
                    alignItems: "center",
                    gap:        5,
                    fontSize:   10,
                    fontWeight: 600,
                    color:      "rgba(255,255,255,0.35)",
                    whiteSpace: "nowrap",
                  }}>
                    {icon} {text}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              COUNTDOWN SECTION â€” only when event has a future date
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {showCountdown && (
            <div style={{
              margin:     "0 22px 16px",
              borderRadius: 14,
              padding:    "14px 16px",
              background: "rgba(255,255,255,0.04)",
              border:     "1px solid rgba(255,255,255,0.07)",
            }}>
              {/* Label */}
              <p style={{
                fontSize:      9,
                fontWeight:    800,
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                color:         "rgba(255,255,255,0.3)",
                textAlign:     "center",
                marginBottom:  10,
              }}>
                â³ Event Starts In
              </p>

              {/* Units */}
              <div style={{
                display:       "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap:           8,
              }}>
                {[
                  { label: "Days",    val: countdown.d },
                  { label: "Hours",   val: countdown.h },
                  { label: "Mins",    val: countdown.m },
                  { label: "Secs",    val: countdown.s },
                ].map(({ label, val }) => (
                  <div key={label} style={{
                    display:        "flex",
                    flexDirection:  "column",
                    alignItems:     "center",
                    gap:            4,
                  }}>
                    {/* Number box */}
                    <div style={{
                      width:          "100%",
                      padding:        "10px 4px",
                      borderRadius:   10,
                      background:     "rgba(255,255,255,0.07)",
                      border:         "1px solid rgba(255,255,255,0.1)",
                      textAlign:      "center",
                      fontSize:       "clamp(20px, 5vw, 28px)",
                      fontWeight:     900,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing:  "-0.02em",
                      color:          "var(--t-accent,#6366f1)",
                      lineHeight:     1,
                      animation:      label === "Secs" ? "_tb_cd_pop 1s ease-in-out infinite" : "none",
                      boxShadow:      "0 2px 12px color-mix(in srgb, var(--t-accent,#6366f1) 20%, transparent)",
                    }}>
                      {String(val).padStart(2, "0")}
                    </div>
                    {/* Label */}
                    <span style={{
                      fontSize:      9,
                      fontWeight:    700,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color:         "rgba(255,255,255,0.28)",
                    }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PERFORATION ── */}
          <div style={{
            display:    "flex",
            alignItems: "center",
            margin:     "0 -1px",
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              flexShrink: 0, marginLeft: -11,
              border: "1px solid rgba(255,255,255,0.06)",
            }} />
            <div style={{
              flex: 1,
              height: 1,
              background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 6px, transparent 6px, transparent 10px)",
              margin: "0 4px",
            }} />
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              flexShrink: 0, marginRight: -11,
              border: "1px solid rgba(255,255,255,0.06)",
            }} />
          </div>

          {/* ── BOTTOM: feature chips + CTA ── */}
          <div style={{ padding: "16px 22px 22px" }}>

            {/* Feature chips */}
            {!isSoldOut && (
              <div style={{
                display:   "flex",
                flexWrap:  "wrap",
                gap:       6,
                marginBottom: 14,
              }}>
                {[
                  "ðŸŽ« E-ticket emailed instantly",
                  "âœ… QR code check-in",
                  "ðŸ’³ Stripe payments",
                  "ðŸ”’ No hidden fees",
                ].map((t) => (
                  <span key={t} style={{
                    padding:       "4px 10px",
                    borderRadius:  99,
                    background:    "rgba(255,255,255,0.05)",
                    border:        "1px solid rgba(255,255,255,0.08)",
                    fontSize:      10,
                    fontWeight:    600,
                    color:         "rgba(255,255,255,0.38)",
                    whiteSpace:    "nowrap",
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={onBuyTickets}
              disabled={isSoldOut}
              onMouseEnter={(e) => { if (!isSoldOut) e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              style={{
                width:          "100%",
                padding:        "16px 0",
                borderRadius:   13,
                border:         "none",
                fontSize:       13,
                fontWeight:     900,
                letterSpacing:  "0.07em",
                textTransform:  "uppercase",
                cursor:         isSoldOut ? "not-allowed" : "pointer",
                transition:     "all 0.22s ease",
                background:     isSoldOut
                  ? "rgba(255,255,255,0.05)"
                  : hovered
                    ? "linear-gradient(135deg, color-mix(in srgb, var(--t-accent,#6366f1) 78%, #fff), var(--t-accent,#6366f1))"
                    : "linear-gradient(135deg, var(--t-accent,#6366f1), color-mix(in srgb, var(--t-accent,#6366f1) 72%, #000))",
                color:          isSoldOut ? "rgba(255,255,255,0.15)" : "var(--t-dark, #fff)",
                boxShadow:      isSoldOut
                  ? "none"
                  : hovered
                    ? "0 14px 40px color-mix(in srgb, var(--t-accent,#6366f1) 60%, transparent)"
                    : "0 6px 22px color-mix(in srgb, var(--t-accent,#6366f1) 38%, transparent)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            10,
              }}
            >
              {isSoldOut ? "Sold Out" : (
                <>
                  <span>{ctaText || (ticketCount > 0 ? "Choose Your Ticket" : "Get Tickets")}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    style={{
                      transition: "transform 0.22s ease",
                      transform: hovered ? "translateX(4px)" : "translateX(0)",
                    }}
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>

            {/* Subtext */}
            {!isSoldOut && (
              <p style={{
                textAlign:     "center",
                marginTop:     8,
                fontSize:      10,
                fontWeight:    600,
                letterSpacing: "0.05em",
                color:         "rgba(255,255,255,0.2)",
              }}>
                {hasLimit && spotsLeft > 0
                  ? `${spotsLeft} ticket${spotsLeft !== 1 ? "s" : ""} remaining`
                  : "Secure your spot today"}
              </p>
            )}
          </div>

        </div>
      </motion.div>
    </>
  );
}



// ─── RSVP CTA ─────────────────────────────────────────────────────────────────

function RsvpBlock({ ctaText, isEditor, delay, centered, onRsvp }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      className={`flex flex-col gap-3 ${centered ? "items-center" : "items-start"}`}
    >
      <button
        onClick={onRsvp}
        className="text-sm font-medium uppercase tracking-[0.25em] transition active:scale-95 px-10 py-3.5"
        style={ctaBtnStyle()}
        onMouseEnter={onCtaEnter}
        onMouseLeave={onCtaLeave}
      >
        {ctaText || "RSVP Now"}
      </button>
    </motion.div>
  );
}

// ─── Donation Card ────────────────────────────────────────────────────────────

function HeroDonationCard({ event, isEditor, delay, centered }) {
  const [preset,     setPreset]     = useState(25);
  const [custom,     setCustom]     = useState("");
  const [email,      setEmail]      = useState("");
  const [name,       setName]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const amount = preset === "custom" ? Number(custom) : preset;

  async function handleDonate(e) {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return setError("Valid email required");
    if (!amount || amount <= 0) return setError("Select or enter an amount");
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/engagement/events/${event?.id}/donations`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donor_name: name.trim() || null, donor_email: email.trim().toLowerCase(), amount, currency: "USD" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Donation failed");
      if (data.data?.checkout_url) window.location.href = data.data.checkout_url;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      className={centered ? "flex justify-center" : ""}
    >
      <div
        className="w-full max-w-xs overflow-hidden rounded-2xl"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(14px)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {/* Heart SVG inline to avoid extra import */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#f472b6" stroke="#f472b6" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Support this event</p>
        </div>

        {/* Body */}
        <form
          onSubmit={isEditor ? (e) => e.preventDefault() : handleDonate}
          className="space-y-2.5 px-4 py-4"
        >
          {/* Amount presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {DONATION_PRESETS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={isEditor ? undefined : () => { setPreset(a); setCustom(""); }}
                className="py-1.5 text-xs font-bold transition active:scale-95"
                style={{
                  borderRadius: 8,
                  border: preset === a ? "1.5px solid var(--t-accent)" : "1px solid rgba(255,255,255,0.12)",
                  background: preset === a ? "var(--t-accent)" : "rgba(255,255,255,0.04)",
                  color: preset === a ? "#000" : "rgba(255,255,255,0.65)",
                }}
              >
                ${a}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <span className="text-xs text-white/30">$</span>
            <input
              type="number"
              min="1"
              value={preset === "custom" ? custom : ""}
              placeholder={preset !== "custom" ? String(preset) : "Custom amount"}
              onFocus={isEditor ? undefined : () => setPreset("custom")}
              onChange={(e) => { setPreset("custom"); setCustom(e.target.value); }}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
            />
          </div>

          {/* Name */}
          <input
            type="text"
            value={name}
            placeholder="Your name (optional)"
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
          />

          {/* Email */}
          <input
            type="email"
            required
            value={email}
            placeholder="your@email.com"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting || isEditor}
            className="w-full rounded-xl py-2.5 text-xs font-black uppercase tracking-[0.12em] transition active:scale-[0.98] disabled:opacity-60"
            style={{ background: "var(--t-accent)", color: "var(--t-accent-fg, #000)" }}
          >
            {submitting ? "Redirectingâ€¦" : `Give ${preset === "custom" ? (custom ? `$${custom}` : "â€¦") : `$${preset}`} â†’`}
          </button>

          <p className="text-center text-[10px] text-white/20">Secure checkout via Stripe</p>
        </form>
      </div>
    </motion.div>
  );
}

// ─── Combined CTA area: renders all enabled features independently ─────────────

function CtaArea({ showTicketBlock, showRsvpBlock, showDonationBlock, centered, delay, event, isEditor, ctaText, priceLabel, spotsLeft, hasLimit, ticketCount, isSoldOut, isUrgent, onRsvp, onBuyTickets }) {
  if (!showTicketBlock && !showRsvpBlock && !showDonationBlock) return null;

  return (
    <div className={`flex flex-col gap-4 ${centered ? "items-center" : "items-start"}`}>
      {showTicketBlock && (
        <TicketBlock
          ctaText={ctaText}
          event={event}  
          isEditor={isEditor}
          priceLabel={priceLabel}
          spotsLeft={spotsLeft}
          hasLimit={hasLimit}
          ticketCount={ticketCount}
          isSoldOut={isSoldOut}
          isUrgent={isUrgent}
          delay={delay}
          centered={centered}
          onBuyTickets={onBuyTickets}
        />
      )}
      {showRsvpBlock && (
        <RsvpBlock
          ctaText={!showTicketBlock ? ctaText : undefined}
          isEditor={isEditor}
          delay={delay + 0.05}
          centered={centered}
          onRsvp={onRsvp}
        />
      )}
      {showDonationBlock && (
        <HeroDonationCard
          event={event}
          isEditor={isEditor}
          delay={delay + 0.1}
          centered={centered}
        />
      )}
    </div>
  );
}

// ─── Module-scope helpers ─────────────────────────────────────────────────────

function readTokenFromSearch() {
  if (typeof window === "undefined") return false;
  return !!new URLSearchParams(window.location.search).get("token");
}

function formatPrice(n, currency) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(n);
}

function getPriceLabel(paidTickets, freeTickets, currency) {
  if (paidTickets.length === 0) return freeTickets.length ? "Free entry" : "";
  const min = Math.min(...paidTickets.map((t) => Number(t.price)));
  const max = Math.max(...paidTickets.map((t) => Number(t.price)));
  return min === max ? `From ${formatPrice(min, currency)}` : `${formatPrice(min, currency)} â€“ ${formatPrice(max, currency)}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HeroSection({ section, event, isEditor = false, onEdit }) {
  const config = section.config || {};
  const theme  = config._theme || "CLASSIC";

  const overlayOpacity = (config.overlay_opacity ?? 50) / 100;
  const align          = config.headline_align || (theme === "MODERN" ? "left" : "center");
  const isLeft         = align === "left";
  const isRight        = align === "right";
  const isCentered     = !isLeft && !isRight;

  const textAlignClass = isLeft ? "text-left items-start" : isRight ? "text-right items-end" : "text-center items-center";

  const [hasToken]    = useState(readTokenFromSearch);
  const [pubTickets, setPubTickets] = useState([]);

  const isTicketed = !isEditor && !!event?.allow_ticketing;

  useEffect(() => {
    if (!isTicketed || !event?.id || !API) return;
    let active = true;
    fetch(`${API}/public/events/${event.id}/tickets`)
      .then((r) => r.json())
      .then((d) => { if (active) setPubTickets(d.tickets ?? []); })
      .catch(() => {});
    return () => { active = false; };
  }, [isTicketed, event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived ticket values
  const paidTickets = pubTickets.filter((t) => t.price > 0);
  const freeTickets = pubTickets.filter((t) => !t.price || t.price === 0);
  const currency    = pubTickets[0]?.currency ?? "USD";
  const priceLabel  = getPriceLabel(paidTickets, freeTickets, currency);
  const spotsLeft   = pubTickets.reduce((sum, t) => {
    const avail = t.quantity_total != null ? t.quantity_total - (t.quantity_sold ?? 0) : null;
    return avail != null ? sum + avail : sum;
  }, 0);
  const hasLimit    = pubTickets.some((t) => t.quantity_total != null);
  const isSoldOut   = hasLimit && spotsLeft === 0;
  const isUrgent    = hasLimit && spotsLeft > 0 && spotsLeft <= 20;
  const ticketCount = pubTickets.length;

  // Independent show flags â€” each feature is separate
  const showTicketBlock   = isEditor ? !!event?.allow_ticketing : isTicketed;
  const showRsvpBlock     = !!event?.allow_rsvp;
  const showDonationBlock = !!event?.allow_donations;

  function handleRsvp() {
    window.dispatchEvent(new CustomEvent("open-rsvp-panel"));
  }
  function handleBuyTickets() {
    if (event?.slug) window.location.href = `/e/${event.slug}/tickets`;
  }

  const bg           = config.background_color || DEFAULT_BG[theme] || DEFAULT_BG.CLASSIC;
  const overlayGrad  = `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity * 0.6}) 0%, rgba(0,0,0,${overlayOpacity}) 100%)`;
  const headingStyle = { fontFamily: "var(--t-font-heading)", color: "#ffffff", ...(HEADING_STYLE[theme] || HEADING_STYLE.CLASSIC) };
  const showOrnament = theme === "CLASSIC" || theme === "ELEGANT";

  const ctaAreaProps = {
    showTicketBlock,
    showRsvpBlock,
    showDonationBlock,
    centered: isCentered,
    event,
    isEditor,
    ctaText: config.cta_text,
    priceLabel,
    spotsLeft,
    hasLimit,
    ticketCount,
    isSoldOut,
    isUrgent,
    onRsvp: handleRsvp,
    onBuyTickets: handleBuyTickets,
  };

  // ── LUXURY ───────────────────────────────────────────────────────────────────
  if (theme === "LUXURY") {
    return (
      <section aria-label="Event hero"
        className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${textAlignClass} ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: bg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {config.background_image ? (
          <motion.div className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${config.background_image})`, transformOrigin: "center center" }}
            initial={{ scale: 1 }} animate={{ scale: 1.08 }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            aria-hidden="true" />
        ) : (
          <div className="absolute inset-0" style={{ background: bg }} aria-hidden="true" />
        )}
        <div className="absolute inset-0" style={{ background: overlayGrad }} aria-hidden="true" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)" }} aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "var(--t-accent)", opacity: 0.35 }} aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: "var(--t-accent)", opacity: 0.25 }} aria-hidden="true" />

        <div className={`relative z-10 mx-auto w-full max-w-5xl px-6 py-40 flex flex-col gap-8 sm:py-52 ${textAlignClass}`}>
          {config.eyebrow && (
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.2 }}
              style={{ color: "var(--t-accent)", fontSize: "0.65rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.55em" }}>
              {config.eyebrow}
            </motion.p>
          )}
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE, delay: 0.35 }} style={headingStyle}>
            {section.title || "Welcome"}
          </motion.h1>
          <Ornament centered={isCentered} />
          {section.body && (
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.65 }}
              className="max-w-lg text-base leading-loose sm:text-lg" style={{ color: "rgba(255,255,255,0.58)", fontStyle: "italic" }}>
              {section.body}
            </motion.p>
          )}
          <CtaArea {...ctaAreaProps} delay={0.8} />
        </div>

        {!isEditor && <ScrollIndicator />}
        {isEditor && <EditorBadge />}
      </section>
    );
  }

  // ── MODERN ───────────────────────────────────────────────────────────────────
  if (theme === "MODERN") {
    return (
      <section aria-label="Event hero"
        className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: bg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {config.background_image && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${config.background_image})` }} aria-hidden="true" />
        )}
        <div className="absolute inset-0" style={{ background: overlayGrad }} aria-hidden="true" />

        {config.eyebrow && (
          <div className="absolute top-8 left-8 z-10">
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
              style={{ color: "var(--t-accent)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase" }}>
              {config.eyebrow}
            </motion.p>
          </div>
        )}

        <div className="relative z-10 mx-auto w-full max-w-6xl px-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6 h-1 w-16" style={{ background: "var(--t-accent)" }} aria-hidden="true" />
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease: EASE, delay: 0.25 }} style={headingStyle}>
            {section.title || "Welcome"}
          </motion.h1>
          {section.body && (
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.45 }}
              className="mt-6 max-w-lg text-base sm:text-lg" style={{ color: "rgba(255,255,255,0.55)", fontWeight: 400 }}>
              {section.body}
            </motion.p>
          )}
          <div className="mt-8">
            <CtaArea {...ctaAreaProps} delay={0.6} />
          </div>
        </div>

        {isEditor && <EditorBadge />}
      </section>
    );
  }

  // ── MINIMAL ──────────────────────────────────────────────────────────────────
  if (theme === "MINIMAL") {
    return (
      <section aria-label="Event hero"
        className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${textAlignClass} ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: bg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {config.background_image && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${config.background_image})` }} aria-hidden="true" />
        )}
        <div className="absolute inset-0" style={{ background: overlayGrad }} aria-hidden="true" />

        <div className={`relative z-10 mx-auto w-full max-w-4xl px-8 py-32 flex flex-col gap-8 sm:py-44 ${textAlignClass}`}>
          {config.eyebrow && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.1 }}
              style={{ color: "var(--t-accent)", fontSize: "0.6rem", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.6em" }}>
              {config.eyebrow}
            </motion.p>
          )}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.2 }} style={headingStyle}>
            {section.title || "Welcome"}
          </motion.h1>
          {section.body && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.45 }}
              className="max-w-md text-base leading-relaxed sm:text-lg" style={{ color: "rgba(255,255,255,0.5)", fontWeight: 300 }}>
              {section.body}
            </motion.p>
          )}
          <CtaArea {...ctaAreaProps} delay={0.65} />
        </div>

        {isEditor && <EditorBadge />}
      </section>
    );
  }

  // ── FUN ──────────────────────────────────────────────────────────────────────
  if (theme === "FUN") {
    return (
      <section aria-label="Event hero"
        className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${textAlignClass} ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: bg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {config.background_image && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${config.background_image})` }} aria-hidden="true" />
        )}
        <div className="absolute inset-0" style={{ background: overlayGrad }} aria-hidden="true" />

        <div className={`relative z-10 mx-auto w-full max-w-5xl px-6 py-32 flex flex-col gap-6 sm:py-44 ${textAlignClass}`}>
          {config.eyebrow && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
              style={{ color: "var(--t-accent)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4em" }}>
              {config.eyebrow}
            </motion.p>
          )}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.25 }} style={headingStyle}>
            {section.title || "Welcome"}
          </motion.h1>
          {section.body && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
              className="max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>
              {section.body}
            </motion.p>
          )}
          <CtaArea {...ctaAreaProps} delay={0.65} />
        </div>

        {isEditor && <EditorBadge />}
      </section>
    );
  }

  // ── CLASSIC / ELEGANT (default) ───────────────────────────────────────────────
  return (
    <section aria-label="Event hero"
      className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${textAlignClass} ${isEditor ? "cursor-pointer" : ""}`}
      style={{ background: bg }}
      onClick={isEditor ? onEdit : undefined}
    >
      {config.background_image && (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${config.background_image})` }} aria-hidden="true" />
      )}
      <div className="absolute inset-0" style={{ background: overlayGrad }} aria-hidden="true" />
      {showOrnament && (
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "var(--t-accent)", opacity: 0.3 }} aria-hidden="true" />
      )}

      <div className={`relative z-10 mx-auto w-full max-w-5xl px-6 py-32 flex flex-col gap-6 sm:py-44 ${textAlignClass}`}>
        {config.eyebrow && (
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
            style={{ color: "var(--t-accent)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4em" }}>
            {config.eyebrow}
          </motion.p>
        )}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.25 }} style={headingStyle}>
          {section.title || "Welcome"}
        </motion.h1>
        {section.body && (
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
            className="max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>
            {section.body}
          </motion.p>
        )}
        {showOrnament && <Ornament centered={isCentered} />}
        <CtaArea {...ctaAreaProps} delay={0.65} />
      </div>

      {isEditor && <EditorBadge />}
    </section>
  );
}
