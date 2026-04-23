"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

// ── Confetti shapes for FUN theme ─────────────────────────────────────────────
const CONFETTI = [
  { shape: "circle", color: "#F59E0B", x: "8%",  y: "15%", size: 14, dur: 3.2, delay: 0 },
  { shape: "circle", color: "#EF4444", x: "92%", y: "20%", size: 10, dur: 2.8, delay: 0.4 },
  { shape: "square", color: "#3B82F6", x: "18%", y: "70%", size: 12, dur: 3.5, delay: 0.8 },
  { shape: "square", color: "#10B981", x: "80%", y: "65%", size: 9,  dur: 2.6, delay: 1.2 },
  { shape: "circle", color: "#8B5CF6", x: "50%", y: "10%", size: 8,  dur: 4.0, delay: 0.3 },
  { shape: "circle", color: "#F59E0B", x: "72%", y: "80%", size: 11, dur: 3.0, delay: 0.7 },
  { shape: "square", color: "#EC4899", x: "35%", y: "78%", size: 10, dur: 3.8, delay: 1.5 },
  { shape: "circle", color: "#06B6D4", x: "62%", y: "12%", size: 7,  dur: 2.9, delay: 0.6 },
  { shape: "star",   color: "#F59E0B", x: "25%", y: "30%", size: 16, dur: 4.2, delay: 0.2 },
  { shape: "star",   color: "#EF4444", x: "85%", y: "42%", size: 12, dur: 3.6, delay: 1.0 },
];

function StarShape({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} opacity={0.7}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

export default function HeroSection({ section, isEditor = false, onEdit }) {
  const config         = section.config || {};
  const theme          = config._theme || "CLASSIC";
  const overlayOpacity = (config.overlay_opacity ?? 50) / 100;
  const align          = config.headline_align || (theme === "MODERN" ? "left" : "center");
  const isLeft         = align === "left";
  const isRight        = align === "right";

  const textAlignClass = isLeft
    ? "text-left items-start"
    : isRight
    ? "text-right items-end"
    : "text-center items-center";

  const [hasToken] = useState(() =>
    typeof window !== "undefined"
      ? !!new URLSearchParams(window.location.search).get("token")
      : false
  );

  const handleRsvp = () => window.dispatchEvent(new CustomEvent("open-rsvp-panel"));

  // ── Per-theme default background when no image is set ──────────────────────
  const defaultBg = {
    CLASSIC: "linear-gradient(160deg, #1a1611 0%, #2d2416 50%, #1a1611 100%)",
    ELEGANT: "linear-gradient(160deg, #1a0f0a 0%, #271a14 50%, #1a0f0a 100%)",
    MODERN:  "linear-gradient(135deg, #06060e 0%, #0a0a14 60%, #0f0f24 100%)",
    MINIMAL: "linear-gradient(180deg, #111111 0%, #1a1a1a 100%)",
    LUXURY:  "linear-gradient(160deg, #060504 0%, #0d0c0a 50%, #060504 100%)",
    FUN:     "linear-gradient(135deg, #1c1407 0%, #2d2b08 60%, #1c1407 100%)",
  }[theme] || "linear-gradient(160deg, #1a1611 0%, #2d2416 50%, #1a1611 100%)";

  // ── Per-theme heading typography ───────────────────────────────────────────
  const headingStyle = {
    fontFamily: "var(--t-font-heading)",
    color: "#ffffff",
    ...(theme === "MODERN"
      ? { fontStyle: "normal", fontWeight: 900, fontSize: "clamp(3rem, 8vw, 6.5rem)", letterSpacing: "-0.03em", lineHeight: 0.95, textTransform: "uppercase" }
      : theme === "FUN"
      ? { fontStyle: "normal", fontWeight: 800, fontSize: "clamp(2.75rem, 7vw, 5.5rem)", letterSpacing: "-0.01em", lineHeight: 1.0 }
      : theme === "MINIMAL"
      ? { fontStyle: "normal", fontWeight: 300, fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "0.04em", lineHeight: 1.2 }
      : theme === "LUXURY"
      ? { fontStyle: "italic", fontWeight: 700, fontSize: "clamp(3rem, 7.5vw, 6rem)", letterSpacing: "0.01em", lineHeight: 1.05 }
      : { fontStyle: "italic", fontWeight: 700, fontSize: "clamp(2.75rem, 7vw, 5.5rem)", letterSpacing: "-0.01em", lineHeight: 1.1 }),
  };

  const showOrnament = theme === "CLASSIC" || theme === "ELEGANT" || theme === "LUXURY";

  // ── Overlay gradient — left-biased for MODERN left-align ──────────────────
  const overlayGradient = isLeft
    ? `linear-gradient(to right, rgba(0,0,0,${overlayOpacity + 0.2}) 0%, rgba(0,0,0,${overlayOpacity * 0.6}) 55%, rgba(0,0,0,${overlayOpacity * 0.2}) 100%)`
    : theme === "LUXURY"
    ? `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity * 0.6}) 0%, rgba(0,0,0,${overlayOpacity * 0.4}) 40%, rgba(0,0,0,${overlayOpacity * 0.5}) 70%, rgba(0,0,0,${overlayOpacity + 0.25}) 100%)`
    : `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity + 0.1}) 0%, rgba(0,0,0,${overlayOpacity * 0.5}) 40%, rgba(0,0,0,${overlayOpacity * 0.5}) 60%, rgba(0,0,0,${overlayOpacity + 0.15}) 100%)`;

  // ── MINIMAL: Single-column, sparse layout ─────────────────────────────────
  if (theme === "MINIMAL") {
    return (
      <section
        aria-label="Event hero"
        className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: config.background_color || defaultBg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {config.background_image && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${config.background_image})`, opacity: 0.3 }} aria-hidden="true" />
        )}
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayOpacity + 0.2})` }} aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-2xl px-8 py-40 text-center">
          {config.eyebrow && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.1 }}
              style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.65rem", letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: "2.5rem" }}>
              {config.eyebrow}
            </motion.p>
          )}
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease, delay: 0.2 }} style={headingStyle}>
            {section.title || "Welcome"}
          </motion.h1>
          {section.body && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.5 }}
              className="mx-auto mt-10 max-w-sm text-base leading-loose" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}>
              {section.body}
            </motion.p>
          )}
          {config.show_cta && (isEditor || hasToken) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-14">
              <button
                onClick={!isEditor ? handleRsvp : undefined}
                className="border bg-transparent text-xs font-light uppercase tracking-[0.4em] text-white/70 transition hover:text-white hover:border-white/60 px-10 py-4"
                style={{ border: "1px solid rgba(255,255,255,0.25)" }}
              >
                {config.cta_text || "RSVP"}
              </button>
            </motion.div>
          )}
        </div>

        {isEditor && <EditorBadge />}
      </section>
    );
  }

  // ── MODERN: Full-screen, hard left-aligned, ultra-bold ─────────────────────
  if (theme === "MODERN") {
    return (
      <section
        aria-label="Event hero"
        className={`relative flex min-h-screen flex-col justify-end overflow-hidden pb-24 sm:pb-32 ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: config.background_color || defaultBg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {config.background_image && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${config.background_image})` }} aria-hidden="true" />
        )}
        <div className="absolute inset-0" style={{ background: overlayGradient }} aria-hidden="true" />

        {/* Top-left eyebrow */}
        <div className="absolute top-8 left-8 z-10">
          {config.eyebrow && (
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease, delay: 0.1 }}
              style={{ color: "var(--t-accent)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase" }}>
              {config.eyebrow}
            </motion.p>
          )}
        </div>

        {/* Bottom-left content */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6 h-1 w-16" style={{ background: "var(--t-accent)" }} aria-hidden="true" />

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease, delay: 0.25 }} style={headingStyle}>
            {section.title || "Welcome"}
          </motion.h1>

          {section.body && (
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.45 }}
              className="mt-6 max-w-lg text-base sm:text-lg" style={{ color: "rgba(255,255,255,0.55)", fontWeight: 400 }}>
              {section.body}
            </motion.p>
          )}

          {config.show_cta && (isEditor || hasToken) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.6 }} className="mt-10">
              <button
                onClick={!isEditor ? handleRsvp : undefined}
                className="w-full max-w-xs text-sm font-bold uppercase tracking-[0.2em] text-white transition active:scale-95 sm:w-auto"
                style={{ background: "var(--t-accent)", color: "#000", padding: "1rem 2.5rem", borderRadius: "var(--t-radius, 3px)" }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                {config.cta_text || "Register Now"}
              </button>
            </motion.div>
          )}
        </div>

        {isEditor && <EditorBadge />}
      </section>
    );
  }

  // ── FUN: Full-screen with floating confetti shapes ─────────────────────────
  if (theme === "FUN") {
    return (
      <section
        aria-label="Event hero"
        className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${textAlignClass} ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: config.background_color || defaultBg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {config.background_image && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${config.background_image})` }} aria-hidden="true" />
        )}
        <div className="absolute inset-0" style={{ background: overlayGradient }} aria-hidden="true" />

        {/* Floating confetti */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {CONFETTI.map((c, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: c.x, top: c.y, opacity: 0.65 }}
              animate={{ y: [-12, 12, -12], rotate: [0, 180, 360] }}
              transition={{ duration: c.dur, repeat: Infinity, ease: "easeInOut", delay: c.delay }}
            >
              {c.shape === "star"
                ? <StarShape size={c.size} color={c.color} />
                : c.shape === "square"
                ? <div style={{ width: c.size, height: c.size, background: c.color, borderRadius: 2, opacity: 0.7, transform: "rotate(15deg)" }} />
                : <div style={{ width: c.size, height: c.size, borderRadius: "50%", background: c.color, opacity: 0.7 }} />
              }
            </motion.div>
          ))}
        </div>

        <div className={`relative z-10 mx-auto w-full max-w-4xl px-6 py-32 flex flex-col gap-6 sm:py-40 ${textAlignClass}`}>
          {config.eyebrow && (
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.1 }}
              style={{ color: "var(--t-accent)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" }}>
              {config.eyebrow}
            </motion.p>
          )}

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease, delay: 0.25 }} style={headingStyle}>
            {section.title || "Welcome"}
          </motion.h1>

          {section.body && (
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, ease, delay: 0.45 }}
              className="max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "rgba(255,255,255,0.7)" }}>
              {section.body}
            </motion.p>
          )}

          {config.show_cta && (isEditor || hasToken) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, ease, delay: 0.65 }}
              className="flex flex-wrap gap-4 mt-2">
              <button
                onClick={!isEditor ? handleRsvp : undefined}
                className="text-sm font-bold uppercase tracking-[0.15em] text-white transition active:scale-95"
                style={{
                  border: "2px solid #fff",
                  background: "var(--t-accent)",
                  color: "#1a1407",
                  padding: "0.9rem 2.5rem",
                  borderRadius: "var(--t-radius, 12px)",
                  boxShadow: "5px 5px 0px rgba(0,0,0,0.5)",
                }}
              >
                {config.cta_text || "Let's Go! 🎉"}
              </button>
            </motion.div>
          )}
        </div>

        {/* Scroll indicator: bouncing chevron */}
        {!isEditor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
            <motion.svg animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </motion.svg>
          </motion.div>
        )}

        {isEditor && <EditorBadge />}
      </section>
    );
  }

  // ── LUXURY: Full-screen with Ken Burns slow-zoom effect ─────────────────────
  if (theme === "LUXURY") {
    return (
      <section
        aria-label="Event hero"
        className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${textAlignClass} ${isEditor ? "cursor-pointer" : ""}`}
        style={{ background: config.background_color || defaultBg }}
        onClick={isEditor ? onEdit : undefined}
      >
        {/* Ken Burns animated background */}
        {config.background_image ? (
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${config.background_image})`, transformOrigin: "center center" }}
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            aria-hidden="true"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: defaultBg }} aria-hidden="true" />
        )}

        {/* Multi-layer luxury overlay */}
        <div className="absolute inset-0" style={{ background: overlayGradient }} aria-hidden="true" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)" }} aria-hidden="true" />

        {/* Top & bottom gold accent lines */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "var(--t-accent)", opacity: 0.35 }} aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: "var(--t-accent)", opacity: 0.25 }} aria-hidden="true" />

        <div className={`relative z-10 mx-auto w-full max-w-5xl px-6 py-40 flex flex-col gap-8 sm:py-52 ${textAlignClass}`}>
          {config.eyebrow && (
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease, delay: 0.2 }}
              style={{ color: "var(--t-accent)", fontSize: "0.65rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.55em" }}>
              {config.eyebrow}
            </motion.p>
          )}

          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease, delay: 0.35 }} style={headingStyle}>
            {section.title || "Welcome"}
          </motion.h1>

          {/* Gold ornament */}
          <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 1, ease, delay: 0.55 }}
            className={`flex items-center gap-3 w-32 ${!isLeft && !isRight ? "mx-auto" : ""}`} aria-hidden="true">
            <div className="h-px flex-1" style={{ background: "var(--t-accent)", opacity: 0.6 }} />
            <div className="h-1.5 w-1.5 rotate-45" style={{ background: "var(--t-accent)" }} />
            <div className="h-px flex-1" style={{ background: "var(--t-accent)", opacity: 0.6 }} />
          </motion.div>

          {section.body && (
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.65 }}
              className="max-w-lg text-base leading-loose sm:text-lg" style={{ color: "rgba(255,255,255,0.58)", fontStyle: "italic" }}>
              {section.body}
            </motion.p>
          )}

          {config.show_cta && (isEditor || hasToken) && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.8 }} className="mt-2">
              <button
                onClick={!isEditor ? handleRsvp : undefined}
                className="text-sm font-medium uppercase tracking-[0.35em] text-white transition active:scale-95"
                style={{ border: "1px solid rgba(255,255,255,0.55)", background: "transparent", padding: "1rem 3rem", borderRadius: "var(--t-radius, 0px)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.55)"; e.currentTarget.style.color = "#fff"; }}
              >
                {config.cta_text || "Confirm Attendance"}
              </button>
            </motion.div>
          )}
        </div>

        {/* Scroll indicator */}
        {!isEditor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" aria-hidden="true">
            <span className="text-[9px] uppercase tracking-[0.5em]" style={{ color: "rgba(255,255,255,0.25)" }}>Scroll</span>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="h-10 w-px" style={{ background: `linear-gradient(to bottom, var(--t-accent), transparent)`, opacity: 0.5 }} />
          </motion.div>
        )}

        {isEditor && <EditorBadge />}
      </section>
    );
  }

  // ── CLASSIC / ELEGANT: Centered with serif heading and ornament ────────────
  return (
    <section
      aria-label="Event hero"
      className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${textAlignClass} ${isEditor ? "cursor-pointer" : ""}`}
      style={{ background: config.background_color || defaultBg }}
      onClick={isEditor ? onEdit : undefined}
    >
      {config.background_image && (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${config.background_image})` }} aria-hidden="true" />
      )}
      <div className="absolute inset-0" style={{ background: overlayGradient }} aria-hidden="true" />

      {showOrnament && (
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "var(--t-accent)", opacity: 0.3 }} aria-hidden="true" />
      )}

      <div className={`relative z-10 mx-auto w-full max-w-5xl px-6 py-32 flex flex-col gap-6 sm:py-44 ${textAlignClass}`}>
        {config.eyebrow && (
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.1 }}
            style={{ color: "var(--t-accent)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4em" }}>
            {config.eyebrow}
          </motion.p>
        )}

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.25 }} style={headingStyle}>
          {section.title || "Welcome"}
        </motion.h1>

        {section.body && (
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.45 }}
            className="max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>
            {section.body}
          </motion.p>
        )}

        {showOrnament && (
          <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.8, ease, delay: 0.55 }}
            className={`flex items-center gap-3 w-24 ${!isLeft && !isRight ? "mx-auto" : ""}`} aria-hidden="true">
            <div className="h-px flex-1" style={{ background: "var(--t-accent)", opacity: 0.6 }} />
            <div className="h-1.5 w-1.5 rotate-45" style={{ background: "var(--t-accent)" }} />
            <div className="h-px flex-1" style={{ background: "var(--t-accent)", opacity: 0.6 }} />
          </motion.div>
        )}

        {config.show_cta && (isEditor || hasToken) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.65 }}
            className="flex flex-wrap gap-4 mt-2">
            <button
              onClick={!isEditor ? handleRsvp : undefined}
              className="text-sm font-medium uppercase tracking-[0.2em] text-white transition active:scale-95"
              style={{ border: "1px solid rgba(255,255,255,0.7)", background: "transparent", padding: "0.875rem 2.5rem", borderRadius: "var(--t-radius, 0px)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {config.cta_text || "Confirm Attendance"}
            </button>
          </motion.div>
        )}
      </div>

      {/* Scroll indicator */}
      {!isEditor && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" aria-hidden="true">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.35)" }}>Scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="h-8 w-px" style={{ background: `linear-gradient(to bottom, var(--t-accent), transparent)`, opacity: 0.6 }} />
        </motion.div>
      )}

      {isEditor && <EditorBadge />}
    </section>
  );
}

function EditorBadge() {
  return (
    <div className="absolute right-3 top-3 z-20 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
      HERO
    </div>
  );
}
