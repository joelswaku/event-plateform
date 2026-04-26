"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;
import {
  MapPin, Navigation, Building2, Car, Copy, Check,
  ExternalLink, ChevronDown, Heart,
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
function SectionWrap({ id, bg = "var(--t-bg)", children, className = "", onClick, isEditor, pad }) {
  const paddingCls = pad || "py-24 sm:py-32";
  return (
    <section
      id={id}
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

// const TICKET_MOCK = [
//   { id: "m1", name: "General", kind: "FREE",  price: 0,   currency: "USD", description: "Full event access", quantity_total: 200, quantity_sold: 47 },
//   { id: "m2", name: "VIP",     kind: "PAID",  price: 150, currency: "USD", description: "Priority seating · Meet & Greet · Gift bag", quantity_total: 30, quantity_sold: 12, tier: "vip" },
//   { id: "m3", name: "Professional", kind: "PAID", price: 350, currency: "USD", description: "All-access · Networking dinner · Recording", quantity_total: 10, quantity_sold: 3, tier: "pro" },
// ];

const TIER_STYLES = {
  vip: { badge: "VIP", accent: "#C9A96E", dark: "#1a1208", glow: "rgba(201,169,110,0.3)" },
  pro: { badge: "PRO", accent: "#6366F1", dark: "#0f0f1a", glow: "rgba(99,102,241,0.3)" },
};

// function TicketCard({ ticket, theme, onBuy, sold }) {
//   const tier = TIER_STYLES[ticket.tier];
//   const available = ticket.quantity_total != null
//     ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
//     : null;
//   const isSoldOut = available !== null && available <= 0;
//   const pct = ticket.quantity_total
//     ? Math.min(((ticket.quantity_sold ?? 0) / ticket.quantity_total) * 100, 100) : 0;

//   const priceLabel = ticket.kind === "FREE"
//     ? "Free"
//     : new Intl.NumberFormat("en-US", { style: "currency", currency: ticket.currency ?? "USD" }).format(ticket.price);

//   return (
//     <div
//       className="relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
//       style={{
//         background: tier ? tier.dark : "var(--t-bg-alt)",
//         border: tier ? `1px solid ${tier.accent}40` : "1px solid var(--t-border)",
//         borderRadius: "var(--t-radius, 12px)",
//         boxShadow: tier ? `0 8px 32px ${tier.glow}, inset 0 1px 0 ${tier.accent}20` : "none",
//       }}
//     >
//       {/* Tier accent top stripe */}
//       {tier && (
//         <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${tier.accent}, transparent)` }} />
//       )}

//       {/* Perforated edge decoration */}
//       <div className="flex items-center justify-between px-6 pt-5 pb-3">
//         <div>
//           {tier && (
//             <span
//               className="mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.2em]"
//               style={{ background: `${tier.accent}20`, color: tier.accent, border: `1px solid ${tier.accent}40` }}
//             >
//               ★ {tier.badge}
//             </span>
//           )}
//           <h4
//             className="text-xl font-bold leading-tight"
//             style={{
//               fontFamily: "var(--t-font-heading)",
//               color: tier ? "#fff" : "var(--t-text)",
//             }}
//           >
//             {ticket.name}
//           </h4>
//         </div>
//         <div className="text-right">
//           <p
//             className="text-3xl font-black"
//             style={{ fontFamily: "var(--t-font-heading)", color: tier ? tier.accent : "var(--t-accent)" }}
//           >
//             {priceLabel}
//           </p>
//           {ticket.kind !== "FREE" && (
//             <p className="text-[10px] uppercase tracking-wide" style={{ color: tier ? "rgba(255,255,255,0.4)" : "var(--t-text-muted)" }}>
//               per ticket
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Divider — perforated style */}
//       <div className="mx-6 flex items-center gap-1.5 py-2">
//         <div className="h-px flex-1" style={{ background: tier ? `${tier.accent}20` : "var(--t-border)" }} />
//         <div className="flex gap-1">
//           {[...Array(5)].map((_, i) => (
//             <div key={i} className="h-1 w-1 rounded-full" style={{ background: tier ? `${tier.accent}30` : "var(--t-border)" }} />
//           ))}
//         </div>
//         <div className="h-px flex-1" style={{ background: tier ? `${tier.accent}20` : "var(--t-border)" }} />
//       </div>

//       {/* Description */}
//       <div className="px-6 pb-4">
//         {ticket.description && (
//           <p className="text-sm leading-relaxed" style={{ color: tier ? "rgba(255,255,255,0.55)" : "var(--t-text-muted)" }}>
//             {ticket.description}
//           </p>
//         )}

//         {/* Availability */}
//         {ticket.quantity_total != null && (
//           <div className="mt-4">
//             <div className="mb-1.5 flex items-center justify-between">
//               <p className="text-[11px]" style={{ color: tier ? "rgba(255,255,255,0.4)" : "var(--t-text-muted)" }}>
//                 {isSoldOut ? "Sold out" : `${available} left`}
//               </p>
//               {!isSoldOut && (
//                 <p className="text-[11px]" style={{ color: tier ? "rgba(255,255,255,0.4)" : "var(--t-text-muted)" }}>
//                   {ticket.quantity_sold} sold
//                 </p>
//               )}
//             </div>
//             <div className="h-1 overflow-hidden rounded-full" style={{ background: tier ? "rgba(255,255,255,0.1)" : "var(--t-border)" }}>
//               <div
//                 className="h-full rounded-full transition-all"
//                 style={{
//                   width: `${pct}%`,
//                   background: tier ? tier.accent : "var(--t-accent)",
//                 }}
//               />
//             </div>
//           </div>
//         )}
//       </div>

//       {/* CTA */}
//       <div className="mt-auto px-6 pb-6">
//         <button
//           onClick={() => !isSoldOut && onBuy(ticket)}
//           disabled={isSoldOut}
//           className="w-full py-3.5 text-sm font-bold uppercase tracking-[0.12em] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
//           style={{
//             background: isSoldOut
//               ? "transparent"
//               : tier
//                 ? `linear-gradient(135deg, ${tier.accent}, ${tier.accent}cc)`
//                 : "var(--t-accent)",
//             color: isSoldOut
//               ? (tier ? "rgba(255,255,255,0.3)" : "var(--t-text-muted)")
//               : tier ? tier.dark : "var(--t-dark)",
//             borderRadius: "var(--t-radius, 8px)",
//             border: isSoldOut ? `1px solid ${tier ? tier.accent + "30" : "var(--t-border)"}` : "none",
//             boxShadow: (!isSoldOut && tier) ? `0 4px 20px ${tier.glow}` : "none",
//           }}
//         >
//           {isSoldOut ? "Sold Out" : ticket.kind === "FREE" ? "Get Free Ticket" : "Buy Now"}
//         </button>
//       </div>
//     </div>
//   );
// }

function StripePaymentFormLight({ accentColor, fmtTotal, onSuccess }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error,  setError]  = useState("");

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError("");
    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: window.location.href },
    });
    if (err) {
      setError(err.message ?? "Payment failed");
      setPaying(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      <button type="submit" disabled={paying || !stripe}
        className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
        style={{ background: accentColor ? `linear-gradient(135deg,${accentColor},${accentColor}cc)` : "#4F46E5" }}>
        {paying ? "Processing…" : `Pay ${fmtTotal} →`}
      </button>
    </form>
  );
}

function TicketCheckoutModal({ ticket, event, onClose, theme }) {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [step, setStep] = useState("form"); // form | success | paid
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const priceEach = ticket.kind === "FREE" ? 0 : Number(ticket.price);
  const total = priceEach * qty;
  const fmtPrice = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: ticket.currency ?? "USD" }).format(n);
  const tier = (() => {
    const n = (ticket.name ?? "").toLowerCase();
    const k = ticket.kind;
    if (k === "FREE") return { accent: "#10b981", dark: "#022c22", badge: "Free", glow: "rgba(16,185,129,0.25)" };
    if (n.includes("vip") || n.includes("platinum") || n.includes("premium")) return { accent: "#C9A96E", dark: "#0f0b00", badge: "VIP", glow: "rgba(201,169,110,0.28)" };
    if (n.includes("pro") || n.includes("diamond") || n.includes("all-access")) return { accent: "#a78bfa", dark: "#0d0718", badge: "Premium", glow: "rgba(167,139,250,0.28)" };
    if (n.includes("early") || n.includes("bird")) return { accent: "#f59e0b", dark: "#1c1002", badge: "Early Bird", glow: "rgba(245,158,11,0.25)" };
    return { accent: "#6366f1", dark: "#0f0f1f", badge: "Standard", glow: "rgba(99,102,241,0.25)" };
  })();

  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : 99;

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required"); return; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError("Enter a valid email address"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/public/events/${event.id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_name:  form.name.trim(),
          buyer_email: form.email.trim(),
          buyer_phone: form.phone.trim() || undefined,
          items: [{ ticket_type_id: ticket.id, quantity: qty }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");
      setResult(data.data);
      setStep(data.data.payment_required ? "paid" : "success");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div
          className="relative flex items-start justify-between p-6"
          style={{
            background: tier ? `linear-gradient(135deg, ${tier.dark}, ${tier.dark}ee)` : "#111827",
            borderBottom: tier ? `1px solid ${tier.accent}30` : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            {tier && (
              <span className="mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
                style={{ background: `${tier.accent}20`, color: tier.accent }}>★ {tier.badge}</span>
            )}
            <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">{event?.title}</p>
            <h3 className="text-xl font-bold text-white">{ticket.name}</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-white/40 hover:text-white hover:bg-white/10 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Quantity */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Quantity</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="h-10 w-10 rounded-xl border border-gray-200 text-lg font-bold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center">−</button>
                  <span className="w-10 text-center text-lg font-bold text-gray-900">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(available, q + 1))}
                    className="h-10 w-10 rounded-xl border border-gray-200 text-lg font-bold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center">+</button>
                  <span className="text-xs text-gray-400 ml-1">{available} available</span>
                </div>
              </div>

              {/* Buyer info */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Your details</p>
                {[
                  { key: "name",  label: "Full name *",    type: "text",  placeholder: "John Doe" },
                  { key: "email", label: "Email *",        type: "email", placeholder: "you@example.com" },
                  { key: "phone", label: "Phone (optional)", type: "tel",  placeholder: "+1 555 000 0000" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-[11px] text-gray-500 font-medium">{label}</label>
                    <input type={type} value={form[key]} placeholder={placeholder}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 transition"
                    />
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="rounded-2xl bg-gray-50 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">{qty} × {ticket.name}</span>
                <span className="text-lg font-bold text-gray-900">
                  {ticket.kind === "FREE" ? "Free" : fmtPrice(total)}
                </span>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button onClick={submit} disabled={submitting}
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                style={{ background: tier ? `linear-gradient(135deg, ${tier.accent}, ${tier.accent}cc)` : "#4F46E5" }}>
                {submitting ? "Processing…" : ticket.kind === "FREE" ? "Get Free Ticket" : `Pay ${fmtPrice(total)}`}
              </button>
            </motion.div>
          )}

          {step === "success" && result?.issued_tickets?.[0] && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="p-6 text-center space-y-5">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl" style={{ background: tier ? `${tier.accent}15` : "#EEF2FF" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={tier ? tier.accent : "#4F46E5"} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">You&apos;re in!</h3>
                <p className="text-sm text-gray-400 mt-1">Your ticket is confirmed. Show this QR at the door.</p>
              </div>

              {/* QR code */}
              <div className="mx-auto w-52 h-52 rounded-2xl overflow-hidden border-4 border-gray-100 shadow-sm">
                <img
                  src={`${API}/public/tickets/qr/${result.issued_tickets[0].qr_token}`}
                  alt="Ticket QR Code"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3 text-left space-y-1">
                <p className="text-xs text-gray-400">Order confirmation sent to</p>
                <p className="text-sm font-semibold text-gray-800">{form.email}</p>
              </div>

              <a
                href={`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/my-tickets?email=${encodeURIComponent(form.email)}`}
                className="block w-full rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                View all my tickets
              </a>
            </motion.div>
          )}

          {step === "paid" && result?.client_secret && (
            <motion.div key="paid" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Order #{result.order_id?.slice(0, 8)} · {fmtPrice(total)}
                </p>
              </div>
              {stripePromise ? (
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret: result.client_secret, appearance: { theme: "stripe" } }}
                >
                  <StripePaymentFormLight
                    accentColor={tier?.accent}
                    fmtTotal={fmtPrice(total)}
                    onSuccess={() => setStep("paid-success")}
                  />
                </Elements>
              ) : (
                <p className="text-sm text-red-500">
                  Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
                </p>
              )}
            </motion.div>
          )}

          {step === "paid-success" && (
            <motion.div key="paid-success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="p-6 text-center space-y-5">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl" style={{ background: tier ? `${tier.accent}15` : "#EEF2FF" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={tier ? tier.accent : "#4F46E5"} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment Confirmed! 🎉</h3>
                <p className="text-sm text-gray-400 mt-1">Your ticket is being issued and will be emailed to you.</p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3 text-left space-y-1">
                <p className="text-xs text-gray-400">Ticket sent to</p>
                <p className="text-sm font-semibold text-gray-800">{form.email}</p>
              </div>
              <a href={`/my-tickets?email=${encodeURIComponent(form.email)}`}
                className="block w-full rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                View My Ticket Profile →
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// export function TicketsSection({ section, event, isEditor = false, onEdit }) {
//   const config = section.config || {};
//   const theme  = config._theme || "CLASSIC";
//   const pad    = getThemePad(theme);

//   const API = process.env.NEXT_PUBLIC_API_URL;
//   const [tickets, setTickets]       = useState(isEditor ? TICKET_MOCK : []);
//   const [loadingTix, setLoadingTix] = useState(!isEditor && !!event?.id);
//   const [checkout, setCheckout]     = useState(null);

//   useEffect(() => {
//     if (isEditor || !event?.id) return;
//     setLoadingTix(true);
//     fetch(`${API}/public/events/${event.id}/tickets`)
//       .then((r) => r.json())
//       .then((d) => setTickets(d.tickets ?? []))
//       .catch(() => {})
//       .finally(() => setLoadingTix(false));
//   }, [event?.id, isEditor, API]);

//   const displayTickets = isEditor ? TICKET_MOCK : tickets;

//   return (
//     <SectionWrap id="tickets" bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
//       <div className="mx-auto max-w-5xl">
//         <FadeUp className="text-center">
//           <SectionEyebrow center>Tickets</SectionEyebrow>
//           <SectionHeading center>{section.title || "Get Your Ticket"}</SectionHeading>
//           {section.body && <SectionBody center>{section.body}</SectionBody>}
//           {theme !== "MODERN" && theme !== "MINIMAL" && <Ornament center />}
//         </FadeUp>

//         {loadingTix ? (
//           <div className="mt-14 grid gap-5 sm:grid-cols-3">
//             {[0, 1, 2].map((i) => (
//               <div key={i} className="h-64 animate-pulse rounded-2xl" style={{ background: "var(--t-bg-alt)" }} />
//             ))}
//           </div>
//         ) : displayTickets.length === 0 ? (
//           <div className="mt-14 rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: "var(--t-border)" }}>
//             <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>Tickets coming soon</p>
//           </div>
//         ) : (
//           <div className={`mt-14 grid gap-5 ${displayTickets.length === 1 ? "max-w-sm mx-auto" : displayTickets.length === 2 ? "sm:grid-cols-2 max-w-2xl mx-auto" : "sm:grid-cols-3"}`}>
//             {displayTickets.map((t, i) => (
//               <FadeUp key={t.id ?? i} delay={i * 0.1}>
//                 <TicketCard ticket={t} theme={theme} onBuy={setCheckout} />
//               </FadeUp>
//             ))}
//           </div>
//         )}
//       </div>

//       {isEditor && <EditorBadge label="TICKETS" />}

//       {/* Checkout modal */}
//       <AnimatePresence>
//         {checkout && !isEditor && (
//           <TicketCheckoutModal
//             ticket={checkout}
//             event={event}
//             theme={theme}
//             onClose={() => setCheckout(null)}
//           />
//         )}
//       </AnimatePresence>
//     </SectionWrap>
//   );
// }





// ══════════════════════════════════════════════════════════════════════════════
// TICKETS  —  drop-in replacement block for SharedSections.jsx
// Replace everything from `const TICKET_MOCK` down to the closing brace of
// `export function TicketsSection` (keep TicketCheckoutModal unchanged above)
// ══════════════════════════════════════════════════════════════════════════════

const TICKET_MOCK = [
  {
    id: "m1", name: "General Admission", kind: "FREE",
    price: 0, currency: "USD",
    description: "Full event access. Doors open 30 min before show.",
    quantity_total: 500, quantity_sold: 210,
  },
  {
    id: "m2", name: "Early Bird", kind: "PAID",
    price: 49, currency: "USD",
    description: "Limited early access pricing. Same great experience.",
    quantity_total: 100, quantity_sold: 88,
  },
  {
    id: "m3", name: "VIP Access", kind: "PAID",
    price: 199, currency: "USD",
    description: "Priority entry · Premium seating · Exclusive lounge · Gift bag",
    quantity_total: 40, quantity_sold: 15,
  },
];

// ── Tier resolver — works with real DB ticket names, no .tier field needed ──
function resolveTier(ticket) {
  const n = (ticket.name ?? "").toLowerCase();
  if (ticket.kind === "FREE")                                       return "free";
  if (n.includes("vip") || n.includes("platinum") || n.includes("premium") || n.includes("elite")) return "vip";
  if (n.includes("pro") || n.includes("diamond") || n.includes("ultra") || n.includes("all-access")) return "pro";
  if (n.includes("early") || n.includes("bird") || n.includes("presale") || n.includes("pre-sale")) return "early";
  if (n.includes("student") || n.includes("youth") || n.includes("concession"))                     return "discount";
  return "standard";
}

const TIER_CONFIG = {
  free: {
    label:       "Free",
    icon:        "🎁",
    accent:      "#10b981",
    accentLight: "#d1fae5",
    dark:        "#022c22",
    glow:        "rgba(16,185,129,0.18)",
    bg:          "linear-gradient(145deg,#022c22,#064e3b)",
    border:      "rgba(16,185,129,0.25)",
    textMuted:   "rgba(167,243,208,0.7)",
    featured:    false,
  },
  early: {
    label:       "Early Bird",
    icon:        "⚡",
    accent:      "#f59e0b",
    accentLight: "#fef3c7",
    dark:        "#1c1002",
    glow:        "rgba(245,158,11,0.22)",
    bg:          "linear-gradient(145deg,#1c1002,#451a03)",
    border:      "rgba(245,158,11,0.3)",
    textMuted:   "rgba(253,230,138,0.7)",
    featured:    false,
  },
  standard: {
    label:       "Standard",
    icon:        "🎟️",
    accent:      "#6366f1",
    accentLight: "#e0e7ff",
    dark:        "#0f0f1f",
    glow:        "rgba(99,102,241,0.2)",
    bg:          "linear-gradient(145deg,#0f0f1f,#1e1b4b)",
    border:      "rgba(99,102,241,0.28)",
    textMuted:   "rgba(199,210,254,0.7)",
    featured:    false,
  },
  discount: {
    label:       "Discount",
    icon:        "🏷️",
    accent:      "#06b6d4",
    accentLight: "#cffafe",
    dark:        "#0a1520",
    glow:        "rgba(6,182,212,0.18)",
    bg:          "linear-gradient(145deg,#0a1520,#0e4a5a)",
    border:      "rgba(6,182,212,0.25)",
    textMuted:   "rgba(165,243,252,0.7)",
    featured:    false,
  },
  vip: {
    label:       "VIP",
    icon:        "👑",
    accent:      "#C9A96E",
    accentLight: "#fef9ec",
    dark:        "#0f0b00",
    glow:        "rgba(201,169,110,0.28)",
    bg:          "linear-gradient(145deg,#0f0b00,#2d1f00)",
    border:      "rgba(201,169,110,0.35)",
    textMuted:   "rgba(253,230,138,0.65)",
    featured:    true,
    shimmer:     true,
  },
  pro: {
    label:       "Premium",
    icon:        "💎",
    accent:      "#a78bfa",
    accentLight: "#ede9fe",
    dark:        "#0d0718",
    glow:        "rgba(167,139,250,0.28)",
    bg:          "linear-gradient(145deg,#0d0718,#1e0a3c)",
    border:      "rgba(167,139,250,0.35)",
    textMuted:   "rgba(221,214,254,0.65)",
    featured:    true,
    shimmer:     true,
  },
};

// ── Perforated divider ────────────────────────────────────────────────────────
function PerforationLine({ color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 24px" }}>
      <div style={{ height: 1, flex: 1, background: color, opacity: 0.2 }} />
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: color, opacity: 0.15 }} />
      ))}
      <div style={{ height: 1, flex: 1, background: color, opacity: 0.2 }} />
    </div>
  );
}

// ── Individual ticket card ────────────────────────────────────────────────────
function TicketCard({ ticket, onBuy, isFeatured }) {
  const tierKey = resolveTier(ticket);
  const cfg     = TIER_CONFIG[tierKey];

  const available = ticket.quantity_total != null
    ? ticket.quantity_total - (ticket.quantity_sold ?? 0)
    : null;
  const isSoldOut  = available !== null && available <= 0;
  const pct        = ticket.quantity_total
    ? Math.min(((ticket.quantity_sold ?? 0) / ticket.quantity_total) * 100, 100)
    : 0;
  const isUrgent   = available !== null && available > 0 && available <= 20;
  const isLow      = available !== null && available > 0 && available <= 50;

  const fmtPrice = (n) =>
    n === 0
      ? "Free"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: ticket.currency ?? "USD",
          maximumFractionDigits: 0,
        }).format(n);

  return (
    <div
      style={{
        position:     "relative",
        display:      "flex",
        flexDirection:"column",
        overflow:     "hidden",
        borderRadius: 20,
        background:   cfg.bg,
        border:       `1px solid ${cfg.border}`,
        boxShadow:    `0 8px 40px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        transition:   "transform 0.25s ease, box-shadow 0.25s ease",
        transform:    isFeatured ? "scale(1.03)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = isFeatured ? "scale(1.05) translateY(-4px)" : "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 20px 60px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isFeatured ? "scale(1.03)" : "scale(1)";
        e.currentTarget.style.boxShadow = `0 8px 40px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`;
      }}
    >
      {/* Shimmer overlay for VIP / Pro */}
      {cfg.shimmer && (
        <div style={{
          position:   "absolute",
          inset:      0,
          background: `linear-gradient(105deg, transparent 40%, ${cfg.accent}08 50%, transparent 60%)`,
          backgroundSize: "200% 100%",
          animation:  "shimmer 3s ease infinite",
          pointerEvents: "none",
        }} />
      )}

      {/* Featured badge */}
      {isFeatured && (
        <div style={{
          position:   "absolute",
          top:        16,
          right:      16,
          background: cfg.accent,
          color:      cfg.dark,
          fontSize:   9,
          fontWeight: 900,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          padding:    "3px 10px",
          borderRadius: 99,
        }}>
          Most Popular
        </div>
      )}

      {/* Accent top stripe */}
      <div style={{
        height:     3,
        background: `linear-gradient(90deg, ${cfg.accent}, ${cfg.accent}60, transparent)`,
        flexShrink: 0,
      }} />

      {/* Header */}
      <div style={{ padding: "20px 24px 12px" }}>
        {/* Tier badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{cfg.icon}</span>
          <span style={{
            fontSize:      10,
            fontWeight:    900,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:         cfg.accent,
            background:    `${cfg.accent}18`,
            border:        `1px solid ${cfg.accent}35`,
            borderRadius:  99,
            padding:       "2px 10px",
          }}>
            {cfg.label}
          </span>
        </div>

        {/* Name */}
        <h4 style={{
          fontSize:      22,
          fontWeight:    800,
          color:         "#fff",
          letterSpacing: "-0.02em",
          lineHeight:    1.2,
          marginBottom:  6,
        }}>
          {ticket.name}
        </h4>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{
            fontSize:      36,
            fontWeight:    900,
            color:         ticket.kind === "FREE" ? cfg.accent : "#fff",
            letterSpacing: "-0.03em",
            lineHeight:    1,
          }}>
            {fmtPrice(Number(ticket.price))}
          </span>
          {ticket.kind !== "FREE" && (
            <span style={{ fontSize: 12, color: cfg.textMuted, fontWeight: 500 }}>/ person</span>
          )}
        </div>
      </div>

      {/* Perforation */}
      <PerforationLine color={cfg.accent} />

      {/* Body */}
      <div style={{ padding: "12px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Description */}
        {ticket.description && (
          <p style={{ fontSize: 13, lineHeight: 1.65, color: cfg.textMuted, margin: 0 }}>
            {ticket.description}
          </p>
        )}

        {/* Features — parse bullet descriptions */}
        {ticket.description && ticket.description.includes("·") && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {ticket.description.split("·").map((f, i) => f.trim() && (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: cfg.textMuted }}>
                <span style={{ color: cfg.accent, fontSize: 10 }}>✓</span>
                {f.trim()}
              </li>
            ))}
          </ul>
        )}

        {/* Capacity bar */}
        {ticket.quantity_total != null && (
          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, color: cfg.textMuted }}>
              <span>
                {isSoldOut
                  ? "Sold out"
                  : isUrgent
                  ? `⚠ Only ${available} left!`
                  : isLow
                  ? `${available} remaining`
                  : `${ticket.quantity_total - (ticket.quantity_sold ?? 0)} available`}
              </span>
              <span style={{ color: isSoldOut ? cfg.textMuted : cfg.accent, fontWeight: 700 }}>
                {pct.toFixed(0)}%
              </span>
            </div>
            <div style={{
              height:       5,
              borderRadius: 99,
              background:   `${cfg.accent}18`,
              overflow:     "hidden",
            }}>
              <div style={{
                height:     "100%",
                width:      `${pct}%`,
                borderRadius: 99,
                background: isSoldOut
                  ? "rgba(255,255,255,0.2)"
                  : isUrgent
                  ? "#ef4444"
                  : `linear-gradient(90deg, ${cfg.accent}, ${cfg.accent}cc)`,
                transition: "width 1s cubic-bezier(0.22,1,0.36,1)",
                boxShadow:  !isSoldOut ? `0 0 8px ${cfg.glow}` : "none",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Perforation above CTA */}
      <PerforationLine color={cfg.accent} />

      {/* CTA */}
      <div style={{ padding: "14px 24px 20px" }}>
        <button
          onClick={() => !isSoldOut && onBuy(ticket)}
          disabled={isSoldOut}
          style={{
            width:         "100%",
            padding:       "13px 0",
            borderRadius:  12,
            fontSize:      14,
            fontWeight:    800,
            letterSpacing: "0.03em",
            cursor:        isSoldOut ? "not-allowed" : "pointer",
            border:        "none",
            transition:    "all 0.2s ease",
            background:    isSoldOut
              ? "rgba(255,255,255,0.05)"
              : `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}cc)`,
            color:         isSoldOut ? "rgba(255,255,255,0.25)" : cfg.dark,
            boxShadow:     !isSoldOut ? `0 4px 20px ${cfg.glow}` : "none",
          }}
          onMouseEnter={(e) => {
            if (!isSoldOut) {
              e.currentTarget.style.filter = "brightness(1.1)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "";
            e.currentTarget.style.transform = "";
          }}
        >
          {isSoldOut
            ? "Sold Out"
            : ticket.kind === "FREE"
            ? "Reserve Free Spot →"
            : `Get ${cfg.label} Ticket →`}
        </button>
      </div>
    </div>
  );
}

// ── Tickets section ───────────────────────────────────────────────────────────
export function TicketsSection({ section, event, isEditor = false, onEdit }) {
  const config = section.config || {};
  const theme  = config._theme || "CLASSIC";
  const pad    = getThemePad(theme);

  const API = process.env.NEXT_PUBLIC_API_URL;
  const [tickets,    setTickets]    = useState(isEditor ? TICKET_MOCK : []);
  const [loadingTix, setLoadingTix] = useState(!isEditor && !!event?.id);
  const [checkout,   setCheckout]   = useState(null);

  useEffect(() => {
    if (isEditor || !event?.id || !API) return;
    fetch(`${API}/public/events/${event.id}/tickets`)
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets ?? []))
      .catch(() => {})
      .finally(() => setLoadingTix(false));
  }, [event?.id, isEditor, API]);

  useEffect(() => {
    if (isEditor) return;
    const handler = (e) => setCheckout(e.detail);
    window.addEventListener("open-ticket-checkout", handler);
    return () => window.removeEventListener("open-ticket-checkout", handler);
  }, [isEditor]);

  const displayTickets = isEditor ? TICKET_MOCK : tickets;

  // Mark the highest-priced ticket as featured
  const maxPrice = Math.max(...displayTickets.map((t) => Number(t.price ?? 0)));

  // Grid layout based on count
  const gridStyle = (() => {
    const n = displayTickets.length;
    if (n === 1) return { maxWidth: 360,  gridTemplateColumns: "1fr" };
    if (n === 2) return { maxWidth: 760,  gridTemplateColumns: "repeat(2,1fr)" };
    if (n === 4) return { maxWidth: 1000, gridTemplateColumns: "repeat(2,1fr)" };
    return              { maxWidth: 1100, gridTemplateColumns: "repeat(3,1fr)" };
  })();

  return (
    <SectionWrap id="tickets" bg="var(--t-bg)" isEditor={isEditor} onClick={onEdit} pad={pad}>
      {/* shimmer keyframes injected once */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 var(--ring-color); }
          70%  { box-shadow: 0 0 0 10px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <FadeUp className="text-center mb-14">
          <SectionEyebrow center>Tickets</SectionEyebrow>
          <SectionHeading center>{section.title || "Choose Your Experience"}</SectionHeading>
          {section.body && <SectionBody center>{section.body}</SectionBody>}
          {theme !== "MODERN" && theme !== "MINIMAL" && <Ornament center />}
        </FadeUp>

        {/* Loading skeletons */}
        {loadingTix && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 340,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.04)",
                  animation: "pulse 1.5s ease infinite",
                }}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loadingTix && displayTickets.length === 0 && (
          <div style={{
            border:       "1px dashed var(--t-border)",
            borderRadius: 20,
            padding:      "60px 24px",
            textAlign:    "center",
            color:        "var(--t-text-muted)",
            fontSize:     14,
          }}>
            Tickets coming soon
          </div>
        )}

        {/* Cards grid */}
        {!loadingTix && displayTickets.length > 0 && (
          <div style={{
            display:             "grid",
            ...gridStyle,
            gap:                 20,
            margin:              "0 auto",
            alignItems:          "start",
          }}>
            {displayTickets.map((t, i) => {
              const isFeatured = Number(t.price ?? 0) === maxPrice && maxPrice > 0;
              return (
                <FadeUp key={t.id ?? i} delay={i * 0.08}>
                  <TicketCard
                    ticket={t}
                    onBuy={setCheckout}
                    isFeatured={isFeatured}
                  />
                </FadeUp>
              );
            })}
          </div>
        )}

        {/* Trust strip */}
        {!loadingTix && displayTickets.length > 0 && (
          <FadeUp delay={0.4}>
            <div style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            28,
              marginTop:      40,
              flexWrap:       "wrap",
            }}>
              {[
                { icon: "🔒", text: "Secure checkout" },
                { icon: "✉️", text: "Instant e-ticket" },
                { icon: "📲", text: "QR code entry" },
                { icon: "💳", text: "Stripe payments" },
              ].map(({ icon, text }) => (
                <div key={text} style={{
                  display:    "flex",
                  alignItems: "center",
                  gap:        6,
                  fontSize:   12,
                  color:      "var(--t-text-muted)",
                  opacity:    0.7,
                }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </FadeUp>
        )}
      </div>

      {isEditor && <EditorBadge label="TICKETS" />}

      {/* Checkout modal — unchanged */}
      <AnimatePresence>
        {checkout && !isEditor && (
          <TicketCheckoutModal
            ticket={checkout}
            event={event}
            theme={theme}
            onClose={() => setCheckout(null)}
          />
        )}
      </AnimatePresence>
    </SectionWrap>
  );
}








// ══════════════════════════════════════════════════════════════════════════════
// DONATIONS
// ══════════════════════════════════════════════════════════════════════════════
const PRESET_AMOUNTS = [10, 25, 50, 100];
const DONATION_API = process.env.NEXT_PUBLIC_API_URL;

export function DonationsSection({ section, event, isEditor = false, onEdit }) {
  const theme = section.config?._theme || "CLASSIC";

  const [preset,      setPreset]      = useState(25);
  const [custom,      setCustom]      = useState("");
  const [form,        setForm]        = useState({ name: "", email: "", message: "" });
  const [anonymous,   setAnonymous]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [donated,     setDonated]     = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("donation") === "success";
  });

  useEffect(() => {
    if (donated) window.history.replaceState({}, "", window.location.pathname);
  }, [donated]);

  const amount = preset === "custom" ? Number(custom) : preset;

  async function handleDonate(e) {
    e.preventDefault();
    if (!form.email.trim()) return setError("Email is required");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email");
    if (!amount || amount <= 0) return setError("Enter a valid donation amount");
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${DONATION_API}/engagement/events/${event?.id}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor_name:  anonymous ? null : form.name.trim() || null,
          donor_email: form.email.trim().toLowerCase(),
          amount,
          currency: "USD",
          message:     form.message.trim() || undefined,
          is_anonymous: anonymous,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Donation failed");
      if (data.data?.checkout_url) {
        window.location.href = data.data.checkout_url;
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const showEditor = isEditor;
  // Hide everywhere (editor included) when donations are disabled
  if (!event?.allow_donations && !donated) return null;

  return (
    <section
      id="donations"
      className={`px-6 py-24 sm:py-32 ${showEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60 relative" : ""}`}
      style={{ background: "var(--t-dark-surface)" }}
      onClick={showEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-xl">

        {/* Thank-you state */}
        {donated && !showEditor && (
          <FadeUp className="text-center space-y-4">
            <div className="text-5xl">💛</div>
            <SectionHeading center light>Thank you!</SectionHeading>
            <SectionBody center light>Your generous contribution means the world to us.</SectionBody>
            <button onClick={() => setDonated(false)}
              className="mt-4 text-xs uppercase tracking-widest underline"
              style={{ color: "rgba(255,255,255,0.45)" }}>
              Make another donation
            </button>
          </FadeUp>
        )}

        {/* Donation form */}
        {(!donated || showEditor) && (
          <>
            <FadeUp className="text-center">
              <SectionEyebrow center>Give</SectionEyebrow>
              <SectionHeading center light>{section.title || "Make a Gift"}</SectionHeading>
              {section.body && <SectionBody center light>{section.body}</SectionBody>}
              {theme !== "MODERN" && theme !== "MINIMAL" && <Ornament center />}
            </FadeUp>

            <FadeUp delay={0.15} className="mt-10 space-y-6">

              {/* Preset amounts */}
              <div>
                <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">Select Amount</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {PRESET_AMOUNTS.map((a) => (
                    <button key={a} type="button"
                      onClick={showEditor ? undefined : () => { setPreset(a); setCustom(""); }}
                      className="py-3 text-sm font-semibold transition active:scale-95"
                      style={{
                        borderRadius: "var(--t-radius, 6px)",
                        border: preset === a ? "1.5px solid var(--t-accent)" : "1px solid rgba(255,255,255,0.15)",
                        background: preset === a ? "var(--t-accent)" : "transparent",
                        color: preset === a ? "#000" : "rgba(255,255,255,0.75)",
                      }}>
                      ${a}
                    </button>
                  ))}
                  <button type="button"
                    onClick={showEditor ? undefined : () => setPreset("custom")}
                    className="py-3 text-sm font-semibold transition active:scale-95 col-span-4 sm:col-span-1"
                    style={{
                      borderRadius: "var(--t-radius, 6px)",
                      border: preset === "custom" ? "1.5px solid var(--t-accent)" : "1px solid rgba(255,255,255,0.15)",
                      background: preset === "custom" ? "var(--t-accent)" : "transparent",
                      color: preset === "custom" ? "#000" : "rgba(255,255,255,0.75)",
                    }}>
                    Custom
                  </button>
                </div>
                {preset === "custom" && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-white/50 text-sm">$</span>
                    <input type="number" min="1" step="1" value={custom}
                      onChange={e => setCustom(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1 bg-transparent border-b py-2 text-lg font-semibold text-white placeholder-white/25 outline-none"
                      style={{ borderColor: "rgba(255,255,255,0.2)" }} />
                  </div>
                )}
              </div>

              {/* Form fields */}
              <form onSubmit={showEditor ? (e) => e.preventDefault() : handleDonate} className="space-y-4">
                {[
                  { key: "name",    label: anonymous ? "Name (hidden)" : "Your Name",  type: "text",  placeholder: "Optional", required: false },
                  { key: "email",   label: "Email",                                     type: "email", placeholder: "your@email.com", required: true },
                ].map(({ key, label, type, placeholder, required }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.25em] mb-1.5 text-white/40">{label}</label>
                    <input type={type} value={form[key]} placeholder={placeholder}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      required={required}
                      className="w-full bg-transparent border-b py-2.5 text-sm text-white placeholder-white/25 outline-none transition"
                      style={{ borderColor: "rgba(255,255,255,0.18)" }}
                      onFocus={e => e.target.style.borderColor = "var(--t-accent)"}
                      onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.18)"} />
                  </div>
                ))}

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.25em] mb-1.5 text-white/40">Message (optional)</label>
                  <textarea rows={2} value={form.message} placeholder="Leave a kind word…"
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full bg-transparent border-b py-2.5 text-sm text-white placeholder-white/25 outline-none resize-none transition"
                    style={{ borderColor: "rgba(255,255,255,0.18)" }}
                    onFocus={e => e.target.style.borderColor = "var(--t-accent)"}
                    onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.18)"} />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div onClick={() => !showEditor && setAnonymous(v => !v)}
                    className="w-10 h-6 rounded-full transition-colors flex items-center px-1"
                    style={{ background: anonymous ? "var(--t-accent)" : "rgba(255,255,255,0.12)" }}>
                    <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                      style={{ transform: anonymous ? "translateX(16px)" : "translateX(0)" }} />
                  </div>
                  <span className="text-xs text-white/50">Donate anonymously</span>
                </label>

                {error && <p className="text-sm text-rose-400">{error}</p>}

                <button type="submit" disabled={submitting || showEditor}
                  className="w-full py-4 text-sm font-bold uppercase tracking-[0.15em] transition active:scale-[0.98] disabled:opacity-50 mt-2"
                  style={{
                    background: "var(--t-accent)",
                    color: "var(--t-accent-fg, #000)",
                    borderRadius: "var(--t-radius, 6px)",
                  }}>
                  {submitting ? "Redirecting…" : `Give ${ preset === "custom" ? (custom ? `$${custom}` : "…") : `$${preset}` } →`}
                </button>
              </form>

            </FadeUp>
          </>
        )}
      </div>
      {showEditor && <EditorBadge label="DONATIONS" />}
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
// DONATION CHECKOUT CARD — shown inside CTASection when allow_donations is on
// ══════════════════════════════════════════════════════════════════════════════
const DONATION_PRESETS_CTA = [10, 25, 50, 100];

function DonationCheckoutCard({ event, isEditor }) {
  const API = process.env.NEXT_PUBLIC_API_URL;
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor_name:  name.trim() || null,
          donor_email: email.trim().toLowerCase(),
          amount,
          currency: "USD",
        }),
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
    <div className="mx-auto mt-10 w-full max-w-sm">
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}
      >
        {/* Card header */}
        <div className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(244,114,182,0.15)" }}>
            <Heart className="h-4 w-4" style={{ color: "#f472b6" }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-white">Support this event</p>
            <p className="mt-0.5 text-[11px] text-white/40">Any amount makes a difference</p>
          </div>
        </div>

        {/* Card body */}
        <form
          onSubmit={isEditor ? (e) => e.preventDefault() : handleDonate}
          className="space-y-3 px-5 py-5"
        >
          {/* Preset amounts */}
          <div className="grid grid-cols-4 gap-1.5">
            {DONATION_PRESETS_CTA.map((a) => (
              <button
                key={a}
                type="button"
                onClick={isEditor ? undefined : () => { setPreset(a); setCustom(""); }}
                className="py-2 text-xs font-bold transition active:scale-95"
                style={{
                  borderRadius: "10px",
                  border: preset === a ? "1.5px solid var(--t-accent)" : "1px solid rgba(255,255,255,0.12)",
                  background: preset === a ? "var(--t-accent)" : "rgba(255,255,255,0.03)",
                  color: preset === a ? "#000" : "rgba(255,255,255,0.65)",
                }}
              >
                ${a}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <span className="text-sm font-medium text-white/35">$</span>
            <input
              type="number"
              min="1"
              value={preset === "custom" ? custom : ""}
              placeholder={preset !== "custom" ? String(preset) : "Custom amount"}
              onFocus={isEditor ? undefined : () => setPreset("custom")}
              onChange={(e) => { setPreset("custom"); setCustom(e.target.value); }}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
            />
            <span className="text-[10px] text-white/25 uppercase tracking-widest">USD</span>
          </div>

          {/* Name (optional) */}
          <input
            type="text"
            value={name}
            placeholder="Your name (optional)"
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
          />

          {/* Email */}
          <input
            type="email"
            required
            value={email}
            placeholder="your@email.com"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || isEditor}
            className="w-full rounded-xl py-3 text-sm font-black uppercase tracking-[0.12em] transition active:scale-[0.98] disabled:opacity-60"
            style={{ background: "var(--t-accent)", color: "var(--t-accent-fg, #000)" }}
          >
            {submitting
              ? "Redirecting…"
              : `Give ${preset === "custom" ? (custom ? `$${custom}` : "…") : `$${preset}`} →`}
          </button>

          <p className="text-center text-[10px] text-white/25">Secure checkout via Stripe</p>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function CTASection({ section, event, isEditor = false, onEdit }) {
  const config  = section.config || {};
  const theme   = config._theme || "CLASSIC";
  const API     = process.env.NEXT_PUBLIC_API_URL;

  const [hasToken, setHasToken]   = useState(false);
  const [pubTickets, setPubTickets] = useState([]);

  useEffect(() => {
    setHasToken(!!new URLSearchParams(window.location.search).get("token"));
  }, []);

  // Fetch public tickets to get pricing info when event has ticketing enabled
  const isTicketed = !isEditor && !!event?.allow_ticketing;
  useEffect(() => {
    if (!isTicketed || !event?.id || !API) return;
    fetch(`${API}/public/events/${event.id}/tickets`)
      .then((r) => r.json())
      .then((d) => setPubTickets(d.tickets ?? []))
      .catch(() => {});
  }, [isTicketed, event?.id, API]);

  const handleRsvp       = () => window.dispatchEvent(new CustomEvent("open-rsvp-panel"));
  const handleBuyTickets = () => {
    if (event?.slug) window.location.href = `/e/${event.slug}/tickets`;
  };

  // Price range label
  const paidTickets = pubTickets.filter((t) => t.price > 0);
  const freeTickets = pubTickets.filter((t) => !t.price || t.price === 0);
  const minPrice    = paidTickets.length ? Math.min(...paidTickets.map((t) => Number(t.price))) : 0;
  const maxPrice    = paidTickets.length ? Math.max(...paidTickets.map((t) => Number(t.price))) : 0;
  const currency    = pubTickets[0]?.currency ?? "USD";
  const fmt         = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const priceLabel  = paidTickets.length === 0
    ? (freeTickets.length ? "Free entry" : "")
    : minPrice === maxPrice ? `From ${fmt(minPrice)}`
    : `${fmt(minPrice)} – ${fmt(maxPrice)}`;
  const spotsLeft   = pubTickets.reduce((s, t) => {
    const avail = t.quantity_total != null ? (t.quantity_total - (t.quantity_sold ?? 0)) : null;
    return avail != null ? s + avail : s;
  }, 0);
  const hasLimit    = pubTickets.some((t) => t.quantity_total != null);

  // In editor mode, preview ticketing look if event has allow_ticketing set
  const showTicketingMode = isEditor
    ? !!(event?.allow_ticketing)
    : isTicketed;

  const showDonation = !!event?.allow_donations;

  // Ticketing CTA content per theme
  const ticketCTA = {
    title:  section.title  || "Secure Your Spot",
    body:   section.body   || "Limited seats available. Get your tickets before they sell out.",
    button: config.button_text || "Buy Tickets",
  };

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
              {showTicketingMode ? ticketCTA.title : (section.title || "Join Us")}
            </h2>
            {showTicketingMode ? (
              <div className="mt-5 max-w-lg space-y-3">
                <p className="text-base text-white/50">{ticketCTA.body}</p>
                {priceLabel && <p className="text-lg font-black" style={{ color: "var(--t-accent)" }}>{priceLabel}</p>}
                {hasLimit && spotsLeft > 0 && spotsLeft < 50 && (
                  <p className="text-xs font-bold uppercase tracking-widest text-red-400">⚡ Only {spotsLeft} spots left</p>
                )}
              </div>
            ) : (
              section.body && <p className="mt-5 max-w-lg text-base text-white/50">{section.body}</p>
            )}
            {(showTicketingMode || isEditor || hasToken) && (
              <button
                onClick={!isEditor ? (showTicketingMode ? handleBuyTickets : handleRsvp) : undefined}
                className="mt-10 w-full max-w-sm text-sm font-black uppercase tracking-[0.2em] transition active:scale-95"
                style={{ background: "var(--t-accent)", color: "#000", padding: "1.25rem 3rem" }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                {showTicketingMode ? ticketCTA.button : (config.button_text || "Register Now")}
              </button>
            )}
            {showDonation && (
              <div className="mt-12 max-w-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25">or donate</span>
                  <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.1)" }} />
                </div>
                <DonationCheckoutCard event={event} isEditor={isEditor} />
              </div>
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
              {showTicketingMode ? ticketCTA.title : (section.title || "Join Us")}
            </h2>
            {showTicketingMode && priceLabel && (
              <p className="mt-4 text-sm font-medium tracking-widest uppercase" style={{ color: "var(--t-accent)" }}>{priceLabel}</p>
            )}
            {showTicketingMode && hasLimit && spotsLeft > 0 && spotsLeft < 50 && (
              <p className="mt-2 text-xs uppercase tracking-widest text-red-400/80">Only {spotsLeft} spots remaining</p>
            )}
            {(showTicketingMode || isEditor || hasToken) && (
              <button
                onClick={!isEditor ? (showTicketingMode ? handleBuyTickets : handleRsvp) : undefined}
                className="mt-14 border bg-transparent text-xs font-light uppercase tracking-[0.5em] text-white/60 transition hover:text-white hover:border-white/50 px-12 py-5"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                {showTicketingMode ? ticketCTA.button : (config.button_text || "RSVP")}
              </button>
            )}
            {showDonation && (
              <>
                <div className="mt-16 flex items-center justify-center gap-4">
                  <div className="h-px w-16" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <span className="text-[10px] font-light uppercase tracking-[0.4em] text-white/20">or donate</span>
                  <div className="h-px w-16" style={{ background: "rgba(255,255,255,0.08)" }} />
                </div>
                <DonationCheckoutCard event={event} isEditor={isEditor} />
              </>
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
                {showTicketingMode ? ticketCTA.title : (section.title || "Let's Party! 🎉")}
              </h2>
              {showTicketingMode ? (
                <div className="mt-4 space-y-2">
                  <p className="text-lg text-white/80">{ticketCTA.body}</p>
                  {priceLabel && <p className="text-2xl font-black text-white">{priceLabel}</p>}
                  {hasLimit && spotsLeft > 0 && spotsLeft < 50 && (
                    <p className="text-sm font-black uppercase tracking-widest text-white/70">⚡ Only {spotsLeft} spots left!</p>
                  )}
                </div>
              ) : (
                section.body && <p className="mt-4 text-lg text-white/80">{section.body}</p>
              )}
              {(showTicketingMode || isEditor || hasToken) && (
                <button onClick={!isEditor ? (showTicketingMode ? handleBuyTickets : handleRsvp) : undefined}
                  className="mt-8 inline-block bg-white text-sm font-black uppercase tracking-[0.15em] transition active:scale-95 px-10 py-4"
                  style={{ color: "var(--t-accent)", borderRadius: 999, border: "3px solid #1a1a1a", boxShadow: "4px 4px 0 #1a1a1a" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-2px,-2px)"; e.currentTarget.style.boxShadow = "6px 6px 0 #1a1a1a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "4px 4px 0 #1a1a1a"; }}
                >
                  {showTicketingMode ? ticketCTA.button : (config.button_text || "Count Me In! →")}
                </button>
              )}
            </div>
            {showDonation && (
              <>
                <div className="mt-10 flex items-center justify-center gap-3">
                  <div className="h-0.5 w-12 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
                  <span className="text-xs font-black uppercase tracking-[0.25em] text-white/30">or donate</span>
                  <div className="h-0.5 w-12 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
                </div>
                <DonationCheckoutCard event={event} isEditor={isEditor} />
              </>
            )}
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
              {showTicketingMode ? ticketCTA.title : (section.title || "Join Us")}
            </h2>
            {showTicketingMode ? (
              <div className="mt-6 space-y-3">
                <p className="mx-auto max-w-md text-lg text-white/40 italic">{ticketCTA.body}</p>
                {priceLabel && <p className="text-xl font-semibold tracking-widest uppercase" style={{ color: "var(--t-accent)" }}>{priceLabel}</p>}
                {hasLimit && spotsLeft > 0 && spotsLeft < 50 && (
                  <p className="text-xs uppercase tracking-[0.3em] text-white/30">— Only {spotsLeft} tickets remain —</p>
                )}
              </div>
            ) : (
              section.body && <p className="mx-auto mt-6 max-w-md text-lg text-white/40 italic">{section.body}</p>
            )}
            {(showTicketingMode || isEditor || hasToken) && (
              <button onClick={!isEditor ? (showTicketingMode ? handleBuyTickets : handleRsvp) : undefined}
                className="mt-14 bg-transparent text-sm font-medium uppercase tracking-[0.4em] transition active:scale-95 px-12 py-5 text-white"
                style={{ border: "1px solid var(--t-accent)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-accent)"; e.currentTarget.style.color = "#000"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#fff"; }}
              >
                {showTicketingMode ? ticketCTA.button : (config.button_text || "Confirm Attendance")}
              </button>
            )}
            {showDonation && (
              <>
                <div className="mt-14 flex items-center justify-center gap-5">
                  <div className="h-px w-10" style={{ background: "var(--t-accent)", opacity: 0.2 }} />
                  <span className="text-[10px] font-medium uppercase tracking-[0.4em] italic text-white/20">or donate</span>
                  <div className="h-px w-10" style={{ background: "var(--t-accent)", opacity: 0.2 }} />
                </div>
                <DonationCheckoutCard event={event} isEditor={isEditor} />
              </>
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
            {showTicketingMode ? ticketCTA.title : (section.title || "Join Us")}
          </h2>
          {showTicketingMode ? (
            <div className="mt-5 space-y-3">
              <p className="mx-auto max-w-md text-lg text-white/50">{ticketCTA.body}</p>
              {priceLabel && <p className="text-lg font-semibold tracking-widest uppercase" style={{ color: "var(--t-accent)" }}>{priceLabel}</p>}
              {hasLimit && spotsLeft > 0 && spotsLeft < 50 && (
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">· {spotsLeft} tickets remaining ·</p>
              )}
            </div>
          ) : (
            section.body && <p className="mx-auto mt-5 max-w-md text-lg text-white/50">{section.body}</p>
          )}
          {(showTicketingMode || isEditor || hasToken) && (
            <button onClick={!isEditor ? (showTicketingMode ? handleBuyTickets : handleRsvp) : undefined}
              className="mt-12 bg-transparent px-12 py-4 text-sm font-medium uppercase tracking-[0.25em] transition active:scale-95"
              style={{ border: "1px solid var(--t-accent)", color: "var(--t-accent)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-dark)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-accent)"; }}
            >
              {showTicketingMode ? ticketCTA.button : (config.button_text || "Confirm Attendance")}
            </button>
          )}
          {showDonation && (
            <>
              <div className="mt-14 flex items-center justify-center gap-5">
                <div className="h-px w-12" style={{ background: "var(--t-accent)", opacity: 0.25 }} />
                <span className="text-[10px] font-medium uppercase tracking-[0.35em] italic text-white/25">or donate</span>
                <div className="h-px w-12" style={{ background: "var(--t-accent)", opacity: 0.25 }} />
              </div>
              <DonationCheckoutCard event={event} isEditor={isEditor} />
            </>
          )}
        </FadeUp>
      </div>
      {isEditor && <EditorBadge label="CTA" />}
    </section>
  );
}
