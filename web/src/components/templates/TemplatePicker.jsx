"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X, Lock, Check, Sparkles, Crown, ArrowRight, Zap, Eye } from "lucide-react";
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

const STYLE_ORDER = ["CLASSIC", "ELEGANT", "MODERN", "MINIMAL", "LUXURY", "FUN"];
const CATEGORY_ORDER = ["SOCIAL", "CORPORATE", "ENTERTAINMENT", "LIFE", "RELIGIOUS"];

function formatEventTypeName(type) {
  if (!type) return "Your Event";
  return String(type)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.22) 55%, transparent 100%)" }}
        />

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

        {isApplying && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
            <span className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5" style={{ color: accent, opacity: 0.9 }}>
            {meta.label}
          </p>
          <h3 className="text-[14px] font-bold text-white leading-snug">{t.name}</h3>
        </div>

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

// ── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ template, userPlan, onClose, onUse, onUpgrade }) {
  const meta      = STYLE_META[template.style] ?? STYLE_META.CLASSIC;
  const accent    = meta.preview.accent;
  const heroImg   = template.assets?.hero_image;
  const accessible = canAccessTemplate(template, userPlan);
  const colors    = template.design?.colors ?? {};

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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <X size={15} />
        </button>

        <div className="relative" style={{ height: "clamp(200px,40vw,320px)", background: meta.preview.hero }}>
          {heroImg && <img src={heroImg} alt={template.name} className="w-full h-full object-cover" />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #111 0%, rgba(0,0,0,0.5) 50%, transparent 100%)" }} />

          <div className="absolute top-4 left-4 flex gap-1.5">
            {Object.entries(colors).map(([name, hex]) => (
              <div key={name} title={name} className="h-5 w-5 rounded-full border-2 border-white/20" style={{ background: hex }} />
            ))}
          </div>

          <div className="absolute top-4 right-14">
            {template.style === FREE_STYLE ? (
              <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider" style={{ background: "rgba(16,185,129,0.9)", color: "#fff" }}>Free</span>
            ) : (
              <span className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider" style={{ background: "rgba(245,158,11,0.9)", color: "#1c1407" }}>
                <Crown size={9} /> Premium
              </span>
            )}
          </div>

          <div className="absolute bottom-5 left-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: accent }}>{meta.label}</p>
            <h2 className="text-2xl font-bold text-white leading-tight">{template.name}</h2>
          </div>
        </div>

        <div className="p-6">
          <p className="text-[13px] leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
            {template.description}
          </p>

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

          <div className="flex items-center justify-between gap-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              {template.design?.fonts?.heading ?? "System font"} · {template.sections.length} sections
            </p>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TemplatePicker({ eventId, isOpen, onClose, eventType }) {
  const { plan, isSubscribed, openUpgradeModal } = useSubscriptionStore();
  const { applyPreset } = useBuilderStore();

  const categoryKey = useMemo(() => getCategoryForType(eventType), [eventType]);
  const hasEventType = Boolean(eventType);

  const defaultFilter = hasEventType ? "FOR_YOU" : "ALL";
  const [activeFilter, setActiveFilter] = useState(defaultFilter);
  const [applying, setApplying] = useState(null);
  const [preview,  setPreview]  = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    setActiveFilter(hasEventType ? "FOR_YOU" : "ALL");
  }, [eventType, hasEventType]);

  const userPlan  = isSubscribed ? plan : "free";
  const isPremium = userPlan === "premium";

  // Templates sorted by relevance for this event type
  const forYouTemplates = useMemo(
    () => (hasEventType ? getTemplatesForEventType(eventType) : ALL_TEMPLATES),
    [eventType, hasEventType]
  );

  // Exact-match templates (same eventTypes[])
  const exactMatchTemplates = useMemo(() => {
    if (!eventType) return [];
    const t = String(eventType).toLowerCase().trim();
    return ALL_TEMPLATES.filter((tmpl) => tmpl.eventTypes?.includes(t));
  }, [eventType]);

  // Count by category
  const countByCategory = useMemo(() => {
    const m = {};
    for (const t of ALL_TEMPLATES) {
      const c = t.category ?? "OTHER";
      m[c] = (m[c] ?? 0) + 1;
    }
    return m;
  }, []);

  // Count by style
  const countByStyle = useMemo(() => {
    const m = {};
    for (const t of ALL_TEMPLATES) m[t.style] = (m[t.style] ?? 0) + 1;
    return m;
  }, []);

  const filteredTemplates = useMemo(() => {
    if (activeFilter === "FOR_YOU") return forYouTemplates;
    if (activeFilter === "ALL")     return ALL_TEMPLATES;
    if (CATEGORY_ORDER.includes(activeFilter)) {
      return ALL_TEMPLATES.filter((t) => t.category === activeFilter);
    }
    if (STYLE_ORDER.includes(activeFilter)) {
      return ALL_TEMPLATES.filter((t) => t.style === activeFilter);
    }
    return ALL_TEMPLATES;
  }, [activeFilter, forYouTemplates]);

  // Scroll to top when filter changes
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeFilter]);

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
  const eventTypeName = formatEventTypeName(eventType);

  // Featured: first 3 templates with hero images from current view
  const featured = filteredTemplates.filter((t) => t.assets?.hero_image).slice(0, 3);

  // Mobile filter pills
  const mobilePills = [
    ...(hasEventType ? [{ key: "FOR_YOU", label: `For You`, accent: "#818CF8" }] : []),
    { key: "ALL", label: "All", accent: "#818CF8" },
    ...CATEGORY_ORDER.filter((c) => countByCategory[c] > 0).map((c) => ({
      key: c,
      label: TEMPLATE_CATEGORIES[c]?.emoji + " " + TEMPLATE_CATEGORIES[c]?.label?.split(" & ")[0],
      accent: "#818CF8",
    })),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="tp-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] bg-black/85 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal shell */}
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
              <style>{`@media(min-width:640px){.tp-shell{border-radius:20px!important}}`}</style>
              <div className="tp-shell absolute inset-0 pointer-events-none" style={{ borderRadius: "24px 24px 0 0", border: "inherit" }} />

              {/* Mobile drag handle */}
              <div className="sm:hidden flex justify-center pt-3 shrink-0">
                <div className="h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
              </div>

              {/* Top bar */}
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
                      {hasEventType ? `Templates for ${eventTypeName}` : "Templates"}
                    </h2>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
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

              {/* Body: sidebar + grid */}
              <div className="flex flex-1 min-h-0">

                {/* ── Sidebar (desktop) ── */}
                <aside
                  className="hidden sm:flex flex-col gap-0.5 shrink-0 overflow-y-auto p-3"
                  style={{ width: 200, borderRight: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {/* For You — shown when event type is known */}
                  {hasEventType && (
                    <>
                      <p className="px-3 pt-1 pb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.2)" }}>
                        Recommended
                      </p>
                      <NavPill
                        label={`For ${eventTypeName}`}
                        count={forYouTemplates.length}
                        active={activeFilter === "FOR_YOU"}
                        accent="#818CF8"
                        onClick={() => setActiveFilter("FOR_YOU")}
                      />
                      <div className="my-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />
                    </>
                  )}

                  {/* All */}
                  <p className="px-3 pt-1 pb-1 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Browse
                  </p>
                  <NavPill
                    label="All Templates"
                    count={ALL_TEMPLATES.length}
                    active={activeFilter === "ALL"}
                    accent="#818CF8"
                    onClick={() => setActiveFilter("ALL")}
                  />

                  <div className="my-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

                  {/* By Category */}
                  <p className="px-3 pt-1 pb-1 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Category
                  </p>
                  {CATEGORY_ORDER.map((catKey) => {
                    const cat = TEMPLATE_CATEGORIES[catKey];
                    const cnt = countByCategory[catKey] ?? 0;
                    if (cnt === 0) return null;
                    const isActive = activeFilter === catKey;
                    const isCurrentCat = catKey === categoryKey;
                    return (
                      <button
                        key={catKey}
                        onClick={() => setActiveFilter(catKey)}
                        className="group flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-left transition-all"
                        style={{
                          background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                          border: isActive ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                        }}
                      >
                        <span className="text-base leading-none" style={{ fontSize: 13 }}>{cat.emoji}</span>
                        <span className="flex-1 text-[12px] font-semibold truncate transition-colors" style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.45)" }}>
                          {cat.label.split(" & ")[0]}
                        </span>
                        <span
                          className="text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0"
                          style={{
                            background: isActive ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)",
                            color: isActive ? "#818CF8" : "rgba(255,255,255,0.25)",
                          }}
                        >
                          {cnt}
                        </span>
                        {isCurrentCat && (
                          <span className="text-[8px] font-black uppercase tracking-wider rounded-full px-1.5 py-0.5 shrink-0"
                            style={{ background: "rgba(99,102,241,0.2)", color: "#818CF8" }}>
                            Yours
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <div className="my-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

                  {/* By Style */}
                  <p className="px-3 pt-1 pb-1 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Style
                  </p>
                  {STYLE_ORDER.map((s) => (
                    <NavPill
                      key={s}
                      label={STYLE_META[s]?.label ?? s}
                      count={countByStyle[s] ?? 0}
                      active={activeFilter === s}
                      accent={STYLE_META[s]?.preview?.accent ?? "#888"}
                      isFree={s === FREE_STYLE}
                      onClick={() => setActiveFilter(s)}
                    />
                  ))}

                  {/* Upgrade CTA */}
                  {!isPremium && (
                    <button
                      onClick={() => openUpgradeModal("templates")}
                      className="mx-1 flex flex-col gap-1.5 rounded-2xl p-3 text-left transition-all hover:scale-[1.02]"
                      style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", marginTop: 16 }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Zap size={11} style={{ color: "#F59E0B" }} />
                        <span className="text-[11px] font-black text-white">Go Premium</span>
                      </div>
                      <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Unlock all {ALL_TEMPLATES.filter((t) => t.style !== FREE_STYLE).length} premium templates.
                      </p>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg self-start" style={{ background: "#F59E0B", color: "#1c1407" }}>$12/mo</span>
                    </button>
                  )}
                </aside>

                {/* ── Mobile top filter pills ── */}
                <div
                  className="sm:hidden absolute left-0 right-0 z-10 flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar"
                  style={{ top: "57px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "#0c0c10" }}
                >
                  {mobilePills.map(({ key, label, accent }) => {
                    const isActive = activeFilter === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveFilter(key)}
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

                {/* ── Main grid ── */}
                <div ref={bodyRef} className="flex-1 overflow-y-auto overscroll-contain">
                  <div className="sm:hidden h-10" />

                  {/* "For You" exact-match banner */}
                  {activeFilter === "FOR_YOU" && exactMatchTemplates.length > 0 && (
                    <div className="px-4 sm:px-5 pt-5 mb-2">
                      <div
                        className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4"
                        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
                      >
                        <Sparkles size={14} style={{ color: "#818CF8", flexShrink: 0 }} />
                        <div>
                          <p className="text-[12px] font-bold text-white leading-none">
                            {exactMatchTemplates.length} template{exactMatchTemplates.length !== 1 ? "s" : ""} made for {eventTypeName} events
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Showing best matches first — more styles below
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Featured banner — show on "ALL" filter */}
                  {activeFilter === "ALL" && featured.length > 0 && (
                    <div className="px-4 sm:px-5 pt-5 mb-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                        ✦ Featured
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {featured.map((t) => {
                          const m   = STYLE_META[t.style] ?? STYLE_META.CLASSIC;
                          const acc = m.preview.accent;
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
                                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                  style={{ background: t.style === FREE_STYLE ? "rgba(16,185,129,0.9)" : "rgba(245,158,11,0.9)", color: t.style === FREE_STYLE ? "#fff" : "#1c1407" }}>
                                  {t.style === FREE_STYLE ? "Free" : "Pro"}
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

                  {/* Premium upgrade strip */}
                  {!isPremium && activeFilter !== FREE_STYLE && (
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
                          <p className="text-[12px] font-black text-white">
                            Unlock {ALL_TEMPLATES.filter((t) => t.style !== FREE_STYLE).length} Premium Templates
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                            Elegant, Modern, Minimal, Luxury & Fun — all styles included.
                          </p>
                        </div>
                        <div
                          className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-all group-hover:scale-105"
                          style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", color: "#1c1407" }}
                        >
                          <Zap size={10} /> Upgrade <ArrowRight size={10} />
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Template grid */}
                  <div className="px-4 sm:px-5 pb-6">
                    {/* Section label for style or category filters */}
                    {(STYLE_ORDER.includes(activeFilter) || CATEGORY_ORDER.includes(activeFilter)) && (
                      <div className="flex items-center gap-3 mb-4">
                        {STYLE_ORDER.includes(activeFilter) ? (
                          <>
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: STYLE_META[activeFilter]?.preview?.accent ?? "#888", boxShadow: `0 0 8px ${STYLE_META[activeFilter]?.preview?.accent ?? "#888"}88` }}
                            />
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
