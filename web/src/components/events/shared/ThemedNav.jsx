"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const NAV_LABELS = {
  ABOUT:     "About",
  STORY:     "Story",
  COUPLE:    "Couple",
  COUNTDOWN: "Countdown",
  VENUE:     "Venue",
  REGISTRY:  "Registry",
  GALLERY:   "Gallery",
  SCHEDULE:  "Schedule",
  SPEAKERS:  "Speakers",
  TICKETS:   "Tickets",
  DONATIONS: "Donate",
  FAQ:       "FAQ",
  CTA:       "RSVP",
};

const FUN_COLORS = ["#F59E0B","#EF4444","#3B82F6","#10B981","#8B5CF6","#EC4899","#F97316"];

const ease = [0.22, 1, 0.36, 1];

// ─────────────────────────────────────────────────────────────────────────────
// Shared scroll hook
// ─────────────────────────────────────────────────────────────────────────────
function useScrollState() {
  const [scrolled,   setScrolled]   = useState(false);
  const [visible,    setVisible]    = useState(true);
  const [atTop,      setAtTop]      = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      setScrolled(y > 48);
      setAtTop(y < 10);
      setVisible(y < lastY.current || y < 80);
      lastY.current = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return { scrolled, visible, atTop };
}

// ─────────────────────────────────────────────────────────────────────────────
// Body scroll lock when mobile menu is open
// ─────────────────────────────────────────────────────────────────────────────
function useLockScroll(locked) {
  useEffect(() => {
    if (locked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [locked]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Smooth scroll helper
// ─────────────────────────────────────────────────────────────────────────────
function scrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 80;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated Hamburger — morphs into X
// ─────────────────────────────────────────────────────────────────────────────
function Hamburger({ open, onToggle, color = "#fff", theme }) {
  const isFun = theme === "FUN";

  return (
    <button
      onClick={onToggle}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className="relative z-[60] flex h-9 w-9 flex-col items-center justify-center gap-[5px] focus:outline-none"
      style={isFun ? {
        background: open ? "#1a1a1a" : "var(--t-accent)",
        border: "2px solid #1a1a1a",
        borderRadius: 8,
        boxShadow: open ? "none" : "2px 2px 0 #1a1a1a",
      } : {}}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-[1.5px] w-5 origin-center"
          style={{ background: isFun ? "#fff" : color }}
          animate={
            open
              ? i === 0 ? { rotate: 45,  y: 6.5, scaleX: 1 }
              : i === 1 ? { opacity: 0,  scaleX: 0 }
              :           { rotate: -45, y: -6.5, scaleX: 1 }
              : { rotate: 0, y: 0, opacity: 1, scaleX: 1 }
          }
          transition={{ duration: 0.28, ease }}
        />
      ))}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile menu overlays — one per theme family
// ─────────────────────────────────────────────────────────────────────────────

// CLASSIC / ELEGANT — Full-screen centered serif overlay
function OverlayMenuClassic({ open, links, onClose, theme }) {
  useLockScroll(open);
  const isElegant = theme === "ELEGANT";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: isElegant
              ? "rgba(39,26,20,0.96)"
              : "rgba(28,25,23,0.97)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Decorative lines */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-[2px] opacity-10" aria-hidden>
            <div className="h-px w-3/4" style={{ background: "var(--t-accent)" }} />
            <div className="h-px w-1/2" style={{ background: "var(--t-accent)" }} />
          </div>

          <nav className="flex flex-col items-center gap-8">
            {links.map((link, i) => (
              <motion.button
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.06 + 0.1, duration: 0.4, ease }}
                onClick={() => { onClose(); setTimeout(() => scrollTo(link.id), 320); }}
                className="group flex flex-col items-center gap-1"
              >
                <span
                  className="text-3xl font-light italic tracking-wide transition-colors duration-300 group-hover:opacity-80 sm:text-4xl"
                  style={{
                    fontFamily: "var(--t-font-heading)",
                    color: "#fff",
                  }}
                >
                  {link.label}
                </span>
                <motion.span
                  className="h-px"
                  style={{ background: "var(--t-accent)" }}
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.25 }}
                />
              </motion.button>
            ))}
          </nav>

          {/* Ornament */}
          <div className="absolute bottom-12 flex items-center gap-3 opacity-30" aria-hidden>
            <div className="h-px w-8" style={{ background: "var(--t-accent)" }} />
            <div className="h-1.5 w-1.5 rotate-45" style={{ background: "var(--t-accent)" }} />
            <div className="h-px w-8" style={{ background: "var(--t-accent)" }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// MODERN — Slide-in panel from right, sharp edges, bold
function OverlayMenuModern({ open, links, onClose }) {
  useLockScroll(open);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(10,10,20,0.7)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.38, ease }}
            className="fixed right-0 top-0 z-50 flex h-full w-[min(340px,90vw)] flex-col"
            style={{
              background: "var(--t-dark)",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b px-6" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: "var(--t-accent)" }}>
                Navigation
              </span>
              <button onClick={onClose} className="text-white/40 hover:text-white transition text-lg leading-none">✕</button>
            </div>

            {/* Links */}
            <nav className="flex flex-1 flex-col justify-center px-6 gap-1">
              {links.map((link, i) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ delay: i * 0.05 + 0.1, duration: 0.3, ease }}
                  onClick={() => { onClose(); setTimeout(() => scrollTo(link.id), 320); }}
                  className="group flex items-center gap-4 border-b py-4 text-left"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <span className="h-px w-6 transition-all duration-300 group-hover:w-10" style={{ background: "var(--t-accent)" }} />
                  <span className="text-lg font-black uppercase tracking-[0.1em] text-white/60 transition-colors group-hover:text-white">
                    {link.label}
                  </span>
                </motion.button>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// MINIMAL — Clean slide-down panel, barely there
function OverlayMenuMinimal({ open, links, onClose }) {
  useLockScroll(open);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease }}
          className="fixed inset-x-0 top-0 z-50 pt-10"
          style={{
            background: "rgba(249,249,249,0.98)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid #e5e5e5",
            paddingBottom: "3rem",
          }}
        >
          <nav className="mx-auto flex max-w-lg flex-col items-center gap-6 pt-8">
            {links.map((link, i) => (
              <motion.button
                key={link.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 + 0.08 }}
                onClick={() => { onClose(); setTimeout(() => scrollTo(link.id), 280); }}
                className="text-[11px] uppercase tracking-[0.5em] transition-opacity hover:opacity-100"
                style={{ color: "var(--t-text-muted)", opacity: 0.7 }}
              >
                {link.label}
              </motion.button>
            ))}
          </nav>
          <button
            onClick={onClose}
            className="absolute right-6 top-5 text-[10px] uppercase tracking-[0.3em]"
            style={{ color: "var(--t-text-muted)" }}
          >
            Close
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// LUXURY — Full-screen portrait overlay, gold links
function OverlayMenuLuxury({ open, links, onClose }) {
  useLockScroll(open);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center xl:hidden"
          style={{
            background: "rgba(6,5,4,0.97)",
            backdropFilter: "blur(32px) saturate(0.8)",
          }}
        >
          {/* Top & bottom rule lines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-30" style={{ background: "linear-gradient(to right, transparent, var(--t-accent), transparent)" }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-30" style={{ background: "linear-gradient(to right, transparent, var(--t-accent), transparent)" }} />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-[10px] uppercase tracking-[0.4em] transition-opacity hover:opacity-100"
            style={{ color: "rgba(212,175,111,0.4)", fontFamily: "var(--t-font-heading)" }}
          >
            Close
          </button>

          <nav className="flex flex-col items-center gap-10">
            {links.map((link, i) => (
              <motion.button
                key={link.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.07 + 0.12, duration: 0.5, ease }}
                onClick={() => { onClose(); setTimeout(() => scrollTo(link.id), 400); }}
                className="group flex flex-col items-center gap-1.5"
              >
                <span
                  className="text-2xl font-light italic tracking-widest"
                  style={{
                    fontFamily: "var(--t-font-heading)",
                    color: "rgba(212,175,111,0.55)",
                    transition: "color 0.3s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(212,175,111,0.55)")}
                >
                  {link.label}
                </span>
                <span className="h-px w-4 opacity-0 transition-all duration-300 group-hover:w-8 group-hover:opacity-100" style={{ background: "var(--t-accent)" }} />
              </motion.button>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// FUN — Slide-up bottom sheet
function OverlayMenuFun({ open, links, onClose }) {
  useLockScroll(open);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl p-6 pb-10"
            style={{
              background: "#fff",
              border: "2px solid #1a1a1a",
              boxShadow: "0 -8px 0 #1a1a1a",
            }}
          >
            {/* Drag handle */}
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-gray-300" />

            <div className="grid grid-cols-2 gap-3">
              {links.map((link, i) => {
                const color = FUN_COLORS[i % FUN_COLORS.length];
                return (
                  <motion.button
                    key={link.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    onClick={() => { onClose(); setTimeout(() => scrollTo(link.id), 320); }}
                    className="rounded-2xl py-4 text-center text-sm font-black uppercase tracking-[0.1em] text-white transition active:scale-95"
                    style={{
                      background: color,
                      border: "2px solid #1a1a1a",
                      boxShadow: "3px 3px 0 #1a1a1a",
                    }}
                  >
                    {link.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-theme desktop nav bars
// ─────────────────────────────────────────────────────────────────────────────

// CLASSIC ── Centered 2-row, cream glass, diamond separators
function ClassicDesktopNav({ event, links, scrolled, visible, mobileBtn }) {
  return (
    <motion.header
      animate={{ y: visible ? 0 : -90, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4, ease }}
      className="fixed inset-x-0 top-0 z-50"
      style={{
        background: scrolled
          ? "color-mix(in srgb, var(--t-bg) 88%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(1.6)" : "none",
        borderBottom: scrolled ? "1px solid var(--t-border)" : "none",
        boxShadow: scrolled ? "0 2px 40px rgba(0,0,0,0.06)" : "none",
        transition: "background 0.5s, border-color 0.5s, box-shadow 0.5s",
      }}
    >
      {/* Title row */}
      <div className="flex justify-center pt-3.5 pb-0.5">
        <p
          className="text-[13px] font-medium tracking-wide transition-colors duration-500"
          style={{
            fontFamily: "var(--t-font-heading)",
            fontStyle: "italic",
            color: scrolled ? "var(--t-text)" : "rgba(255,255,255,0.9)",
          }}
        >
          {event?.title || ""}
        </p>
      </div>

      {/* Links row (desktop) + hamburger (mobile) */}
      <div className="flex items-center justify-between px-5 pb-2.5 sm:justify-center sm:gap-0">
        {/* Mobile hamburger */}
        <div className="sm:hidden">
          {mobileBtn(scrolled ? "var(--t-text-muted)" : "rgba(255,255,255,0.85)")}
        </div>

        {/* Desktop links */}
        {links.length > 0 && (
          <nav className="hidden items-center sm:flex flex-wrap justify-center gap-0">
            {links.map((link, i) => (
              <span key={link.id} className="flex items-center">
                {i > 0 && (
                  <span
                    className="mx-3 text-[6px] opacity-50"
                    style={{ color: "var(--t-accent)" }}
                    aria-hidden
                  >
                    ◆
                  </span>
                )}
                <button
                  onClick={() => scrollTo(link.id)}
                  className="group relative text-[9px] font-semibold uppercase tracking-[0.3em] pb-0.5"
                  style={{ color: scrolled ? "var(--t-text-muted)" : "rgba(255,255,255,0.65)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = scrolled ? "var(--t-text-muted)" : "rgba(255,255,255,0.65)")}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 h-px w-0 transition-all duration-300 group-hover:w-full" style={{ background: "var(--t-accent)" }} />
                </button>
              </span>
            ))}
          </nav>
        )}
      </div>
    </motion.header>
  );
}

// ELEGANT ── Asymmetric, thin underline hover, airy
function ElegantDesktopNav({ event, links, scrolled, visible, mobileBtn }) {
  return (
    <motion.header
      animate={{ y: visible ? 0 : -72, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.45, ease }}
      className="fixed inset-x-0 top-0 z-50"
      style={{
        background: scrolled
          ? "color-mix(in srgb, var(--t-bg) 90%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(1.5)" : "none",
        borderBottom: scrolled ? "1px solid var(--t-border)" : "none",
        transition: "background 0.5s, border-color 0.5s",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-10">
        <p
          className="text-sm font-light tracking-[0.12em] transition-colors duration-500"
          style={{
            fontFamily: "var(--t-font-heading)",
            fontStyle: "italic",
            color: scrolled ? "var(--t-text)" : "rgba(255,255,255,0.88)",
          }}
        >
          {event?.title || ""}
        </p>

        {/* Desktop links */}
        {links.length > 0 && (
          <nav className="hidden items-center gap-8 sm:flex">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="group relative pb-0.5 text-[10px] font-light uppercase tracking-[0.35em]"
                style={{ color: scrolled ? "var(--t-text-muted)" : "rgba(255,255,255,0.6)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = scrolled ? "var(--t-text)" : "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = scrolled ? "var(--t-text-muted)" : "rgba(255,255,255,0.6)")}
              >
                {link.label}
                <span className="absolute bottom-0 left-0 h-px w-0 bg-[var(--t-accent)] transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>
        )}

        {/* Mobile hamburger */}
        <div className="sm:hidden">
          {mobileBtn(scrolled ? "var(--t-text)" : "rgba(255,255,255,0.85)")}
        </div>
      </div>
    </motion.header>
  );
}

// MODERN ── Always dark, no glass, accent underline bar on hover
function ModernDesktopNav({ event, links, mobileBtn }) {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        background: "var(--t-dark)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <p
          className="text-[11px] font-black uppercase tracking-[0.3em]"
          style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}
        >
          {event?.title || ""}
        </p>

        {/* Desktop links */}
        {links.length > 0 && (
          <nav className="hidden items-center sm:flex">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="group relative px-4 py-3.5 text-[9px] font-bold uppercase tracking-[0.22em] transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
              >
                {link.label}
                <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transition-transform duration-250 group-hover:scale-x-100" style={{ background: "var(--t-accent)", transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }} />
              </button>
            ))}
          </nav>
        )}

        {/* Mobile hamburger */}
        <div className="sm:hidden">
          {mobileBtn("rgba(255,255,255,0.7)")}
        </div>
      </div>
    </header>
  );
}

// MINIMAL ── Appears only on scroll, ultra-thin, near invisible
function MinimalDesktopNav({ event, links, scrolled, mobileBtn }) {
  return (
    <motion.header
      animate={{ opacity: scrolled ? 1 : 0, y: scrolled ? 0 : -12 }}
      transition={{ duration: 0.5, ease }}
      className="fixed inset-x-0 top-0 z-50"
      style={{
        background: "rgba(249,249,249,0.97)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #ebebeb",
        pointerEvents: scrolled ? "auto" : "none",
      }}
    >
      <div className="mx-auto flex h-10 max-w-4xl items-center justify-between px-8">
        <p
          className="text-[8px] uppercase tracking-[0.55em]"
          style={{ color: "var(--t-text-muted)" }}
        >
          {event?.title || ""}
        </p>

        {/* Desktop links */}
        {links.length > 0 && (
          <nav className="hidden items-center gap-7 sm:flex">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-[8px] uppercase tracking-[0.45em] transition-opacity hover:opacity-100"
                style={{ color: "var(--t-text-muted)", opacity: 0.55 }}
              >
                {link.label}
              </button>
            ))}
          </nav>
        )}

        {/* Mobile hamburger */}
        <div className="sm:hidden">
          {mobileBtn("var(--t-text-muted)")}
        </div>
      </div>
    </motion.header>
  );
}

// LUXURY ── Fixed left vertical sidebar (desktop), hamburger on mobile
function LuxuryDesktopNav({ event, links, mobileBtn }) {
  const [hovered, setHovered] = useState(null);

  return (
    <>
      {/* Left sidebar — only on xl+ */}
      <aside
        className="fixed left-0 top-0 z-50 hidden xl:flex flex-col justify-between h-screen w-[72px] py-12 items-center"
        style={{
          background: "rgba(13,12,10,0.88)",
          backdropFilter: "blur(20px) saturate(0.9)",
          borderRight: "1px solid rgba(212,175,111,0.1)",
        }}
      >
        {/* Diamond monogram */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="h-8 w-8 flex items-center justify-center rotate-45"
            style={{ border: "1px solid rgba(212,175,111,0.4)" }}
          >
            <span
              className="-rotate-45 text-[11px] font-light"
              style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}
            >
              {(event?.title || "E")[0]}
            </span>
          </div>
          <div className="h-8 w-px mt-1" style={{ background: "linear-gradient(to bottom, rgba(212,175,111,0.4), transparent)" }} />
        </div>

        {/* Vertical links */}
        <nav className="flex flex-col items-center gap-9">
          {links.map((link, i) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              title={link.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ writingMode: "vertical-rl" }}
              className="text-[7.5px] uppercase tracking-[0.4em] transition-all duration-300"
            >
              <span style={{ color: hovered === i ? "var(--t-accent)" : "rgba(212,175,111,0.28)", transition: "color 0.3s" }}>
                {link.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Bottom rule */}
        <div className="h-8 w-px" style={{ background: "linear-gradient(to top, rgba(212,175,111,0.4), transparent)" }} />
      </aside>

      {/* Mobile hamburger bar (shown below xl) */}
      <div
        className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-5 xl:hidden"
        style={{ background: "rgba(13,12,10,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(212,175,111,0.1)" }}
      >
        <p className="text-[10px] font-light italic tracking-[0.2em]" style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}>
          {event?.title || ""}
        </p>
        {mobileBtn("rgba(212,175,111,0.7)")}
      </div>
    </>
  );
}

// FUN ── Colorful pill nav, neo-brutalism, bold
function FunDesktopNav({ event, links, scrolled, visible, mobileBtn }) {
  return (
    <motion.header
      animate={{ y: visible ? 0 : -80 }}
      transition={{ duration: 0.35, ease }}
      className="fixed inset-x-0 top-0 z-50"
      style={{
        background: scrolled ? "#ffffff" : "transparent",
        borderBottom: scrolled ? "2px solid #1a1a1a" : "none",
        boxShadow: scrolled ? "0 4px 0 #1a1a1a" : "none",
        transition: "background 0.3s, border 0.3s, box-shadow 0.3s",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <p
          className="text-sm font-black transition-colors duration-300"
          style={{
            color: scrolled ? "#1a1a1a" : "#fff",
            fontFamily: "var(--t-font-heading)",
            textShadow: scrolled ? "none" : "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {event?.title || ""}
        </p>

        {/* Desktop pills */}
        {links.length > 0 && (
          <nav className="hidden items-center gap-2 sm:flex flex-wrap">
            {links.map((link, i) => {
              const color = FUN_COLORS[i % FUN_COLORS.length];
              return (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="rounded-full px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] transition-all duration-200 active:scale-95"
                  style={{
                    background: scrolled ? color : "rgba(255,255,255,0.15)",
                    color: "#fff",
                    border: `2px solid ${scrolled ? "#1a1a1a" : "rgba(255,255,255,0.3)"}`,
                    boxShadow: scrolled ? "2px 2px 0 #1a1a1a" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (scrolled) {
                      e.currentTarget.style.transform = "translate(-1px,-1px)";
                      e.currentTarget.style.boxShadow = "3px 3px 0 #1a1a1a";
                    } else {
                      e.currentTarget.style.background = "rgba(255,255,255,0.28)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = scrolled ? "2px 2px 0 #1a1a1a" : "none";
                    e.currentTarget.style.background = scrolled ? color : "rgba(255,255,255,0.15)";
                  }}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Mobile hamburger */}
        <div className="sm:hidden">
          {mobileBtn(scrolled ? "#1a1a1a" : "#fff")}
        </div>
      </div>
    </motion.header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — Dispatches to the correct nav + mobile overlay per theme
// ─────────────────────────────────────────────────────────────────────────────
export default function ThemedNav({ event, sections, themeKey }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrolled, visible, atTop } = useScrollState();

  const navLinks = useMemo(
    () =>
      sections
        .filter((s) => s.is_visible !== false && NAV_LABELS[s.section_type])
        .map((s) => ({ id: `s-${s.id}`, label: NAV_LABELS[s.section_type] })),
    [sections]
  );

  const openMenu  = useCallback(() => setMenuOpen(true),  []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Returns a hamburger button, bound to open the mobile menu
  const mobileBtn = useCallback(
    (color) => (
      <Hamburger
        open={menuOpen}
        onToggle={() => setMenuOpen((o) => !o)}
        color={color}
        theme={themeKey}
      />
    ),
    [menuOpen, themeKey]
  );

  const sharedDesktopProps = { event, links: navLinks, scrolled, visible, atTop, mobileBtn };

  // Mobile overlay component per theme
  const MobileOverlay = () => {
    if (themeKey === "CLASSIC" || themeKey === "ELEGANT") {
      return <OverlayMenuClassic open={menuOpen} links={navLinks} onClose={closeMenu} theme={themeKey} />;
    }
    if (themeKey === "MODERN")  return <OverlayMenuModern  open={menuOpen} links={navLinks} onClose={closeMenu} />;
    if (themeKey === "MINIMAL") return <OverlayMenuMinimal open={menuOpen} links={navLinks} onClose={closeMenu} />;
    if (themeKey === "LUXURY")  return <OverlayMenuLuxury  open={menuOpen} links={navLinks} onClose={closeMenu} />;
    if (themeKey === "FUN")     return <OverlayMenuFun     open={menuOpen} links={navLinks} onClose={closeMenu} />;
    return <OverlayMenuClassic open={menuOpen} links={navLinks} onClose={closeMenu} theme="CLASSIC" />;
  };

  return (
    <>
      {/* Desktop nav per theme */}
      {themeKey === "CLASSIC"  && <ClassicDesktopNav  {...sharedDesktopProps} />}
      {themeKey === "ELEGANT"  && <ElegantDesktopNav  {...sharedDesktopProps} />}
      {themeKey === "MODERN"   && <ModernDesktopNav   {...sharedDesktopProps} />}
      {themeKey === "MINIMAL"  && <MinimalDesktopNav  {...sharedDesktopProps} />}
      {themeKey === "LUXURY"   && <LuxuryDesktopNav   event={event} links={navLinks} mobileBtn={mobileBtn} />}
      {themeKey === "FUN"      && <FunDesktopNav      {...sharedDesktopProps} />}

      {/* Fallback for unknown themes */}
      {!["CLASSIC","ELEGANT","MODERN","MINIMAL","LUXURY","FUN"].includes(themeKey) && (
        <ClassicDesktopNav {...sharedDesktopProps} />
      )}

      {/* Mobile overlay */}
      <MobileOverlay />
    </>
  );
}
