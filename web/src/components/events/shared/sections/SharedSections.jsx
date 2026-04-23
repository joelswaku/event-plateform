"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Navigation, Building2, Car, Copy, Check,
  ExternalLink, ChevronDown,
} from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const CREAM      = "#FAF9F6";
const CHAMPAGNE  = "#C9A96E";
const CHARCOAL   = "#1C1917";

// ── Animation primitives ──────────────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1];

function FadeUp({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
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
    <div
      className={`mt-6 flex w-20 items-center gap-2 ${center ? "mx-auto" : ""}`}
      aria-hidden="true"
    >
      <div className="h-px flex-1 bg-[#C9A96E]/50" />
      <div className="h-1.5 w-1.5 rotate-45 bg-[#C9A96E]" />
      <div className="h-px flex-1 bg-[#C9A96E]/50" />
    </div>
  );
}

function SectionEyebrow({ children }) {
  return (
    <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.35em] text-[#C9A96E]">
      {children}
    </p>
  );
}

function SectionHeading({ children, center = false, light = false }) {
  return (
    <h2
      className={`font-serif text-4xl font-bold leading-tight tracking-tight
        sm:text-5xl
        ${center ? "mx-auto text-center" : ""}
        ${light ? "text-white" : "text-stone-900"}
      `}
    >
      {children}
    </h2>
  );
}

function SectionBody({ children, center = false, light = false }) {
  return (
    <p
      className={`mt-4 max-w-2xl text-base leading-relaxed sm:text-lg
        ${center ? "mx-auto text-center" : ""}
        ${light ? "text-white/60" : "text-stone-500"}
      `}
    >
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

function editorProps(isEditor, onEdit) {
  return isEditor
    ? { onClick: onEdit, className: "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" }
    : {};
}

// ─── About ────────────────────────────────────────────────────────────────────
export function AboutSection({ section, isEditor = false, onEdit }) {
  return (
    <section
      className={`relative overflow-hidden bg-[#FAF9F6] px-6 py-24 sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-3xl text-center">
        <FadeUp>
          <SectionEyebrow>About</SectionEyebrow>
          <SectionHeading center>{section.title || "About This Event"}</SectionHeading>
          <Ornament center />
        </FadeUp>
        <FadeUp delay={0.15}>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-stone-500">
            {section.body || "Add your event description here."}
          </p>
        </FadeUp>
      </div>
      {isEditor && <EditorBadge label="ABOUT" />}
    </section>
  );
}

// ─── Story ────────────────────────────────────────────────────────────────────
export function StorySection({ section, isEditor = false, onEdit }) {
  const config     = section.config || {};
  const image      = config.story_image;
  const imageRight = config.image_position === "right";

  const imagePanel = (
    <FadeUp delay={0.1} className="relative aspect-[3/4] w-full overflow-hidden">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="Our Story" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-stone-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <svg className="h-8 w-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5M4.5 5.25h15A.75.75 0 0 1 20.25 6v12a.75.75 0 0 1-.75.75H4.5A.75.75 0 0 1 3.75 18V6A.75.75 0 0 1 4.5 5.25Z" />
            </svg>
          </div>
          {isEditor && <p className="mt-4 text-sm text-stone-400">Upload a story photo</p>}
        </div>
      )}
      {/* Champagne frame accent */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#C9A96E]/20" aria-hidden="true" />
    </FadeUp>
  );

  const textPanel = (
    <FadeUp delay={0.25} className="flex flex-col justify-center">
      <SectionEyebrow>Our Story</SectionEyebrow>
      <SectionHeading>{section.title || "How It All Began"}</SectionHeading>
      <Ornament />
      <p className="mt-8 text-lg leading-relaxed text-stone-500">
        {section.body || (isEditor ? "Share the story of how you met…" : "")}
      </p>
      {config.quote && (
        <blockquote className="mt-8 border-l-2 border-[#C9A96E] pl-6 font-serif text-xl italic text-stone-600">
          &ldquo;{config.quote}&rdquo;
        </blockquote>
      )}
    </FadeUp>
  );

  return (
    <section
      className={`relative overflow-hidden bg-white px-6 py-24 sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      {/* Ambient */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-stone-50 blur-3xl" aria-hidden="true" />

      <div
        className={`relative mx-auto grid max-w-6xl gap-16 md:grid-cols-2 md:items-center ${
          imageRight ? "" : "md:[&>*:first-child]:order-2"
        }`}
      >
        {imageRight ? <>{textPanel}{imagePanel}</> : <>{imagePanel}{textPanel}</>}
      </div>
      {isEditor && <EditorBadge label="STORY" />}
    </section>
  );
}

// ─── Couple ───────────────────────────────────────────────────────────────────
function CoupleCard({ image, name, role, bio, quote, fallbackGradient, fallbackInitial, isEditor, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <FadeUp delay={0.15 + index * 0.15}>
      <div className="flex flex-col items-center">
        {/* Photo with hover-reveal quote */}
        <div
          className="relative w-full cursor-pointer overflow-hidden"
          style={{ aspectRatio: index === 0 ? "3/4" : "4/5" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          tabIndex={quote ? 0 : undefined}
          role={quote ? "button" : undefined}
          aria-label={quote ? `${name}'s quote` : undefined}
        >
          {/* Photo */}
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name || ""} className="h-full w-full object-cover transition-transform duration-700 ease-out" style={{ transform: hovered ? "scale(1.04)" : "scale(1)" }} />
          ) : (
            <div className={`flex h-full w-full items-center justify-center ${fallbackGradient}`}>
              {isEditor ? (
                <div className="flex flex-col items-center gap-3 text-white/70">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5M4.5 5.25h15A.75.75 0 0 1 20.25 6v12a.75.75 0 0 1-.75.75H4.5A.75.75 0 0 1 3.75 18V6A.75.75 0 0 1 4.5 5.25Z" />
                  </svg>
                  <span className="text-xs font-medium">Upload photo</span>
                </div>
              ) : (
                <span className="font-serif text-9xl font-thin text-white/20">{fallbackInitial}</span>
              )}
            </div>
          )}

          {/* Champagne ring */}
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#C9A96E]/20" aria-hidden="true" />

          {/* Quote reveal overlay */}
          <AnimatePresence>
            {(quote || isEditor) && hovered && (
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: "0%" }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ duration: 0.45, ease }}
                className="absolute inset-x-0 bottom-0 bg-[#1C1917]/90 px-6 py-8 backdrop-blur-sm"
              >
                <p className="font-serif text-base italic leading-relaxed text-white/90">
                  &ldquo;{quote || (isEditor ? `Add a quote for ${name || "this person"}` : "")}&rdquo;
                </p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-[#C9A96E]">— {name}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Name + bio */}
        <div className="mt-6 text-center">
          {role && (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.3em] text-[#C9A96E]">{role}</p>
          )}
          <h3 className="font-serif text-2xl font-bold text-stone-900">{name || fallbackInitial}</h3>
          {bio && <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-stone-500">{bio}</p>}
        </div>
      </div>
    </FadeUp>
  );
}

export function CoupleSection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};

  return (
    <section
      className={`relative overflow-hidden bg-[#FAF9F6] px-6 py-24 sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -left-60 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-stone-100/60 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-60 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-amber-50/40 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <FadeUp className="mb-16 text-center sm:mb-20">
          <SectionEyebrow>The Couple</SectionEyebrow>
          <SectionHeading center>{section.title || "Meet the Couple"}</SectionHeading>
          {section.body && <SectionBody center>{section.body}</SectionBody>}
          <Ornament center />
        </FadeUp>

        {/*
          Asymmetric grid:
          mobile  : stacked
          md      : equal 2-col
          lg      : asymmetric — person A taller/wider (col-span-5), "&" (col-span-2), person B (col-span-5)
        */}
        <div className="grid gap-10 md:grid-cols-2 md:items-start lg:grid-cols-12 lg:gap-8">

          {/* Person A — slightly taller on lg */}
          <div className="md:col-span-1 lg:col-span-5">
            <CoupleCard
              index={0}
              image={config.bride_image}
              name={config.bride_name || "Partner One"}
              role={config.bride_role || "Bride"}
              bio={config.bride_bio}
              quote={config.bride_quote}
              fallbackGradient="bg-linear-to-br from-rose-100 via-pink-100 to-rose-200"
              fallbackInitial="A"
              isEditor={isEditor}
            />
          </div>

          {/* Decorative "&" — desktop only */}
          <div className="hidden lg:col-span-2 lg:flex lg:items-center lg:justify-center lg:pt-24" aria-hidden="true">
            <span className="font-serif text-8xl font-light text-[#C9A96E]/25 select-none">&amp;</span>
          </div>

          {/* Person B — slightly offset top on lg for asymmetry */}
          <div className="md:col-span-1 lg:col-span-5 lg:pt-16">
            <CoupleCard
              index={1}
              image={config.groom_image}
              name={config.groom_name || "Partner Two"}
              role={config.groom_role || "Groom"}
              bio={config.groom_bio}
              quote={config.groom_quote}
              fallbackGradient="bg-linear-to-br from-slate-200 via-blue-100 to-indigo-200"
              fallbackInitial="B"
              isEditor={isEditor}
            />
          </div>
        </div>
      </div>

      {isEditor && <EditorBadge label="COUPLE" />}
    </section>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────
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
  const target = section.config?.starts_at;
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(target));

  useEffect(() => {
    const tick = () => setTimeLeft(calcTimeLeft(target));
    tick();
    if (!target) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <section
      className={`relative overflow-hidden bg-[#0f0e0c] px-6 py-24 text-center sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      {/* Radial champagne glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C9A96E]/5 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-4xl">
        <FadeUp>
          <SectionEyebrow>Counting Down</SectionEyebrow>
          <SectionHeading center light>{section.title || "The Big Day"}</SectionHeading>
          {section.body && <SectionBody center light>{section.body}</SectionBody>}
          <Ornament center />
        </FadeUp>

        <FadeUp delay={0.2} className="mt-16">
          {!target ? (
            <p className="text-sm italic text-white/30">Set an event date to start the countdown</p>
          ) : !timeLeft ? (
            <div className="inline-flex items-center gap-3 rounded-none border border-[#C9A96E]/30 px-10 py-5">
              <span className="font-serif text-2xl italic text-[#C9A96E]">Happening Now</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6" role="timer" aria-label="Countdown to event">
              {UNITS.map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease, delay: i * 0.08 }}
                  className="flex flex-col items-center border border-white/8 bg-white/3 px-4 py-8"
                >
                  <span className="font-serif text-5xl font-bold tabular-nums text-white sm:text-6xl">
                    {String(timeLeft[label] ?? 0).padStart(2, "0")}
                  </span>
                  <span className="mt-3 text-[10px] font-medium uppercase tracking-[0.3em] text-[#C9A96E]">
                    {label}
                  </span>
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

// ─── Venue ────────────────────────────────────────────────────────────────────
export function VenueSection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};
  const [copied, setCopied] = useState(false);

  const locationLine = [config.city, config.state, config.country].filter(Boolean).join(", ");
  const fullAddress  = [config.venue_name, config.venue_address, config.city, config.state, config.country].filter(Boolean).join(", ");
  const hasLocation  = !!(config.venue_name || config.venue_address || locationLine);
  const mapsQuery    = encodeURIComponent(fullAddress);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;
  const embedUrl      = `https://maps.google.com/maps?q=${mapsQuery}&output=embed&z=15`;

  const copyAddress = useCallback(async () => {
    if (!fullAddress) return;
    await navigator.clipboard.writeText(fullAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullAddress]);

  return (
    <section
      className={`relative overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-28 lg:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-6xl">
        <FadeUp className="mb-12 sm:mb-16">
          <SectionEyebrow>Venue &amp; Directions</SectionEyebrow>
          <SectionHeading>{section.title || "Where to Find Us"}</SectionHeading>
          {section.body && <SectionBody>{section.body}</SectionBody>}
          <Ornament />
        </FadeUp>

        <div className="grid gap-8 md:grid-cols-2 md:items-start lg:grid-cols-5 lg:gap-12">
          {/* Details */}
          <FadeUp delay={0.1} className="flex flex-col gap-4 lg:col-span-2">
            {config.venue_name && (
              <div className="flex items-start gap-4 border border-stone-100 bg-stone-50 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-white shadow-sm">
                  <Building2 className="h-4 w-4 text-[#C9A96E]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">Venue</p>
                  <p className="mt-0.5 font-semibold text-stone-900">{config.venue_name}</p>
                </div>
              </div>
            )}
            {(config.venue_address || locationLine) && (
              <div className="flex items-start gap-4 border border-stone-100 bg-stone-50 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-white shadow-sm">
                  <MapPin className="h-4 w-4 text-[#C9A96E]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">Address</p>
                  {config.venue_address && <p className="mt-0.5 font-medium text-stone-900">{config.venue_address}</p>}
                  {locationLine && <p className="text-sm text-stone-500">{locationLine}</p>}
                </div>
              </div>
            )}
            {config.show_parking && (
              <div className="flex items-start gap-4 border border-stone-100 bg-stone-50 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-white shadow-sm">
                  <Car className="h-4 w-4 text-[#C9A96E]" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">Parking</p>
                  <p className="mt-0.5 font-medium text-stone-900">{config.parking_info || "Free parking available on-site"}</p>
                </div>
              </div>
            )}
            {!hasLocation && (
              <div className="flex items-center gap-3 border border-dashed border-stone-200 p-5 text-sm text-stone-400">
                <MapPin className="h-5 w-5 shrink-0" /> Location details coming soon
              </div>
            )}
            {hasLocation && (
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => isEditor && e.preventDefault()}
                  className="inline-flex w-full items-center justify-center gap-2 bg-[#1C1917] px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-white transition hover:bg-stone-800 active:scale-95 sm:w-auto">
                  <Navigation className="h-4 w-4" /> Get directions
                </a>
                <button type="button" onClick={(e) => { e.stopPropagation(); copyAddress(); }}
                  className="inline-flex w-full items-center justify-center gap-2 border border-stone-200 bg-white px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-stone-700 transition hover:bg-stone-50 active:scale-95 sm:w-auto">
                  {copied ? <><Check className="h-4 w-4 text-emerald-500" />Copied</> : <><Copy className="h-4 w-4" />Copy address</>}
                </button>
              </div>
            )}
          </FadeUp>

          {/* Map */}
          <FadeUp delay={0.2} className="lg:col-span-3">
            {hasLocation ? (
              <>
                {/* Mobile: tap card */}
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => isEditor && e.preventDefault()}
                  className="flex items-center gap-4 border border-stone-200 bg-stone-50 p-5 transition hover:bg-stone-100 md:hidden">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-[#1C1917]">
                    <MapPin className="h-6 w-6 text-[#C9A96E]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-stone-900">{config.venue_name || "View location"}</p>
                    {config.venue_address && <p className="truncate text-sm text-stone-500">{config.venue_address}</p>}
                    {locationLine && <p className="truncate text-sm text-stone-400">{locationLine}</p>}
                  </div>
                  <ExternalLink className="h-5 w-5 shrink-0 text-stone-400" />
                </a>
                {/* Desktop: iframe */}
                <div className="relative hidden overflow-hidden border border-stone-200 shadow-sm md:block" style={{ height: "400px" }}>
                  <iframe title="Event location" src={embedUrl} width="100%" height="100%" style={{ border: 0, display: "block", height: "400px" }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => isEditor && e.preventDefault()}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-lg ring-1 ring-black/10 transition hover:bg-stone-50">
                    <ExternalLink className="h-3.5 w-3.5" /> Open in Maps
                  </a>
                </div>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center border border-dashed border-stone-200 bg-stone-50 md:h-[400px]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <MapPin className="h-8 w-8 text-stone-300" />
                  <p className="text-sm text-stone-400">{isEditor ? "Add an address to show the map" : "Location coming soon"}</p>
                </div>
              </div>
            )}
          </FadeUp>
        </div>
      </div>
      {isEditor && <EditorBadge label="VENUE" />}
    </section>
  );
}

// ─── Registry ─────────────────────────────────────────────────────────────────
export function RegistrySection({ section, isEditor = false, onEdit }) {
  const items = section.config?.items || [
    { name: "Amazon Registry", url: "#" },
    { name: "Target Registry", url: "#" },
    { name: "Gift Fund",       url: "#" },
  ];

  return (
    <section
      className={`bg-[#FAF9F6] px-6 py-24 text-center sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-4xl">
        <FadeUp>
          <SectionEyebrow>Registry</SectionEyebrow>
          <SectionHeading center>{section.title || "Our Registry"}</SectionHeading>
          {section.body && <SectionBody center>{section.body}</SectionBody>}
          <Ornament center />
        </FadeUp>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {items.map((item, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <a
                href={item.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-4 border border-stone-200 bg-white p-8 transition hover:-translate-y-1 hover:border-[#C9A96E]/40 hover:shadow-md"
              >
                <div className="h-px w-8 bg-[#C9A96E]/50" />
                <h4 className="font-serif text-lg font-semibold text-stone-900">{item.name}</h4>
                <span className="text-xs uppercase tracking-[0.2em] text-[#C9A96E] transition group-hover:tracking-[0.3em]">
                  View Registry →
                </span>
              </a>
            </FadeUp>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="REGISTRY" />}
    </section>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
export function GallerySection({ section, isEditor = false, onEdit }) {
  const layout      = section.config?.layout || "grid";
  const images      = Array.isArray(section.config?.images) ? section.config.images : [];
  const placeholders = isEditor ? Array(6).fill(null) : [];
  const display     = images.length > 0 ? images : placeholders;

  return (
    <section
      className={`bg-white px-6 py-24 sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-6xl">
        <FadeUp className="mb-12">
          <SectionEyebrow>Gallery</SectionEyebrow>
          <SectionHeading>{section.title || "Our Moments"}</SectionHeading>
          <Ornament />
        </FadeUp>

        {images.length === 0 && !isEditor ? (
          <p className="py-16 text-center text-stone-400">Upload images to display the gallery</p>
        ) : layout === "carousel" ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {display.map((img, i) => (
              <div key={i} className="min-w-[280px] h-[200px] shrink-0 overflow-hidden bg-stone-100 sm:min-w-[340px] sm:h-[240px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
            {display.map((img, i) => (
              <div key={i} className="mb-4 overflow-hidden break-inside-avoid bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img} alt={`Gallery ${i + 1}`} className="w-full object-cover transition-transform duration-500 hover:scale-105" />}
                {!img && <div className="aspect-square bg-stone-100" />}
              </div>
            ))}
          </div>
        )}
      </div>
      {isEditor && <EditorBadge label="GALLERY" />}
    </section>
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
export function ScheduleSection({ section, event, isEditor = false, onEdit }) {
  const items = event?.schedule_items || section.config?.items || [];
  const mock  = [
    { title: "Registration & Welcome",  starts_at: "9:00 AM",  location: "Main Hall"    },
    { title: "Keynote Address",         starts_at: "10:00 AM", location: "Auditorium"   },
    { title: "Lunch Break",             starts_at: "12:00 PM", location: "Dining Area"  },
  ];
  const display = items.length > 0 ? items : isEditor ? mock : [];

  return (
    <section
      className={`bg-[#FAF9F6] px-6 py-24 sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-3xl">
        <FadeUp className="mb-14">
          <SectionEyebrow>Agenda</SectionEyebrow>
          <SectionHeading>{section.title || "Schedule"}</SectionHeading>
          <Ornament />
        </FadeUp>

        <div className="relative">
          {/* Champagne vertical line */}
          <div className="absolute left-[86px] top-0 h-full w-px bg-[#C9A96E]/20 sm:left-[102px]" aria-hidden="true" />

          <div className="space-y-0">
            {display.map((item, i) => (
              <FadeUp key={item.id || i} delay={i * 0.08}>
                <div className="flex items-start gap-6 py-6 sm:gap-8">
                  {/* Time */}
                  <div className="w-20 shrink-0 pt-0.5 text-right sm:w-24">
                    <span className="text-xs font-medium uppercase tracking-wider text-[#C9A96E]">
                      {item.starts_at && typeof item.starts_at === "string" && item.starts_at.includes("T")
                        ? new Date(item.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : item.starts_at || "—"}
                    </span>
                  </div>
                  {/* Dot */}
                  <div className="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
                    <div className="h-2 w-2 rotate-45 bg-[#C9A96E]" />
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1 pb-2">
                    <h4 className="font-serif text-lg font-semibold text-stone-900">{item.title}</h4>
                    {item.location && <p className="mt-0.5 text-sm text-stone-500">{item.location}</p>}
                    {item.description && <p className="mt-1 text-sm text-stone-400">{item.description}</p>}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
      {isEditor && <EditorBadge label="SCHEDULE" />}
    </section>
  );
}

// ─── Speakers ─────────────────────────────────────────────────────────────────
export function SpeakersSection({ section, event, isEditor = false, onEdit }) {
  const speakers = event?.speakers || section.config?.items || [];
  const mock     = [
    { full_name: "Speaker Name", title: "Role / Company" },
    { full_name: "Speaker Name", title: "Role / Company" },
    { full_name: "Speaker Name", title: "Role / Company" },
  ];
  const display = speakers.length > 0 ? speakers : isEditor ? mock : [];

  return (
    <section
      className={`bg-white px-6 py-24 sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-5xl">
        <FadeUp className="mb-14">
          <SectionEyebrow>Speakers</SectionEyebrow>
          <SectionHeading>{section.title || "Our Speakers"}</SectionHeading>
          <Ornament />
        </FadeUp>

        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {display.map((s, i) => (
            <FadeUp key={s.id || i} delay={i * 0.08}>
              <div className="group flex flex-col items-center text-center">
                <div className="relative h-24 w-24 overflow-hidden bg-stone-100 ring-1 ring-stone-200 transition group-hover:ring-[#C9A96E]/40 sm:h-28 sm:w-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {s.avatar_url
                    ? <img src={s.avatar_url} className="h-full w-full object-cover" alt={s.full_name} />
                    : <div className="flex h-full w-full items-center justify-center bg-stone-50"><span className="font-serif text-3xl text-stone-300">{(s.full_name || "S")[0]}</span></div>
                  }
                </div>
                <div className="mt-5">
                  <h4 className="font-serif text-lg font-semibold text-stone-900">{s.full_name}</h4>
                  {s.title && <p className="mt-1 text-sm text-[#C9A96E]">{s.title}</p>}
                  {s.bio && <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-stone-500 line-clamp-2">{s.bio}</p>}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="SPEAKERS" />}
    </section>
  );
}

// ─── Tickets ──────────────────────────────────────────────────────────────────
export function TicketsSection({ section, isEditor = false, onEdit }) {
  const mock = [
    { name: "General",  price: 20, description: "Full event access" },
    { name: "VIP",      price: 80, description: "Priority seating + gifts", featured: true },
    { name: "Group ×5", price: 90, description: "Group of five tickets" },
  ];

  return (
    <section
      className={`bg-[#FAF9F6] px-6 py-24 sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-4xl">
        <FadeUp className="text-center">
          <SectionEyebrow>Tickets</SectionEyebrow>
          <SectionHeading center>{section.title || "Reserve Your Seat"}</SectionHeading>
          {section.body && <SectionBody center>{section.body}</SectionBody>}
          <Ornament center />
        </FadeUp>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {mock.map((t, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div className={`flex flex-col border p-8 transition ${
                t.featured
                  ? "border-[#C9A96E] bg-[#1C1917] text-white"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}>
                {t.featured && (
                  <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.3em] text-[#C9A96E]">Most Popular</p>
                )}
                <h4 className={`font-serif text-xl font-bold ${t.featured ? "text-white" : "text-stone-900"}`}>{t.name}</h4>
                <p className={`mt-1 text-sm ${t.featured ? "text-white/50" : "text-stone-400"}`}>{t.description}</p>
                <div className={`my-6 font-serif text-4xl font-bold ${t.featured ? "text-[#C9A96E]" : "text-stone-900"}`}>
                  ${t.price}
                </div>
                <button className={`mt-auto py-3 text-sm font-medium uppercase tracking-[0.15em] transition active:scale-95 ${
                  t.featured
                    ? "bg-[#C9A96E] text-[#1C1917] hover:bg-[#d4b47a]"
                    : "border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white"
                }`}>
                  Select
                </button>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="TICKETS" />}
    </section>
  );
}

// ─── Donations ────────────────────────────────────────────────────────────────
export function DonationsSection({ section, isEditor = false, onEdit }) {
  const amounts = ["$10", "$25", "$50", "$100", "Custom"];

  return (
    <section
      className={`bg-[#0f0e0c] px-6 py-24 text-center sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-2xl">
        <FadeUp>
          <SectionEyebrow>Give</SectionEyebrow>
          <SectionHeading center light>{section.title || "Make a Gift"}</SectionHeading>
          {section.body && <SectionBody center light>{section.body}</SectionBody>}
          <Ornament center />
        </FadeUp>

        <FadeUp delay={0.15} className="mt-12 flex flex-wrap justify-center gap-3">
          {amounts.map((a) => (
            <button
              key={a}
              className="border border-white/15 bg-transparent px-8 py-3 text-sm font-medium uppercase tracking-[0.15em] text-white/80 transition hover:border-[#C9A96E] hover:text-[#C9A96E] active:scale-95"
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

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQItem({ question, answer, index }) {
  const [open, setOpen] = useState(false);

  return (
    <FadeUp delay={index * 0.06}>
      <div className="border-b border-stone-200">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 py-5 text-left transition hover:text-[#C9A96E]"
          aria-expanded={open}
        >
          <span className="font-serif text-lg font-semibold text-stone-900">{question}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3, ease }}
            className="shrink-0"
          >
            <ChevronDown className="h-5 w-5 text-[#C9A96E]" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="answer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className="overflow-hidden"
            >
              <p className="pb-5 text-stone-500 leading-relaxed">{answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeUp>
  );
}

export function FAQSection({ section, isEditor = false, onEdit }) {
  const items = section.config?.items || [];
  const mock  = [
    { question: "What time does it start?",   answer: "Doors open one hour before the event begins." },
    { question: "Is parking available?",       answer: "Yes, free parking is available on-site."     },
    { question: "Can I bring a plus one?",     answer: "Please refer to your personal invitation for plus-one availability." },
  ];
  const display = items.length > 0 ? items : isEditor ? mock : [];

  return (
    <section
      className={`bg-white px-6 py-24 sm:py-32 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-3xl">
        <FadeUp className="mb-12">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <SectionHeading>{section.title || "Questions & Answers"}</SectionHeading>
          <Ornament />
        </FadeUp>

        <div>
          {display.map((item, i) => (
            <FAQItem key={i} index={i} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="FAQ" />}
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
export function CTASection({ section, isEditor = false, onEdit }) {
  const [hasToken] = useState(() =>
    typeof window !== "undefined"
      ? !!new URLSearchParams(window.location.search).get("token")
      : false
  );

  const handleRsvp = () => {
    window.dispatchEvent(new CustomEvent("open-rsvp-panel"));
  };

  return (
    <section
      className={`relative overflow-hidden bg-[#1C1917] px-6 py-32 text-center sm:py-40 ${isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""}`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C9A96E]/5 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-2xl">
        <FadeUp>
          <div className="mb-8 flex items-center justify-center" aria-hidden="true">
            <div className="h-px w-12 bg-[#C9A96E]/50" />
            <div className="mx-3 h-1.5 w-1.5 rotate-45 bg-[#C9A96E]" />
            <div className="h-px w-12 bg-[#C9A96E]/50" />
          </div>
          <h2 className="font-serif text-5xl font-bold italic leading-tight text-white sm:text-6xl">
            {section.title || "Join Us"}
          </h2>
          {section.body && (
            <p className="mx-auto mt-5 max-w-md text-lg text-white/50">{section.body}</p>
          )}

          {/* RSVP button — only visible to invited guests (token in URL) or in editor */}
          {(isEditor || hasToken) ? (
            <button
              onClick={!isEditor ? handleRsvp : undefined}
              className="mt-12 border border-[#C9A96E] bg-transparent px-12 py-4 text-sm font-medium uppercase tracking-[0.25em] text-[#C9A96E] transition hover:bg-[#C9A96E] hover:text-[#1C1917] active:scale-95"
            >
              {section.config?.button_text || "Confirm Attendance"}
            </button>
          ) : (
            /* Public visitors see a subtle "by invitation only" note instead */
            <p className="mt-12 text-xs uppercase tracking-[0.3em] text-white/25">
              By invitation only
            </p>
          )}
        </FadeUp>
      </div>
      {isEditor && <EditorBadge label="CTA" />}
    </section>
  );
}
