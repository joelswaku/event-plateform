"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Zap, QrCode, Ticket, CheckCircle, CreditCard, Shield, Timer, Heart, ArrowRight, Loader2 } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];
const API  = process.env.NEXT_PUBLIC_API_URL;

const DONATION_PRESETS_DEFAULT = [5, 10, 25];

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

  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!targetDate) return;
    setCountdown(calcLeft(targetDate));
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
        🎟 Ticket Card — visible on public page
      </motion.div>
    );
  }

  // ── Rotating marketing phrases ─────────────────────────────────────────────
  const phrases = [
    "Your next great experience.",
    "Limited seats — don't miss out.",
    "Secure. Fast. Instant e-ticket.",
    "Join the crowd. Grab your spot.",
    "Tonight starts with your ticket.",
  ];
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => {
      setPhraseVisible(false);
      setTimeout(() => {
        setPhraseIdx(i => (i + 1) % phrases.length);
        setPhraseVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const features = [
    { emoji: "✉️", text: "Instant e-ticket by email" },
    { emoji: "📲", text: "QR code check-in at door" },
    { emoji: "🔒", text: "Encrypted Stripe checkout" },
    { emoji: "↩️", text: "Refund policy by organizer" },
  ];

  // ── Public ticket card ──────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes _tb_pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(1.55)} }
        @keyframes _tb_scan    { 0%{top:-2px} 100%{top:102%} }
        @keyframes _tb_glow    { 0%,100%{opacity:.55} 50%{opacity:.95} }
        @keyframes _tb_flip    { 0%{transform:rotateY(0deg)} 50%{transform:rotateY(-8deg)} 100%{transform:rotateY(0deg)} }
        @keyframes _tb_cd_pop  { 0%{transform:scaleY(1)} 50%{transform:scaleY(.88)} 100%{transform:scaleY(1)} }
        @keyframes _tb_float   { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-10px) rotate(1deg)} 66%{transform:translateY(-4px) rotate(-1deg)} }
        @keyframes _tb_float2  { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.06)} }
        @keyframes _tb_shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes _tb_dot     { 0%,100%{opacity:.18} 50%{opacity:.55} }
        @keyframes _tb_gold_pulse { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.85;transform:scale(1.05)} }
        @keyframes _tb_in_up   { from{opacity:0;transform:translateY(20px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes _tb_starfield { 0%,100%{opacity:.04} 50%{opacity:.18} }
        @media (max-width:768px){
          ._tb_mktcol { display:none !important; animation:none !important; }
          ._tb_mktcol * { animation:none !important; transition:none !important; }
          ._tb_donwrap { border-radius:16px !important; }
          ._tb_donform { padding:18px 16px 20px !important; gap:12px !important; }
          ._tb_donpresets button { padding:12px 4px !important; font-size:1.1rem !important; }
          ._tb_donfreq button { padding:9px 0 !important; font-size:10px !important; }
        }
      `}</style>

      {/* ── OUTER MARKETING SHELL ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay }}
        className={centered ? "mx-auto" : ""}
        style={{
          width: "100%", maxWidth: 860,
          borderRadius: 26,
          border: "1px solid rgba(201,169,110,0.18)",
          background: "rgba(8,6,4,0.88)",
          backdropFilter: "blur(40px) saturate(160%)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(201,169,110,0.06) inset, 0 0 80px -20px rgba(201,169,110,0.18)",
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Subtle ambient glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(ellipse 60% 55% at 25% 50%, color-mix(in srgb, var(--t-accent,#6366f1) 12%, transparent), transparent)",
        }} />

        {/* ── LEFT: marketing panel (hidden on mobile via CSS) ── */}
        <div className="_tb_mktcol" style={{
          position:      "relative",
          zIndex:        1,
          flex:          "0 0 290px",
          display:       "flex",
          flexDirection: "column",
          justifyContent:"center",
          padding:       "36px 28px",
          borderRight:   "1px solid rgba(201,169,110,0.12)",
          gap:           22,
          overflow:      "hidden",
          background:    "linear-gradient(155deg, #080502 0%, #120c04 25%, #0e0904 50%, #150f06 75%, #090601 100%)",
        }}>
          {/* Gold radial glow — top left */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 75% 55% at 18% 28%, rgba(201,169,110,0.20), transparent)",
          }} />
          {/* Amber glow — bottom right */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 50% 40% at 88% 82%, rgba(180,100,20,0.14), transparent)",
          }} />
          {/* Cool highlight — mid */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 40% 30% at 60% 10%, rgba(255,220,120,0.06), transparent)",
          }} />

          {/* Floating orbs — gold / amber / warm */}
          {[
            { x: 12, y: 12,  size: 100, color: "#c9a96e", dur: 8.5,  delay2: 0,   anim: "_tb_float2" },
            { x: 78, y: 55,  size: 65,  color: "#b45309", dur: 11,   delay2: 1.8, anim: "_tb_float"  },
            { x: 45, y: 82,  size: 45,  color: "#d97706", dur: 7.2,  delay2: 0.9, anim: "_tb_float2" },
            { x: 88, y: 8,   size: 35,  color: "#fbbf24", dur: 9.4,  delay2: 2.2, anim: "_tb_float"  },
          ].map(({ x, y, size, color, dur, delay2, anim }, i) => (
            <div key={i} style={{
              position: "absolute", left: `${x}%`, top: `${y}%`,
              width: size, height: size, borderRadius: "50%",
              background: color, filter: "blur(34px)", opacity: 0.16,
              animation: `${anim} ${dur}s ease-in-out infinite`,
              animationDelay: `${delay2}s`,
              pointerEvents: "none",
            }} />
          ))}

          {/* Star / dot grid — animated twinkle */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle, rgba(201,169,110,0.18) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            animation: "_tb_starfield 4s ease-in-out infinite",
          }} />

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0,   scale: 1   }}
            transition={{ delay: delay + 0.08, duration: 0.7, ease: EASE }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "5px 13px", borderRadius: 99, width: "fit-content",
              background: "rgba(201,169,110,0.10)",
              border: "1px solid rgba(201,169,110,0.30)",
              backdropFilter: "blur(10px)",
              fontSize: 9, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.22em", color: "rgba(201,169,110,0.90)",
              position: "relative", zIndex: 1,
              boxShadow: "0 2px 12px rgba(201,169,110,0.15)",
            }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
              background: isSoldOut ? "#ef4444" : "#c9a96e",
              boxShadow: `0 0 8px ${isSoldOut ? "#ef4444" : "rgba(201,169,110,0.8)"}`,
              animation: "_tb_pulse 1.8s ease-in-out infinite",
              display: "inline-block",
            }} />
            {isSoldOut ? "Event Full" : "Live · Tickets Open"}
          </motion.div>

          {/* Rotating headline — Playfair Display with gold gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: delay + 0.22, duration: 0.8, ease: EASE }}
            style={{ minHeight: 88, position: "relative", zIndex: 1 }}
          >
            <p style={{
              fontFamily:    "'Playfair Display', 'IM Fell English', Georgia, serif",
              fontSize:      "clamp(21px, 3vw, 28px)",
              fontWeight:    700,
              fontStyle:     "italic",
              lineHeight:    1.22,
              letterSpacing: "-0.01em",
              background:    "linear-gradient(135deg, #fff 20%, #e8d5a3 50%, #c9a96e 80%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
              backgroundClip: "text",
              transition:    "opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)",
              opacity:       phraseVisible ? 1 : 0,
              transform:     phraseVisible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.96)",
              textShadow:    "none",
            }}>
              {phrases[phraseIdx]}
            </p>
            {/* Gold underline accent */}
            <div style={{
              marginTop: 10, width: phraseVisible ? 48 : 0, height: 1.5,
              background: "linear-gradient(90deg, #c9a96e, transparent)",
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1) 0.1s",
              borderRadius: 2,
            }} />
          </motion.div>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, position: "relative", zIndex: 1 }}>
            {features.map(({ emoji, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0  }}
                transition={{ delay: delay + 0.38 + i * 0.09, duration: 0.6, ease: EASE }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(201,169,110,0.10)",
                  border: "1px solid rgba(201,169,110,0.22)",
                  backdropFilter: "blur(6px)",
                  fontSize: 13,
                  boxShadow: "0 2px 10px rgba(201,169,110,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}>
                  {emoji}
                </span>
                <span style={{
                  fontSize: 11.5, fontWeight: 500,
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.4, letterSpacing: "0.01em",
                }}>
                  {text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Animated gold shimmer border at bottom */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent 0%, #c9a96e 40%, #fbbf24 60%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "_tb_shimmer 3.2s linear infinite",
          }} />

          {/* Vertical edge fade */}
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 1,
            background: "linear-gradient(to bottom, transparent 0%, rgba(201,169,110,0.12) 50%, transparent 100%)",
          }} />
        </div>

        {/* ── RIGHT: ticket card (existing) ── */}
        <div
          style={{ flex: 1, position: "relative", zIndex: 1 }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
        {/* ── TICKET CARD (inner) ── */}
        <div style={{ position: "relative", overflow: "hidden" }}>

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
              🎟 {isSoldOut ? "Event Full" : "Tickets Available"}
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
            <div style={{ minWidth: 0 }}>
              {!isSoldOut && priceLabel && priceLabel !== "Free entry" && (
                <p style={{
                  fontSize: 10, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.22em",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 4,
                }}>
                  Tickets
                </p>
              )}
              <p style={{
                fontSize:      "clamp(26px, 6vw, 42px)",
                fontWeight:    900,
                letterSpacing: "-0.03em",
                lineHeight:    1,
                color:         isSoldOut ? "rgba(255,255,255,0.18)" : "#fff",
                whiteSpace:    "nowrap",
                overflow:      "hidden",
                textOverflow:  "ellipsis",
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
                  { icon: Lock,   text: "Secure checkout" },
                  { icon: Zap,    text: "Instant e-ticket" },
                  { icon: QrCode, text: "QR code entry" },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} style={{
                    display:    "flex",
                    alignItems: "center",
                    gap:        5,
                    fontSize:   10,
                    fontWeight: 600,
                    color:      "rgba(255,255,255,0.35)",
                    whiteSpace: "nowrap",
                  }}>
                    <Icon size={11} strokeWidth={2.5} /> {text}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              COUNTDOWN SECTION â€" only when event has a future date
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
                <Timer size={10} strokeWidth={2.5} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Event Starts In
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
                  { icon: Ticket,      text: "E-ticket emailed instantly" },
                  { icon: CheckCircle, text: "QR code check-in" },
                  { icon: CreditCard,  text: "Stripe payments" },
                  { icon: Shield,      text: "No hidden fees" },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           5,
                    padding:       "4px 10px",
                    borderRadius:  99,
                    background:    "rgba(255,255,255,0.05)",
                    border:        "1px solid rgba(255,255,255,0.08)",
                    fontSize:      10,
                    fontWeight:    600,
                    color:         "rgba(255,255,255,0.38)",
                    whiteSpace:    "nowrap",
                  }}>
                    <Icon size={10} strokeWidth={2.5} />
                    {text}
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

        </div>{/* end right panel */}
      </motion.div>{/* end outer shell */}
    </>
  );
}



// ─── RSVP CTA ─────────────────────────────────────────────────────────────────

function RsvpBlock({ ctaText, isEditor, delay, centered, onRsvp }) {
  const [isMobile,    setIsMobile]    = useState(false);
  const [phraseIdx,   setPhraseIdx]   = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const phrases = [
    "Your seat is waiting.",
    "Be there — reserve your spot.",
    "Events are better together.",
    "Don't miss a moment.",
    "Save your place today.",
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseVisible(false);
      setTimeout(() => { setPhraseIdx(i => (i + 1) % phrases.length); setPhraseVisible(true); }, 400);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const features = [
    { emoji: "✅", text: "Instant confirmation by email" },
    { emoji: "📅", text: "Add to your calendar" },
    { emoji: "🔔", text: "Reminders before the event" },
    { emoji: "💌", text: "Updates from the organizer" },
  ];

  const G1 = "#c9a96e";
  const G3 = "#e8d5a3";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      transition={{ duration: 0.85, ease: EASE, delay }}
      className={centered ? "mx-auto" : ""}
      style={{ width: "100%", maxWidth: 680 }}
    >
      <div className="_tb_donwrap" style={{
        display: "flex", flexDirection: "row",
        borderRadius: 20, overflow: "hidden",
        border: "1px solid rgba(201,169,110,0.18)",
        boxShadow: "0 28px 70px rgba(0,0,0,0.70), 0 0 60px -20px rgba(201,169,110,0.20)",
        background: "rgba(8,6,4,0.90)",
        backdropFilter: "blur(40px) saturate(180%)",
        position: "relative",
      }}>

        {/* ── LEFT: marketing panel — desktop only ─────────────── */}
        {!isMobile && (
          <div className="_tb_mktcol" style={{
            flex: "0 0 220px",
            display: "flex", flexDirection: "column", justifyContent: "center",
            padding: "28px 22px", gap: 18, overflow: "hidden", position: "relative",
            borderRight: "1px solid rgba(201,169,110,0.12)",
            background: "linear-gradient(155deg,#080502 0%,#120c04 30%,#0e0904 60%,#090601 100%)",
          }}>
            {/* Gold glow layers */}
            <div style={{ position:"absolute", inset:0, pointerEvents:"none",
              background:"radial-gradient(ellipse 80% 55% at 22% 28%,rgba(201,169,110,0.18),transparent)" }} />
            <div style={{ position:"absolute", inset:0, pointerEvents:"none",
              background:"radial-gradient(ellipse 50% 40% at 85% 82%,rgba(180,83,9,0.14),transparent)" }} />

            {/* Floating orbs */}
            {[
              { x:12, y:10, size:55, c:"rgba(201,169,110,0.22)", dur:7.5, anim:"_tb_float2" },
              { x:74, y:52, size:38, c:"rgba(180,83,9,0.18)",    dur:9.4, anim:"_tb_float"  },
              { x:42, y:84, size:28, c:"rgba(251,191,36,0.16)",  dur:6.2, anim:"_tb_float2" },
            ].map(({ x, y, size, c, dur, anim }, i) => (
              <div key={i} style={{
                position:"absolute", left:`${x}%`, top:`${y}%`,
                width:size, height:size, borderRadius:"50%",
                background:c, filter:"blur(22px)",
                animation:`${anim} ${dur}s ease-in-out infinite`,
                animationDelay:`${i*0.9}s`, pointerEvents:"none",
              }} />
            ))}

            {/* Dot grid */}
            <div style={{
              position:"absolute", inset:0, pointerEvents:"none",
              backgroundImage:"radial-gradient(circle,rgba(201,169,110,0.16) 1px,transparent 1px)",
              backgroundSize:"18px 18px",
              animation:"_tb_starfield 4s ease-in-out infinite",
            }} />

            {/* Badge */}
            <motion.div
              initial={{ opacity:0, y:-10, scale:0.9 }} animate={{ opacity:1, y:0, scale:1 }}
              transition={{ delay:delay+0.08, duration:0.7, ease:EASE }}
              style={{
                display:"inline-flex", alignItems:"center", gap:6, position:"relative", zIndex:1,
                padding:"4px 12px", borderRadius:99, width:"fit-content",
                background:"rgba(201,169,110,0.10)", border:"1px solid rgba(201,169,110,0.30)",
                backdropFilter:"blur(8px)", boxShadow:"0 2px 10px rgba(201,169,110,0.12)",
              }}>
              <span style={{
                width:5, height:5, borderRadius:"50%", background:G1, flexShrink:0,
                boxShadow:"0 0 6px rgba(201,169,110,0.8)", animation:"_tb_pulse 1.8s ease-in-out infinite",
              }} />
              <span style={{ fontSize:8, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.2em", color:"rgba(201,169,110,0.85)" }}>
                Free to attend
              </span>
            </motion.div>

            {/* Rotating phrase */}
            <motion.div
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:delay+0.25, duration:0.7, ease:EASE }}
              style={{ minHeight:80, position:"relative", zIndex:1 }}
            >
              <p style={{
                fontFamily:"'Playfair Display','IM Fell English',Georgia,serif",
                fontSize:"clamp(14px,1.9vw,16px)", fontWeight:700, fontStyle:"italic",
                lineHeight:1.4, letterSpacing:"-0.01em",
                background:"linear-gradient(135deg,#fff 25%,#e8d5a3 55%,#c9a96e 85%)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                backgroundClip:"text",
                transition:"opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)",
                opacity:phraseVisible ? 1 : 0,
                transform:phraseVisible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.96)",
              }}>
                {phrases[phraseIdx]}
              </p>
              <div style={{
                marginTop:8, width: phraseVisible ? 44 : 0, height:1.5,
                background:"linear-gradient(90deg,#c9a96e,transparent)",
                transition:"width 0.6s cubic-bezier(0.4,0,0.2,1) 0.1s", borderRadius:2,
              }} />
            </motion.div>

            {/* Feature list */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, position:"relative", zIndex:1 }}>
              {features.map(({ emoji, text }, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:delay+0.38+i*0.09, duration:0.6, ease:EASE }}
                  style={{ display:"flex", alignItems:"center", gap:10 }}
                >
                  <span style={{
                    width:28, height:28, borderRadius:8, flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background:"rgba(201,169,110,0.10)",
                    border:"1px solid rgba(201,169,110,0.22)",
                    backdropFilter:"blur(6px)", fontSize:12,
                    boxShadow:"0 2px 10px rgba(201,169,110,0.12)",
                  }}>{emoji}</span>
                  <span style={{ fontSize:11, fontWeight:500, color:"rgba(255,255,255,0.52)", lineHeight:1.4 }}>
                    {text}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Shimmer bottom */}
            <div style={{
              position:"absolute", bottom:0, left:0, right:0, height:2,
              background:`linear-gradient(90deg,transparent,${G1},${G3},transparent)`,
              backgroundSize:"200% 100%", animation:"_tb_shimmer 2.8s linear infinite",
            }} />
          </div>
        )}

        {/* ── RIGHT: RSVP action (logic unchanged) ─────────────── */}
        <div style={{ flex:1, overflow:"hidden" }}>
          {/* Gold accent bar */}
          <div style={{
            height:4,
            background:"linear-gradient(90deg,#c9a96e,#d4a853,#fbbf24,#c9a96e)",
            backgroundSize:"200% 100%",
            animation:"_tb_shimmer 3.2s linear infinite",
          }} />

          <div className="_tb_donform" style={{
            display:"flex", flexDirection:"column", alignItems:"stretch",
            gap:16, padding:"24px 24px 26px",
          }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:38, height:38, borderRadius:10, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                background:"rgba(201,169,110,0.12)", border:"1px solid rgba(201,169,110,0.28)",
              }}>
                <CheckCircle size={17} style={{ color:G1 }} />
              </div>
              <div>
                <p style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.2em", color:"rgba(201,169,110,0.75)" }}>
                  Reserve your spot
                </p>
                <p style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.85)", lineHeight:1.3 }}>
                  RSVP is free — confirm your attendance
                </p>
              </div>
            </div>

            {/* ── Original RSVP button — logic untouched ── */}
            <button
              onClick={onRsvp}
              disabled={isEditor}
              className="text-sm font-medium uppercase tracking-[0.25em] transition active:scale-95"
              style={{
                ...ctaBtnStyle(),
                width:"100%", padding:"14px 0", borderRadius:12,
                fontSize:12, fontWeight:900, letterSpacing:"0.08em",
              }}
              onMouseEnter={onCtaEnter}
              onMouseLeave={onCtaLeave}
            >
              {ctaText || "RSVP Now"}
            </button>

            <p style={{
              textAlign:"center", fontSize:9, fontWeight:600,
              color:"rgba(255,255,255,0.20)", textTransform:"uppercase", letterSpacing:"0.12em",
              display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            }}>
              <Lock size={8} strokeWidth={2.5} /> Free · No payment required
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Donation Card ────────────────────────────────────────────────────────────

function HeroDonationCard({ event, isEditor, delay, centered, fullWidth }) {
  const [freq,       setFreq]       = useState("once");
  const [preset,     setPreset]     = useState(null);
  const [custom,     setCustom]     = useState("");
  const [name,       setName]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");
  const [donConfig,  setDonConfig]  = useState({ amounts: [], message: "" });
  const [quoteIdx,   setQuoteIdx]   = useState(0);
  const [quoteVis,   setQuoteVis]   = useState(true);
  const [isMobile,   setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const ROSE   = "#c9a96e";
  const A1     = "#c9a96e";
  const A2     = "#b45309";
  const A3     = "#e8d5a3";

  useEffect(() => {
    if (!event?.id) return;
    fetch(`${API}/engagement/events/${event.id}/donation-config`)
      .then(r => r.json())
      .then(d => { if (d?.data) setDonConfig(d.data); })
      .catch(() => {});
  }, [event?.id]);

  const QUOTES = [
    { text: "Giving is not just about making a donation. It is about making a difference.", author: "Kathy Calvin" },
    { text: "No one has ever become poor by giving.", author: "Anne Frank" },
    { text: "We make a living by what we get, but we make a life by what we give.", author: "Winston Churchill" },
    { text: "The meaning of life is to find your gift. The purpose is to give it away.", author: "Pablo Picasso" },
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteVis(false);
      setTimeout(() => { setQuoteIdx(i => (i + 1) % QUOTES.length); setQuoteVis(true); }, 500);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const presets = donConfig.amounts?.length === 3 ? donConfig.amounts : DONATION_PRESETS_DEFAULT;
  const amount  = preset === "custom" ? Number(custom) : (preset ?? 0);

  async function handleDonate(e) {
    e.preventDefault();
    if (!amount || amount <= 0) return setError("Please select or enter an amount");
    setError(""); setSubmitting(true);
    try {
      const res = await fetch(`${API}/engagement/events/${event?.id}/donations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donor_name: name.trim() || null, amount, currency: "USD", frequency: freq }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Donation failed");
      if (data.data?.checkout_url) window.location.href = data.data.checkout_url;
      else setDone(true);
    } catch (err) { setError(err.message); setSubmitting(false); }
  }

  /* ── Thank-you state ── */
  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className={fullWidth ? "w-full" : centered ? "mx-auto" : ""}
        style={{ maxWidth: 680 }}
      >
        <div style={{
          borderRadius: 24, overflow: "hidden",
          boxShadow: "0 32px 80px rgba(201,169,110,0.20)",
          border: "1px solid rgba(201,169,110,0.25)",
        }}>
          <div style={{ height: 4, background: "linear-gradient(90deg,#c9a96e,#d4a853,#fbbf24,#c9a96e)", backgroundSize:"200% 100%", animation:"_tb_shimmer 3.2s linear infinite" }} />
          <div style={{
            padding: "52px 40px", textAlign: "center",
            background: "linear-gradient(160deg,#0c0904,#0f0d0a)",
          }}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              style={{
                width: 64, height: 64, borderRadius: 20, margin: "0 auto 20px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(201,169,110,0.12)", border: "1px solid rgba(201,169,110,0.30)",
                boxShadow: "0 0 40px rgba(201,169,110,0.20)",
              }}>
              <Heart size={28} fill={ROSE} stroke={ROSE} />
            </motion.div>
            <p style={{
              fontFamily: "'Playfair Display',Georgia,serif",
              fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 900, fontStyle: "italic",
              background: `linear-gradient(135deg,#fff,${ROSE})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: 10,
            }}>
              Thank you!
            </p>
            <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              Your {freq === "monthly" ? "monthly " : ""}gift of{" "}
              <strong style={{ color: ROSE }}>${amount}</strong> makes a real difference.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.85, ease: EASE, delay }}
      className={fullWidth ? "w-full" : centered ? "mx-auto" : ""}
      style={{ width: "100%", maxWidth: 680 }}
    >
      <div className="_tb_donwrap" style={{
        display: "flex", flexDirection: "row",
        borderRadius: 20, overflow: "hidden",
        border: "1px solid rgba(201,169,110,0.18)",
        boxShadow: "0 28px 70px rgba(0,0,0,0.70), 0 0 60px -20px rgba(201,169,110,0.20)",
        background: "rgba(8,6,4,0.90)",
        backdropFilter: "blur(40px) saturate(180%)",
        position: "relative",
      }}>

        {/* ── LEFT: script / inspiration card — desktop only ─── */}
        {!isMobile && <div className="_tb_mktcol" style={{
          flex: "0 0 220px",
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "28px 22px", gap: 18, overflow: "hidden", position: "relative",
          borderRight: `1px solid ${A1}22`,
          background: `linear-gradient(155deg,#080502 0%,#120c04 30%,#0e0904 60%,#090601 100%)`,
        }}>
          {/* Gold glow layers */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none",
            background:`radial-gradient(ellipse 80% 55% at 22% 28%,rgba(201,169,110,0.18),transparent)` }} />
          <div style={{ position:"absolute", inset:0, pointerEvents:"none",
            background:`radial-gradient(ellipse 50% 40% at 85% 82%,rgba(180,83,9,0.14),transparent)` }} />

          {/* Floating orbs — gold/amber */}
          {[
            { x:12, y:10, size:55, c:"rgba(201,169,110,0.22)", dur:7.5,  anim:"_tb_float2" },
            { x:74, y:52, size:38, c:"rgba(180,83,9,0.18)",    dur:9.4,  anim:"_tb_float"  },
            { x:42, y:84, size:28, c:"rgba(251,191,36,0.16)",  dur:6.2,  anim:"_tb_float2" },
          ].map(({ x, y, size, c, dur, anim }, i) => (
            <div key={i} style={{
              position:"absolute", left:`${x}%`, top:`${y}%`,
              width:size, height:size, borderRadius:"50%",
              background:c, filter:"blur(22px)",
              animation:`${anim} ${dur}s ease-in-out infinite`,
              animationDelay:`${i*0.9}s`, pointerEvents:"none",
            }} />
          ))}

          {/* Dot grid — gold tinted */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            backgroundImage:"radial-gradient(circle,rgba(201,169,110,0.16) 1px,transparent 1px)",
            backgroundSize:"18px 18px",
            animation:"_tb_starfield 4s ease-in-out infinite",
          }} />

          {/* Badge */}
          <motion.div
            initial={{ opacity:0, y:-10, scale:0.9 }} animate={{ opacity:1, y:0, scale:1 }}
            transition={{ delay:delay+0.08, duration:0.7, ease:EASE }}
            style={{
              display:"inline-flex", alignItems:"center", gap:6, position:"relative", zIndex:1,
              padding:"4px 12px", borderRadius:99, width:"fit-content",
              background:"rgba(201,169,110,0.10)", border:"1px solid rgba(201,169,110,0.30)",
              backdropFilter:"blur(8px)", boxShadow:"0 2px 10px rgba(201,169,110,0.12)",
            }}>
            <span style={{
              width:5, height:5, borderRadius:"50%", background:"#c9a96e", flexShrink:0,
              boxShadow:"0 0 6px rgba(201,169,110,0.8)", animation:"_tb_pulse 1.8s ease-in-out infinite",
            }} />
            <span style={{ fontSize:8, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.2em", color:"rgba(201,169,110,0.85)" }}>
              Support Now
            </span>
          </motion.div>

          {/* Rotating quote */}
          <motion.div
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:delay+0.25, duration:0.7, ease:EASE }}
            style={{ minHeight:90, position:"relative", zIndex:1 }}
          >
            <p style={{
              fontFamily:"'Playfair Display','IM Fell English',Georgia,serif",
              fontSize:"clamp(13px,1.8vw,15.5px)", fontWeight:700, fontStyle:"italic",
              lineHeight:1.5, letterSpacing:"-0.01em",
              background:"linear-gradient(135deg,#fff 25%,#e8d5a3 55%,#c9a96e 85%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              backgroundClip:"text",
              transition:"opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)",
              opacity:quoteVis ? 1 : 0,
              transform:quoteVis ? "translateY(0) scale(1)" : "translateY(10px) scale(0.96)",
            }}>
              &ldquo;{QUOTES[quoteIdx].text}&rdquo;
            </p>
            <p style={{
              marginTop:8, fontSize:9, fontWeight:700, textTransform:"uppercase",
              letterSpacing:"0.15em", color:"rgba(201,169,110,0.45)",
              transition:"opacity 0.5s ease", opacity:quoteVis ? 1 : 0,
            }}>
              — {QUOTES[quoteIdx].author}
            </p>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
            transition={{ delay:delay+0.5, duration:0.55, ease:EASE }}
            style={{
              display:"flex", flexDirection:"column", gap:6,
              position:"relative", zIndex:1,
              padding:"10px 12px", borderRadius:10,
              background:"rgba(201,169,110,0.05)",
              border:"1px solid rgba(201,169,110,0.16)",
            }}
          >
            {[["💝","To organizer"],["🔒","Stripe secure"],["↩️","Cancel anytime"]].map(([e,l]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:11 }}>{e}</span>
                <span style={{ fontSize:10, fontWeight:500, color:"rgba(255,255,255,0.42)" }}>{l}</span>
              </div>
            ))}
          </motion.div>

          {/* Shimmer bottom */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, height:2,
            background:`linear-gradient(90deg,transparent,${A1},${A3},transparent)`,
            backgroundSize:"200% 100%", animation:"_tb_shimmer 2.8s linear infinite",
          }} />
        </div>}

        {/* ── RIGHT: donation form ─────────────────────────────── */}
        <div style={{ flex:1, overflow:"hidden" }}>
          {/* Accent top bar */}
          <div style={{
            height:4,
            background:"linear-gradient(90deg,#c9a96e,#d4a853,#fbbf24,#c9a96e)",
            backgroundSize:"200% 100%",
            animation:"_tb_shimmer 3.2s linear infinite",
          }} />

          <form
            onSubmit={isEditor ? (e) => e.preventDefault() : handleDonate}
            className="_tb_donform"
            style={{ display:"flex", flexDirection:"column", gap:14, padding:"20px 22px 22px" }}
          >
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:36, height:36, borderRadius:10, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                background:"rgba(201,169,110,0.14)", border:"1px solid rgba(201,169,110,0.30)",
              }}>
                <Heart size={16} fill={ROSE} stroke={ROSE} />
              </div>
              <div>
                <p style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.2em", color:"rgba(201,169,110,0.75)" }}>
                  Support this event
                </p>
                <p style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.85)", lineHeight:1.3 }}>
                  {donConfig.message || "Every contribution makes a difference."}
                </p>
              </div>
            </div>

            {/* Frequency toggle */}
            <div className="_tb_donfreq" style={{
              display:"flex", borderRadius:10, padding:3, gap:3,
              background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.10)",
            }}>
              {[["once","One Time"],["monthly","Monthly"]].map(([val,label]) => (
                <button key={val} type="button"
                  onClick={isEditor ? undefined : () => setFreq(val)}
                  style={{
                    flex:1, borderRadius:7, padding:"7px 0",
                    fontSize:11, fontWeight:800, letterSpacing:"0.05em", textTransform:"uppercase",
                    cursor:"pointer", transition:"all 0.22s ease", border:"none",
                    background: freq===val ? `linear-gradient(135deg,${ROSE},#d4a853)` : "transparent",
                    color: freq===val ? "#fff" : "rgba(255,255,255,0.38)",
                    boxShadow: freq===val ? `0 4px 12px rgba(201,169,110,0.28)` : "none",
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Preset amounts */}
            <div className="_tb_donpresets" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {presets.map((a) => (
                <button key={a} type="button"
                  onClick={isEditor ? undefined : () => { setPreset(a); setCustom(""); setError(""); }}
                  style={{
                    padding:"14px 4px", borderRadius:12, cursor:"pointer",
                    fontFamily:"'Playfair Display',Georgia,serif",
                    fontSize:"clamp(1.1rem,2vw,1.4rem)", fontWeight:700,
                    transition:"all 0.22s ease", border:"none",
                    background: preset===a
                      ? `linear-gradient(135deg,${ROSE},#d4a853)`
                      : "rgba(255,255,255,0.06)",
                    color: preset===a ? "#fff" : "rgba(255,255,255,0.60)",
                    boxShadow: preset===a ? `0 6px 20px rgba(201,169,110,0.25)` : "none",
                    transform: preset===a ? "scale(1.04)" : "scale(1)",
                    border: preset===a ? "none" : "1px solid rgba(255,255,255,0.10)",
                  }}>
                  ${a}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{
              display:"flex", alignItems:"center", gap:8, borderRadius:10, padding:"10px 14px",
              background:"rgba(255,255,255,0.05)",
              border: preset==="custom" ? `1.5px solid ${ROSE}` : "1px solid rgba(255,255,255,0.10)",
              transition:"border-color 0.2s",
            }}>
              <span style={{ fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.35)" }}>$</span>
              <input type="number" min="1"
                value={preset==="custom" ? custom : ""}
                placeholder="Other amount"
                onFocus={isEditor ? undefined : () => setPreset("custom")}
                onChange={(e) => { setPreset("custom"); setCustom(e.target.value); setError(""); }}
                style={{
                  flex:1, background:"transparent", border:"none", outline:"none",
                  fontSize:13, fontWeight:600,
                  color:"rgba(255,255,255,0.80)",
                }}
              />
            </div>

            {/* Name (optional) */}
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name (optional)"
              style={{
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)",
                borderRadius:10, padding:"9px 14px", fontSize:12, fontWeight:500,
                color:"rgba(255,255,255,0.70)", outline:"none",
              }}
            />

            {error && (
              <p style={{ fontSize:11, fontWeight:600, color:ROSE }}>{error}</p>
            )}

            {/* CTA */}
            <button type="submit" disabled={submitting || isEditor}
              style={{
                width:"100%", padding:"14px 0", borderRadius:12,
                border:"none", cursor: submitting || isEditor ? "not-allowed" : "pointer",
                fontSize:12, fontWeight:900, letterSpacing:"0.08em", textTransform:"uppercase",
                background: `linear-gradient(135deg,${ROSE},#d4a853)`,
                color:"#fff",
                boxShadow:`0 8px 24px rgba(201,169,110,0.30)`,
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                opacity: submitting ? 0.65 : 1,
                transition:"all 0.22s ease",
              }}
              onMouseEnter={e => { if (!submitting && !isEditor) e.currentTarget.style.transform="scale(1.02)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
            >
              {submitting
                ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                : <><Heart size={13} fill="#fff" stroke="#fff" />
                    {freq==="monthly" ? "Give Monthly" : "Donate Now"}
                    {amount>0 ? ` — $${amount}` : ""}</>
              }
            </button>

            <p style={{
              textAlign:"center", fontSize:9, fontWeight:600,
              color:"rgba(255,255,255,0.20)", textTransform:"uppercase", letterSpacing:"0.12em",
              display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            }}>
              <Lock size={8} strokeWidth={2.5} /> Secured by Stripe
            </p>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Combined CTA area: renders all enabled features independently ─────────────

function CtaArea({ showTicketBlock, showRsvpBlock, showDonationBlock, centered, delay, event, isEditor, ctaText, priceLabel, spotsLeft, hasLimit, ticketCount, isSoldOut, isUrgent, onRsvp, onBuyTickets }) {
  if (!showTicketBlock && !showRsvpBlock && !showDonationBlock) return null;

  const donationOnly = showDonationBlock && !showTicketBlock && !showRsvpBlock;

  return (
    <div className={`flex flex-col gap-4 ${donationOnly ? "w-full" : centered ? "items-center" : "items-start"}`}>
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
          fullWidth={donationOnly}
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
  // Always show "From $X" — cleaner in the hero card regardless of how many tiers exist
  return `From ${formatPrice(min, currency)}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HeroSection({ section, event, isEditor = false, onEdit }) {
  const config = section.config || {};
  const theme  = config._theme || "CLASSIC";

  // In public/preview mode fall back to the event's own data when sections are empty
  const bgImg  = config.background_image || (!isEditor && event?.cover_image_url) || null;

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

  // Independent show flags â€" each feature is separate
  const showTicketBlock   = isEditor ? !!event?.allow_ticketing : isTicketed;
  const showRsvpBlock     = false; // RSVP is handled exclusively by the sticky panel
  const showDonationBlock = !!event?.allow_donations;

  function handleRsvp() {
    window.dispatchEvent(new CustomEvent("open-rsvp-panel"));
  }
  function handleBuyTickets() {
    const inPageSection = document.getElementById("tickets");
    if (inPageSection) {
      inPageSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (event?.slug) {
      window.location.href = `/e/${event.slug}/tickets`;
    }
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
        className={`relative flex min-h-screen flex-col justify-start overflow-visible ${textAlignClass} ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: bg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {bgImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bgImg} alt="" aria-hidden="true" fetchPriority="high"
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
        )}
        {bgImg ? (
          <motion.div className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImg})`, transformOrigin: "center center" }}
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

        <div className={`relative z-10 mx-auto w-full max-w-5xl px-6 pt-20 pb-16 flex flex-col gap-8 sm:pt-28 sm:pb-24 ${textAlignClass}`}>
          {config.eyebrow && (
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.2 }}
              style={{ color: "var(--t-accent)", fontSize: "0.65rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.55em" }}>
              {config.eyebrow}
            </motion.p>
          )}
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE, delay: 0.35 }} style={headingStyle}>
            {section.title || (!isEditor && event?.title) || "Welcome"}
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
        className={`relative flex min-h-screen flex-col justify-start overflow-visible ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: bg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {bgImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bgImg} alt="" aria-hidden="true" fetchPriority="high"
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
        )}
        {bgImg && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImg})` }} aria-hidden="true" />
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
            {section.title || (!isEditor && event?.title) || "Welcome"}
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
        className={`relative flex min-h-screen flex-col justify-start overflow-visible ${textAlignClass} ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: bg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {bgImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bgImg} alt="" aria-hidden="true" fetchPriority="high"
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
        )}
        {bgImg && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImg})` }} aria-hidden="true" />
        )}
        <div className="absolute inset-0" style={{ background: overlayGrad }} aria-hidden="true" />

        <div className={`relative z-10 mx-auto w-full max-w-4xl px-8 pt-20 pb-16 flex flex-col gap-8 sm:pt-28 sm:pb-24 ${textAlignClass}`}>
          {config.eyebrow && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.1 }}
              style={{ color: "var(--t-accent)", fontSize: "0.6rem", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.6em" }}>
              {config.eyebrow}
            </motion.p>
          )}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.2 }} style={headingStyle}>
            {section.title || (!isEditor && event?.title) || "Welcome"}
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
        className={`relative flex min-h-screen flex-col justify-start overflow-visible ${textAlignClass} ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: bg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {bgImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bgImg} alt="" aria-hidden="true" fetchPriority="high"
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
        )}
        {bgImg && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImg})` }} aria-hidden="true" />
        )}
        <div className="absolute inset-0" style={{ background: overlayGrad }} aria-hidden="true" />

        <div className={`relative z-10 mx-auto w-full max-w-5xl px-6 pt-20 pb-16 flex flex-col gap-6 sm:pt-28 sm:pb-24 ${textAlignClass}`}>
          {config.eyebrow && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
              style={{ color: "var(--t-accent)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4em" }}>
              {config.eyebrow}
            </motion.p>
          )}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.25 }} style={headingStyle}>
            {section.title || (!isEditor && event?.title) || "Welcome"}
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
      className={`relative flex min-h-screen flex-col justify-start overflow-visible ${textAlignClass} ${isEditor ? "cursor-pointer" : ""}`}
      style={{ background: bg }}
      onClick={isEditor ? onEdit : undefined}
    >
      {bgImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bgImg} alt="" aria-hidden="true" fetchPriority="high"
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
      )}
      {bgImg && (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImg})` }} aria-hidden="true" />
      )}
      <div className="absolute inset-0" style={{ background: overlayGrad }} aria-hidden="true" />
      {showOrnament && (
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "var(--t-accent)", opacity: 0.3 }} aria-hidden="true" />
      )}

      <div className={`relative z-10 mx-auto w-full max-w-5xl px-6 pt-20 pb-16 flex flex-col gap-6 sm:pt-28 sm:pb-24 ${textAlignClass}`}>
        {config.eyebrow && (
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
            style={{ color: "var(--t-accent)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4em" }}>
            {config.eyebrow}
          </motion.p>
        )}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.25 }} style={headingStyle}>
          {section.title || (!isEditor && event?.title) || "Welcome"}
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
