"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Navigation, Building2, Car, Copy, Check,
  ExternalLink, ChevronDown,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

// ── Animation ─────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────
function Ornament({ center = false }) {
  return (
    <div className={`mt-6 flex w-20 items-center gap-2 ${center ? "mx-auto" : ""}`} aria-hidden="true">
      <div className="h-px flex-1" style={{ background: "var(--t-accent)", opacity: 0.5 }} />
      <div className="h-1.5 w-1.5 rotate-45" style={{ background: "var(--t-accent)" }} />
      <div className="h-px flex-1" style={{ background: "var(--t-accent)", opacity: 0.5 }} />
    </div>
  );
}

function SectionEyebrow({ children, center = false, light = false }) {
  return (
    <p className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.4em] ${center ? "text-center" : ""}`}
      style={{ color: light ? "var(--t-accent)" : "var(--t-accent)" }}>
      {children}
    </p>
  );
}

function SectionHeading({ children, center = false, light = false, className = "" }) {
  return (
    <h2 className={`text-4xl font-bold leading-tight tracking-tight sm:text-5xl ${center ? "mx-auto text-center" : ""} ${className}`}
      style={{ fontFamily: "var(--t-font-heading)", color: light ? "#ffffff" : "var(--t-text)" }}>
      {children}
    </h2>
  );
}

function SectionBody({ children, center = false, light = false }) {
  return (
    <p className={`mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${center ? "mx-auto text-center" : ""}`}
      style={{ color: light ? "rgba(255,255,255,0.58)" : "var(--t-text-muted)" }}>
      {children}
    </p>
  );
}

function EditorBadge({ label }) {
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
      {label}
    </div>
  );
}

// ── Per-theme section padding ─────────────────────────────────────────────────
function getThemePad(theme) {
  return {
    CLASSIC: "py-24 sm:py-36",
    ELEGANT: "py-28 sm:py-40",
    MODERN:  "py-16 sm:py-24",
    MINIMAL: "py-36 sm:py-52",
    LUXURY:  "py-28 sm:py-44",
    FUN:     "py-16 sm:py-24",
  }[theme] || "py-24 sm:py-32";
}

// ── Base section wrapper ──────────────────────────────────────────────────────
function SectionWrap({ bg = "var(--t-bg)", children, className = "", onClick, isEditor, pad }) {
  const paddingCls = pad || "py-24 sm:py-32";
  return (
    <section
      className={`relative overflow-hidden px-6 ${paddingCls} ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""} ${className}`}
      style={{ background: bg, color: "var(--t-text)" }}
      onClick={isEditor ? onClick : undefined}
    >
      {children}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ABOUT
// ══════════════════════════════════════════════════════════════════════════════
export function AboutSection({ section, isEditor = false, onEdit }) {
  const theme = section.config?._theme || "CLASSIC";
  const pad   = getThemePad(theme);

  // ── MODERN: Left-aligned card with thick accent left-border ──────────────
  if (theme === "MODERN") {
    return (
      <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-6xl">
          <FadeUp>
            <div className="grid gap-12 md:grid-cols-12 md:items-start">
              {/* Left: label column */}
              <div className="md:col-span-3">
                <div className="h-1 w-10 mb-4" style={{ background: "var(--t-accent)" }} />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--t-accent)" }}>About</p>
              </div>
              {/* Right: content */}
              <div className="md:col-span-9 pl-0 md:pl-6" style={{ borderLeft: "3px solid var(--t-accent)" }}>
                <h2 className="text-4xl font-black sm:text-5xl leading-none uppercase" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)", letterSpacing: "-0.02em" }}>
                  {section.title || "About This Event"}
                </h2>
                <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--t-text-muted)" }}>
                  {section.body || "Add your event description here."}
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
        {isEditor && <EditorBadge label="ABOUT" />}
      </SectionWrap>
    );
  }

  // ── MINIMAL: Ultra-centered, narrow, extreme whitespace, no decorations ───
  if (theme === "MINIMAL") {
    return (
      <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-lg text-center">
          <FadeUp>
            <p className="mb-6 text-[10px] uppercase tracking-[0.5em]" style={{ color: "var(--t-text-muted)" }}>About</p>
            <h2 className="text-4xl font-light sm:text-5xl" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)", letterSpacing: "0.01em" }}>
              {section.title || "About This Event"}
            </h2>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="mx-auto mt-10 text-base leading-loose" style={{ color: "var(--t-text-muted)" }}>
              {section.body || "Add your event description here."}
            </p>
          </FadeUp>
        </div>
        {isEditor && <EditorBadge label="ABOUT" />}
      </SectionWrap>
    );
  }

  // ── LUXURY: Dark bg, centered, top + bottom gold rule lines ──────────────
  if (theme === "LUXURY") {
    return (
      <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        {/* Top rule */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "var(--t-accent)", opacity: 0.2 }} aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: "var(--t-accent)", opacity: 0.12 }} aria-hidden="true" />

        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <SectionEyebrow center>About</SectionEyebrow>
            <SectionHeading center>{section.title || "About This Event"}</SectionHeading>
            <Ornament center />
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="mx-auto mt-10 max-w-2xl text-lg leading-loose italic" style={{ color: "var(--t-text-muted)" }}>
              {section.body || "Add your event description here."}
            </p>
          </FadeUp>
        </div>
        {isEditor && <EditorBadge label="ABOUT" />}
      </SectionWrap>
    );
  }

  // ── FUN: Bright bg, bold, rounded card, accent chunk ─────────────────────
  if (theme === "FUN") {
    return (
      <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-5xl">
          <FadeUp>
            <div className="rounded-3xl p-10 sm:p-14" style={{ background: "var(--t-bg-alt)", boxShadow: "6px 6px 0px var(--t-accent)" }}>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--t-accent)" }}>✦ About</p>
              <h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>
                {section.title || "About This Event"}
              </h2>
              <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--t-text-muted)" }}>
                {section.body || "Add your event description here."}
              </p>
            </div>
          </FadeUp>
        </div>
        {isEditor && <EditorBadge label="ABOUT" />}
      </SectionWrap>
    );
  }

  // ── ELEGANT: Narrow text with wide margins, airy ─────────────────────────
  if (theme === "ELEGANT") {
    return (
      <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-3 md:col-start-2">
              <FadeUp>
                <SectionEyebrow>About</SectionEyebrow>
                <div className="h-px w-12 mt-6" style={{ background: "var(--t-accent)", opacity: 0.5 }} />
              </FadeUp>
            </div>
            <div className="md:col-span-6">
              <FadeUp delay={0.1}>
                <SectionHeading>{section.title || "About This Event"}</SectionHeading>
                <p className="mt-8 text-lg leading-relaxed" style={{ color: "var(--t-text-muted)" }}>
                  {section.body || "Add your event description here."}
                </p>
              </FadeUp>
            </div>
          </div>
        </div>
        {isEditor && <EditorBadge label="ABOUT" />}
      </SectionWrap>
    );
  }

  // ── CLASSIC: Centered, ornament divider, symmetric ───────────────────────
  return (
    <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
      {/* Top divider */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-px w-1/2" style={{ background: "var(--t-border)" }} />
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <FadeUp>
          <SectionEyebrow center>About</SectionEyebrow>
          <SectionHeading center>{section.title || "About This Event"}</SectionHeading>
          <Ornament center />
        </FadeUp>
        <FadeUp delay={0.15}>
          <p className="mx-auto mt-10 max-w-2xl text-lg leading-relaxed" style={{ color: "var(--t-text-muted)" }}>
            {section.body || "Add your event description here."}
          </p>
        </FadeUp>
      </div>
      {/* Bottom divider */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-px w-1/2" style={{ background: "var(--t-border)" }} />
      </div>
      {isEditor && <EditorBadge label="ABOUT" />}
    </SectionWrap>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STORY (unchanged layout but theme-aware)
// ══════════════════════════════════════════════════════════════════════════════
export function StorySection({ section, isEditor = false, onEdit }) {
  const config     = section.config || {};
  const theme      = config._theme || "CLASSIC";
  const pad        = getThemePad(theme);
  const imageRight = config.image_position === "right";

  const imagePanel = (
    <FadeUp delay={0.1} className="relative aspect-[3/4] w-full overflow-hidden" style={{ borderRadius: theme === "FUN" ? 16 : 0 }}>
      {config.story_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={config.story_image} alt="Our Story" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center" style={{ background: "var(--t-bg-alt)" }}>
          <svg className="h-10 w-10" style={{ color: "var(--t-border)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5" />
          </svg>
          {isEditor && <p className="mt-3 text-xs" style={{ color: "var(--t-text-muted)" }}>Upload a photo</p>}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset" style={{ borderColor: "var(--t-accent-dim, rgba(201,169,110,0.2))" }} aria-hidden="true" />
    </FadeUp>
  );

  const textPanel = (
    <FadeUp delay={0.25} className="flex flex-col justify-center">
      <SectionEyebrow>Our Story</SectionEyebrow>
      <SectionHeading>{section.title || "How It All Began"}</SectionHeading>
      {theme !== "MODERN" && theme !== "MINIMAL" && <Ornament />}
      <p className="mt-8 text-lg leading-relaxed" style={{ color: "var(--t-text-muted)" }}>
        {section.body || (isEditor ? "Share the story of how you met…" : "")}
      </p>
      {config.quote && (
        <blockquote className="mt-8 pl-6 text-xl italic" style={{ borderLeft: `3px solid var(--t-accent)`, fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>
          &ldquo;{config.quote}&rdquo;
        </blockquote>
      )}
    </FadeUp>
  );

  return (
    <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad}>
      <div className={`relative mx-auto grid max-w-6xl gap-16 md:grid-cols-2 md:items-center ${imageRight ? "" : "md:[&>*:first-child]:order-2"}`}>
        {imageRight ? <>{textPanel}{imagePanel}</> : <>{imagePanel}{textPanel}</>}
      </div>
      {isEditor && <EditorBadge label="STORY" />}
    </SectionWrap>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COUPLE
// ══════════════════════════════════════════════════════════════════════════════
function CoupleCard({ image, name, role, bio, quote, fallbackGradient, fallbackInitial, isEditor, index, theme }) {
  const [hovered, setHovered] = useState(false);
  const radius = theme === "FUN" ? 20 : 0;

  return (
    <FadeUp delay={0.15 + index * 0.15}>
      <div className="flex flex-col items-center">
        <div
          className="relative w-full cursor-pointer overflow-hidden"
          style={{ aspectRatio: index === 0 ? "3/4" : "4/5", borderRadius: radius }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {image
            ? <img src={image} alt={name || ""} className="h-full w-full object-cover transition-transform duration-700" style={{ transform: hovered ? "scale(1.04)" : "scale(1)" }} />
            : <div className={`flex h-full w-full items-center justify-center ${fallbackGradient}`}>
                {isEditor
                  ? <div className="flex flex-col items-center gap-3 text-white/70"><svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5" /></svg><span className="text-xs">Upload photo</span></div>
                  : <span className="font-serif text-9xl font-thin text-white/20">{fallbackInitial}</span>
                }
              </div>
          }
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset" style={{ borderColor: "var(--t-accent-dim, rgba(201,169,110,0.2))", borderRadius: radius }} aria-hidden="true" />
          <AnimatePresence>
            {(quote || isEditor) && hovered && (
              <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: "0%" }} exit={{ opacity: 0, y: "100%" }}
                transition={{ duration: 0.45, ease }}
                className="absolute inset-x-0 bottom-0 px-6 py-8 backdrop-blur-sm"
                style={{ background: "color-mix(in srgb, var(--t-dark) 90%, transparent)" }}>
                <p className="text-base italic leading-relaxed text-white/90" style={{ fontFamily: "var(--t-font-heading)" }}>
                  &ldquo;{quote || (isEditor ? `Add a quote for ${name || "this person"}` : "")}&rdquo;
                </p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.25em]" style={{ color: "var(--t-accent)" }}>— {name}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-6 text-center">
          {role && <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: "var(--t-accent)" }}>{role}</p>}
          <h3 className="text-2xl font-bold" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>{name || fallbackInitial}</h3>
          {bio && <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed" style={{ color: "var(--t-text-muted)" }}>{bio}</p>}
        </div>
      </div>
    </FadeUp>
  );
}

export function CoupleSection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};
  const theme  = config._theme || "CLASSIC";
  const pad    = getThemePad(theme);

  return (
    <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
      <div className="relative mx-auto max-w-6xl">
        <FadeUp className="mb-16 text-center sm:mb-20">
          <SectionEyebrow center>The Couple</SectionEyebrow>
          <SectionHeading center>{section.title || "Meet the Couple"}</SectionHeading>
          {section.body && <SectionBody center>{section.body}</SectionBody>}
          {theme !== "MODERN" && theme !== "MINIMAL" && <Ornament center />}
        </FadeUp>
        <div className="grid gap-10 md:grid-cols-2 md:items-start lg:grid-cols-12 lg:gap-8">
          <div className="md:col-span-1 lg:col-span-5">
            <CoupleCard theme={theme} index={0} image={config.bride_image} name={config.bride_name || "Partner One"} role={config.bride_role || "Bride"} bio={config.bride_bio} quote={config.bride_quote} fallbackGradient="bg-linear-to-br from-rose-100 via-pink-100 to-rose-200" fallbackInitial="A" isEditor={isEditor} />
          </div>
          <div className="hidden lg:col-span-2 lg:flex lg:items-center lg:justify-center lg:pt-24" aria-hidden="true">
            <span className="text-8xl font-light select-none" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-accent)", opacity: 0.25 }}>&amp;</span>
          </div>
          <div className="md:col-span-1 lg:col-span-5 lg:pt-16">
            <CoupleCard theme={theme} index={1} image={config.groom_image} name={config.groom_name || "Partner Two"} role={config.groom_role || "Groom"} bio={config.groom_bio} quote={config.groom_quote} fallbackGradient="bg-linear-to-br from-slate-200 via-blue-100 to-indigo-200" fallbackInitial="B" isEditor={isEditor} />
          </div>
        </div>
      </div>
      {isEditor && <EditorBadge label="COUPLE" />}
    </SectionWrap>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COUNTDOWN
// ══════════════════════════════════════════════════════════════════════════════
const UNITS = ["Days", "Hours", "Minutes", "Seconds"];

function calcTimeLeft(targetISO) {
  if (!targetISO) return null;
  const diff = new Date(targetISO).getTime() - Date.now();
  if (isNaN(diff) || diff <= 0) return null;
  return {
    Days:    Math.floor(diff / 864e5),
    Hours:   Math.floor((diff / 36e5) % 24),
    Minutes: Math.floor((diff / 6e4) % 60),
    Seconds: Math.floor((diff / 1e3) % 60),
  };
}

export function CountdownSection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};
  const theme  = config._theme || "CLASSIC";
  const target = config.starts_at;
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(target));

  useEffect(() => {
    const tick = () => setTimeLeft(calcTimeLeft(target));
    tick();
    if (!target) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  // FUN: colorful chunky cards
  if (theme === "FUN") {
    const funColors = ["#F59E0B", "#EF4444", "#3B82F6", "#10B981"];
    return (
      <section
        className={`relative overflow-hidden px-6 py-16 sm:py-24 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
        style={{ background: "var(--t-dark-surface)" }}
        onClick={isEditor ? onEdit : undefined}
      >
        <div className="relative mx-auto max-w-4xl text-center">
          <FadeUp>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--t-accent)" }}>✦ Counting Down</p>
            <h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: "var(--t-font-heading)", color: "#fff" }}>
              {section.title || "The Big Day"}
            </h2>
          </FadeUp>
          {timeLeft && (
            <FadeUp delay={0.2} className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {UNITS.map((label, i) => (
                <div key={label} className="flex flex-col items-center rounded-2xl p-5"
                  style={{ background: `${funColors[i]}18`, border: `2px solid ${funColors[i]}`, boxShadow: `4px 4px 0 ${funColors[i]}40` }}>
                  <span className="text-5xl font-black tabular-nums sm:text-6xl" style={{ color: funColors[i] }}>
                    {String(timeLeft[label] ?? 0).padStart(2, "0")}
                  </span>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: funColors[i], opacity: 0.8 }}>{label}</span>
                </div>
              ))}
            </FadeUp>
          )}
        </div>
        {isEditor && <EditorBadge label="COUNTDOWN" />}
      </section>
    );
  }

  // MODERN: Tight grid, sharp corners, accent number
  if (theme === "MODERN") {
    return (
      <section
        className={`relative overflow-hidden px-6 py-16 sm:py-20 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
        style={{ background: "var(--t-dark-surface)" }}
        onClick={isEditor ? onEdit : undefined}
      >
        <div className="relative mx-auto max-w-5xl">
          <FadeUp className="mb-10">
            <div className="h-1 w-10 mb-4" style={{ background: "var(--t-accent)" }} />
            <h2 className="text-4xl font-black uppercase sm:text-5xl" style={{ fontFamily: "var(--t-font-heading)", color: "#fff", letterSpacing: "-0.02em" }}>
              {section.title || "The Countdown"}
            </h2>
          </FadeUp>
          {timeLeft && (
            <div className="grid grid-cols-4 gap-3">
              {UNITS.map((label, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.4, ease, delay: i * 0.06 }}
                  className="flex flex-col px-4 py-8"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                  <span className="text-5xl font-black tabular-nums sm:text-6xl" style={{ color: "var(--t-accent)" }}>
                    {String(timeLeft[label] ?? 0).padStart(2, "0")}
                  </span>
                  <span className="mt-3 text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">{label}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        {isEditor && <EditorBadge label="COUNTDOWN" />}
      </section>
    );
  }

  // Default: CLASSIC / ELEGANT / LUXURY / MINIMAL
  return (
    <section
      className={`relative overflow-hidden px-6 py-24 text-center sm:py-36 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      style={{ background: "var(--t-dark-surface)" }}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "var(--t-accent-dim, rgba(201,169,110,0.05))" }} aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl">
        <FadeUp>
          <SectionEyebrow center>Counting Down</SectionEyebrow>
          <SectionHeading center light>{section.title || "The Big Day"}</SectionHeading>
          {section.body && <SectionBody center light>{section.body}</SectionBody>}
          {theme !== "MINIMAL" && <Ornament center />}
        </FadeUp>
        <FadeUp delay={0.2} className="mt-16">
          {!target ? (
            <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.3)" }}>Set an event date to start the countdown</p>
          ) : !timeLeft ? (
            <div className="inline-flex items-center gap-3 border px-10 py-5" style={{ borderColor: "var(--t-accent)", opacity: 0.6 }}>
              <span className="text-2xl italic" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-accent)" }}>Happening Now</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6" role="timer">
              {UNITS.map((label, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5, ease, delay: i * 0.08 }}
                  className="flex flex-col items-center px-4 py-8"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                  <span className="text-5xl font-bold tabular-nums text-white sm:text-6xl" style={{ fontFamily: "var(--t-font-heading)" }}>
                    {String(timeLeft[label] ?? 0).padStart(2, "0")}
                  </span>
                  <span className="mt-3 text-[10px] font-medium uppercase tracking-[0.3em]" style={{ color: "var(--t-accent)" }}>{label}</span>
                </motion.div>
              ))}
            </div>
          )}
        </FadeUp>
      </div>
      {isEditor && <EditorBadge label="COUNTDOWN" />}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VENUE
// ══════════════════════════════════════════════════════════════════════════════
export function VenueSection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};
  const theme  = config._theme || "CLASSIC";
  const pad    = getThemePad(theme);
  const [copied, setCopied] = useState(false);

  const locationLine  = [config.city, config.state, config.country].filter(Boolean).join(", ");
  const fullAddress   = [config.venue_name, config.venue_address, config.city, config.state, config.country].filter(Boolean).join(", ");
  const hasLocation   = !!(config.venue_name || config.venue_address || locationLine);
  const mapsQuery     = encodeURIComponent(fullAddress);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;
  const embedUrl      = `https://maps.google.com/maps?q=${mapsQuery}&output=embed&z=15`;
  const copyAddress   = useCallback(async () => {
    if (!fullAddress) return;
    await navigator.clipboard.writeText(fullAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullAddress]);

  // LUXURY: Grayscale map, gold border detail
  const mapFilter = theme === "LUXURY" ? "grayscale(100%) contrast(0.9) brightness(0.85)" : "none";

  // MODERN: Layout swap — map full-width top, details below
  if (theme === "MODERN") {
    return (
      <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad} className="px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <FadeUp className="mb-10">
            <div className="h-1 w-10 mb-4" style={{ background: "var(--t-accent)" }} />
            <h2 className="text-4xl font-black uppercase sm:text-5xl leading-none" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)", letterSpacing: "-0.02em" }}>
              {section.title || "Where to Find Us"}
            </h2>
          </FadeUp>

          {/* Map full-width */}
          {hasLocation && (
            <FadeUp delay={0.1} className="mb-8 overflow-hidden" style={{ height: 320, border: "1px solid var(--t-border)" }}>
              <iframe title="Event location" src={embedUrl} width="100%" height="100%" style={{ border: 0, display: "block", filter: mapFilter }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </FadeUp>
          )}

          {/* Detail row */}
          <FadeUp delay={0.2} className="flex flex-wrap gap-4">
            {config.venue_name && (
              <div className="flex items-center gap-3 px-5 py-4" style={{ border: "1px solid var(--t-border)", background: "var(--t-bg)" }}>
                <Building2 className="h-4 w-4" style={{ color: "var(--t-accent)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>{config.venue_name}</span>
              </div>
            )}
            {(config.venue_address || locationLine) && (
              <div className="flex items-center gap-3 px-5 py-4" style={{ border: "1px solid var(--t-border)", background: "var(--t-bg)" }}>
                <MapPin className="h-4 w-4" style={{ color: "var(--t-accent)" }} />
                <span className="text-sm" style={{ color: "var(--t-text-muted)" }}>{config.venue_address || locationLine}</span>
              </div>
            )}
            {hasLocation && (
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => isEditor && e.preventDefault()}
                className="inline-flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-90"
                style={{ background: "var(--t-accent)", color: "#000" }}>
                <Navigation className="h-4 w-4" /> Directions
              </a>
            )}
          </FadeUp>
        </div>
        {isEditor && <EditorBadge label="VENUE" />}
      </SectionWrap>
    );
  }

  // MINIMAL: Map as full-width hero, minimal info below
  if (theme === "MINIMAL") {
    return (
      <section className={`relative overflow-hidden ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`} style={{ background: "var(--t-bg)" }} onClick={isEditor ? onEdit : undefined}>
        {hasLocation && (
          <div style={{ height: 400 }}>
            <iframe title="Event location" src={embedUrl} width="100%" height="100%" style={{ border: 0, display: "block", filter: mapFilter }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        )}
        <div className={`px-6 ${pad} mx-auto max-w-lg text-center`}>
          <FadeUp>
            <p className="mb-4 text-[10px] uppercase tracking-[0.5em]" style={{ color: "var(--t-text-muted)" }}>Location</p>
            <h2 className="text-3xl font-light" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>
              {section.title || "Where to Find Us"}
            </h2>
            {config.venue_name && <p className="mt-4 font-medium" style={{ color: "var(--t-text)" }}>{config.venue_name}</p>}
            {config.venue_address && <p className="mt-1 text-sm" style={{ color: "var(--t-text-muted)" }}>{config.venue_address}</p>}
            {locationLine && <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>{locationLine}</p>}
            {hasLocation && (
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => isEditor && e.preventDefault()}
                className="mt-8 inline-flex items-center gap-2 text-sm" style={{ color: "var(--t-accent)" }}>
                <Navigation className="h-3.5 w-3.5" /> Get Directions
              </a>
            )}
          </FadeUp>
        </div>
        {isEditor && <EditorBadge label="VENUE" />}
      </section>
    );
  }

  // Default: CLASSIC / ELEGANT / LUXURY / FUN
  return (
    <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad} className="px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <FadeUp className="mb-12 sm:mb-16">
          <SectionEyebrow>Venue &amp; Directions</SectionEyebrow>
          <SectionHeading>{section.title || "Where to Find Us"}</SectionHeading>
          {section.body && <SectionBody>{section.body}</SectionBody>}
          {theme !== "MINIMAL" && theme !== "MODERN" && <Ornament />}
        </FadeUp>

        <div className="grid gap-8 md:grid-cols-2 md:items-start lg:grid-cols-5 lg:gap-12">
          <FadeUp delay={0.1} className="flex flex-col gap-4 lg:col-span-2">
            {config.venue_name && (
              <div className="flex items-start gap-4 p-5"
                style={{ border: theme === "LUXURY" ? `1px solid var(--t-border)` : "1px solid var(--t-border)", borderLeft: theme === "LUXURY" ? "3px solid var(--t-accent)" : undefined, background: "var(--t-bg)" }}>
                <Building2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--t-accent)" }} />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--t-text-muted)" }}>Venue</p>
                  <p className="mt-0.5 font-semibold" style={{ color: "var(--t-text)" }}>{config.venue_name}</p>
                </div>
              </div>
            )}
            {(config.venue_address || locationLine) && (
              <div className="flex items-start gap-4 p-5"
                style={{ border: "1px solid var(--t-border)", borderLeft: theme === "LUXURY" ? "3px solid var(--t-accent)" : undefined, background: "var(--t-bg)" }}>
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--t-accent)" }} />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--t-text-muted)" }}>Address</p>
                  {config.venue_address && <p className="mt-0.5 font-medium" style={{ color: "var(--t-text)" }}>{config.venue_address}</p>}
                  {locationLine && <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>{locationLine}</p>}
                </div>
              </div>
            )}
            {!hasLocation && (
              <div className="flex items-center gap-3 border-dashed border p-5 text-sm" style={{ borderColor: "var(--t-border)", color: "var(--t-text-muted)" }}>
                <MapPin className="h-5 w-5 shrink-0" /> Location details coming soon
              </div>
            )}
            {hasLocation && (
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => isEditor && e.preventDefault()}
                  className="inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-white transition hover:opacity-90 sm:w-auto"
                  style={{ background: "var(--t-dark)", borderRadius: "var(--t-radius, 0px)" }}>
                  <Navigation className="h-4 w-4" /> Get directions
                </a>
                <button type="button" onClick={(e) => { e.stopPropagation(); copyAddress(); }}
                  className="inline-flex w-full items-center justify-center gap-2 border px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] transition hover:opacity-80 sm:w-auto"
                  style={{ borderColor: "var(--t-border)", color: "var(--t-text)", background: "var(--t-bg-alt)", borderRadius: "var(--t-radius, 0px)" }}>
                  {copied ? <><Check className="h-4 w-4 text-emerald-500" />Copied</> : <><Copy className="h-4 w-4" />Copy address</>}
                </button>
              </div>
            )}
          </FadeUp>

          <FadeUp delay={0.2} className="lg:col-span-3">
            {hasLocation ? (
              <div className="relative hidden overflow-hidden border shadow-sm md:block" style={{ height: "400px", borderColor: "var(--t-border)" }}>
                <iframe title="Event location" src={embedUrl} width="100%" height="100%" style={{ border: 0, display: "block", height: "400px", filter: mapFilter }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => isEditor && e.preventDefault()}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-lg ring-1 ring-black/10 transition hover:bg-stone-50">
                  <ExternalLink className="h-3.5 w-3.5" /> Open in Maps
                </a>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center border border-dashed md:h-[400px]" style={{ borderColor: "var(--t-border)", background: "var(--t-bg)" }}>
                <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>{isEditor ? "Add an address to show the map" : "Location coming soon"}</p>
              </div>
            )}
          </FadeUp>
        </div>
      </div>
      {isEditor && <EditorBadge label="VENUE" />}
    </SectionWrap>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GALLERY
// ══════════════════════════════════════════════════════════════════════════════
export function GallerySection({ section, isEditor = false, onEdit }) {
  const config  = section.config || {};
  const theme   = config._theme || "CLASSIC";
  const pad     = getThemePad(theme);
  const images  = Array.isArray(config.images) ? config.images : [];
  const display = images.length > 0 ? images : isEditor ? Array(6).fill(null) : [];

  // FUN: Zig-zag (alternating left/right pairs)
  if (theme === "FUN") {
    return (
      <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-5xl">
          <FadeUp className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--t-accent)" }}>✦ Gallery</p>
            <h2 className="text-4xl font-extrabold" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>
              {section.title || "Our Moments"}
            </h2>
          </FadeUp>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {display.map((img, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: i % 3 === 1 ? "1/1.3" : "4/3", background: "var(--t-bg)", boxShadow: "4px 4px 0px var(--t-accent)" }}>
                  {img && <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
        {isEditor && <EditorBadge label="GALLERY" />}
      </SectionWrap>
    );
  }

  // MODERN: Strict uniform 4-col grid
  if (theme === "MODERN") {
    return (
      <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-6xl">
          <FadeUp className="mb-10">
            <div className="h-1 w-10 mb-4" style={{ background: "var(--t-accent)" }} />
            <h2 className="text-4xl font-black uppercase sm:text-5xl leading-none" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)", letterSpacing: "-0.02em" }}>
              {section.title || "Gallery"}
            </h2>
          </FadeUp>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
            {display.map((img, i) => (
              <FadeUp key={i} delay={i * 0.04}>
                <div className="aspect-square overflow-hidden" style={{ background: "var(--t-bg)" }}>
                  {img && <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
        {isEditor && <EditorBadge label="GALLERY" />}
      </SectionWrap>
    );
  }

  // MINIMAL: Clean 2-col, pure negative space
  if (theme === "MINIMAL") {
    return (
      <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-4xl">
          <FadeUp className="mb-12 text-center">
            <p className="mb-4 text-[10px] uppercase tracking-[0.5em]" style={{ color: "var(--t-text-muted)" }}>Gallery</p>
            <h2 className="text-4xl font-light" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>
              {section.title || "Our Moments"}
            </h2>
          </FadeUp>
          <div className="grid grid-cols-2 gap-6">
            {display.map((img, i) => (
              <FadeUp key={i} delay={i * 0.06}>
                <div className="overflow-hidden" style={{ aspectRatio: i % 2 === 0 ? "4/5" : "4/3", background: "var(--t-bg-alt)" }}>
                  {img && <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
        {isEditor && <EditorBadge label="GALLERY" />}
      </SectionWrap>
    );
  }

  // Default (CLASSIC / ELEGANT / LUXURY): Masonry columns
  return (
    <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad}>
      <div className="mx-auto max-w-6xl">
        <FadeUp className="mb-12">
          <SectionEyebrow>Gallery</SectionEyebrow>
          <SectionHeading>{section.title || "Our Moments"}</SectionHeading>
          {theme !== "MINIMAL" && <Ornament />}
        </FadeUp>
        {display.length === 0 ? (
          <p className="py-16 text-center" style={{ color: "var(--t-text-muted)" }}>Upload images to display the gallery</p>
        ) : (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
            {display.map((img, i) => (
              <FadeUp key={i} delay={i * 0.04}>
                <div className="mb-4 overflow-hidden break-inside-avoid" style={{ background: "var(--t-bg)" }}>
                  {img
                    ? <img src={img} alt={`Gallery ${i + 1}`} className="w-full object-cover transition-transform duration-500 hover:scale-105" />
                    : <div className="aspect-square" style={{ background: "var(--t-bg)" }} />
                  }
                </div>
              </FadeUp>
            ))}
          </div>
        )}
      </div>
      {isEditor && <EditorBadge label="GALLERY" />}
    </SectionWrap>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCHEDULE
// ══════════════════════════════════════════════════════════════════════════════
export function ScheduleSection({ section, event, isEditor = false, onEdit }) {
  const config = section.config || {};
  const theme  = config._theme || "CLASSIC";
  const pad    = getThemePad(theme);
  const items  = event?.schedule_items || config.items || [];
  const mock   = [
    { title: "Registration & Welcome",  starts_at: "9:00 AM",  location: "Main Hall"   },
    { title: "Keynote Address",         starts_at: "10:00 AM", location: "Auditorium"  },
    { title: "Lunch Break",             starts_at: "12:00 PM", location: "Dining Area" },
    { title: "Workshops & Breakouts",   starts_at: "2:00 PM",  location: "Rooms A–D"   },
  ];
  const display = items.length > 0 ? items : isEditor ? mock : [];

  const formatTime = (t) =>
    t && typeof t === "string" && t.includes("T")
      ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : t || "—";

  // ── MODERN: 2-column card grid ──────────────────────────────────────────
  if (theme === "MODERN") {
    return (
      <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-6xl">
          <FadeUp className="mb-10">
            <div className="h-1 w-10 mb-4" style={{ background: "var(--t-accent)" }} />
            <h2 className="text-4xl font-black uppercase sm:text-5xl leading-none" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)", letterSpacing: "-0.02em" }}>
              {section.title || "Schedule"}
            </h2>
          </FadeUp>
          <div className="grid gap-3 sm:grid-cols-2">
            {display.map((item, i) => (
              <FadeUp key={item.id || i} delay={i * 0.06}>
                <div className="flex flex-col p-6" style={{ border: "1px solid var(--t-border)", background: "var(--t-bg-alt)", borderTop: "3px solid var(--t-accent)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] mb-3" style={{ color: "var(--t-accent)" }}>
                    {formatTime(item.starts_at)}
                  </span>
                  <h4 className="text-xl font-black" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>{item.title}</h4>
                  {item.location && <p className="mt-1 text-sm" style={{ color: "var(--t-text-muted)" }}>{item.location}</p>}
                  {item.description && <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--t-text-muted)", opacity: 0.7 }}>{item.description}</p>}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
        {isEditor && <EditorBadge label="SCHEDULE" />}
      </SectionWrap>
    );
  }

  // ── FUN: Colorful chunky cards with neo-brutalism shadow ────────────────
  if (theme === "FUN") {
    const funBgs = ["#FEF3C7", "#DBEAFE", "#D1FAE5", "#FCE7F3"];
    return (
      <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-4xl">
          <FadeUp className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--t-accent)" }}>✦ Agenda</p>
            <h2 className="text-4xl font-extrabold" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>
              {section.title || "What's Happening"}
            </h2>
          </FadeUp>
          <div className="flex flex-col gap-4">
            {display.map((item, i) => (
              <FadeUp key={item.id || i} delay={i * 0.07}>
                <div className="flex items-center gap-5 rounded-2xl p-5"
                  style={{ background: funBgs[i % funBgs.length], border: "2px solid #1a1a1a", boxShadow: "5px 5px 0px #1a1a1a" }}>
                  <div className="shrink-0 rounded-xl px-3 py-2 text-center" style={{ background: "var(--t-accent)", minWidth: 64 }}>
                    <span className="block text-[10px] font-black uppercase text-white/80">Time</span>
                    <span className="block text-sm font-black text-white">{formatTime(item.starts_at)}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold" style={{ color: "#1a1a1a" }}>{item.title}</h4>
                    {item.location && <p className="mt-0.5 text-sm font-medium" style={{ color: "#555" }}>{item.location}</p>}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
        {isEditor && <EditorBadge label="SCHEDULE" />}
      </SectionWrap>
    );
  }

  // ── LUXURY: Single col, gold left-border per item ────────────────────────
  if (theme === "LUXURY") {
    return (
      <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-3xl">
          <FadeUp className="mb-16">
            <SectionEyebrow>Programme</SectionEyebrow>
            <SectionHeading>{section.title || "Schedule"}</SectionHeading>
            <Ornament />
          </FadeUp>
          <div className="flex flex-col gap-0">
            {display.map((item, i) => (
              <FadeUp key={item.id || i} delay={i * 0.08}>
                <div className="flex items-start gap-8 py-8" style={{ borderBottom: "1px solid var(--t-border)", borderLeft: "3px solid var(--t-accent)", paddingLeft: "1.5rem" }}>
                  <div className="shrink-0 w-20 text-right">
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--t-accent)" }}>
                      {formatTime(item.starts_at)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-semibold italic" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>{item.title}</h4>
                    {item.location && <p className="mt-1 text-sm" style={{ color: "var(--t-text-muted)" }}>{item.location}</p>}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
        {isEditor && <EditorBadge label="SCHEDULE" />}
      </SectionWrap>
    );
  }

  // ── MINIMAL: Clean list, no borders, pure whitespace ────────────────────
  if (theme === "MINIMAL") {
    return (
      <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-2xl">
          <FadeUp className="mb-16 text-center">
            <p className="mb-4 text-[10px] uppercase tracking-[0.5em]" style={{ color: "var(--t-text-muted)" }}>Schedule</p>
            <h2 className="text-4xl font-light" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>
              {section.title || "What's On"}
            </h2>
          </FadeUp>
          <div className="flex flex-col gap-10">
            {display.map((item, i) => (
              <FadeUp key={item.id || i} delay={i * 0.08}>
                <div className="flex gap-10">
                  <div className="shrink-0 w-20 text-right">
                    <span className="text-xs" style={{ color: "var(--t-text-muted)", letterSpacing: "0.05em" }}>
                      {formatTime(item.starts_at)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium" style={{ color: "var(--t-text)" }}>{item.title}</h4>
                    {item.location && <p className="mt-0.5 text-sm" style={{ color: "var(--t-text-muted)" }}>{item.location}</p>}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
        {isEditor && <EditorBadge label="SCHEDULE" />}
      </SectionWrap>
    );
  }

  // ── CLASSIC / ELEGANT: Diamond timeline with justified text ─────────────
  return (
    <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
      {/* Top section divider */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-px w-1/2" style={{ background: "var(--t-border)" }} />
      </div>
      <div className="mx-auto max-w-3xl">
        <FadeUp className="mb-14">
          <SectionEyebrow>Agenda</SectionEyebrow>
          <SectionHeading>{section.title || "Schedule"}</SectionHeading>
          <Ornament />
        </FadeUp>
        <div className="relative">
          <div className="absolute left-[86px] top-0 h-full w-px sm:left-[102px]" style={{ background: "var(--t-accent)", opacity: 0.2 }} aria-hidden="true" />
          <div className="space-y-0">
            {display.map((item, i) => (
              <FadeUp key={item.id || i} delay={i * 0.08}>
                <div className="flex items-start gap-6 py-7 sm:gap-8">
                  <div className="w-20 shrink-0 pt-0.5 text-right sm:w-24">
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--t-accent)" }}>
                      {formatTime(item.starts_at)}
                    </span>
                  </div>
                  <div className="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
                    <div className="h-2 w-2 rotate-45" style={{ background: "var(--t-accent)" }} />
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <h4 className="text-lg font-semibold" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>{item.title}</h4>
                    {item.location && <p className="mt-0.5 text-sm" style={{ color: "var(--t-text-muted)" }}>{item.location}</p>}
                    {item.description && <p className="mt-1 text-sm" style={{ color: "var(--t-text-muted)", opacity: 0.7 }}>{item.description}</p>}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
      {isEditor && <EditorBadge label="SCHEDULE" />}
    </SectionWrap>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SPEAKERS
// ══════════════════════════════════════════════════════════════════════════════
export function SpeakersSection({ section, event, isEditor = false, onEdit }) {
  const config   = section.config || {};
  const theme    = config._theme || "CLASSIC";
  const pad      = getThemePad(theme);
  const speakers = event?.speakers || config.items || [];
  const mock     = [
    { full_name: "Speaker Name", title: "Role / Company" },
    { full_name: "Speaker Name", title: "Role / Company" },
    { full_name: "Speaker Name", title: "Role / Company" },
  ];
  const display  = speakers.length > 0 ? speakers : isEditor ? mock : [];
  const radius   = theme === "FUN" ? "50%" : "0px";

  return (
    <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad}>
      <div className="mx-auto max-w-5xl">
        <FadeUp className="mb-14">
          <SectionEyebrow>Speakers</SectionEyebrow>
          <SectionHeading>{section.title || "Our Speakers"}</SectionHeading>
          {theme !== "MODERN" && theme !== "MINIMAL" && <Ornament />}
        </FadeUp>
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {display.map((s, i) => (
            <FadeUp key={s.id || i} delay={i * 0.08}>
              <div className="group flex flex-col items-center text-center">
                <div className="relative h-24 w-24 overflow-hidden sm:h-28 sm:w-28" style={{ background: "var(--t-bg)", borderRadius: radius, border: "1px solid var(--t-border)" }}>
                  {s.avatar_url
                    ? <img src={s.avatar_url} className="h-full w-full object-cover" alt={s.full_name} />
                    : <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--t-bg)" }}>
                        <span className="text-3xl" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-border)" }}>{(s.full_name || "S")[0]}</span>
                      </div>
                  }
                </div>
                <div className="mt-5">
                  <h4 className="text-lg font-semibold" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>{s.full_name}</h4>
                  {s.title && <p className="mt-1 text-sm" style={{ color: "var(--t-accent)" }}>{s.title}</p>}
                  {s.bio && <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed line-clamp-2" style={{ color: "var(--t-text-muted)" }}>{s.bio}</p>}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="SPEAKERS" />}
    </SectionWrap>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REGISTRY
// ══════════════════════════════════════════════════════════════════════════════
export function RegistrySection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};
  const theme  = config._theme || "CLASSIC";
  const pad    = getThemePad(theme);
  const items  = config.items || [
    { name: "Amazon Registry", url: "#" },
    { name: "Target Registry", url: "#" },
    { name: "Gift Fund",       url: "#" },
  ];

  return (
    <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad} className="text-center">
      <div className="mx-auto max-w-4xl">
        <FadeUp>
          <SectionEyebrow center>Registry</SectionEyebrow>
          <SectionHeading center>{section.title || "Our Registry"}</SectionHeading>
          {section.body && <SectionBody center>{section.body}</SectionBody>}
          {theme !== "MODERN" && theme !== "MINIMAL" && <Ornament center />}
        </FadeUp>
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {items.map((item, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <a href={item.url || "#"} target="_blank" rel="noopener noreferrer"
                className="group flex flex-col items-center gap-4 p-8 transition hover:-translate-y-1"
                style={{ border: "1px solid var(--t-border)", background: "var(--t-bg-alt)", borderRadius: "var(--t-radius, 0px)", boxShadow: theme === "FUN" ? "4px 4px 0 var(--t-accent)" : "none" }}>
                <div className="h-px w-8" style={{ background: "var(--t-accent)", opacity: 0.5 }} />
                <h4 className="text-lg font-semibold" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>{item.name}</h4>
                <span className="text-xs uppercase tracking-[0.2em] transition-all group-hover:tracking-[0.3em]" style={{ color: "var(--t-accent)" }}>
                  View →
                </span>
              </a>
            </FadeUp>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="REGISTRY" />}
    </SectionWrap>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TICKETS
// ══════════════════════════════════════════════════════════════════════════════
export function TicketsSection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};
  const theme  = config._theme || "CLASSIC";
  const pad    = getThemePad(theme);
  const mock   = [
    { name: "General",  price: 20, description: "Full event access" },
    { name: "VIP",      price: 80, description: "Priority seating + gifts", featured: true },
    { name: "Group ×5", price: 90, description: "Group of five tickets" },
  ];

  return (
    <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
      <div className="mx-auto max-w-4xl">
        <FadeUp className="text-center">
          <SectionEyebrow center>Tickets</SectionEyebrow>
          <SectionHeading center>{section.title || "Reserve Your Seat"}</SectionHeading>
          {section.body && <SectionBody center>{section.body}</SectionBody>}
          {theme !== "MODERN" && theme !== "MINIMAL" && <Ornament center />}
        </FadeUp>
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {mock.map((t, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div className="flex flex-col p-8 transition"
                style={t.featured
                  ? { border: `1px solid var(--t-accent)`, background: "var(--t-dark)", color: "#fff", borderRadius: "var(--t-radius, 0px)", boxShadow: theme === "FUN" ? "6px 6px 0 var(--t-accent)" : "none" }
                  : { border: "1px solid var(--t-border)", background: "var(--t-bg-alt)", borderRadius: "var(--t-radius, 0px)", boxShadow: theme === "FUN" ? "4px 4px 0 rgba(0,0,0,0.2)" : "none" }
                }>
                {t.featured && <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.3em]" style={{ color: "var(--t-accent)" }}>Most Popular</p>}
                <h4 className="text-xl font-bold" style={{ fontFamily: "var(--t-font-heading)", color: t.featured ? "#fff" : "var(--t-text)" }}>{t.name}</h4>
                <p className="mt-1 text-sm" style={{ color: t.featured ? "rgba(255,255,255,0.5)" : "var(--t-text-muted)" }}>{t.description}</p>
                <div className="my-6 text-4xl font-bold" style={{ fontFamily: "var(--t-font-heading)", color: t.featured ? "var(--t-accent)" : "var(--t-text)" }}>${t.price}</div>
                <button className="mt-auto py-3 text-sm font-medium uppercase tracking-[0.15em] transition active:scale-95"
                  style={t.featured
                    ? { background: "var(--t-accent)", color: "var(--t-dark)", borderRadius: "var(--t-radius, 0px)" }
                    : { border: "1px solid var(--t-text)", color: "var(--t-text)", background: "transparent", borderRadius: "var(--t-radius, 0px)" }
                  }>
                  Select
                </button>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="TICKETS" />}
    </SectionWrap>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DONATIONS
// ══════════════════════════════════════════════════════════════════════════════
export function DonationsSection({ section, isEditor = false, onEdit }) {
  const theme   = section.config?._theme || "CLASSIC";
  const amounts = ["$10", "$25", "$50", "$100", "Custom"];

  return (
    <section
      className={`px-6 py-24 text-center sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      style={{ background: "var(--t-dark-surface)" }}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-2xl">
        <FadeUp>
          <SectionEyebrow center>Give</SectionEyebrow>
          <SectionHeading center light>{section.title || "Make a Gift"}</SectionHeading>
          {section.body && <SectionBody center light>{section.body}</SectionBody>}
          {theme !== "MODERN" && theme !== "MINIMAL" && <Ornament center />}
        </FadeUp>
        <FadeUp delay={0.15} className="mt-12 flex flex-wrap justify-center gap-3">
          {amounts.map((a) => (
            <button key={a}
              className="bg-transparent px-8 py-3 text-sm font-medium uppercase tracking-[0.15em] text-white/80 transition active:scale-95"
              style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--t-radius, 0px)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
            >
              {a}
            </button>
          ))}
        </FadeUp>
      </div>
      {isEditor && <EditorBadge label="DONATIONS" />}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FAQ
// ══════════════════════════════════════════════════════════════════════════════
function FAQItem({ question, answer, index, theme }) {
  const [open, setOpen] = useState(false);

  return (
    <FadeUp delay={index * 0.06}>
      <div style={{ borderBottom: "1px solid var(--t-border)", borderRadius: theme === "FUN" ? 12 : 0 }}>
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 py-5 text-left transition"
          aria-expanded={open}
          style={{ color: "var(--t-text)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--t-accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--t-text)"; }}
        >
          <span className="text-lg font-semibold" style={{ fontFamily: "var(--t-font-heading)" }}>{question}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease }} className="shrink-0">
            <ChevronDown className="h-5 w-5" style={{ color: "var(--t-accent)" }} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div key="answer" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease }} className="overflow-hidden">
              <p className="pb-5 leading-relaxed" style={{ color: "var(--t-text-muted)" }}>{answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeUp>
  );
}

export function FAQSection({ section, isEditor = false, onEdit }) {
  const config  = section.config || {};
  const theme   = config._theme || "CLASSIC";
  const pad     = getThemePad(theme);
  const items   = config.items || [];
  const mock    = [
    { question: "What time does it start?",  answer: "Doors open one hour before the event begins." },
    { question: "Is parking available?",      answer: "Yes, free parking is available on-site."     },
    { question: "Can I bring a plus one?",    answer: "Please refer to your personal invitation for plus-one availability." },
    { question: "What should I wear?",        answer: "Smart casual or formal attire is recommended." },
  ];
  const display = items.length > 0 ? items : isEditor ? mock : [];

  // ── MODERN: 2-column layout ──────────────────────────────────────────────
  if (theme === "MODERN") {
    const half = Math.ceil(display.length / 2);
    return (
      <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-6xl">
          <FadeUp className="mb-10">
            <div className="h-1 w-10 mb-4" style={{ background: "var(--t-accent)" }} />
            <h2 className="text-4xl font-black uppercase sm:text-5xl leading-none" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)", letterSpacing: "-0.02em" }}>
              {section.title || "FAQ"}
            </h2>
          </FadeUp>
          <div className="grid gap-0 md:grid-cols-2 md:gap-x-12">
            <div>{display.slice(0, half).map((item, i) => <FAQItem key={i} index={i} question={item.question} answer={item.answer} theme={theme} />)}</div>
            <div>{display.slice(half).map((item, i) => <FAQItem key={i} index={i} question={item.question} answer={item.answer} theme={theme} />)}</div>
          </div>
        </div>
        {isEditor && <EditorBadge label="FAQ" />}
      </SectionWrap>
    );
  }

  // ── FUN: Card-style blocks with neo-brutalism shadows ──────────────────
  if (theme === "FUN") {
    return (
      <SectionWrap bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-3xl">
          <FadeUp className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--t-accent)" }}>✦ FAQ</p>
            <h2 className="text-4xl font-extrabold" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>
              {section.title || "Got Questions?"}
            </h2>
          </FadeUp>
          <div className="flex flex-col gap-4">
            {display.map((item, i) => (
              <FadeUp key={i} delay={i * 0.06}>
                <details className="group rounded-2xl overflow-hidden" style={{ border: "2px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a", background: "var(--t-bg-alt)" }}>
                  <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 font-bold" style={{ color: "var(--t-text)" }}>
                    <span style={{ fontFamily: "var(--t-font-heading)" }}>{item.question}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" style={{ color: "var(--t-accent)" }} />
                  </summary>
                  <div className="px-6 pb-5 text-base leading-relaxed" style={{ color: "var(--t-text-muted)" }}>{item.answer}</div>
                </details>
              </FadeUp>
            ))}
          </div>
        </div>
        {isEditor && <EditorBadge label="FAQ" />}
      </SectionWrap>
    );
  }

  // ── Default: CLASSIC / ELEGANT / LUXURY / MINIMAL ───────────────────────
  return (
    <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad}>
      <div className="mx-auto max-w-3xl">
        <FadeUp className="mb-12">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <SectionHeading>{section.title || "Questions & Answers"}</SectionHeading>
          {theme !== "MINIMAL" && <Ornament />}
        </FadeUp>
        <div>
          {display.map((item, i) => (
            <FAQItem key={i} index={i} question={item.question} answer={item.answer} theme={theme} />
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="FAQ" />}
    </SectionWrap>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CTA
// ══════════════════════════════════════════════════════════════════════════════
export function CTASection({ section, isEditor = false, onEdit }) {
  const config  = section.config || {};
  const theme   = config._theme || "CLASSIC";
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    setHasToken(!!new URLSearchParams(window.location.search).get("token"));
  }, []);
  const handleRsvp = () => window.dispatchEvent(new CustomEvent("open-rsvp-panel"));

  // ── MODERN: Left-aligned, full-width button ──────────────────────────────
  if (theme === "MODERN") {
    return (
      <section
        className={`relative overflow-hidden px-6 py-20 sm:py-28 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
        style={{ background: "var(--t-dark)" }}
        onClick={isEditor ? onEdit : undefined}
      >
        <div className="relative mx-auto max-w-6xl">
          <FadeUp>
            <div className="h-1 w-16 mb-6" style={{ background: "var(--t-accent)" }} />
            <h2 className="text-5xl font-black uppercase sm:text-7xl leading-none" style={{ fontFamily: "var(--t-font-heading)", color: "#fff", letterSpacing: "-0.03em" }}>
              {section.title || "Join Us"}
            </h2>
            {section.body && <p className="mt-5 max-w-lg text-base text-white/50">{section.body}</p>}
            {(isEditor || hasToken) && (
              <button onClick={!isEditor ? handleRsvp : undefined}
                className="mt-10 w-full max-w-sm text-sm font-black uppercase tracking-[0.2em] transition active:scale-95"
                style={{ background: "var(--t-accent)", color: "#000", padding: "1.25rem 3rem" }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                {config.button_text || "Register Now"}
              </button>
            )}
          </FadeUp>
        </div>
        {isEditor && <EditorBadge label="CTA" />}
      </section>
    );
  }

  // ── MINIMAL: Just headline + single button, nothing else ────────────────
  if (theme === "MINIMAL") {
    return (
      <section
        className={`relative overflow-hidden px-6 py-40 sm:py-56 text-center ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
        style={{ background: "var(--t-dark)" }}
        onClick={isEditor ? onEdit : undefined}
      >
        <div className="relative mx-auto max-w-xl">
          <FadeUp>
            <h2 className="text-5xl font-light sm:text-6xl text-white" style={{ fontFamily: "var(--t-font-heading)", letterSpacing: "0.01em" }}>
              {section.title || "Join Us"}
            </h2>
            {(isEditor || hasToken) && (
              <button onClick={!isEditor ? handleRsvp : undefined}
                className="mt-14 border bg-transparent text-xs font-light uppercase tracking-[0.5em] text-white/60 transition hover:text-white hover:border-white/50 px-12 py-5"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                {config.button_text || "RSVP"}
              </button>
            )}
          </FadeUp>
        </div>
        {isEditor && <EditorBadge label="CTA" />}
      </section>
    );
  }

  // ── FUN: Neo-brutalism — thick shadow, rounded, bright ──────────────────
  if (theme === "FUN") {
    return (
      <section
        className={`relative overflow-hidden px-6 py-20 sm:py-28 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
        style={{ background: "var(--t-dark)" }}
        onClick={isEditor ? onEdit : undefined}
      >
        <div className="relative mx-auto max-w-3xl text-center">
          <FadeUp>
            <div className="inline-block rounded-3xl p-10 sm:p-14"
              style={{ background: "var(--t-accent)", border: "3px solid #fff", boxShadow: "8px 8px 0px rgba(255,255,255,0.4)" }}>
              <h2 className="text-5xl font-extrabold sm:text-6xl text-white" style={{ fontFamily: "var(--t-font-heading)" }}>
                {section.title || "Let's Party! 🎉"}
              </h2>
              {section.body && <p className="mt-4 text-lg text-white/80">{section.body}</p>}
              {(isEditor || hasToken) && (
                <button onClick={!isEditor ? handleRsvp : undefined}
                  className="mt-8 inline-block bg-white text-sm font-black uppercase tracking-[0.15em] transition active:scale-95 px-10 py-4"
                  style={{ color: "var(--t-accent)", borderRadius: 999, border: "3px solid #1a1a1a", boxShadow: "4px 4px 0 #1a1a1a" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-2px,-2px)"; e.currentTarget.style.boxShadow = "6px 6px 0 #1a1a1a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "4px 4px 0 #1a1a1a"; }}
                >
                  {config.button_text || "Count Me In! →"}
                </button>
              )}
            </div>
          </FadeUp>
        </div>
        {isEditor && <EditorBadge label="CTA" />}
      </section>
    );
  }

  // ── LUXURY: Centered, full-height feel, italic serif ────────────────────
  if (theme === "LUXURY") {
    return (
      <section
        className={`relative overflow-hidden px-6 py-44 sm:py-60 text-center ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
        style={{ background: "var(--t-dark)" }}
        onClick={isEditor ? onEdit : undefined}
      >
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "var(--t-accent-dim, rgba(212,175,111,0.06))" }} aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "var(--t-accent)", opacity: 0.2 }} aria-hidden="true" />

        <div className="relative mx-auto max-w-2xl">
          <FadeUp>
            <div className="mb-10 flex items-center justify-center gap-4" aria-hidden="true">
              <div className="h-px w-12" style={{ background: "var(--t-accent)", opacity: 0.4 }} />
              <div className="h-1.5 w-1.5 rotate-45" style={{ background: "var(--t-accent)" }} />
              <div className="h-px w-12" style={{ background: "var(--t-accent)", opacity: 0.4 }} />
            </div>
            <h2 className="text-6xl font-bold italic text-white sm:text-7xl" style={{ fontFamily: "var(--t-font-heading)", letterSpacing: "0.01em" }}>
              {section.title || "Join Us"}
            </h2>
            {section.body && <p className="mx-auto mt-6 max-w-md text-lg text-white/40 italic">{section.body}</p>}
            {(isEditor || hasToken) && (
              <button onClick={!isEditor ? handleRsvp : undefined}
                className="mt-14 bg-transparent text-sm font-medium uppercase tracking-[0.4em] transition active:scale-95 px-12 py-5 text-white"
                style={{ border: "1px solid var(--t-accent)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-accent)"; e.currentTarget.style.color = "#000"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#fff"; }}
              >
                {config.button_text || "Confirm Attendance"}
              </button>
            )}
          </FadeUp>
        </div>
        {isEditor && <EditorBadge label="CTA" />}
      </section>
    );
  }

  // ── CLASSIC / ELEGANT: Centered, italic serif, outlined gold button ──────
  return (
    <section
      className={`relative overflow-hidden px-6 py-32 text-center sm:py-44 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      style={{ background: "var(--t-dark)" }}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "var(--t-accent-dim, rgba(201,169,110,0.05))" }} aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl">
        <FadeUp>
          <div className="mb-8 flex items-center justify-center gap-3" aria-hidden="true">
            <div className="h-px w-12" style={{ background: "var(--t-accent)", opacity: 0.5 }} />
            <div className="h-1.5 w-1.5 rotate-45" style={{ background: "var(--t-accent)" }} />
            <div className="h-px w-12" style={{ background: "var(--t-accent)", opacity: 0.5 }} />
          </div>
          <h2 className="text-5xl font-bold italic leading-tight text-white sm:text-6xl" style={{ fontFamily: "var(--t-font-heading)" }}>
            {section.title || "Join Us"}
          </h2>
          {section.body && <p className="mx-auto mt-5 max-w-md text-lg text-white/50">{section.body}</p>}
          {(isEditor || hasToken) && (
            <button onClick={!isEditor ? handleRsvp : undefined}
              className="mt-12 bg-transparent px-12 py-4 text-sm font-medium uppercase tracking-[0.25em] transition active:scale-95"
              style={{ border: "1px solid var(--t-accent)", color: "var(--t-accent)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-dark)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-accent)"; }}
            >
              {config.button_text || "Confirm Attendance"}
            </button>
          )}
        </FadeUp>
      </div>
      {isEditor && <EditorBadge label="CTA" />}
    </section>
  );
}
