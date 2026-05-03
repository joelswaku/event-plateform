"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, Lock, Check, Sparkles, Crown, ArrowRight, Zap, Eye, Layout, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  STYLE_TEMPLATES,
  canAccessTemplate,
  FREE_STYLE,
  TEMPLATE_CATEGORIES,
  getCategoryForType,
  getTemplatesForEventType,
} from "@/lib/styleTemplates";
import { STYLE_META } from "@/lib/styleThemes";
import { useSubscriptionStore } from "@/store/subscription.store";
import { useBuilderStore } from "@/store/builder.store";

// ── Data ──────────────────────────────────────────────────────────────────────
const ALL_TEMPLATES = Array.from(
  new Map(STYLE_TEMPLATES.map((t) => [t.id, t])).values()
);

const STYLE_ORDER    = ["CLASSIC", "ELEGANT", "MODERN", "MINIMAL", "LUXURY", "FUN"];
const CATEGORY_ORDER = ["SOCIAL", "CORPORATE", "ENTERTAINMENT", "LIFE", "RELIGIOUS"];

function formatEventTypeName(type) {
  if (!type) return "Your Event";
  return String(type)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Section type → wireframe shape ────────────────────────────────────────────
const SECTION_SHAPES = {
  HERO:      { h: 72, label: "Hero" },
  ABOUT:     { h: 44, label: "About" },
  STORY:     { h: 56, label: "Story" },
  COUPLE:    { h: 60, label: "Couple" },
  COUNTDOWN: { h: 40, label: "Countdown" },
  VENUE:     { h: 52, label: "Venue" },
  GALLERY:   { h: 48, label: "Gallery" },
  SCHEDULE:  { h: 52, label: "Schedule" },
  SPEAKERS:  { h: 56, label: "Speakers" },
  REGISTRY:  { h: 40, label: "Registry" },
  TICKETS:   { h: 60, label: "Tickets" },
  DONATIONS: { h: 44, label: "Donations" },
  FAQ:       { h: 44, label: "FAQ" },
  CTA:       { h: 36, label: "CTA" },
  RSVP:      { h: 36, label: "RSVP" },
};

// ── Live wireframe preview of a single section ─────────────────────────────
function SectionWireframe({ type, index, bg, accent, heroImg, isHero }) {
  const shape = SECTION_SHAPES[type] ?? { h: 40, label: type };

  // HERO — show actual image if available
  if (isHero) {
    return (
      <div
        style={{
          height: shape.h,
          position: "relative",
          overflow: "hidden",
          background: heroImg ? "transparent" : bg,
          flexShrink: 0,
        }}
      >
        {heroImg && (
          <img
            src={heroImg}
            alt=""
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.42)" }} />
        {/* Fake headline */}
        <div style={{ position: "absolute", bottom: 10, left: 10, right: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.85)", width: "68%", marginBottom: 4 }} />
          <div style={{ height: 2.5, borderRadius: 2, background: accent, width: "42%", marginBottom: 5 }} />
          <div style={{ display: "inline-block", height: 8, width: 40, borderRadius: 3, background: accent, opacity: 0.9 }} />
        </div>
      </div>
    );
  }

  // Generic section wireframe
  return (
    <div
      style={{
        height: shape.h,
        padding: "6px 8px",
        background: index % 2 === 0 ? bg : `${bg}ee`,
        position: "relative",
        flexShrink: 0,
        borderTop: `1px solid rgba(0,0,0,0.04)`,
      }}
    >
      {/* Section label */}
      <div style={{
        position: "absolute", top: 4, right: 5,
        fontSize: 5.5, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.12em", color: accent, opacity: 0.6,
      }}>
        {shape.label}
      </div>

      {/* Wireframe content */}
      {type === "TICKETS" && (
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              flex: 1, height: 40, borderRadius: 4,
              background: `${accent}18`,
              border: `1px solid ${accent}30`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 3,
            }}>
              <div style={{ height: 2.5, width: "60%", borderRadius: 1, background: accent, opacity: 0.7 }} />
              <div style={{ height: 5, width: 28, borderRadius: 2, background: accent, opacity: 0.9 }} />
            </div>
          ))}
        </div>
      )}

      {type === "GALLERY" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3, marginTop: 4 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ height: 14, borderRadius: 2, background: `${accent}18`, border: `1px solid ${accent}15` }} />
          ))}
        </div>
      )}

      {type === "COUNTDOWN" && (
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 4 }}>
          {["DD", "HH", "MM", "SS"].map((l) => (
            <div key={l} style={{
              width: 18, height: 18, borderRadius: 3,
              background: `${accent}20`, border: `1px solid ${accent}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 5, fontWeight: 900, color: accent,
            }}>
              {l}
            </div>
          ))}
        </div>
      )}

      {type === "SCHEDULE" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
          {[80, 65, 75].map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: accent, flexShrink: 0 }} />
              <div style={{ height: 2, borderRadius: 1, background: "rgba(0,0,0,0.2)", width: `${w}%` }} />
            </div>
          ))}
        </div>
      )}

      {type === "COUPLE" && (
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 6 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: 20, height: 26, borderRadius: 10, background: `${accent}20`, border: `1px solid ${accent}30` }} />
              <div style={{ height: 2, width: 20, borderRadius: 1, background: "rgba(0,0,0,0.2)" }} />
            </div>
          ))}
        </div>
      )}

      {type === "VENUE" && (
        <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
          <div style={{ flex: 1 }}>
            {[70, 55, 45].map((w, i) => (
              <div key={i} style={{ height: 2, borderRadius: 1, background: "rgba(0,0,0,0.18)", width: `${w}%`, marginBottom: 3 }} />
            ))}
          </div>
          <div style={{ width: 50, height: 32, borderRadius: 3, background: `${accent}15`, border: `1px solid ${accent}20`, flexShrink: 0 }} />
        </div>
      )}

      {type === "SPEAKERS" && (
        <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 4 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${accent}20`, border: `1px solid ${accent}25` }} />
              <div style={{ height: 1.5, width: 18, borderRadius: 1, background: "rgba(0,0,0,0.2)" }} />
            </div>
          ))}
        </div>
      )}

      {(type === "ABOUT" || type === "STORY" || type === "FAQ" || type === "DONATIONS") && (
        <div style={{ marginTop: 6 }}>
          <div style={{ height: 2.5, borderRadius: 1, background: "rgba(0,0,0,0.25)", width: "55%", marginBottom: 3 }} />
          {[88, 72, 60].map((w, i) => (
            <div key={i} style={{ height: 1.5, borderRadius: 1, background: "rgba(0,0,0,0.12)", width: `${w}%`, marginBottom: 2 }} />
          ))}
        </div>
      )}

      {(type === "CTA" || type === "RSVP") && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, paddingTop: 4 }}>
          <div style={{ height: 2.5, borderRadius: 1, background: "rgba(0,0,0,0.2)", width: "45%" }} />
          <div style={{ height: 8, width: 48, borderRadius: 4, background: accent, opacity: 0.9 }} />
        </div>
      )}

      {type === "REGISTRY" && (
        <div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "center" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              width: 32, height: 22, borderRadius: 3,
              border: `1px solid ${accent}30`,
              background: `${accent}10`,
            }} />
          ))}
        </div>
      )}

      {type === "COUNTDOWN" || !["TICKETS","GALLERY","COUNTDOWN","SCHEDULE","COUPLE","VENUE","SPEAKERS","ABOUT","STORY","FAQ","DONATIONS","CTA","RSVP","REGISTRY"].includes(type) ? null : null}
    </div>
  );
}

// ── Phone mockup wireframe ─────────────────────────────────────────────────────
function PhonePreview({ template, accent, bg, heroImg }) {
  const sections = template.sections ?? [];

  return (
    <div
      style={{
        width: 160,
        flexShrink: 0,
        background: "#1a1b1f",
        borderRadius: 24,
        padding: "10px 8px",
        boxShadow: "0 32px 64px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.08)",
        border: "2px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Notch */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <div style={{ width: 40, height: 5, borderRadius: 99, background: "rgba(255,255,255,0.1)" }} />
      </div>

      {/* Screen */}
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          background: bg,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
          maxHeight: 420,
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        {sections.map((s, i) => (
          <SectionWireframe
            key={i}
            type={s.type}
            index={i}
            bg={bg}
            accent={accent}
            heroImg={heroImg}
            isHero={s.type === "HERO"}
          />
        ))}
      </div>

      {/* Home bar */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <div style={{ width: 48, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.12)" }} />
      </div>
    </div>
  );
}

// ── Section pill list ──────────────────────────────────────────────────────────
function SectionPills({ sections, accent }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {sections.map((s, i) => {
        const shape = SECTION_SHAPES[s.type];
        return (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              borderRadius: 99,
              padding: "3px 10px",
              background: `${accent}12`,
              border: `1px solid ${accent}25`,
              fontSize: 11,
              fontWeight: 600,
              color: accent,
            }}
          >
            {shape?.label ?? s.type}
          </div>
        );
      })}
    </div>
  );
}

// ── Premium Preview Modal ──────────────────────────────────────────────────────
function PreviewModal({ template, userPlan, onClose, onUse, onUpgrade }) {
  const meta       = STYLE_META[template.style] ?? STYLE_META.CLASSIC;
  const accent     = meta.preview.accent;
  const heroBg     = meta.preview.hero;
  const pageBg     = meta.preview.bg;
  const heroImg    = template.assets?.hero_image;
  const accessible = canAccessTemplate(template, userPlan);
  const colors     = template.design?.colors ?? {};

  // Determine dominant colors for display
  const paletteColors = [
    { label: "Background", value: colors.bg     ?? pageBg },
    { label: "Accent",     value: colors.accent  ?? accent },
    { label: "Dark",       value: colors.dark    ?? heroBg },
    { label: "Text",       value: colors.text    ?? "#1a1a1a" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full overflow-hidden rounded-3xl"
        style={{
          maxWidth: 820,
          maxHeight: "90vh",
          background: "#111215",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: `0 48px 120px rgba(0,0,0,0.95), 0 0 0 1px ${accent}18`,
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
        >
          <X size={14} />
        </button>

        {/* ── Top accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}00, ${accent}, ${accent}00)`, flexShrink: 0 }} />

        {/* ── Body */}
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

          {/* ── Left: phone preview */}
          <div
            style={{
              width: 220,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px 20px",
              background: `radial-gradient(ellipse at center, ${accent}10 0%, transparent 70%)`,
              borderRight: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <PhonePreview
              template={template}
              accent={accent}
              bg={pageBg}
              heroImg={heroImg}
            />
          </div>

          {/* ── Right: info */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Header */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {/* Style badge */}
                <span
                  style={{
                    fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em",
                    padding: "2px 8px", borderRadius: 99,
                    background: `${accent}18`, border: `1px solid ${accent}30`, color: accent,
                  }}
                >
                  {meta.icon} {meta.label}
                </span>
                {/* Tier badge */}
                {template.style === FREE_STYLE ? (
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", padding: "2px 8px", borderRadius: 99, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
                    Free
                  </span>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", padding: "2px 8px", borderRadius: 99, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
                    ✦ Premium
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 6 }}>
                {template.name}
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                {template.description}
              </p>
            </div>

            {/* Color palette */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
                Color Palette
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {paletteColors.map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: value,
                        border: "2px solid rgba(255,255,255,0.1)",
                        boxShadow: `0 4px 12px ${value}40`,
                      }}
                    />
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sections list */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
                {template.sections.length} Sections Included
              </p>
              <SectionPills sections={template.sections} accent={accent} />
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Style",     value: meta.label },
                { label: "Sections",  value: template.sections.length },
                { label: "Category",  value: template.category ?? "General" },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  flex: 1, padding: "10px 12px", borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* CTA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {accessible ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onUse}
                  style={{
                    padding: "13px 0", borderRadius: 14, border: "none",
                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                    color: "#fff", fontSize: 13, fontWeight: 800,
                    cursor: "pointer", letterSpacing: "0.02em",
                    boxShadow: `0 8px 28px ${accent}45`,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <Check size={14} /> Use This Template
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onUpgrade}
                  style={{
                    padding: "13px 0", borderRadius: 14, border: "none",
                    background: "linear-gradient(135deg,#F59E0B,#F97316)",
                    color: "#1c1407", fontSize: 13, fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 8px 28px rgba(245,158,11,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <Crown size={14} /> Unlock Premium · Use This Template
                </motion.button>
              )}
              <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                {accessible
                  ? "Applies to your event page instantly"
                  : "Unlock all " + ALL_TEMPLATES.filter(t => t.style !== FREE_STYLE).length + " premium templates"}
              </p>
            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Sidebar nav pill ──────────────────────────────────────────────────────────
function NavPill({ label, count, active, accent = "#818CF8", isFree = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-left transition-all"
      style={{
        background: active ? `${accent}18` : "transparent",
        border: active ? `1px solid ${accent}40` : "1px solid transparent",
      }}
    >
      <span
        className="h-2.5 w-2.5 rounded-full shrink-0 transition-all"
        style={{ background: active ? accent : "rgba(255,255,255,0.2)", boxShadow: active ? `0 0 8px ${accent}88` : "none" }}
      />
      <span className="flex-1 text-[12px] font-semibold transition-colors" style={{ color: active ? "#fff" : "rgba(255,255,255,0.45)" }}>
        {label}
      </span>
      {count != null && (
        <span
          className="text-[10px] font-bold rounded-full px-1.5 py-0.5 transition-all"
          style={{
            background: active ? `${accent}30` : "rgba(255,255,255,0.06)",
            color: active ? accent : "rgba(255,255,255,0.25)",
          }}
        >
          {count}
        </span>
      )}
      {isFree && (
        <span className="text-[8px] font-black uppercase tracking-wider rounded-full px-1.5 py-0.5"
          style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
          Free
        </span>
      )}
    </button>
  );
}

// ── Template Card ─────────────────────────────────────────────────────────────
function TemplateCard({ t, userPlan, applying, onSelect, onPreview }) {
  const accessible = canAccessTemplate(t, userPlan);
  const isApplying = applying === t.id;
  const meta       = STYLE_META[t.style] ?? STYLE_META.CLASSIC;
  const accent     = meta.preview.accent;
  const heroImg    = t.assets?.hero_image;
  const isFree     = t.style === FREE_STYLE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: meta.preview.bg,
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
      }}
      onClick={() => onPreview(t)}
    >
      {/* Hero image area */}
      <div className="relative overflow-hidden shrink-0" style={{ height: 180, background: meta.preview.hero }}>
        {heroImg && (
          <img
            src={heroImg}
            alt={t.name}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.22) 55%, transparent 100%)" }}
        />

        {!accessible && (
          <div className="absolute inset-0 flex items-end pb-3 justify-center" style={{ background: "rgba(0,0,0,0.28)" }}>
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm"
              style={{ background: "rgba(245,158,11,0.9)", color: "#1c1407" }}>
              <Lock size={9} /> Premium Only
            </div>
          </div>
        )}

        {/* Free / tier badge */}
        <div className="absolute top-2.5 left-2.5">
          {isFree ? (
            <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide"
              style={{ background: "rgba(16,185,129,0.9)", color: "#fff" }}>Free</span>
          ) : (
            <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide"
              style={{ background: "rgba(245,158,11,0.9)", color: "#1c1407" }}>✦ Pro</span>
          )}
        </div>

        {/* Preview + Use overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.45)" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(t); }}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-sm transition hover:scale-105"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <Eye size={10} /> Preview
          </button>
          {accessible ? (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(t); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold transition hover:scale-105"
              style={{ background: accent, color: "#fff" }}
            >
              <Check size={10} /> Use
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(t); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold transition hover:scale-105"
              style={{ background: "#F59E0B", color: "#1c1407" }}
            >
              <Lock size={10} /> Unlock
            </button>
          )}
        </div>

        {/* Section count badges bottom-right */}
        <div className="absolute bottom-2.5 right-2.5 flex gap-1 flex-wrap justify-end">
          {t.sections.slice(0, 3).map((s, i) => {
            const shape = SECTION_SHAPES[s.type];
            return (
              <span key={i} className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
                style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)" }}>
                {shape?.label ?? s.type}
              </span>
            );
          })}
          {t.sections.length > 3 && (
            <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
              style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.5)" }}>
              +{t.sections.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-1.5" style={{ background: "#18191e" }}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[12px] font-bold text-white leading-tight truncate">{t.name}</h3>
          <span className="text-[9px] font-bold uppercase tracking-wide shrink-0" style={{ color: accent }}>
            {meta.icon} {meta.label}
          </span>
        </div>

        {/* Color dots */}
        <div className="flex items-center gap-1.5">
          {Object.values(t.design?.colors ?? {}).slice(0, 4).map((hex, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: hex, border: "1px solid rgba(255,255,255,0.12)" }} />
          ))}
        </div>
      </div>

      {/* Card footer */}
      <div className="px-3 py-2 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
          {t.sections.length} sections · {meta.description}
        </p>
        <div className="h-2 w-2 rounded-full shrink-0 ml-2" style={{ background: accent }} />
      </div>

      {/* Applying overlay */}
      {isApplying && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="text-[10px] font-bold text-white">Applying…</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TemplatePicker({ eventId, isOpen, onClose, eventType }) {
  const { plan, isSubscribed, openUpgradeModal } = useSubscriptionStore();
  const { applyPreset } = useBuilderStore();

  const categoryKey  = useMemo(() => getCategoryForType(eventType), [eventType]);
  const hasEventType = Boolean(eventType);

  const defaultFilter = hasEventType ? "FOR_YOU" : "ALL";
  const [activeFilter, setActiveFilter] = useState(defaultFilter);
  const [applying,     setApplying]     = useState(null);
  const [preview,      setPreview]      = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    setActiveFilter(hasEventType ? "FOR_YOU" : "ALL");
  }, [eventType, hasEventType]);

  const userPlan  = isSubscribed ? plan : "free";
  const isPremium = userPlan === "premium";

  const forYouTemplates = useMemo(
    () => (hasEventType ? getTemplatesForEventType(eventType) : ALL_TEMPLATES),
    [eventType, hasEventType]
  );

  const exactMatchTemplates = useMemo(() => {
    if (!eventType) return [];
    const t = String(eventType).toLowerCase().trim();
    return ALL_TEMPLATES.filter((tmpl) => tmpl.eventTypes?.includes(t));
  }, [eventType]);

  const countByCategory = useMemo(() => {
    const m = {};
    for (const t of ALL_TEMPLATES) { const c = t.category ?? "OTHER"; m[c] = (m[c] ?? 0) + 1; }
    return m;
  }, []);

  const countByStyle = useMemo(() => {
    const m = {};
    for (const t of ALL_TEMPLATES) m[t.style] = (m[t.style] ?? 0) + 1;
    return m;
  }, []);

  const filteredTemplates = useMemo(() => {
    if (activeFilter === "FOR_YOU") return forYouTemplates;
    if (activeFilter === "ALL")     return ALL_TEMPLATES;
    if (CATEGORY_ORDER.includes(activeFilter)) return ALL_TEMPLATES.filter((t) => t.category === activeFilter);
    if (STYLE_ORDER.includes(activeFilter))    return ALL_TEMPLATES.filter((t) => t.style    === activeFilter);
    return ALL_TEMPLATES;
  }, [activeFilter, forYouTemplates]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeFilter]);

  const handleSelect = async (t) => {
    if (!canAccessTemplate(t, userPlan)) { openUpgradeModal(t.name); return; }
    setApplying(t.id);
    const sections = t.sections.map((s) => {
      const config = { ...(s.config ?? {}) };
      if (s.type === "HERO"    && t.assets?.hero_image)             config.background_image = t.assets.hero_image;
      if (s.type === "GALLERY" && t.assets?.gallery_images?.length) config.images            = t.assets.gallery_images;
      return { type: s.type, config };
    });
    await applyPreset(eventId, sections);
    setApplying(null);
    setPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  const cardProps     = { userPlan, applying, onSelect: handleSelect, onPreview: setPreview };
  const eventTypeName = formatEventTypeName(eventType);

  const mobilePills = [
    ...(hasEventType ? [{ id: "FOR_YOU", label: `For You (${forYouTemplates.length})` }] : []),
    { id: "ALL",      label: `All (${ALL_TEMPLATES.length})` },
    ...CATEGORY_ORDER.filter((c) => countByCategory[c]).map((c) => ({
      id: c, label: TEMPLATE_CATEGORIES[c]?.label ?? c,
    })),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/90 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-4 sm:inset-6 z-[9991] flex flex-col rounded-3xl overflow-hidden"
            style={{ background: "#0e0f11", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 40px 120px rgba(0,0,0,0.95)" }}
          >
            {/* ── Header ── */}
            <div className="flex shrink-0 items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.25)" }}>
                  <Layout size={14} style={{ color: "#818CF8" }} />
                </div>
                <div>
                  <h2 className="text-[14px] font-black text-white">
                    {hasEventType ? `Templates for ${eventTypeName}` : "Templates"}
                  </h2>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {hasEventType
                      ? `${exactMatchTemplates.length} exact match · ${ALL_TEMPLATES.length} total`
                      : `${ALL_TEMPLATES.filter((t) => t.style === FREE_STYLE).length} free · ${ALL_TEMPLATES.filter((t) => t.style !== FREE_STYLE).length} premium`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isPremium && (
                  <button
                    onClick={() => openUpgradeModal("templates")}
                    className="hidden sm:flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97]"
                    style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", color: "#1c1407" }}
                  >
                    <Crown size={11} /> Go Premium
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.background = "transparent"; }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Body: sidebar + grid ── */}
            <div className="flex flex-1 min-h-0">

              {/* Sidebar (desktop only) */}
              <aside
                className="hidden sm:flex flex-col gap-0.5 shrink-0 overflow-y-auto p-3"
                style={{ width: 200, borderRight: "1px solid rgba(255,255,255,0.05)" }}
              >
                {hasEventType && (
                  <>
                    <p className="px-3 pt-1 pb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.2)" }}>Recommended</p>
                    <NavPill label={`For ${eventTypeName}`} count={forYouTemplates.length} active={activeFilter === "FOR_YOU"} accent="#818CF8" onClick={() => setActiveFilter("FOR_YOU")} />
                    <div className="my-2 mx-3 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                  </>
                )}

                <p className="px-3 pt-1 pb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.2)" }}>Browse All</p>
                <NavPill label="All Templates" count={ALL_TEMPLATES.length} active={activeFilter === "ALL"} accent="#818CF8" onClick={() => setActiveFilter("ALL")} />

                <div className="my-2 mx-3 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                <p className="px-3 pb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.2)" }}>By Category</p>
                {CATEGORY_ORDER.filter((c) => countByCategory[c]).map((c) => (
                  <NavPill key={c} label={`${TEMPLATE_CATEGORIES[c]?.emoji} ${TEMPLATE_CATEGORIES[c]?.label}`} count={countByCategory[c]} active={activeFilter === c} accent="#818CF8" onClick={() => setActiveFilter(c)} />
                ))}

                <div className="my-2 mx-3 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                <p className="px-3 pb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.2)" }}>By Style</p>
                {STYLE_ORDER.filter((s) => countByStyle[s]).map((s) => {
                  const m = STYLE_META[s];
                  return (
                    <NavPill key={s} label={`${m.icon} ${m.label}`} count={countByStyle[s]} active={activeFilter === s} accent={m.preview.accent} isFree={s === FREE_STYLE} onClick={() => setActiveFilter(s)} />
                  );
                })}
              </aside>

              {/* Grid area */}
              <div ref={bodyRef} className="flex-1 overflow-y-auto">

                {/* Mobile pills */}
                <div className="sm:hidden flex gap-2 overflow-x-auto p-3 pb-0" style={{ scrollbarWidth: "none" }}>
                  {mobilePills.map((p) => (
                    <button key={p.id} onClick={() => setActiveFilter(p.id)}
                      className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all"
                      style={{
                        background: activeFilter === p.id ? "#818CF8" : "rgba(255,255,255,0.07)",
                        color: activeFilter === p.id ? "#fff" : "rgba(255,255,255,0.45)",
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Premium upgrade banner */}
                {!isPremium && (
                  <div className="mx-4 sm:mx-5 mt-4 mb-0">
                    <button
                      onClick={() => openUpgradeModal("templates")}
                      className="group w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all hover:scale-[1.01]"
                      style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.1),rgba(249,115,22,0.06))", border: "1px solid rgba(245,158,11,0.2)" }}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(245,158,11,0.15)" }}>
                        <Sparkles size={16} style={{ color: "#F59E0B" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black text-white">Unlock all premium templates</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {ALL_TEMPLATES.filter((t) => t.style !== FREE_STYLE).length} premium designs — upgrade once, use forever
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-all group-hover:scale-105"
                        style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", color: "#1c1407" }}>
                        <Zap size={10} /> Upgrade <ArrowRight size={10} />
                      </div>
                    </button>
                  </div>
                )}

                {/* Template grid */}
                <div className="px-4 sm:px-5 py-5 pb-6">
                  {/* Filter header */}
                  {(STYLE_ORDER.includes(activeFilter) || CATEGORY_ORDER.includes(activeFilter)) && (
                    <div className="flex items-center gap-3 mb-4">
                      {STYLE_ORDER.includes(activeFilter) ? (
                        <>
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: STYLE_META[activeFilter]?.preview?.accent ?? "#888", boxShadow: `0 0 8px ${STYLE_META[activeFilter]?.preview?.accent ?? "#888"}88` }} />
                          <span className="text-[12px] font-bold text-white">{STYLE_META[activeFilter]?.label} Style</span>
                          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{STYLE_META[activeFilter]?.description}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-base">{TEMPLATE_CATEGORIES[activeFilter]?.emoji}</span>
                          <span className="text-[12px] font-bold text-white">{TEMPLATE_CATEGORIES[activeFilter]?.label}</span>
                        </>
                      )}
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{filteredTemplates.length} templates</span>
                    </div>
                  )}

                  {filteredTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>No templates in this category yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                      {filteredTemplates.map((t) => (
                        <TemplateCard key={t.id} t={t} {...cardProps} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Preview modal */}
          <AnimatePresence>
            {preview && (
              <PreviewModal
                key="preview"
                template={preview}
                userPlan={userPlan}
                onClose={() => setPreview(null)}
                onUse={() => { setPreview(null); handleSelect(preview); }}
                onUpgrade={() => { setPreview(null); openUpgradeModal(preview.name); }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
