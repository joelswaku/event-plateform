"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  MapPin, Navigation, Building2, Car, Copy, Check,
  ExternalLink, ChevronDown, Heart,
  ChevronLeft, ChevronRight, X, Download, ZoomIn,
} from "lucide-react";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const ease = [0.22, 1, 0.36, 1];

// ── Animation ─────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
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
export function AboutSection({ section, event, isEditor = false, onEdit }) {
  const theme  = section.config?._theme || "CLASSIC";
  const pad    = getThemePad(theme);
  const aTitle = section.title || (!isEditor && event?.title) || "About This Event";
  const aBody  = section.body  || (!isEditor && (event?.description || event?.short_description)) || (isEditor ? "Add your event description here." : "");

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
                  {aTitle}
                </h2>
                <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--t-text-muted)" }}>
                  {aBody}
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
              {aTitle}
            </h2>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="mx-auto mt-10 text-base leading-loose" style={{ color: "var(--t-text-muted)" }}>
              {aBody}
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
            <SectionHeading center>{aTitle}</SectionHeading>
            <Ornament center />
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="mx-auto mt-10 max-w-2xl text-lg leading-loose italic" style={{ color: "var(--t-text-muted)" }}>
              {aBody}
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
            <div className="rounded-3xl p-10 sm:p-14" style={{ background: "var(--t-bg-alt)", border: "2px solid #1a1a1a", boxShadow: "6px 6px 0px #1a1a1a" }}>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--t-accent)" }}>✦ About</p>
              <h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>
                {aTitle}
              </h2>
              <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--t-text-muted)" }}>
                {aBody}
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
                <SectionHeading>{aTitle}</SectionHeading>
                <p className="mt-8 text-lg leading-relaxed" style={{ color: "var(--t-text-muted)" }}>
                  {aBody}
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
          <SectionHeading center>{aTitle}</SectionHeading>
          <Ornament center />
        </FadeUp>
        <FadeUp delay={0.15}>
          <p className="mx-auto mt-10 max-w-2xl text-lg leading-relaxed" style={{ color: "var(--t-text-muted)" }}>
            {aBody}
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
// ══════════════════════════════════════════════════════════════════════════════
// STORY — per-theme redesign with full animations
// ══════════════════════════════════════════════════════════════════════════════
export function StorySection({ section, isEditor = false, onEdit }) {
  const config   = section.config || {};
  const theme    = config._theme || "CLASSIC";
  const imageUrl = config.story_image || null;
  const imgLeft  = config.image_position !== "right";
  const quote    = config.quote || null;
  const body     = section.body || (isEditor ? "Share the story behind this event…" : "");
  const title    = section.title || "Our Story";

  const editorCls = isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : "";

  const ImgPlaceholder = ({ className = "" }) => (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} style={{ background: "var(--t-bg-alt)" }}>
      <svg className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5" />
      </svg>
      {isEditor && <p className="text-xs" style={{ color: "var(--t-text-muted)" }}>Upload a photo</p>}
    </div>
  );

  // ── LUXURY ───────────────────────────────────────────────────────────────
  if (theme === "LUXURY") {
    return (
      <section className={`relative overflow-hidden ${editorCls}`} onClick={isEditor ? onEdit : undefined}>
        <div className="relative h-[62vh] min-h-[400px] w-full overflow-hidden">
          {imageUrl
            ? <motion.img src={imageUrl} alt="Our Story" className="h-full w-full object-cover"
                initial={{ scale: 1.08 }} animate={{ scale: 1 }}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} />
            : <ImgPlaceholder className="h-full w-full" />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(13,12,10,0) 30%, rgba(13,12,10,0.95) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 px-8 pb-14 sm:px-20">
            <FadeUp>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.45em]" style={{ color: "var(--t-accent)" }}>Our Story</p>
              <h2 className="text-4xl font-thin italic uppercase sm:text-6xl leading-tight" style={{ fontFamily: "var(--t-font-heading)", color: "#fff", letterSpacing: "0.06em" }}>{title}</h2>
            </FadeUp>
          </div>
        </div>
        <div className="px-8 py-16 sm:px-20 sm:py-24" style={{ background: "#0D0C0A" }}>
          <div className="mx-auto max-w-3xl">
            <FadeUp delay={0.15}>
              <p className="text-lg leading-[1.95] font-light" style={{ color: "rgba(237,232,223,0.65)", letterSpacing: "0.01em" }}>{body}</p>
            </FadeUp>
            {quote && (
              <FadeUp delay={0.3}>
                <blockquote className="mt-14 pl-8 text-2xl italic font-thin" style={{ borderLeft: "1px solid var(--t-accent)", fontFamily: "var(--t-font-heading)", color: "var(--t-accent)", letterSpacing: "0.04em" }}>
                  &ldquo;{quote}&rdquo;
                </blockquote>
              </FadeUp>
            )}
          </div>
        </div>
        {isEditor && <EditorBadge label="STORY" />}
      </section>
    );
  }

  // ── MODERN ───────────────────────────────────────────────────────────────
  if (theme === "MODERN") {
    return (
      <section className={`relative overflow-hidden px-6 py-20 sm:py-28 ${editorCls}`} style={{ background: "var(--t-bg)" }} onClick={isEditor ? onEdit : undefined}>
        <div className="relative mx-auto max-w-6xl">
          <FadeUp className="mb-14">
            <div className="h-[3px] w-16 mb-5" style={{ background: "var(--t-accent)" }} />
            <h2 className="text-5xl font-black uppercase tracking-tight sm:text-6xl" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)", letterSpacing: "-0.03em" }}>{title}</h2>
          </FadeUp>
          <div className={`grid gap-12 md:grid-cols-5 md:items-center`}>
            <FadeUp delay={0.15} className="md:col-span-3 space-y-6">
              <p className="text-lg leading-relaxed" style={{ color: "var(--t-text-muted)" }}>{body}</p>
              {quote && (
                <div className="pt-4">
                  <div className="h-px mb-6" style={{ background: "rgba(91,95,237,0.15)" }} />
                  <p className="text-2xl font-black" style={{ color: "var(--t-accent)", letterSpacing: "-0.02em" }}>&ldquo;{quote}&rdquo;</p>
                </div>
              )}
            </FadeUp>
            <motion.div
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative md:col-span-2 aspect-[4/5] overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {imageUrl ? <img src={imageUrl} alt="Our Story" className="h-full w-full object-cover" /> : <ImgPlaceholder className="h-full w-full" />}
              <div className="absolute bottom-0 right-0 h-20 w-20" style={{ background: "var(--t-accent)", opacity: 0.12 }} />
            </motion.div>
          </div>
        </div>
        {isEditor && <EditorBadge label="STORY" />}
      </section>
    );
  }

  // ── MINIMAL ──────────────────────────────────────────────────────────────
  if (theme === "MINIMAL") {
    return (
      <section className={`relative px-6 py-24 sm:py-36 ${editorCls}`} style={{ background: "var(--t-bg)" }} onClick={isEditor ? onEdit : undefined}>
        <div className="mx-auto max-w-2xl">
          <FadeUp>
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.45em]" style={{ color: "var(--t-text-muted)" }}>Our Story</p>
            <h2 className="mb-10 text-4xl font-light sm:text-5xl" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)", letterSpacing: "0.02em" }}>{title}</h2>
            <div className="h-px w-12 mb-12" style={{ background: "var(--t-text-muted)", opacity: 0.25 }} />
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="text-lg leading-[2.1] font-light" style={{ color: "var(--t-text-muted)" }}>{body}</p>
          </FadeUp>
          {quote && (
            <FadeUp delay={0.3}>
              <div className="my-14 py-10" style={{ borderTop: "1px solid var(--t-border)", borderBottom: "1px solid var(--t-border)" }}>
                <p className="text-xl italic text-center leading-relaxed" style={{ color: "var(--t-text)", fontFamily: "var(--t-font-heading)" }}>&ldquo;{quote}&rdquo;</p>
              </div>
            </FadeUp>
          )}
          {imageUrl && (
            <FadeUp delay={0.4} className="mt-16 aspect-video overflow-hidden w-full">
              <img src={imageUrl} alt="Our Story" className="h-full w-full object-cover" />
            </FadeUp>
          )}
        </div>
        {isEditor && <EditorBadge label="STORY" />}
      </section>
    );
  }

  // ── ELEGANT ──────────────────────────────────────────────────────────────
  if (theme === "ELEGANT") {
    return (
      <section className={`relative px-6 py-20 sm:py-28 ${editorCls}`} style={{ background: "var(--t-bg)" }} onClick={isEditor ? onEdit : undefined}>
        <div className="mx-auto max-w-5xl">
          <FadeUp className="text-center mb-14">
            <SectionEyebrow center>Our Story</SectionEyebrow>
            <SectionHeading center>{title}</SectionHeading>
            <Ornament center />
          </FadeUp>
          {(imageUrl || isEditor) && (
            <FadeUp delay={0.2} className="relative mx-auto mb-14 max-w-2xl aspect-[16/9] overflow-hidden">
              {imageUrl ? <img src={imageUrl} alt="Our Story" className="h-full w-full object-cover" /> : <ImgPlaceholder className="h-full w-full" />}
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset" style={{ borderColor: "rgba(184,115,85,0.25)" }} />
            </FadeUp>
          )}
          <FadeUp delay={0.3} className="mx-auto max-w-2xl text-center">
            <p className="text-lg leading-[1.9] font-light italic" style={{ color: "var(--t-text-muted)", fontFamily: "var(--t-font-heading)" }}>{body}</p>
            {quote && (
              <div className="mt-10 flex items-center gap-5">
                <div className="flex-1 h-px" style={{ background: "var(--t-border)" }} />
                <p className="text-base font-medium italic" style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}>&ldquo;{quote}&rdquo;</p>
                <div className="flex-1 h-px" style={{ background: "var(--t-border)" }} />
              </div>
            )}
          </FadeUp>
        </div>
        {isEditor && <EditorBadge label="STORY" />}
      </section>
    );
  }

  // ── FUN ──────────────────────────────────────────────────────────────────
  if (theme === "FUN") {
    return (
      <section className={`relative px-6 py-16 sm:py-20 ${editorCls}`} style={{ background: "var(--t-bg)" }} onClick={isEditor ? onEdit : undefined}>
        <div className="mx-auto max-w-5xl">
          <FadeUp className="mb-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--t-accent)" }}>✦ Our Story</p>
            <h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)", letterSpacing: "-0.01em" }}>{title}</h2>
          </FadeUp>
          <div className={`grid gap-8 md:grid-cols-2 md:items-start ${imgLeft ? "" : "md:[&>*:first-child]:order-2"}`}>
            <FadeUp delay={0.1} className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl" style={{ border: "3px solid #1a1a1a", boxShadow: "7px 7px 0 #1a1a1a" }}>
                {imageUrl ? <img src={imageUrl} alt="Our Story" className="h-full w-full object-cover" /> : <ImgPlaceholder className="h-full w-full rounded-2xl" />}
              </div>
              <div className="absolute -right-2 -top-2 -z-10 h-full w-full rounded-2xl" style={{ background: "var(--t-accent)", opacity: 0.2 }} />
            </FadeUp>
            <FadeUp delay={0.2} className="flex flex-col justify-center gap-6">
              <p className="text-lg leading-relaxed" style={{ color: "var(--t-text-muted)" }}>{body}</p>
              {quote && (
                <div className="rounded-2xl p-5" style={{ background: "var(--t-accent)", border: "2px solid #1a1a1a", boxShadow: "4px 4px 0 #1a1a1a" }}>
                  <p className="text-lg font-bold italic" style={{ color: "#fff" }}>&ldquo;{quote}&rdquo;</p>
                </div>
              )}
            </FadeUp>
          </div>
        </div>
        {isEditor && <EditorBadge label="STORY" />}
      </section>
    );
  }

  // ── CLASSIC (default) ────────────────────────────────────────────────────
  return (
    <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={getThemePad(theme)}>
      <div className={`relative mx-auto max-w-6xl grid gap-16 md:grid-cols-2 md:items-center ${imgLeft ? "" : "md:[&>*:first-child]:order-2"}`}>
        <motion.div
          initial={{ opacity: 0, x: imgLeft ? -30 : 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[3/4] overflow-hidden"
        >
          {imageUrl
            ? <img src={imageUrl} alt="Our Story" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]" />
            : <ImgPlaceholder className="h-full w-full" />}
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset" style={{ borderColor: "var(--t-accent-dim, rgba(201,169,110,0.22))" }} aria-hidden="true" />
        </motion.div>
        <FadeUp delay={0.2} className="flex flex-col justify-center">
          <SectionEyebrow>Our Story</SectionEyebrow>
          <SectionHeading>{title}</SectionHeading>
          <Ornament />
          <p className="mt-8 text-lg leading-[1.85]" style={{ color: "var(--t-text-muted)" }}>{body}</p>
          {quote && (
            <FadeUp delay={0.4}>
              <blockquote className="mt-10 pl-6 text-xl italic" style={{ borderLeft: "2px solid var(--t-accent)", fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>
                &ldquo;{quote}&rdquo;
              </blockquote>
            </FadeUp>
          )}
        </FadeUp>
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

function formatElapsed(ms) {
  if (!ms || ms <= 0) return "";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ago`;
  if (h > 0) return `${h}h ${m % 60}m ago`;
  if (m > 0) return `${m}m ${s % 60}s ago`;
  return "just started";
}

function HappeningNow({ target }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!target) return;
    setElapsed(Math.max(0, Date.now() - new Date(target).getTime()));
    const id = setInterval(() => {
      setElapsed(Math.max(0, Date.now() - new Date(target).getTime()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="relative flex flex-col items-center gap-5 py-4">
      {/* Expanding pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ border: "1px solid var(--t-accent)", width: 56, height: 56, top: "50%", left: "50%", x: "-50%", y: "-50%" }}
          animate={{ scale: [1, 3.5 + i], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, delay: i * 0.7, repeat: Infinity, ease: "easeOut" }}
        />
      ))}

      {/* Live badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 rounded-full px-4 py-1.5"
        style={{ background: "rgba(var(--t-accent-rgb, 201,169,110), 0.12)", border: "1px solid rgba(var(--t-accent-rgb, 201,169,110), 0.3)" }}
      >
        <motion.span
          className="block h-2.5 w-2.5 rounded-full"
          style={{ background: "var(--t-accent)" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <span className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: "var(--t-accent)" }}>Live Now</span>
      </motion.div>

      {/* Main heading */}
      <motion.p
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-4xl font-bold sm:text-5xl text-white text-center"
        style={{ fontFamily: "var(--t-font-heading)" }}
      >
        Happening Now
      </motion.p>

      {/* Elapsed time */}
      {elapsed > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Started {formatElapsed(elapsed)}
        </motion.p>
      )}
    </div>
  );
}

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

function buildTextCountdown(t) {
  if (!t) return null;
  const parts = [];
  if (t.Days    > 0) parts.push(`${t.Days} day${t.Days    !== 1 ? "s" : ""}`);
  if (t.Hours   > 0) parts.push(`${t.Hours} hr${t.Hours   !== 1 ? "s" : ""}`);
  if (t.Minutes > 0) parts.push(`${t.Minutes} min`);
  if (parts.length === 0) parts.push(`${t.Seconds} sec`);
  return parts.join(" · ");
}

export function CountdownSection({ section, event, isEditor = false, onEdit }) {
  const config = section.config || {};
  const theme  = config._theme || "CLASSIC";
  const displayStyle = config.display_style ?? "blocks";
  const target = event?.starts_at_utc || event?.starts_at || null;
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!target) return;
    setTimeLeft(calcTimeLeft(target));
    const id = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  // Shared style-override renderers — return early before theme blocks
  if (displayStyle === "flip") {
    const wrapCls = `relative overflow-hidden px-6 py-16 sm:py-24 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`;
    return (
      <section className={wrapCls} style={{ background: "var(--t-dark-surface)" }} onClick={isEditor ? onEdit : undefined}>
        <div className="relative mx-auto max-w-4xl text-center">
          <FadeUp>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--t-accent)" }}>Counting Down</p>
            <h2 className="text-4xl font-bold sm:text-5xl" style={{ fontFamily: "var(--t-font-heading)", color: "#fff" }}>
              {section.title || "The Big Day"}
            </h2>
            {section.body && <p className="mt-3 text-base sm:text-lg" style={{ color: "rgba(255,255,255,0.55)" }}>{section.body}</p>}
          </FadeUp>
          {!target && <p className="mt-10 text-sm italic" style={{ color: "rgba(255,255,255,0.3)" }}>Set an event date to start the countdown</p>}
          {target && !timeLeft && (
            <div className="mt-12"><HappeningNow target={target} /></div>
          )}
          {timeLeft && (
            <FadeUp delay={0.2} className="mt-12 grid grid-cols-4 gap-2 sm:gap-3">
              {UNITS.map((label) => (
                <div key={label} className="flex flex-col items-center overflow-hidden rounded-lg" style={{ background: "rgba(0,0,0,0.55)" }}>
                  <div className="w-full py-5 text-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <span className="text-4xl font-black tabular-nums sm:text-6xl" style={{ color: "#fff", letterSpacing: "-0.04em" }}>
                      {String(timeLeft[label] ?? 0).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="py-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--t-accent)" }}>{label}</span>
                  </div>
                </div>
              ))}
            </FadeUp>
          )}
        </div>
        {isEditor && <EditorBadge label="COUNTDOWN" />}
      </section>
    );
  }

  if (displayStyle === "minimal") {
    const wrapCls = `relative overflow-hidden px-6 py-16 sm:py-20 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`;
    return (
      <section className={wrapCls} style={{ background: "var(--t-dark-surface)" }} onClick={isEditor ? onEdit : undefined}>
        <div className="relative mx-auto max-w-4xl text-center">
          <FadeUp>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--t-accent)" }}>Counting Down</p>
            <h2 className="text-4xl font-bold sm:text-5xl" style={{ fontFamily: "var(--t-font-heading)", color: "#fff" }}>
              {section.title || "The Big Day"}
            </h2>
            {section.body && <p className="mt-3 text-base sm:text-lg" style={{ color: "rgba(255,255,255,0.55)" }}>{section.body}</p>}
          </FadeUp>
          {!target && <p className="mt-10 text-sm italic" style={{ color: "rgba(255,255,255,0.3)" }}>Set an event date to start the countdown</p>}
          {target && !timeLeft && (
            <div className="mt-12"><HappeningNow target={target} /></div>
          )}
          {timeLeft && (
            <FadeUp delay={0.2} className="mt-12 flex items-center justify-center gap-0">
              {UNITS.map((label, i) => (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center px-3 sm:px-5">
                    <span className="text-5xl font-bold tabular-nums sm:text-7xl" style={{ color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                      {String(timeLeft[label] ?? 0).padStart(2, "0")}
                    </span>
                    <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--t-accent)" }}>{label}</span>
                  </div>
                  {i < 3 && <span className="mb-6 text-3xl font-light sm:text-4xl" style={{ color: "rgba(255,255,255,0.2)" }}>:</span>}
                </div>
              ))}
            </FadeUp>
          )}
        </div>
        {isEditor && <EditorBadge label="COUNTDOWN" />}
      </section>
    );
  }

  // FUN: colorful chunky cards
  if (theme === "FUN") {
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
            {section.body && <p className="mt-3 text-base sm:text-lg" style={{ color: "rgba(255,255,255,0.6)" }}>{section.body}</p>}
          </FadeUp>
          {target && !timeLeft && (
            <div className="mt-12"><HappeningNow target={target} /></div>
          )}
          {displayStyle === "text" ? (
            timeLeft ? (
              <FadeUp delay={0.2} className="mt-10">
                <p className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}>{buildTextCountdown(timeLeft)}</p>
              </FadeUp>
            ) : null
          ) : timeLeft && (
            <FadeUp delay={0.2} className="mt-12 grid grid-cols-4 gap-1.5 sm:gap-4">
              {UNITS.map((label) => (
                <div key={label} className="flex flex-col items-center rounded-xl p-2 sm:rounded-2xl sm:p-5"
                  style={{ background: "var(--t-accent)", border: "2px solid #1a1a1a", boxShadow: "2px 2px 0 #1a1a1a" }}>
                  <span className="text-2xl font-black tabular-nums sm:text-5xl md:text-6xl" style={{ color: "#fff" }}>
                    {String(timeLeft[label] ?? 0).padStart(2, "0")}
                  </span>
                  <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.15em] sm:mt-2 sm:text-[10px] sm:tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.85)" }}>{label}</span>
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
            {section.body && <p className="mt-3 text-base" style={{ color: "rgba(255,255,255,0.5)" }}>{section.body}</p>}
          </FadeUp>
          {target && !timeLeft && (
            <div className="mt-6"><HappeningNow target={target} /></div>
          )}
          {displayStyle === "text" ? (
            timeLeft ? (
              <p className="mt-4 text-2xl font-bold sm:text-3xl" style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}>{buildTextCountdown(timeLeft)}</p>
            ) : null
          ) : timeLeft && (
            <div className="grid grid-cols-4 gap-3">
              {UNITS.map((label, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
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
        {displayStyle === "text" ? (
          <FadeUp delay={0.2} className="mt-16 text-center">
            {timeLeft ? (
              <p className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}>{buildTextCountdown(timeLeft)}</p>
            ) : (
              <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.3)" }}>Set an event date to start the countdown</p>
            )}
          </FadeUp>
        ) : (
          <FadeUp delay={0.2} className="mt-16">
            {!target ? (
              <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.3)" }}>Set an event date to start the countdown</p>
            ) : !timeLeft ? (
              <HappeningNow target={target} />
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:gap-6" role="timer">
                {UNITS.map((label, i) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease, delay: i * 0.08 }}
                    className="flex flex-col items-center px-1 py-5 sm:px-4 sm:py-8"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                    <span className="text-3xl font-bold tabular-nums text-white sm:text-5xl md:text-6xl" style={{ fontFamily: "var(--t-font-heading)" }}>
                      {String(timeLeft[label] ?? 0).padStart(2, "0")}
                    </span>
                    <span className="mt-2 text-[9px] font-medium uppercase tracking-[0.2em] sm:mt-3 sm:text-[10px] sm:tracking-[0.3em]" style={{ color: "var(--t-accent)" }}>{label}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </FadeUp>
        )}
      </div>
      {isEditor && <EditorBadge label="COUNTDOWN" />}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VENUE
// ══════════════════════════════════════════════════════════════════════════════
export function VenueSection({ section, event, isEditor = false, onEdit }) {
  const raw    = section.config || {};
  // Fall back to event record so edit-page changes are reflected without re-saving section config
  const config = {
    ...raw,
    venue_name:    raw.venue_name    || event?.venue_name    || "",
    venue_address: raw.venue_address || event?.venue_address || "",
    city:          raw.city          || event?.city          || "",
    state:         raw.state         || event?.state         || "",
    zip_code:      raw.zip_code      || event?.zip_code      || "",
    country:       raw.country       || event?.country       || "",
  };
  const theme  = raw._theme || "CLASSIC";
  const pad    = getThemePad(theme);
  const [copied, setCopied] = useState(false);

  const locationLine  = [config.city, config.state, config.zip_code, config.country].filter(Boolean).join(", ");
  const fullAddress   = [config.venue_name, config.venue_address, config.city, config.state, config.zip_code, config.country].filter(Boolean).join(", ");
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
        <FadeUp className="mb-12 sm:mb-16 text-center">
          <SectionEyebrow center>Venue &amp; Directions</SectionEyebrow>
          <SectionHeading center>{section.title || "Where to Find Us"}</SectionHeading>
          {section.body && <SectionBody center>{section.body}</SectionBody>}
          {theme !== "MINIMAL" && theme !== "MODERN" && <Ornament center />}
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
            {config.directions && (
              <div className="flex items-start gap-4 p-5"
                style={{ border: "1px solid var(--t-border)", borderLeft: theme === "LUXURY" ? "3px solid var(--t-accent)" : undefined, background: "var(--t-bg)" }}>
                <Navigation className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--t-accent)" }} />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--t-text-muted)" }}>Directions</p>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--t-text)" }}>{config.directions}</p>
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
              <div className="relative overflow-hidden border shadow-sm h-[260px] md:h-[400px]" style={{ borderColor: "var(--t-border)" }}>
                <iframe title="Event location" src={embedUrl} width="100%" height="100%" style={{ border: 0, display: "block", height: "100%", filter: mapFilter }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
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
// GALLERY — lightbox + carousel + themed grids
// ══════════════════════════════════════════════════════════════════════════════

/* ── Lightbox ────────────────────────────────────────────────────────────────── */
function GalleryLightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const total = images.length;
  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = () => setIdx(i => (i + 1) % total);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowRight")  next();
      if (e.key === "ArrowLeft")   prev();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [total]);

  const handleDownload = async () => {
    try {
      const res  = await fetch(images[idx]);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), { href: url, download: `image-${idx + 1}.jpg` });
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* cross-origin — open tab instead */ window.open(images[idx], "_blank"); }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="lb-backdrop"
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
      >
        {/* Image */}
        <motion.div
          key={idx}
          className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.28, ease }}
          onClick={e => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[idx]} alt={`Photo ${idx + 1}`}
            className="max-w-full max-h-[88vh] object-contain rounded-lg shadow-2xl"
            style={{ userSelect: "none" }}
          />
        </motion.div>

        {/* Controls row */}
        <div className="fixed top-4 right-4 flex gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={handleDownload}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
            <Download size={15} />
          </button>
          <button onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Prev / Next */}
        {total > 1 && <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="fixed left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="fixed right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
            <ChevronRight size={22} />
          </button>
        </>}

        {/* Counter + dots */}
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
          <span className="text-xs font-medium text-white/50">{idx + 1} / {total}</span>
          {total <= 12 && (
            <div className="flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/30"}`} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Carousel strip ──────────────────────────────────────────────────────────── */
function GalleryCarousel({ images, accentColor, onImageClick }) {
  const [current, setCurrent]   = useState(0);
  const trackRef                = useRef(null);
  const total                   = images.length;

  const scrollTo = (i) => {
    const clamped = Math.max(0, Math.min(i, total - 1));
    setCurrent(clamped);
    trackRef.current?.children[clamped]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setCurrent(Math.max(0, Math.min(idx, total - 1)));
  }, [total]);

  return (
    <div className="relative select-none">
      {/* Track */}
      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-2"
        style={{ scrollbarWidth: "none" }}
        onScroll={onScroll}
      >
        {images.map((img, i) => (
          <div key={i} className="snap-center shrink-0 w-full sm:w-[85%] overflow-hidden rounded-xl cursor-pointer group relative"
            style={{ aspectRatio: "16/9" }}
            onClick={() => onImageClick(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {img && <img src={img} alt={`Gallery ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.25)" }}>
              <ZoomIn size={28} color="white" />
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {total > 1 && <>
        <button onClick={() => scrollTo(current - 1)} disabled={current === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors disabled:opacity-0">
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => scrollTo(current + 1)} disabled={current >= total - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors disabled:opacity-0">
          <ChevronRight size={18} />
        </button>
      </>}

      {/* Dots */}
      {total > 1 && total <= 15 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button key={i} onClick={() => scrollTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 20 : 6, height: 6,
                background: i === current ? accentColor : `${accentColor}40`,
              }} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GallerySection({ section, isEditor = false, onEdit }) {
  const config   = section.config || {};
  const theme    = config._theme  || "CLASSIC";
  const layout   = config.layout  || "grid";
  const pad      = getThemePad(theme);
  const images   = Array.isArray(config.images) ? config.images : [];
  const display  = images.length > 0 ? images : isEditor ? Array(6).fill(null) : [];
  const hasReal  = images.length > 0;
  const [lbIdx, setLbIdx] = useState(null);

  const openLb = (i) => { if (hasReal) setLbIdx(i); };

  /* ── CAROUSEL layout ─────────────────────────────────────────────── */
  if (layout === "carousel") {
    const Header = () => (
      theme === "MODERN" ? (
        <FadeUp className="mb-8">
          <div className="h-1 w-10 mb-4" style={{ background: "var(--t-accent)" }} />
          <h2 className="text-4xl font-black uppercase sm:text-5xl leading-none"
            style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)", letterSpacing: "-0.02em" }}>
            {section.title || "Gallery"}
          </h2>
        </FadeUp>
      ) : theme === "FUN" ? (
        <FadeUp className="mb-8 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--t-accent)" }}>✦ Gallery</p>
          <h2 className="text-4xl font-extrabold" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>
            {section.title || "Our Moments"}
          </h2>
        </FadeUp>
      ) : (
        <FadeUp className="mb-8">
          <SectionEyebrow center>Gallery</SectionEyebrow>
          <SectionHeading center>{section.title || "Our Moments"}</SectionHeading>
          {theme !== "MINIMAL" && <Ornament center />}
        </FadeUp>
      )
    );

    return (
      <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-5xl">
          <Header />
          {display.length === 0
            ? <p className="py-16 text-center text-sm" style={{ color: "var(--t-text-muted)" }}>Upload images to display the gallery</p>
            : hasReal
              ? <GalleryCarousel images={display} accentColor="var(--t-accent)" onImageClick={openLb} />
              : <div className="flex gap-3 overflow-hidden">
                  {display.slice(0, 3).map((_, i) => (
                    <div key={i} className="flex-1 rounded-xl" style={{ aspectRatio:"16/9", background:"var(--t-bg)" }} />
                  ))}
                </div>
          }
        </div>
        {hasReal && lbIdx !== null && <GalleryLightbox images={images} startIndex={lbIdx} onClose={() => setLbIdx(null)} />}
        {isEditor && <EditorBadge label="GALLERY" />}
      </SectionWrap>
    );
  }

  /* ── FUN: staggered grid with bold shadows ───────────────────────── */
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
          {display.length === 0
            ? <p className="py-16 text-center text-sm" style={{ color: "var(--t-text-muted)" }}>Upload images to display the gallery</p>
            : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {display.map((img, i) => (
                  <FadeUp key={i} delay={i * 0.04}>
                    <div className="overflow-hidden rounded-2xl cursor-pointer group relative"
                      style={{ aspectRatio: i % 3 === 1 ? "1/1.3" : "4/3", background: "var(--t-bg)", border: "2px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a" }}
                      onClick={() => openLb(i)}>
                      {img && <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.2)" }}>
                        <ZoomIn size={22} color="white" />
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            )}
        </div>
        {hasReal && lbIdx !== null && <GalleryLightbox images={images} startIndex={lbIdx} onClose={() => setLbIdx(null)} />}
        {isEditor && <EditorBadge label="GALLERY" />}
      </SectionWrap>
    );
  }

  /* ── MODERN: tight uniform grid ─────────────────────────────────── */
  if (theme === "MODERN") {
    return (
      <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad}>
        <div className="mx-auto max-w-6xl">
          <FadeUp className="mb-10">
            <div className="h-1 w-10 mb-4" style={{ background: "var(--t-accent)" }} />
            <h2 className="text-4xl font-black uppercase sm:text-5xl leading-none"
              style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)", letterSpacing: "-0.02em" }}>
              {section.title || "Gallery"}
            </h2>
          </FadeUp>
          {display.length === 0
            ? <p className="py-16 text-center text-sm" style={{ color: "var(--t-text-muted)" }}>Upload images to display the gallery</p>
            : (
              <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 md:grid-cols-4">
                {display.map((img, i) => (
                  <FadeUp key={i} delay={i * 0.03}>
                    <div className="aspect-square overflow-hidden cursor-pointer group relative"
                      style={{ background: "var(--t-bg)" }}
                      onClick={() => openLb(i)}>
                      {img && <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.35)" }}>
                        <ZoomIn size={20} color="white" />
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            )}
        </div>
        {hasReal && lbIdx !== null && <GalleryLightbox images={images} startIndex={lbIdx} onClose={() => setLbIdx(null)} />}
        {isEditor && <EditorBadge label="GALLERY" />}
      </SectionWrap>
    );
  }

  /* ── MINIMAL: airy 2-col alternating aspect ratios ──────────────── */
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
          {display.length === 0
            ? <p className="py-16 text-center text-sm" style={{ color: "var(--t-text-muted)" }}>Upload images to display the gallery</p>
            : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {display.map((img, i) => (
                  <FadeUp key={i} delay={i * 0.05}>
                    <div className="overflow-hidden cursor-pointer group relative"
                      style={{ aspectRatio: i % 2 === 0 ? "4/5" : "4/3", background: "var(--t-bg-alt)" }}
                      onClick={() => openLb(i)}>
                      {img && <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.2)" }}>
                        <ZoomIn size={20} color="white" />
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            )}
        </div>
        {hasReal && lbIdx !== null && <GalleryLightbox images={images} startIndex={lbIdx} onClose={() => setLbIdx(null)} />}
        {isEditor && <EditorBadge label="GALLERY" />}
      </SectionWrap>
    );
  }

  /* ── CLASSIC / ELEGANT / LUXURY: masonry columns ────────────────── */
  return (
    <SectionWrap bg="var(--t-bg-alt)" isEditor={isEditor} onClick={onEdit} pad={pad}>
      <div className="mx-auto max-w-6xl">
        <FadeUp className="mb-12">
          <SectionEyebrow>Gallery</SectionEyebrow>
          <SectionHeading>{section.title || "Our Moments"}</SectionHeading>
          {theme !== "MINIMAL" && <Ornament />}
        </FadeUp>
        {display.length === 0
          ? <p className="py-16 text-center text-sm" style={{ color: "var(--t-text-muted)" }}>Upload images to display the gallery</p>
          : (
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
              {display.map((img, i) => (
                <FadeUp key={i} delay={i * 0.03}>
                  <div className="mb-3 overflow-hidden break-inside-avoid cursor-pointer group relative"
                    style={{ background: "var(--t-bg)" }}
                    onClick={() => openLb(i)}>
                    {img
                      ? <img src={img} alt={`Gallery ${i + 1}`} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      : <div className="aspect-square" style={{ background: "var(--t-bg)" }} />
                    }
                    {img && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.28)" }}>
                        <ZoomIn size={22} color="white" />
                      </div>
                    )}
                  </div>
                </FadeUp>
              ))}
            </div>
          )}
      </div>
      {hasReal && lbIdx !== null && <GalleryLightbox images={images} startIndex={lbIdx} onClose={() => setLbIdx(null)} />}
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
          <FadeUp className="mb-16 text-center">
            <SectionEyebrow center>Programme</SectionEyebrow>
            <SectionHeading center>{section.title || "Schedule"}</SectionHeading>
            <Ornament center />
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
        <FadeUp className="mb-14 text-center">
          <SectionEyebrow center>Agenda</SectionEyebrow>
          <SectionHeading center>{section.title || "Schedule"}</SectionHeading>
          <Ornament center />
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
      <div className="mx-auto max-w-6xl">
        <FadeUp className="mb-10 text-center">
          <SectionEyebrow>Speakers</SectionEyebrow>
          <SectionHeading>{section.title || "Our Speakers"}</SectionHeading>
          {theme !== "MODERN" && theme !== "MINIMAL" && <Ornament center />}
        </FadeUp>

        {/* Horizontal scroll row — centered on desktop, bigger avatars on mobile */}
        <div
          className="flex justify-center gap-6 overflow-x-auto pb-4"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          {display.map((s, i) => (
            <FadeUp key={s.id || i} delay={i * 0.06} style={{ flexShrink: 0 }}>
              <div
                className="flex flex-col items-center text-center"
                style={{ width: "clamp(140px, 22vw, 180px)", scrollSnapAlign: "start" }}
              >
                {/* Avatar — bigger on small viewport */}
                <div
                  className="h-36 w-36 sm:h-28 sm:w-28 overflow-hidden mx-auto"
                  style={{ background: "var(--t-bg)", borderRadius: radius, border: "1px solid var(--t-border)", flexShrink: 0 }}
                >
                  {s.avatar_url
                    ? <img src={s.avatar_url} className="h-full w-full object-cover" alt={s.full_name} />
                    : <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--t-bg)" }}>
                        <span className="text-4xl sm:text-3xl" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-border)" }}>{(s.full_name || "S")[0]}</span>
                      </div>
                  }
                </div>
                <div className="mt-4">
                  <h4 className="text-base font-semibold leading-tight" style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}>{s.full_name}</h4>
                  {s.title && <p className="mt-1 text-xs" style={{ color: "var(--t-accent)" }}>{s.title}</p>}
                  {s.bio && <p className="mt-2 text-xs leading-relaxed line-clamp-3" style={{ color: "var(--t-text-muted)" }}>{s.bio}</p>}
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
                style={{ border: theme === "FUN" ? "2px solid #1a1a1a" : "1px solid var(--t-border)", background: "var(--t-bg-alt)", borderRadius: "var(--t-radius, 0px)", boxShadow: theme === "FUN" ? "4px 4px 0 #1a1a1a" : "none" }}>
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

// ══════════════════════════════════════════════════════════════════════════════
// DONATIONS
// ══════════════════════════════════════════════════════════════════════════════
const DONATION_API          = process.env.NEXT_PUBLIC_API_URL;
const DONATION_PRESET_DEFAULT = [5, 10, 25];

export function DonationsSection({ section, event, isEditor = false, onEdit }) {
  const [freq,       setFreq]       = useState("once");
  const [preset,     setPreset]     = useState(null);
  const [custom,     setCustom]     = useState("");
  const [name,       setName]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [donConfig,  setDonConfig]  = useState({ amounts: [], message: "" });
  const [donated,    setDonated]    = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("donation") === "success";
  });

  useEffect(() => {
    if (donated) window.history.replaceState({}, "", window.location.pathname);
  }, [donated]);

  useEffect(() => {
    if (!event?.id) return;
    fetch(`${DONATION_API}/engagement/events/${event.id}/donation-config`)
      .then(r => r.json())
      .then(d => { if (d?.data) setDonConfig(d.data); })
      .catch(() => {});
  }, [event?.id]);

  const presets = donConfig.amounts?.length === 3 ? donConfig.amounts : DONATION_PRESET_DEFAULT;
  const amount  = preset === "custom" ? Number(custom) : (preset ?? 0);

  async function handleDonate(e) {
    e.preventDefault();
    if (!amount || amount <= 0) return setError("Please select or enter a donation amount");
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${DONATION_API}/engagement/events/${event?.id}/donations`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor_name: name.trim() || null,
          amount, currency: "USD",
          frequency: freq,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Donation failed");
      if (data.data?.checkout_url) window.location.href = data.data.checkout_url;
      else setDonated(true);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (!event?.allow_donations && !donated) return null;

  const inputStyle = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.13)",
  };

  return (
    <section
      id="donations"
      className={`px-6 py-20 sm:py-28 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60 relative" : ""}`}
      style={{ background: "var(--t-dark-surface)" }}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-lg">

        {/* Thank-you state */}
        {donated && !isEditor && (
          <FadeUp className="text-center space-y-4">
            <div className="text-5xl">💛</div>
            <SectionHeading center light>Thank you!</SectionHeading>
            <SectionBody center light>Your generous contribution means the world to us.</SectionBody>
            <button onClick={() => setDonated(false)}
              className="mt-4 text-xs uppercase tracking-widest underline"
              style={{ color: "rgba(255,255,255,0.45)" }}>
              Donate again
            </button>
          </FadeUp>
        )}

        {/* Donation card — matches hero card design */}
        {(!donated || isEditor) && (
          <FadeUp>
            {/* Section heading above the card */}
            <div className="text-center mb-8">
              <SectionEyebrow center>Give</SectionEyebrow>
              <SectionHeading center light>{section.title || "Make a Donation"}</SectionHeading>
            </div>

            <div
              className="w-full overflow-hidden rounded-2xl"
              style={{ background: "rgba(10,10,20,0.72)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(22px)", boxShadow: "0 24px 64px rgba(0,0,0,0.50)" }}
            >
              {/* top accent bar */}
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#be185d,#f43f5e,#fb923c)" }} />

              {/* header */}
              <div className="px-7 pt-6 pb-4">
                <p className="text-base sm:text-lg font-bold text-white leading-snug">
                  {donConfig.message || section.body || "Every contribution makes a difference."}
                </p>
              </div>

              <form
                onSubmit={isEditor ? (e) => e.preventDefault() : handleDonate}
                className="px-7 pb-7 space-y-4"
              >
                {/* One Time / Monthly */}
                <div
                  className="flex rounded-xl p-1 gap-1"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  {[["once", "One Time"], ["monthly", "Monthly"]].map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={isEditor ? undefined : () => setFreq(val)}
                      className="flex-1 rounded-lg py-2.5 text-sm font-black tracking-wide transition-all"
                      style={freq === val
                        ? { background: "var(--t-accent)", color: "var(--t-accent-fg,#000)" }
                        : { color: "rgba(255,255,255,0.45)" }
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Amount presets */}
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((a) => (
                    <button key={a} type="button"
                      onClick={isEditor ? undefined : () => { setPreset(a); setCustom(""); setError(""); }}
                      className="py-4 text-base font-black transition-all active:scale-95"
                      style={{
                        borderRadius: 14,
                        border: preset === a ? "2px solid var(--t-accent)" : "1px solid rgba(255,255,255,0.13)",
                        background: preset === a ? "var(--t-accent)" : "rgba(255,255,255,0.05)",
                        color: preset === a ? "var(--t-accent-fg,#000)" : "rgba(255,255,255,0.80)",
                        boxShadow: preset === a ? "0 4px 20px rgba(244,63,94,0.35)" : "none",
                      }}
                    >
                      ${a}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={preset === "custom"
                    ? { ...inputStyle, border: "1.5px solid var(--t-accent)" }
                    : inputStyle}
                >
                  <span className="text-base font-bold text-white/35">$</span>
                  <input
                    type="number" min="1"
                    value={preset === "custom" ? custom : ""}
                    placeholder="Other amount"
                    onFocus={isEditor ? undefined : () => setPreset("custom")}
                    onChange={(e) => { setPreset("custom"); setCustom(e.target.value); setError(""); }}
                    className="flex-1 bg-transparent text-base font-semibold text-white placeholder-white/25 outline-none"
                  />
                </div>

                {/* Name */}
                <input
                  type="text" value={name}
                  placeholder="Your name (optional)"
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-base font-medium text-white placeholder-white/30 outline-none"
                  style={inputStyle}
                />

                {error && <p className="text-sm font-semibold text-rose-400">{error}</p>}

                {/* CTA */}
                <button type="submit" disabled={submitting || isEditor}
                  className="w-full rounded-xl py-4 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: "var(--t-accent)", color: "var(--t-accent-fg,#000)", boxShadow: "0 8px 28px rgba(244,63,94,0.40)" }}
                >
                  {submitting
                    ? "Processing…"
                    : `${freq === "monthly" ? "Give Monthly" : "Donate"}${amount > 0 ? ` — $${amount}` : ""} →`
                  }
                </button>

                <p className="text-center text-[11px] text-white/20">Secure payment via Stripe</p>
              </form>
            </div>
          </FadeUp>
        )}
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
          <span className="text-lg font-semibold" style={{ fontFamily: "var(--t-font-heading)" }}>{question || `Question ${index + 1}`}</span>
          <span
            className="shrink-0 transition-transform duration-300"
            style={{ transform: `rotate(${open ? 180 : 0}deg)` }}
          >
            <ChevronDown className="h-5 w-5" style={{ color: "var(--t-accent)" }} />
          </span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div key="answer" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease }} className="overflow-hidden">
              <p className="pb-5 leading-relaxed" style={{ color: "var(--t-text-muted)" }}>{answer || "Answer coming soon."}</p>
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
                    <span style={{ fontFamily: "var(--t-font-heading)" }}>{item.question || `Question ${i + 1}`}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" style={{ color: "var(--t-accent)" }} />
                  </summary>
                  <div className="px-6 pb-5 text-base leading-relaxed" style={{ color: "var(--t-text-muted)" }}>{item.answer || "Answer coming soon."}</div>
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

// ── Ticket CTA card — editorial cream/dark design (matches /tickets page) ────
function TicketCTACard({ ticket, onBuy, isEditor }) {
  function tierCode(t) {
    const n = (t.name ?? "").toLowerCase();
    if (t.kind === "FREE")                                                return "FREE";
    if (n.includes("vip") || n.includes("platinum"))                     return "VIP";
    if (n.includes("early") || n.includes("bird"))                       return "EB";
    if (n.includes("pro") || n.includes("premium") || n.includes("diamond")) return "PRO";
    return "GA";
  }
  function resolveTierLocal(t) {
    const n = (t.name ?? "").toLowerCase();
    if (t.kind === "FREE") return { accent: "#10b981", label: "Free", code: "FREE" };
    if (n.includes("vip") || n.includes("platinum")) return { accent: "#C9A96E", label: "VIP", code: "VIP" };
    if (n.includes("early") || n.includes("bird"))   return { accent: "#f59e0b", label: "Early Bird", code: "EB" };
    if (n.includes("pro") || n.includes("premium"))  return { accent: "#a78bfa", label: "Premium", code: "PRO" };
    return { accent: "#6366f1", label: "Standard", code: "GA" };
  }
  const tier = resolveTierLocal(ticket);
  const available = ticket.quantity_total != null ? ticket.quantity_total - (ticket.quantity_sold ?? 0) : null;
  const isSoldOut  = available !== null && available <= 0;
  const isUrgent   = available !== null && available > 0 && available <= 20;
  const pct        = ticket.quantity_total ? Math.min(((ticket.quantity_sold ?? 0) / ticket.quantity_total) * 100, 100) : 0;
  const fmtLocal   = (n) => n === 0 ? "Free" : new Intl.NumberFormat("en-US", { style: "currency", currency: ticket.currency ?? "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 16px 48px rgba(0,0,0,0.45)" }}>
      {/* Dark header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ background: "#0c0c12", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black"
            style={{ background: `${tier.accent}18`, border: `1.5px solid ${tier.accent}40`, color: tier.accent }}>
            {tier.code}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: tier.accent }}>{tier.label} Access</p>
            <p className="text-sm font-bold text-white leading-tight">{ticket.name}</p>
          </div>
        </div>
        {isSoldOut ? (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>Sold Out</span>
        ) : isUrgent ? (
          <span className="text-[10px] font-black text-amber-400">🔥 {available} left</span>
        ) : null}
      </div>
      {/* Cream body */}
      <div className="flex flex-col gap-4 px-5 pt-5 pb-5" style={{ background: "#f0ebe0" }}>
        <div className="text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: "#7a6e5f" }}>per person</p>
          <p className="leading-none font-black" style={{ fontFamily: "var(--t-font-heading,'Playfair Display',Georgia,serif)", fontSize: "clamp(2.8rem,5vw,4rem)", color: "#0f0d0a", letterSpacing: "-0.02em" }}>
            {fmtLocal(Number(ticket.price))}
          </p>
        </div>
        {ticket.quantity_total != null && !isSoldOut && (
          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9a8c7e" }}>
              <span>{isUrgent ? `⚠ ${available} spots left` : `${available} available`}</span>
              <span style={{ color: tier.accent }}>{Math.round(pct)}% filled</span>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: "rgba(0,0,0,0.10)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99, background: isUrgent ? "#ef4444" : tier.accent, width: `${pct}%`, transition: "width 1s ease" }} />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button onClick={() => !isSoldOut && !isEditor && onBuy(ticket)} disabled={isSoldOut || isEditor}
            className="w-full py-3.5 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40 rounded-xl"
            style={{ background: isSoldOut ? "rgba(0,0,0,0.12)" : "#0f0d0a", color: isSoldOut ? "#9a8c7e" : "#f0ebe0", letterSpacing: "0.08em" }}>
            {isSoldOut ? "Sold Out" : ticket.kind === "FREE" ? "Reserve Free Spot" : "Buy Now →"}
          </button>
          {!isSoldOut && !isEditor && (
            <button onClick={() => onBuy(ticket)}
              className="w-full py-2.5 text-xs font-bold uppercase transition-all active:scale-[0.98] rounded-xl"
              style={{ background: "transparent", color: "#4a3f30", border: "1.5px solid rgba(0,0,0,0.18)", letterSpacing: "0.10em" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = tier.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.18)"}>
              {ticket.kind === "FREE" ? "Learn More" : "Reserve a Spot"}
            </button>
          )}
        </div>
        <p className="text-center text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.20)", letterSpacing: "0.12em" }}>
          🔒 Secure checkout · Instant e-ticket
        </p>
      </div>
    </div>
  );
}

// DONATION CHECKOUT CARD — shown inside CTASection when allow_donations is on
// Matches the HeroDonationCard design exactly.
// ══════════════════════════════════════════════════════════════════════════════
const DONATION_CTA_DEFAULTS = [5, 10, 25];

function DonationCheckoutCard({ event, isEditor }) {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [freq,       setFreq]       = useState("once");
  const [preset,     setPreset]     = useState(null);
  const [custom,     setCustom]     = useState("");
  const [name,       setName]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");
  const [donConfig,  setDonConfig]  = useState({ amounts: [], message: "" });

  useEffect(() => {
    if (!event?.id) return;
    fetch(`${API}/engagement/events/${event.id}/donation-config`)
      .then(r => r.json())
      .then(d => { if (d?.data) setDonConfig(d.data); })
      .catch(() => {});
  }, [event?.id]);

  const presets = donConfig.amounts?.length === 3 ? donConfig.amounts : DONATION_CTA_DEFAULTS;
  const amount  = preset === "custom" ? Number(custom) : (preset ?? 0);

  const inputStyle = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.13)",
  };

  async function handleDonate(e) {
    e.preventDefault();
    if (!amount || amount <= 0) return setError("Please select or enter an amount");
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/engagement/events/${event?.id}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donor_name: name.trim() || null, amount, currency: "USD", frequency: freq }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Donation failed");
      if (data.data?.checkout_url) window.location.href = data.data.checkout_url;
      else setDone(true);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const ROSE = "#f43f5e";

  if (done) {
    return (
      <div className="mx-auto mt-10 w-full overflow-hidden rounded-2xl text-center"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.50)" }}>
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,#be185d,${ROSE},#fb923c)` }} />
        <div className="px-8 py-12" style={{ background: "#f0ebe0" }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(244,63,94,0.10)", border: "1px solid rgba(244,63,94,0.20)" }}>
            <Heart className="h-7 w-7" fill={ROSE} stroke={ROSE} />
          </div>
          <p style={{ fontFamily: "var(--t-font-heading,'Playfair Display',Georgia,serif)", fontSize: "1.6rem", fontWeight: 900, color: "#0f0d0a", marginBottom: 6 }}>
            Thank you! 💝
          </p>
          <p className="text-sm font-semibold" style={{ color: "#7a6e5f" }}>
            Your {freq === "monthly" ? "monthly " : ""}donation of <strong style={{ color: ROSE }}>${amount}</strong> means a lot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full overflow-hidden rounded-2xl"
      style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}>

      {/* ── Dark header ── */}
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ background: "#0c0814", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.28)" }}>
          <Heart className="h-4 w-4" fill={ROSE} stroke={ROSE} />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.20em]" style={{ color: "rgba(244,63,94,0.70)" }}>
            Support this event
          </p>
          <p className="text-sm font-bold text-white leading-tight">
            {donConfig.message || "Every contribution makes a difference."}
          </p>
        </div>
      </div>

      {/* ── Cream body ── */}
      <form onSubmit={isEditor ? (e) => e.preventDefault() : handleDonate}
        className="flex flex-col gap-4 px-5 sm:px-6 pt-5 pb-5 sm:pb-6"
        style={{ background: "#f0ebe0" }}>

        {/* One Time / Monthly */}
        <div className="flex rounded-xl p-1 gap-1"
          style={{ background: "rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.10)" }}>
          {[["once", "One Time"], ["monthly", "Monthly"]].map(([val, label]) => (
            <button key={val} type="button"
              onClick={isEditor ? undefined : () => setFreq(val)}
              className="flex-1 rounded-lg py-2 text-xs font-black tracking-wide transition-all"
              style={freq === val ? { background: "#0f0d0a", color: "#f0ebe0" } : { color: "#7a6e5f" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Preset amounts */}
        <div className="grid grid-cols-3 gap-2">
          {presets.map((a) => (
            <button key={a} type="button"
              onClick={isEditor ? undefined : () => { setPreset(a); setCustom(""); setError(""); }}
              className="py-4 font-black transition-all active:scale-95"
              style={{
                borderRadius: 14,
                fontFamily: "var(--t-font-heading,'Playfair Display',Georgia,serif)",
                fontSize: "clamp(1.2rem,2.5vw,1.6rem)",
                border: preset === a ? `2px solid ${ROSE}` : "1.5px solid rgba(0,0,0,0.12)",
                background: preset === a ? ROSE : "rgba(0,0,0,0.05)",
                color: preset === a ? "#fff" : "#0f0d0a",
                boxShadow: preset === a ? `0 6px 20px rgba(244,63,94,0.28)` : "none",
              }}>
              ${a}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: "rgba(0,0,0,0.05)", border: preset === "custom" ? `1.5px solid ${ROSE}` : "1.5px solid rgba(0,0,0,0.12)" }}>
          <span className="text-sm font-bold" style={{ color: "#9a8c7e" }}>$</span>
          <input type="number" min="1"
            value={preset === "custom" ? custom : ""}
            placeholder="Other amount"
            onFocus={isEditor ? undefined : () => setPreset("custom")}
            onChange={(e) => { setPreset("custom"); setCustom(e.target.value); setError(""); }}
            className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder-[#b0a89a]"
            style={{ color: "#0f0d0a" }}
          />
        </div>

        {/* Name */}
        <input type="text" value={name} placeholder="Your name (optional)"
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none placeholder-[#b0a89a]"
          style={{ background: "rgba(0,0,0,0.05)", border: "1.5px solid rgba(0,0,0,0.12)", color: "#0f0d0a" }}
          onFocus={e => e.target.style.borderColor = ROSE}
          onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.12)"}
        />

        {error && <p className="text-xs font-semibold" style={{ color: ROSE }}>{error}</p>}

        {/* Dual CTA */}
        <div className="flex flex-col gap-2">
          <button type="submit" disabled={submitting || isEditor}
            className="w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#0f0d0a", color: "#f0ebe0", letterSpacing: "0.08em" }}>
            {submitting
              ? "Processing…"
              : <><Heart className="h-3.5 w-3.5" fill="#f0ebe0" stroke="#f0ebe0" />
                  {freq === "monthly" ? "Give Monthly" : "Donate"}{amount > 0 ? ` — $${amount}` : ""}</>
            }
          </button>
          {!isEditor && !submitting && (
            <button type="button" onClick={handleDonate}
              className="w-full rounded-xl py-2.5 text-xs font-bold uppercase transition-all active:scale-[0.98]"
              style={{ background: "transparent", color: "#4a3f30", border: "1.5px solid rgba(0,0,0,0.18)", letterSpacing: "0.10em" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = ROSE}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.18)"}>
              Reserve Contribution
            </button>
          )}
        </div>

        <p className="text-center text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "rgba(0,0,0,0.22)", letterSpacing: "0.12em" }}>
          Secure payment via Stripe
        </p>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function CTASection({ section, event, isEditor = false, onEdit }) {
  const config  = section.config || {};
  const theme   = config._theme || "CLASSIC";
  const API     = process.env.NEXT_PUBLIC_API_URL;

  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    setHasToken(!!new URLSearchParams(window.location.search).get("token"));
  }, []);
  const [pubTickets, setPubTickets] = useState([]);

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

  // Ticket cards block — defined AFTER showTicketingMode to avoid TDZ error
  const TicketCardsBlock = showTicketingMode && pubTickets.length > 0 ? (
    <div className={`mt-8 w-full mx-auto grid gap-5 ${
      pubTickets.length === 1
        ? "max-w-md sm:max-w-lg"
        : pubTickets.length === 2
        ? "sm:grid-cols-2 max-w-3xl"
        : "sm:grid-cols-3 max-w-5xl"
    }`}>
      {pubTickets.map((t) => (
        <TicketCTACard key={t.id} ticket={t} onBuy={handleBuyTickets} isEditor={isEditor} />
      ))}
    </div>
  ) : null;

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
              <p className="mt-5 max-w-lg text-base text-white/50">{ticketCTA.body}</p>
            ) : (
              section.body && <p className="mt-5 max-w-lg text-base text-white/50">{section.body}</p>
            )}
            {/* Ticket cards */}
            {TicketCardsBlock}
            {/* RSVP button fallback (no tickets yet) */}
            {!showTicketingMode && (isEditor || hasToken) && (
              <button onClick={!isEditor ? handleRsvp : undefined}
                className="mt-10 w-full max-w-sm text-sm font-black uppercase tracking-[0.2em] transition active:scale-95"
                style={{ background: "var(--t-accent)", color: "#000", padding: "1.25rem 3rem" }}>
                {config.button_text || "Register Now"}
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
            {TicketCardsBlock}
            {!showTicketingMode && (isEditor || hasToken) && (
              <button onClick={!isEditor ? handleRsvp : undefined}
                className="mt-14 border bg-transparent text-xs font-light uppercase tracking-[0.5em] text-white/60 transition hover:text-white hover:border-white/50 px-12 py-5"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
                {config.button_text || "RSVP"}
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
              {!(showTicketingMode) && section.body && <p className="mt-4 text-lg text-white/80">{section.body}</p>}
              {TicketCardsBlock}
              {!showTicketingMode && (isEditor || hasToken) && (
                <button onClick={!isEditor ? handleRsvp : undefined}
                  className="mt-8 inline-block bg-white text-sm font-black uppercase tracking-[0.15em] transition active:scale-95 px-10 py-4"
                  style={{ color: "var(--t-accent)", borderRadius: 999, border: "3px solid #1a1a1a", boxShadow: "4px 4px 0 #1a1a1a" }}>
                  {config.button_text || "Count Me In! →"}
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
            {!showTicketingMode && section.body && <p className="mx-auto mt-6 max-w-md text-lg text-white/40 italic">{section.body}</p>}
            {TicketCardsBlock}
            {!showTicketingMode && (isEditor || hasToken) && (
              <button onClick={!isEditor ? handleRsvp : undefined}
                className="mt-14 bg-transparent text-sm font-medium uppercase tracking-[0.4em] transition active:scale-95 px-12 py-5 text-white"
                style={{ border: "1px solid var(--t-accent)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-accent)"; e.currentTarget.style.color = "#000"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#fff"; }}>
                {config.button_text || "Confirm Attendance"}
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
          {!showTicketingMode && section.body && <p className="mx-auto mt-5 max-w-md text-lg text-white/50">{section.body}</p>}
          {TicketCardsBlock}
          {!showTicketingMode && (isEditor || hasToken) && (
            <button onClick={!isEditor ? handleRsvp : undefined}
              className="mt-12 bg-transparent px-12 py-4 text-sm font-medium uppercase tracking-[0.25em] transition active:scale-95"
              style={{ border: "1px solid var(--t-accent)", color: "var(--t-accent)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-dark)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-accent)"; }}>
              {config.button_text || "Confirm Attendance"}
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
