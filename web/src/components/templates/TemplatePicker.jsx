"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, Lock, Check, Sparkles, Crown, Star, ArrowRight, Zap, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { STYLE_TEMPLATES, canAccessTemplate, FREE_STYLE } from "@/lib/styleTemplates";
import { STYLE_META } from "@/lib/styleThemes";
import { useSubscriptionStore } from "@/store/subscription.store";
import { useBuilderStore } from "@/store/builder.store";

// ── Data ──────────────────────────────────────────────────────────────────────
const UNIQUE_TEMPLATES = Array.from(
  new Map(STYLE_TEMPLATES.map((t) => [t.id, t])).values()
);

const STYLE_ORDER = ["CLASSIC", "ELEGANT", "MODERN", "MINIMAL", "LUXURY", "FUN"];

// Event types from the Ticketed & Entertainment category
const ENTERTAINMENT_EVENT_TYPES = new Set([
  "CONCERT", "FESTIVAL", "LIVE_SHOW", "NIGHTCLUB", "THEATER",
  "COMEDY", "SPORTS", "EXHIBITION",
]);

// Styles appropriate for entertainment/ticket events (no wedding imagery)
const ENTERTAINMENT_STYLES = ["MODERN", "MINIMAL", "LUXURY", "FUN"];

function isEntertainmentType(eventType) {
  if (!eventType) return false;
  return ENTERTAINMENT_EVENT_TYPES.has(String(eventType).toUpperCase().trim());
}

const RECOMMENDED_STYLES = {
  WEDDING:         ["CLASSIC", "ELEGANT", "LUXURY"],
  ENGAGEMENT:      ["ELEGANT", "CLASSIC", "LUXURY"],
  BIRTHDAY:        ["FUN", "ELEGANT", "CLASSIC"],
  ANNIVERSARY:     ["ELEGANT", "CLASSIC"],
  BABY_SHOWER:     ["FUN", "ELEGANT"],
  GENDER_REVEAL:   ["FUN", "MODERN"],
  GRADUATION:      ["CLASSIC", "MODERN"],
  FUNERAL:         ["MINIMAL", "CLASSIC"],
  PRIVATE_PARTY:   ["FUN", "MODERN"],
  FAMILY_REUNION:  ["CLASSIC", "FUN"],
  MEETING:         ["MINIMAL", "MODERN"],
  CONFERENCE:      ["MODERN", "MINIMAL"],
  SEMINAR:         ["MODERN", "MINIMAL"],
  WORKSHOP:        ["MODERN", "CLASSIC"],
  NETWORKING:      ["MODERN", "ELEGANT"],
  PRODUCT_LAUNCH:  ["MODERN", "LUXURY"],
  COMPANY_PARTY:   ["FUN", "MODERN"],
  TRAINING:        ["MINIMAL", "MODERN"],
  CONCERT:         ["LUXURY", "FUN", "MODERN"],
  FESTIVAL:        ["FUN", "MODERN"],
  LIVE_SHOW:       ["MODERN", "LUXURY"],
  NIGHTCLUB:       ["LUXURY", "MODERN"],
  THEATER:         ["ELEGANT", "LUXURY"],
  COMEDY:          ["FUN", "MODERN"],
  SPORTS:          ["MODERN", "FUN"],
  EXHIBITION:      ["MINIMAL", "MODERN"],
  CHURCH:          ["CLASSIC", "ELEGANT"],
  CORPORATE_EVENT: ["MODERN", "MINIMAL"],
  OTHER:           ["CLASSIC", "MODERN"],
};

function getRecommendedStyleKeys(eventType) {
  if (!eventType) return null;
  return RECOMMENDED_STYLES[String(eventType).toUpperCase().trim()] ?? null;
}

// ── Large immersive template card ─────────────────────────────────────────────
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
      onClick={() => onSelect(t)}
    >
      {/* Hero image area */}
      <div
        className="relative overflow-hidden shrink-0"
        style={{ height: 180, background: meta.preview.hero }}
      >
        {heroImg && (
          <img
            src={heroImg}
            alt={t.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}
        {/* Cinematic overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.22) 55%, transparent 100%)" }}
        />

        {/* Lock overlay for premium */}
        {!accessible && (
          <div className="absolute inset-0 flex items-end pb-3 justify-center" style={{ background: "rgba(0,0,0,0.28)" }}>
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm"
              style={{ background: "rgba(245,158,11,0.9)", color: "#1c1407" }}
            >
              <Lock size={9} /> Premium Only
            </div>
          </div>
        )}

        {/* Tier badge */}
        <div className="absolute top-2.5 left-2.5">
          {isFree ? (
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: "rgba(16,185,129,0.92)", color: "#fff", backdropFilter: "blur(6px)" }}
            >
              Free
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: "rgba(245,158,11,0.92)", color: "#1c1407", backdropFilter: "blur(6px)" }}
            >
              <Crown size={8} /> Pro
            </span>
          )}
        </div>

        {/* Applying spinner */}
        {isApplying && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
            <span className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
        )}

        {/* Bottom hero text */}
        <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5" style={{ color: accent, opacity: 0.9 }}>
            {meta.label}
          </p>
          <h3 className="text-[14px] font-bold text-white leading-snug">{t.name}</h3>
        </div>

        {/* Hover actions */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(t); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white backdrop-blur-sm transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <Eye size={11} /> Preview
          </button>
          {accessible ? (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(t); }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all hover:scale-105"
              style={{ background: accent, color: "#fff", border: `1px solid ${accent}` }}
            >
              <Check size={11} /> Use
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(t); }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all hover:scale-105"
              style={{ background: "#F59E0B", color: "#1c1407" }}
            >
              <Lock size={11} /> Unlock
            </button>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid rgba(0,0,0,0.06)` }}>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] leading-relaxed truncate" style={{ color: "rgba(0,0,0,0.45)" }}>
            {t.sections.length} sections · {meta.description}
          </p>
        </div>
        <div className="h-2 w-2 rounded-full shrink-0 ml-2" style={{ background: accent }} />
      </div>
    </motion.div>
  );
}

// ── Cinematic full-screen preview ─────────────────────────────────────────────
function PreviewModal({ template, userPlan, onClose, onUse, onUpgrade }) {
  const meta    = STYLE_META[template.style] ?? STYLE_META.CLASSIC;
  const accent  = meta.preview.accent;
  const heroImg = template.assets?.hero_image;
  const accessible = canAccessTemplate(template, userPlan);
  const colors  = template.design?.colors ?? {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", boxShadow: `0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px ${accent}22` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <X size={15} />
        </button>

        {/* Hero */}
        <div className="relative" style={{ height: "clamp(200px,40vw,320px)", background: meta.preview.hero }}>
          {heroImg && (
            <img src={heroImg} alt={template.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #111 0%, rgba(0,0,0,0.5) 50%, transparent 100%)" }} />

          {/* Color swatches */}
          <div className="absolute top-4 left-4 flex gap-1.5">
            {Object.entries(colors).map(([name, hex]) => (
              <div
                key={name}
                title={name}
                className="h-5 w-5 rounded-full border-2 border-white/20"
                style={{ background: hex }}
              />
            ))}
          </div>

          {/* Tier */}
          <div className="absolute top-4 right-14">
            {template.style === FREE_STYLE ? (
              <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider" style={{ background: "rgba(16,185,129,0.9)", color: "#fff" }}>Free</span>
            ) : (
              <span className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider" style={{ background: "rgba(245,158,11,0.9)", color: "#1c1407" }}>
                <Crown size={9} /> Premium
              </span>
            )}
          </div>

          {/* Template name */}
          <div className="absolute bottom-5 left-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: accent }}>{meta.label}</p>
            <h2 className="text-2xl font-bold text-white leading-tight">{template.name}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-[13px] leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
            {template.description}
          </p>

          {/* Section pills */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {template.sections.map((s, i) => (
              <span
                key={i}
                className="rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
              >
                {s.type}
              </span>
            ))}
          </div>

          {/* Footer meta + CTA */}
          <div className="flex items-center justify-between gap-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                {template.design?.fonts?.heading ?? "System font"} · {template.sections.length} sections
              </p>
            </div>

            {accessible ? (
              <button
                onClick={onUse}
                className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[13px] font-bold transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: accent, color: "#fff", boxShadow: `0 8px 24px ${accent}55` }}
              >
                <Check size={14} /> Use This Template
              </button>
            ) : (
              <button
                onClick={onUpgrade}
                className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-[13px] font-bold transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", color: "#1c1407", boxShadow: "0 8px 24px rgba(245,158,11,0.4)" }}
              >
                <Crown size={14} /> Unlock Premium
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Style sidebar pill ────────────────────────────────────────────────────────
function StylePill({ styleKey, active, count, onClick }) {
  const meta   = STYLE_META[styleKey];
  const accent = meta?.preview?.accent ?? "#888";
  const isFree = styleKey === FREE_STYLE;

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
      <span
        className="flex-1 text-[12px] font-semibold transition-colors"
        style={{ color: active ? "#fff" : "rgba(255,255,255,0.45)" }}
      >
        {meta?.label ?? styleKey}
      </span>
      <span
        className="text-[10px] font-bold rounded-full px-1.5 py-0.5 transition-all"
        style={{
          background: active ? `${accent}30` : "rgba(255,255,255,0.06)",
          color: active ? accent : "rgba(255,255,255,0.25)",
        }}
      >
        {count}
      </span>
      {isFree && (
        <span className="text-[8px] font-black uppercase tracking-wider rounded-full px-1.5 py-0.5"
          style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
          Free
        </span>
      )}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TemplatePicker({ eventId, isOpen, onClose, eventType }) {
  const { plan, isSubscribed, openUpgradeModal } = useSubscriptionStore();
  const { applyPreset } = useBuilderStore();

  const isEntertainment = isEntertainmentType(eventType);

  // For entertainment events default to "RECOMMENDED"; otherwise "ALL"
  const [activeStyle, setActiveStyle] = useState(isEntertainment ? "RECOMMENDED" : "ALL");
  const [applying,    setApplying]    = useState(null);
  const [preview,     setPreview]     = useState(null);
  const bodyRef = useRef(null);

  // Reset active style when event type changes
  useEffect(() => {
    setActiveStyle(isEntertainment ? "RECOMMENDED" : "ALL");
  }, [isEntertainment]);

  const userPlan  = isSubscribed ? plan : "free";
  const isPremium = userPlan === "premium";

  const recStyleKeys = useMemo(() => getRecommendedStyleKeys(eventType), [eventType]);

  // For entertainment events, scope ALL templates to non-wedding styles only
  const scopedTemplates = useMemo(() =>
    isEntertainment
      ? UNIQUE_TEMPLATES.filter((t) => ENTERTAINMENT_STYLES.includes(t.style))
      : UNIQUE_TEMPLATES,
  [isEntertainment]);

  // Only show style pills that are relevant for the current event scope
  const visibleStyleOrder = isEntertainment ? ENTERTAINMENT_STYLES : STYLE_ORDER;

  // Template list for each style (based on scoped set)
  const countByStyle = useMemo(() => {
    const m = {};
    for (const t of scopedTemplates) m[t.style] = (m[t.style] ?? 0) + 1;
    return m;
  }, [scopedTemplates]);

  const filteredTemplates = useMemo(() => {
    if (activeStyle === "ALL")         return scopedTemplates;
    if (activeStyle === "RECOMMENDED") {
      if (!recStyleKeys) return scopedTemplates.filter((t) => t.style === FREE_STYLE);
      return scopedTemplates.filter((t) => recStyleKeys.includes(t.style));
    }
    return scopedTemplates.filter((t) => t.style === activeStyle);
  }, [activeStyle, recStyleKeys, scopedTemplates]);

  // Scroll to top when filter changes
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeStyle]);

  const handleSelect = async (t) => {
    if (!canAccessTemplate(t, userPlan)) { openUpgradeModal(t.name); return; }
    setApplying(t.id);
    const sections = t.sections.map((s) => {
      const config = { ...(s.config ?? {}) };
      if (s.type === "HERO"    && t.assets?.hero_image)             config.background_image = t.assets.hero_image;
      if (s.type === "GALLERY" && t.assets?.gallery_images?.length) config.images = t.assets.gallery_images;
      return { type: s.type, config };
    });
    await applyPreset(eventId, sections);
    setApplying(null);
    setPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  const cardProps = { userPlan, applying, onSelect: handleSelect, onPreview: setPreview };

  const sidebarItems = [
    ...(recStyleKeys ? [{ key: "RECOMMENDED", label: "For You", count: scopedTemplates.filter((t) => recStyleKeys.includes(t.style)).length }] : []),
    { key: "ALL", label: isEntertainment ? "All Event Templates" : "All Templates", count: scopedTemplates.length },
    ...visibleStyleOrder.map((s) => ({ key: s, label: STYLE_META[s]?.label ?? s, count: countByStyle[s] ?? 0 })),
  ];

  // Featured (hero-image templates, scoped to current event type)
  const featured = scopedTemplates.filter((t) => t.assets?.hero_image).slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="tp-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] bg-black/85 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* ── Modal shell ── */}
          <motion.div
            key="tp-shell"
            initial={{ opacity: 0, scale: 0.97, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9001] flex items-end sm:items-center justify-center sm:p-5 pointer-events-none"
          >
            <div
              className="pointer-events-auto relative w-full flex flex-col overflow-hidden"
              style={{
                maxWidth: 1080,
                height: "clamp(500px, 92dvh, 92dvh)",
                background: "#0c0c10",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "24px 24px 0 0",
                boxShadow: "0 48px 120px rgba(0,0,0,0.95)",
              }}
            >
              {/* sm+: full rounded */}
              <style>{`@media(min-width:640px){.tp-shell{border-radius:20px!important}}`}</style>
              <div className="tp-shell absolute inset-0 pointer-events-none" style={{ borderRadius: "24px 24px 0 0", border: "inherit" }} />

              {/* Drag handle mobile */}
              <div className="sm:hidden flex justify-center pt-3 shrink-0">
                <div className="h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
              </div>

              {/* ── Top bar ── */}
              <div
                className="flex items-center justify-between px-5 sm:px-6 py-4 shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}
                  >
                    <Sparkles size={15} style={{ color: "#818CF8" }} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-white leading-none">
                      {isEntertainment ? "Event Templates" : "Templates"}
                    </h2>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {isEntertainment
                        ? `${scopedTemplates.length} templates for ${eventType?.toLowerCase() ?? "your event"}`
                        : `${UNIQUE_TEMPLATES.filter(t => t.style === FREE_STYLE).length} free · ${UNIQUE_TEMPLATES.filter(t => t.style !== FREE_STYLE).length} premium`}
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

                {/* Sidebar (desktop) */}
                <aside
                  className="hidden sm:flex flex-col gap-0.5 shrink-0 overflow-y-auto p-3"
                  style={{ width: 188, borderRight: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <p className="px-3 pt-1 pb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Style
                  </p>

                  {/* ALL + RECOMMENDED */}
                  {recStyleKeys && (
                    <StylePill
                      styleKey="RECOMMENDED"
                      active={activeStyle === "RECOMMENDED"}
                      count={UNIQUE_TEMPLATES.filter(t => recStyleKeys.includes(t.style)).length}
                      onClick={() => setActiveStyle("RECOMMENDED")}
                    />
                  )}
                  <button
                    onClick={() => setActiveStyle("ALL")}
                    className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-left transition-all mb-2"
                    style={{
                      background: activeStyle === "ALL" ? "rgba(99,102,241,0.15)" : "transparent",
                      border: activeStyle === "ALL" ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                    }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: activeStyle === "ALL" ? "#818CF8" : "rgba(255,255,255,0.2)" }} />
                    <span className="flex-1 text-[12px] font-semibold" style={{ color: activeStyle === "ALL" ? "#fff" : "rgba(255,255,255,0.45)" }}>All</span>
                    <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: activeStyle === "ALL" ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)", color: activeStyle === "ALL" ? "#818CF8" : "rgba(255,255,255,0.25)" }}>
                      {UNIQUE_TEMPLATES.length}
                    </span>
                  </button>

                  <div className="mb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

                  {visibleStyleOrder.map((s) => (
                    <StylePill
                      key={s}
                      styleKey={s}
                      active={activeStyle === s}
                      count={countByStyle[s] ?? 0}
                      onClick={() => setActiveStyle(s)}
                    />
                  ))}

                  {/* Upgrade CTA in sidebar */}
                  {!isPremium && (
                    <button
                      onClick={() => openUpgradeModal("templates")}
                      className="mt-auto mx-1 flex flex-col gap-1.5 rounded-2xl p-3 text-left transition-all hover:scale-[1.02]"
                      style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", marginTop: 16 }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Zap size={11} style={{ color: "#F59E0B" }} />
                        <span className="text-[11px] font-black text-white">Go Premium</span>
                      </div>
                      <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {isEntertainment
                          ? `Unlock ${scopedTemplates.filter(t => t.style !== FREE_STYLE).length} premium event templates.`
                          : `Unlock all 5 premium styles & ${UNIQUE_TEMPLATES.filter(t => t.style !== FREE_STYLE).length} templates.`}
                      </p>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg self-start" style={{ background: "#F59E0B", color: "#1c1407" }}>$12/mo</span>
                    </button>
                  )}
                </aside>

                {/* ── Mobile top filter pills ── */}
                <div className="sm:hidden absolute top-[57px] left-0 right-0 z-10 flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "#0c0c10" }}>
                  {[
                    ...(recStyleKeys ? [{ key: "RECOMMENDED", label: "For You" }] : []),
                    { key: "ALL", label: isEntertainment ? "All" : "All" },
                    ...visibleStyleOrder.map((s) => ({ key: s, label: STYLE_META[s]?.label ?? s })),
                  ].map(({ key, label }) => {
                    const isActive = activeStyle === key;
                    const meta = STYLE_META[key];
                    const accent = meta?.preview?.accent ?? "#818CF8";
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveStyle(key)}
                        className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all"
                        style={{
                          background: isActive ? `${accent}22` : "rgba(255,255,255,0.05)",
                          color:      isActive ? "#fff" : "rgba(255,255,255,0.4)",
                          border:     isActive ? `1px solid ${accent}50` : "1px solid transparent",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Main grid */}
                <div
                  ref={bodyRef}
                  className="flex-1 overflow-y-auto overscroll-contain"
                  style={{ paddingTop: "0" }}
                >
                  <div className="sm:hidden h-10" /> {/* mobile filter offset */}

                  {/* Featured banner — only on "ALL" or "RECOMMENDED" */}
                  {(activeStyle === "ALL" || activeStyle === "RECOMMENDED") && featured.length > 0 && (
                    <div className="px-4 sm:px-5 pt-5 mb-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                        ✦ Featured
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {featured.map((t) => {
                          const m      = STYLE_META[t.style] ?? STYLE_META.CLASSIC;
                          const acc    = m.preview.accent;
                          const free   = t.style === FREE_STYLE;
                          const locked = !canAccessTemplate(t, userPlan);
                          return (
                            <div
                              key={`feat-${t.id}`}
                              className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                              style={{
                                height: 130,
                                background: m.preview.hero,
                                border: `1px solid ${acc}25`,
                                boxShadow: `0 4px 24px rgba(0,0,0,0.5)`,
                              }}
                              onClick={() => handleSelect(t)}
                            >
                              {t.assets?.hero_image && (
                                <img src={t.assets.hero_image} alt={t.name} className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                              )}
                              <div className="absolute inset-0" style={{ background: "linear-gradient(120deg,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.3) 100%)" }} />

                              <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
                                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: free ? "rgba(16,185,129,0.9)" : "rgba(245,158,11,0.9)", color: free ? "#fff" : "#1c1407" }}>
                                  {free ? "Free" : "Pro"}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: acc }}>{m.label}</span>
                              </div>

                              <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="text-[13px] font-bold text-white leading-tight">{t.name}</h3>
                                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{t.sections.length} sections</p>
                              </div>

                              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.4)" }}>
                                <button onClick={(e) => { e.stopPropagation(); setPreview(t); }} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.15)" }}>
                                  <Eye size={10} /> Preview
                                </button>
                                {locked ? (
                                  <button onClick={(e) => { e.stopPropagation(); openUpgradeModal(t.name); }} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold" style={{ background: "#F59E0B", color: "#1c1407" }}>
                                    <Lock size={10} /> Unlock
                                  </button>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); handleSelect(t); }} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white" style={{ background: acc }}>
                                    <Check size={10} /> Use
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Premium upgrade strip for free users */}
                  {!isPremium && activeStyle !== FREE_STYLE && (
                    <div className="px-4 sm:px-5 mb-5">
                      <button
                        onClick={() => openUpgradeModal("templates")}
                        className="group w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.1),rgba(249,115,22,0.07))", border: "1px solid rgba(245,158,11,0.22)" }}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(245,158,11,0.15)" }}>
                          <Crown size={18} style={{ color: "#F59E0B" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black text-white">Unlock {UNIQUE_TEMPLATES.filter(t => t.style !== FREE_STYLE).length} Premium Templates</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                            {isEntertainment
                              ? "Modern, Minimal, Luxury & Fun — premium event styles."
                              : "Elegant, Modern, Minimal, Luxury & Fun — all styles included."}
                          </p>
                        </div>
                        <div
                          className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-all group-hover:scale-105"
                          style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", color: "#1c1407" }}
                        >
                          <Zap size={10} /> Upgrade
                          <ArrowRight size={10} />
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Template grid */}
                  <div className="px-4 sm:px-5 pb-6">
                    {/* Section label */}
                    {activeStyle !== "ALL" && activeStyle !== "RECOMMENDED" && (
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: STYLE_META[activeStyle]?.preview?.accent ?? "#888", boxShadow: `0 0 8px ${STYLE_META[activeStyle]?.preview?.accent ?? "#888"}88` }}
                        />
                        <span className="text-[12px] font-bold text-white">{STYLE_META[activeStyle]?.label} Style</span>
                        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{STYLE_META[activeStyle]?.description}</span>
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{filteredTemplates.length} templates</span>
                      </div>
                    )}

                    {filteredTemplates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>No templates in this style yet.</p>
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
            </div>
          </motion.div>

          {/* ── Preview modal ── */}
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
