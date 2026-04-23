"use client";

import { useState, useMemo } from "react";
import { X, Lock, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { STYLE_TEMPLATES, canAccessTemplate } from "@/lib/styleTemplates";
import { STYLE_META } from "@/lib/styleThemes";
import { useSubscriptionStore } from "@/store/subscription.store";
import { useBuilderStore } from "@/store/builder.store";

const STYLE_KEYS = ["ALL", "CLASSIC", "ELEGANT", "MODERN", "MINIMAL", "LUXURY", "FUN"];
const TIER_KEYS  = ["all", "free", "premium"];

// Deduplicate by id once at module level
const UNIQUE_TEMPLATES = Array.from(
  new Map(STYLE_TEMPLATES.map((t) => [t.id, t])).values()
);

// ── Mini event-page mockup — pure CSS, no images required ────────────────────
function TemplatePreviewCard({ template, meta }) {
  const { bg, accent, hero } = meta?.preview || { bg: "#FAF9F6", accent: "#C9A96E", hero: "#1C1917" };

  return (
    <div className="w-full overflow-hidden" style={{ background: bg, borderRadius: 6 }}>
      {/* Hero strip */}
      <div className="relative flex flex-col items-center justify-center px-3 py-6" style={{ background: hero, minHeight: 80 }}>
        {template.assets?.hero_image && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${template.assets.hero_image})` }}
          />
        )}
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,0.45)` }} />
        <div className="relative flex flex-col items-center gap-1">
          {/* Eyebrow dot */}
          <div className="h-px w-8" style={{ background: accent, opacity: 0.8 }} />
          {/* Simulated heading */}
          <div className="h-2 rounded-sm" style={{ background: "#ffffff", width: 72, opacity: 0.9 }} />
          <div className="h-1.5 rounded-sm mt-0.5" style={{ background: "#ffffff", width: 48, opacity: 0.55 }} />
          {/* Accent bar */}
          <div className="flex items-center gap-1 mt-1" style={{ opacity: 0.7 }}>
            <div className="h-px w-4" style={{ background: accent }} />
            <div className="h-1 w-1 rotate-45" style={{ background: accent }} />
            <div className="h-px w-4" style={{ background: accent }} />
          </div>
        </div>
      </div>

      {/* Content rows — simulate sections */}
      <div className="flex flex-col gap-1.5 px-2.5 py-2.5">
        {template.sections.slice(1, 5).map((s, i) => {
          const isAlt = i % 2 === 1;
          return (
            <div
              key={`${template.id}-prev-${i}`}
              className="flex items-center gap-2 rounded px-2 py-1.5"
              style={{ background: isAlt ? "rgba(0,0,0,0.04)" : "transparent" }}
            >
              <div className="h-1.5 w-1.5 rounded-sm shrink-0" style={{ background: accent, opacity: 0.6 }} />
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="h-1.5 rounded-sm" style={{ background: "currentColor", width: "60%", opacity: 0.25 }} />
                <div className="h-1 rounded-sm" style={{ background: "currentColor", width: "80%", opacity: 0.15 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA strip */}
      <div className="flex items-center justify-center px-2.5 pb-2.5">
        <div className="h-5 w-20 flex items-center justify-center" style={{ border: `1px solid ${accent}`, borderRadius: 2 }}>
          <div className="h-1 rounded-sm w-10" style={{ background: accent, opacity: 0.7 }} />
        </div>
      </div>
    </div>
  );
}

export default function TemplatePicker({ eventId, isOpen, onClose }) {
  const { plan, isSubscribed, openUpgradeModal } = useSubscriptionStore();
  const { applyPreset } = useBuilderStore();

  const [styleTab, setStyleTab] = useState("ALL");
  const [tierTab,  setTierTab]  = useState("all");
  const [applying, setApplying] = useState(null);
  const [preview,  setPreview]  = useState(null);

  const userPlan = isSubscribed ? plan : "free";

  const visible = useMemo(() =>
    UNIQUE_TEMPLATES.filter((t) => {
      if (styleTab !== "ALL" && t.style !== styleTab) return false;
      if (tierTab  !== "all" && t.tier  !== tierTab)  return false;
      return true;
    }),
  [styleTab, tierTab]);

  const handleSelect = async (t) => {
    if (!canAccessTemplate(t, userPlan)) { openUpgradeModal(t.name); return; }
    setApplying(t.id);

    const enrichedSections = t.sections.map((s) => {
      const config = { ...(s.config || {}) };
      if (s.type === "HERO" && t.assets?.hero_image) {
        config.background_image = t.assets.hero_image;
      }
      if (s.type === "GALLERY" && t.assets?.gallery_images?.length) {
        config.images = t.assets.gallery_images;
      }
      return { type: s.type, config };
    });

    await applyPreset(eventId, enrichedSections);
    setApplying(null);
    onClose();
  };

  if (!isOpen) return null;

  const freeCount    = UNIQUE_TEMPLATES.filter((t) => t.tier === "free").length;
  const premiumCount = UNIQUE_TEMPLATES.filter((t) => t.tier === "premium").length;

  return (
    <AnimatePresence mode="wait">
      <div
        key="picker-root"
        className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          key="picker-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          key="picker-modal"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.08)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div>
              <h2 className="text-lg font-bold text-white">Choose Your Style</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {UNIQUE_TEMPLATES.length} templates · {freeCount} free · {premiumCount} premium
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isSubscribed && (
                <button
                  onClick={() => openUpgradeModal()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "linear-gradient(135deg, #c9a96e, #d4b47a)", color: "#1c1917" }}
                >
                  <Sparkles size={13} /> Unlock All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Style tabs ─────────────────────────────────────────── */}
          <div
            className="flex items-center gap-1 overflow-x-auto px-6 pt-4 pb-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            {STYLE_KEYS.map((key) => {
              const meta    = key === "ALL" ? null : STYLE_META[key];
              const active  = styleTab === key;
              const accent  = meta?.preview?.accent;
              return (
                <button
                  key={key}
                  onClick={() => setStyleTab(key)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0"
                  style={{
                    background: active ? (accent || "rgba(255,255,255,0.12)") : "rgba(255,255,255,0.05)",
                    color: active ? (key === "ALL" ? "#fff" : "#fff") : "rgba(255,255,255,0.45)",
                    border: active ? `1px solid ${accent || "rgba(255,255,255,0.2)"}` : "1px solid transparent",
                  }}
                >
                  {meta && (
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: meta.preview.accent }}
                    />
                  )}
                  {key === "ALL" ? "All Styles" : meta?.label}
                </button>
              );
            })}

            {/* Tier filter on the right */}
            <div className="ml-auto flex items-center gap-1 shrink-0">
              {TIER_KEYS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTierTab(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: tierTab === t ? "rgba(255,255,255,0.12)" : "transparent",
                    color: tierTab === t ? "#fff" : "rgba(255,255,255,0.35)",
                  }}
                >
                  {t === "all" ? "All" : t === "free" ? "Free" : "⭐ Premium"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Template grid ──────────────────────────────────────── */}
          <div className="overflow-y-auto flex-1 px-6 py-6">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40" style={{ color: "rgba(255,255,255,0.25)" }}>
                <p className="text-sm">No templates match</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {visible.map((t) => {
                  const accessible = canAccessTemplate(t, userPlan);
                  const isApplying = applying === t.id;
                  const meta       = STYLE_META[t.style];
                  const accent     = meta?.preview?.accent || "#C9A96E";

                  return (
                    <div key={t.id} className="flex flex-col gap-2">
                      {/* Card */}
                      <div
                        className="relative overflow-hidden cursor-pointer transition-all duration-200 group"
                        style={{ border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 10 }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 20px ${accent}30`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                        onClick={() => handleSelect(t)}
                      >
                        {/* Preview mockup */}
                        <TemplatePreviewCard template={t} meta={meta} />

                        {/* Locked overlay */}
                        {!accessible && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                              <Lock size={15} className="text-white" />
                            </div>
                          </div>
                        )}

                        {/* Applying spinner */}
                        {isApplying && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                            <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          </div>
                        )}

                        {/* Hover action bar */}
                        <div
                          className="absolute bottom-0 inset-x-0 flex items-center justify-between px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreview(t); }}
                            className="text-[10px] font-semibold text-white/70 hover:text-white transition-colors"
                          >
                            Preview
                          </button>
                          {accessible ? (
                            <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: accent }}>
                              <Check size={10} /> Apply
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); openUpgradeModal(t.name); }}
                              className="text-[10px] font-bold"
                              style={{ color: "#f59e0b" }}
                            >
                              Upgrade
                            </button>
                          )}
                        </div>

                        {/* Tier badge */}
                        <div className="absolute top-2 left-2">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={t.tier === "premium"
                              ? { background: "rgba(245,158,11,0.9)", color: "#1c1407" }
                              : { background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }
                            }
                          >
                            {t.tier === "premium" ? "⭐ Pro" : "Free"}
                          </span>
                        </div>
                      </div>

                      {/* Name + style pill */}
                      <div className="px-0.5">
                        <p className="text-xs font-semibold text-white leading-tight">{t.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: meta?.preview?.accent || "#C9A96E" }}
                          />
                          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{meta?.label}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Preview modal ───────────────────────────────────────────── */}
      {preview && (
        <div
          key="preview-modal"
          className="fixed inset-0 z-[9500] flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#16181c", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full transition-colors"
              style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)" }}
            >
              <X size={15} />
            </button>

            {/* Hero image or gradient */}
            <div className="relative overflow-hidden" style={{ height: "50vh", background: STYLE_META[preview.style]?.preview?.hero || "#1C1917" }}>
              {preview.assets?.hero_image && (
                <img
                  src={preview.assets.hero_image}
                  alt={preview.name}
                  className="w-full h-full object-cover opacity-80"
                />
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />

              {/* Color swatches */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                {Object.entries(preview.design.colors).map(([name, hex]) => (
                  <div
                    key={`${preview.id}-swatch-${name}`}
                    className="h-5 w-5 rounded-full border-2 border-white/20 shadow"
                    style={{ background: hex }}
                    title={name}
                  />
                ))}
              </div>

              {/* Title on image */}
              <div className="absolute bottom-5 left-6">
                <p className="text-xs uppercase tracking-[0.25em] mb-1" style={{ color: "var(--t-accent, #C9A96E)", opacity: 0.8 }}>
                  {STYLE_META[preview.style]?.label}
                </p>
                <h3 className="text-2xl font-bold text-white">{preview.name}</h3>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{preview.description}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {preview.sections.map((s, sIdx) => (
                    <span
                      key={`${preview.id}-sec-${s.type}-${sIdx}`}
                      className="text-[9px] px-2 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {s.type}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {preview.design.fonts.heading} · {preview.sections.length} sections
                </p>
              </div>

              {canAccessTemplate(preview, userPlan) ? (
                <button
                  onClick={() => { setPreview(null); handleSelect(preview); }}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                  style={{ background: STYLE_META[preview.style]?.preview?.accent || "#C9A96E", color: "#fff" }}
                >
                  <Check size={14} /> Use Template
                </button>
              ) : (
                <button
                  onClick={() => { setPreview(null); openUpgradeModal(preview.name); }}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: "#f59e0b", color: "#1c1407" }}
                >
                  <Lock size={14} /> Upgrade
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
