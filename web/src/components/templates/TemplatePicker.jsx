"use client";

import { useState, useMemo } from "react";
import { X, Lock, Eye, Check, Sparkles, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WEDDING_TEMPLATES, canAccessTemplate } from "@/lib/weddingTemplates";
import { useSubscriptionStore } from "@/store/subscription.store";
import { useBuilderStore } from "@/store/builder.store";

const FILTERS = [
  { key: "all",     label: "All Templates" },
  { key: "free",    label: "Free" },
  { key: "premium", label: "Premium" },
];

// Deduplicate by id once at module level — prevents duplicate-key warnings
// if the same template is accidentally listed twice in weddingTemplates.js
const UNIQUE_TEMPLATES = Array.from(
  new Map(WEDDING_TEMPLATES.map((t) => [t.id, t])).values()
);

const FREE_COUNT    = UNIQUE_TEMPLATES.filter((t) => t.tier === "free").length;
const PREMIUM_COUNT = UNIQUE_TEMPLATES.filter((t) => t.tier === "premium").length;

export default function TemplatePicker({ eventId, isOpen, onClose }) {
  const { plan, isSubscribed, openUpgradeModal } = useSubscriptionStore();
  const { applyPreset } = useBuilderStore();

  const [filter,   setFilter]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [hovered,  setHovered]  = useState(null);
  const [applying, setApplying] = useState(null);
  const [preview,  setPreview]  = useState(null);

  const userPlan = isSubscribed ? plan : "free";

  const visible = useMemo(() =>
    UNIQUE_TEMPLATES.filter((t) => {
      if (filter !== "all" && t.tier !== filter) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
  [filter, search]);

  const handleSelect = async (t) => {
    if (!canAccessTemplate(t, userPlan)) { openUpgradeModal(t.name); return; }
    setApplying(t.id);

    // Build enriched sections: merge template section config with asset URLs
    const enrichedSections = t.sections.map((s) => {
      const config = { ...(s.config || {}) };
      if (s.type === "HERO" && t.assets?.hero_image) {
        config.background_image = t.assets.hero_image;
      }
      if (s.type === "GALLERY" && t.assets?.gallery_images?.length) {
        config.gallery_images = t.assets.gallery_images;
      }
      return { type: s.type, config };
    });

    await applyPreset(eventId, enrichedSections);
    setApplying(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {/* ── Backdrop + main modal ────────────────────────────────── */}
      <div key="template-picker-root" className="fixed inset-0 z-[9000] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          key="template-picker-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        <motion.div
          key="template-picker-modal"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Choose Your Template</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {UNIQUE_TEMPLATES.length} templates · {FREE_COUNT} free · {PREMIUM_COUNT} premium
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isSubscribed && (
                <button
                  onClick={() => openUpgradeModal()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-amber-400 to-yellow-400 text-white text-sm font-semibold shadow hover:from-amber-500 hover:to-yellow-500 transition-all"
                >
                  <Sparkles size={13} /> Unlock All
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* ── Controls ─────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-6 pt-4 pb-3 shrink-0">
            <div className="flex gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filter === f.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="ml-auto relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 w-48"
              />
            </div>
          </div>

          {/* ── Grid ─────────────────────────────────────────────── */}
          <div className="overflow-y-auto flex-1 px-6 pb-6">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Search size={28} className="mb-2 opacity-30" />
                <p className="text-sm">No templates match</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 mt-2 space-y-4">
                {visible.map((t) => {
                  const accessible = canAccessTemplate(t, userPlan);
                  const isApplying = applying === t.id;

                  return (
                    // KEY: stable template.id — guaranteed unique after dedup above
                    <div
                      key={t.id}
                      className="break-inside-avoid"
                      onMouseEnter={() => setHovered(t.id)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div
                        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                          accessible
                            ? "border-transparent hover:border-amber-400 hover:shadow-xl hover:shadow-amber-100/50"
                            : "border-transparent hover:border-gray-200"
                        }`}
                      >
                        {/* Image */}
                        <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "3/4" }}>
                          <img
                            src={t.assets.cover_image}
                            alt={t.name}
                            loading="lazy"
                            className={`w-full h-full object-cover transition-transform duration-500 ${
                              hovered === t.id ? "scale-110" : "scale-100"
                            }`}
                          />

                          <div
                            className={`absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent transition-opacity duration-300 ${
                              hovered === t.id ? "opacity-100" : "opacity-0"
                            }`}
                          />

                          {!accessible && (
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                                <Lock size={18} className="text-gray-700" />
                              </div>
                            </div>
                          )}

                          <div className="absolute top-2.5 left-2.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                t.tier === "premium" ? "bg-amber-500 text-white" : "bg-white/90 text-gray-600"
                              }`}
                            >
                              {t.tier === "premium" ? "⭐ Premium" : "Free"}
                            </span>
                          </div>

                          <div
                            className={`absolute bottom-0 left-0 right-0 p-2.5 flex gap-1.5 transition-all duration-300 ${
                              hovered === t.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                            }`}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); setPreview(t); }}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-medium hover:bg-white/30 transition-colors"
                            >
                              <Eye size={11} /> Preview
                            </button>

                            {accessible ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSelect(t); }}
                                disabled={isApplying}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-bold transition-colors"
                              >
                                {isApplying ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <><Check size={11} /> Select</>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); openUpgradeModal(t.name); }}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
                              >
                                <Lock size={11} /> Upgrade
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Card footer */}
                        <div className="p-2.5 bg-white">
                          <p className="font-semibold text-gray-900 text-xs leading-tight">{t.name}</p>
                          <p className="text-gray-400 text-[10px] mt-0.5 line-clamp-1">{t.description}</p>
                          <div className="mt-1.5 flex flex-wrap gap-0.5">
                            {t.sections.slice(0, 4).map((s, sIdx) => (
                              // KEY: combine template.id + section type + position
                              // guards against duplicate section types within one template
                              <span
                                key={`${t.id}-section-${s.type}-${sIdx}`}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-100"
                              >
                                {s.type}
                              </span>
                            ))}
                            {t.sections.length > 4 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-100">
                                +{t.sections.length - 4}
                              </span>
                            )}
                          </div>
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

      {/* ── Preview Modal ─────────────────────────────────────────── */}
      {preview && (
        <div
          key="template-preview-modal"
          className="fixed inset-0 z-[9500] flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X size={15} />
            </button>

            <img
              src={preview.assets.hero_image}
              alt={preview.name}
              className="w-full object-cover max-h-[55vh]"
            />

            {/* Color swatches — key by hex value, not index */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              {Object.entries(preview.design.colors).map(([colorName, colorHex]) => (
                <div
                  key={`${preview.id}-color-${colorName}`}
                  className="w-5 h-5 rounded-full border-2 border-white shadow"
                  style={{ background: colorHex }}
                  title={colorName}
                />
              ))}
            </div>

            <div className="p-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">{preview.name}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      preview.tier === "premium" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {preview.tier === "premium" ? "⭐ Premium" : "Free"}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">{preview.description}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {preview.design.fonts.heading_font} · {preview.design.fonts.body_font}
                </p>
              </div>

              {canAccessTemplate(preview, userPlan) ? (
                <button
                  onClick={() => { setPreview(null); handleSelect(preview); }}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors"
                >
                  <Check size={14} /> Use Template
                </button>
              ) : (
                <button
                  onClick={() => { setPreview(null); openUpgradeModal(preview.name); }}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors"
                >
                  <Lock size={14} /> Upgrade to Use
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
