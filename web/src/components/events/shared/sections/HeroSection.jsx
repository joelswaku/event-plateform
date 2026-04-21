"use client";

import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

export default function HeroSection({ section, isEditor = false, onEdit }) {
  const config          = section.config || {};
  const overlayOpacity  = (config.overlay_opacity ?? 45) / 100;
  const align           = config.headline_align;
  const textAlign       = align === "left" ? "text-left items-start" : align === "right" ? "text-right items-end" : "text-center items-center";

  return (
    <section
      aria-label="Event hero"
      className={`relative flex min-h-screen flex-col justify-center overflow-hidden ${textAlign} ${
        isEditor ? "cursor-pointer" : ""
      }`}
      style={{
        background: config.background_color || "linear-gradient(160deg,#1a1611 0%,#2d2416 50%,#1a1611 100%)",
      }}
      onClick={isEditor ? onEdit : undefined}
    >
      {/* Background image */}
      {config.background_image && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${config.background_image})` }}
          aria-hidden="true"
        />
      )}

      {/* Gradient overlay — top dark + bottom dark */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom,
            rgba(0,0,0,${overlayOpacity + 0.15}) 0%,
            rgba(0,0,0,${overlayOpacity * 0.6}) 40%,
            rgba(0,0,0,${overlayOpacity * 0.6}) 60%,
            rgba(0,0,0,${overlayOpacity + 0.2}) 100%)`,
        }}
        aria-hidden="true"
      />

      {/* Champagne decorative line */}
      <div className="absolute inset-x-0 top-0 h-px bg-[#C9A96E]/30" aria-hidden="true" />

      {/* Content */}
      <div className={`relative z-10 mx-auto w-full max-w-5xl px-6 py-32 flex flex-col gap-6 sm:py-40 ${textAlign}`}>

        {config.eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="text-xs font-medium uppercase tracking-[0.4em] text-[#C9A96E]"
          >
            {config.eyebrow}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.25 }}
          className="font-serif text-5xl font-bold italic leading-[1.1] text-white drop-shadow-lg sm:text-7xl md:text-8xl"
        >
          {section.title || "Welcome"}
        </motion.h1>

        {section.body && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.45 }}
            className="max-w-xl text-base leading-relaxed text-white/70 sm:text-lg"
          >
            {section.body}
          </motion.p>
        )}

        {/* Champagne ornament */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.55 }}
          className={`flex items-center gap-3 w-24 ${align !== "left" && align !== "right" ? "mx-auto" : ""}`}
          aria-hidden="true"
        >
          <div className="h-px flex-1 bg-[#C9A96E]/60" />
          <div className="h-1.5 w-1.5 rotate-45 bg-[#C9A96E]" />
          <div className="h-px flex-1 bg-[#C9A96E]/60" />
        </motion.div>

        {config.show_cta && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.65 }}
            className="flex flex-wrap gap-4 mt-2"
          >
            <button className="rounded-none border border-white bg-transparent px-10 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-stone-900 active:scale-95">
              {config.cta_text || "Register Now"}
            </button>
            {config.secondary_cta_text && (
              <button className="rounded-none border border-white/30 px-10 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-white/80 transition hover:border-white/60 hover:text-white">
                {config.secondary_cta_text}
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Scroll indicator */}
      {!isEditor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          aria-hidden="true"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="h-8 w-px bg-linear-to-b from-[#C9A96E]/60 to-transparent"
          />
        </motion.div>
      )}

      {isEditor && (
        <div className="absolute right-3 top-3 z-20 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          HERO
        </div>
      )}
    </section>
  );
}
