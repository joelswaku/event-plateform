"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RectangleStackIcon,
  InformationCircleIcon,
  PhotoIcon,
  QuestionMarkCircleIcon,
  MegaphoneIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon,
  TicketIcon,
  HeartIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  XMarkIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  ListBulletIcon,
  SwatchIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import SortableSectionList from "@/components/builder/SortableSectionList";
import { useBuilderStore } from "@/store/builder.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import { STYLE_META } from "@/lib/styleThemes";
import { PAGE_PRESETS } from "@/builder/page-presets";
import SectionConfigPanel from "./SectionConfigPanel";

// ── All block types with colours ─────────────────────────────────────────────
const BLOCK_ITEMS = [
  { type: "HERO",      Icon: RectangleStackIcon,    label: "Hero",      color: "#6c6fee" },
  { type: "ABOUT",     Icon: InformationCircleIcon,  label: "About",     color: "#3ecf8e" },
  { type: "GALLERY",   Icon: PhotoIcon,              label: "Gallery",   color: "#f59e0b" },
  { type: "FAQ",       Icon: QuestionMarkCircleIcon, label: "FAQ",       color: "#f43f5e" },
  { type: "CTA",       Icon: MegaphoneIcon,          label: "CTA",       color: "#8b5cf6" },
  { type: "SPEAKERS",  Icon: UserGroupIcon,          label: "Speakers",  color: "#06b6d4" },
  { type: "VENUE",     Icon: MapPinIcon,             label: "Venue",     color: "#c9a96e" },
  { type: "COUNTDOWN", Icon: ClockIcon,              label: "Countdown", color: "#ef4444" },
  { type: "TICKETS",   Icon: TicketIcon,             label: "Tickets",   color: "#22c55e" },
  { type: "COUPLE",    Icon: HeartIcon,              label: "Couple",    color: "#ec4899" },
  { type: "STORY",     Icon: BookOpenIcon,           label: "Story",     color: "#f97316" },
  { type: "SCHEDULE",  Icon: CalendarDaysIcon,       label: "Schedule",  color: "#64748b" },
];

// ── Bottom tab definitions ────────────────────────────────────────────────────
const TABS = [
  { id: "style",  label: "Style",  Icon: SwatchIcon      },
  { id: "blocks", label: "Add",    Icon: Squares2X2Icon  },
  { id: "layers", label: "Layers", Icon: ListBulletIcon  },
  { id: "edit",   label: "Edit",   Icon: PencilSquareIcon },
];

export default function MobileBottomBar({
  eventId,
  sections,
  selectedSectionId,
  selectedSection,
  onSectionSelect,
  onDeselectSection,
  activeSheet,
  onSheetChange,
}) {
  const createSectionFromTemplate = useBuilderStore((s) => s.createSectionFromTemplate);
  const applyPreset               = useBuilderStore((s) => s.applyPreset);
  const setTheme                  = useBuilderStore((s) => s.setTheme);
  const undo    = useBuilderStore((s) => s.undo);
  const redo    = useBuilderStore((s) => s.redo);
  const canUndo = useBuilderStore((s) => s._historyIndex > 0);
  const canRedo = useBuilderStore((s) => s._historyIndex < s._history.length - 1);

  const isSubscribed     = useSubscriptionStore((s) => s.isSubscribed);
  const plan             = useSubscriptionStore((s) => s.plan);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
  const isPremium = isSubscribed && plan === "premium";

  const activeTheme = useMemo(() => {
    const first = sections?.find((s) => s?.config?._theme);
    return first?.config?._theme || "CLASSIC";
  }, [sections]);

  const handleThemeChange = (themeId) => {
    if (themeId !== "CLASSIC" && !isPremium) { openUpgradeModal("templates"); return; }
    if (sections?.length) setTheme(eventId, themeId);
  };

  const handlePresetSelect = async (e) => {
    const presetKey = e.target.value;
    const preset = PAGE_PRESETS[presetKey];
    if (!preset) return;
    e.target.value = "";
    const themeId = isPremium && STYLE_META[presetKey] ? presetKey : "CLASSIC";
    const sectionsWithTheme = preset.sections.map((s) => ({ type: s, config: { _theme: themeId } }));
    const newSections = await applyPreset(eventId, sectionsWithTheme);
    if (newSections?.length && newSections[0]?.config?._theme !== themeId) {
      await setTheme(eventId, themeId);
    }
  };

  const sheetTitle = {
    style:  "Style & Layout",
    blocks: "Add Block",
    layers: "Layers",
    edit:   selectedSection ? `Edit: ${selectedSection.section_type}` : "Edit Section",
  }[activeSheet] ?? "";

  const handleTab = (id) => {
    if (id === "edit" && !selectedSection) return;
    onSheetChange(activeSheet === id ? null : id);
  };

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeSheet && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => onSheetChange(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Bottom sheet ──────────────────────────────────────────── */}
      <AnimatePresence>
        {activeSheet && (
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-x-0 z-50 flex flex-col rounded-t-2xl overflow-hidden"
            style={{
              bottom: 64,
              maxHeight: "72dvh",
              background: "#16181c",
              border: "1px solid rgba(255,255,255,0.1)",
              borderBottom: "none",
            }}
          >
            {/* Drag handle pill */}
            <div className="flex shrink-0 justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Sheet header */}
            <div
              className="flex shrink-0 items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span className="text-sm font-semibold text-white">{sheetTitle}</span>
              <button
                onClick={() => onSheetChange(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <XMarkIcon className="h-4 w-4 text-white/60" />
              </button>
            </div>

            {/* Sheet content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* ── STYLE & LAYOUT ── */}
              {activeSheet === "style" && (
                <div className="flex flex-col gap-5 p-4">
                  {/* Theme grid */}
                  <div className="flex flex-col gap-2">
                    <SheetLabel>Style</SheetLabel>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {Object.entries(STYLE_META).map(([id, meta]) => {
                        const isActive = activeTheme === id;
                        const locked   = id !== "CLASSIC" && !isPremium;
                        return (
                          <button
                            key={id}
                            onClick={() => handleThemeChange(id)}
                            style={{
                              border: `1px solid ${isActive ? meta.preview.accent : "rgba(255,255,255,0.06)"}`,
                              borderRadius: 9,
                              overflow: "hidden",
                              cursor: "pointer",
                              boxShadow: isActive
                                ? `0 0 0 1px ${meta.preview.accent}50, 0 0 16px ${meta.preview.accent}25`
                                : "none",
                              transition: "all 0.18s ease",
                              background: "transparent",
                              opacity: locked ? 0.55 : 1,
                              position: "relative",
                            }}
                          >
                            {/* Hero strip */}
                            <div style={{ height: 34, background: meta.preview.hero, position: "relative", overflow: "hidden" }}>
                              <div style={{
                                position: "absolute", inset: 0,
                                background: `repeating-linear-gradient(135deg, transparent, transparent 4px, ${meta.preview.accent}08 4px, ${meta.preview.accent}08 8px)`,
                              }} />
                              <div style={{ position: "absolute", bottom: 5, left: 6, right: 6 }}>
                                <div style={{ height: 3, background: "rgba(255,255,255,0.6)", borderRadius: 2, width: "72%", marginBottom: 2 }} />
                                <div style={{ height: 2, background: meta.preview.accent, opacity: 0.85, borderRadius: 2, width: "44%" }} />
                              </div>
                              {locked && (
                                <div style={{
                                  position: "absolute", top: 4, right: 4,
                                  background: "rgba(0,0,0,0.6)",
                                  borderRadius: 4, padding: "2px 4px",
                                  display: "flex", alignItems: "center",
                                }}>
                                  <LockClosedIcon style={{ width: 9, height: 9, color: "#f0c060" }} />
                                </div>
                              )}
                            </div>
                            {/* Content strip */}
                            <div style={{ background: meta.preview.bg, padding: "4px 6px 5px" }}>
                              <div style={{ height: 2, background: "rgba(0,0,0,0.2)", borderRadius: 1, width: "88%", marginBottom: 2 }} />
                              <div style={{ height: 2, background: "rgba(0,0,0,0.12)", borderRadius: 1, width: "60%" }} />
                            </div>
                            {/* Label */}
                            <div style={{
                              background: isActive ? `${meta.preview.hero}ee` : "#1a1b1f",
                              padding: "3px 4px",
                              fontSize: 9,
                              textAlign: "center",
                              color: isActive ? meta.preview.accent : "#4a5060",
                              fontWeight: 700,
                              letterSpacing: "0.07em",
                              textTransform: "uppercase",
                            }}>
                              {meta.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {!isPremium && (
                      <p style={{ fontSize: 11, color: "#44495a", lineHeight: 1.5 }}>
                        Classic is free. Upgrade to unlock all styles.
                      </p>
                    )}
                  </div>

                  {/* Layout presets */}
                  <div className="flex flex-col gap-2">
                    <SheetLabel>Layout</SheetLabel>
                    <select
                      defaultValue=""
                      onChange={handlePresetSelect}
                      className="w-full rounded-xl px-4 py-3 text-sm"
                      style={{
                        background: "#1e2026",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#f0f1f3",
                      }}
                    >
                      <option value="" disabled>Apply a preset layout…</option>
                      {Object.entries(PAGE_PRESETS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}{k !== "CLASSIC" && !isPremium ? " (Classic style)" : ""}
                        </option>
                      ))}
                    </select>
                    {!isPremium && (
                      <p style={{ fontSize: 11, color: "#44495a", lineHeight: 1.5 }}>
                        All layouts available. Premium styles apply only for Pro users.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── ADD BLOCKS ── */}
              {activeSheet === "blocks" && (
                <div className="grid grid-cols-3 gap-2.5 p-4 sm:grid-cols-4">
                  {BLOCK_ITEMS.map(({ type, Icon, label, color }) => (
                    <button
                      key={type}
                      onClick={() => {
                        createSectionFromTemplate(eventId, type);
                        onSheetChange(null);
                      }}
                      className="flex flex-col items-center gap-2 rounded-2xl p-3 transition-transform active:scale-95"
                      style={{ background: "#1e2026", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{ background: `${color}22` }}
                      >
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <span className="text-center text-[11px] font-medium leading-tight text-white/60">{label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── LAYERS ── */}
              {activeSheet === "layers" && (
                <div className="p-3">
                  {sections.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <ListBulletIcon className="h-8 w-8 text-white/20" />
                      <p className="text-sm text-white/30">No sections yet</p>
                      <button
                        onClick={() => onSheetChange("blocks")}
                        className="mt-1 rounded-lg px-4 py-2 text-xs font-semibold"
                        style={{ background: "#6c6fee22", color: "#6c6fee" }}
                      >
                        Add a block
                      </button>
                    </div>
                  ) : (
                    <SortableSectionList
                      eventId={eventId}
                      sections={sections}
                      selectedSectionId={selectedSectionId}
                      onSectionSelect={(s) => {
                        onSectionSelect(s);
                        onSheetChange("edit");
                      }}
                    />
                  )}
                </div>
              )}

              {/* ── EDIT ── */}
              {activeSheet === "edit" && selectedSection && (
                <div className="p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{ background: "rgba(108,111,238,0.15)", color: "#6c6fee" }}
                    >
                      {selectedSection.section_type}
                    </span>
                    <button
                      onClick={() => { onDeselectSection(); onSheetChange(null); }}
                      className="ml-auto flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-white/40 transition-colors hover:text-white/60"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      <XMarkIcon className="h-3 w-3" /> Deselect
                    </button>
                  </div>
                  <SectionConfigPanel section={selectedSection} eventId={eventId} />
                </div>
              )}

              {activeSheet === "edit" && !selectedSection && (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <PencilSquareIcon className="h-8 w-8 text-white/20" />
                  <p className="text-sm text-white/30">Tap a section in the canvas to edit it</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom tab bar ────────────────────────────────────────── */}
      <div
        className="relative z-50 flex h-16 shrink-0 items-center justify-between px-3"
        style={{ background: "#16181c", borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:scale-90"
            style={{ color: canUndo ? "#8b8f9a" : "#333640" }}
          >
            <UndoIcon />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:scale-90"
            style={{ color: canRedo ? "#8b8f9a" : "#333640" }}
          >
            <RedoIcon />
          </button>
        </div>

        {/* Style / Add / Layers / Edit tabs */}
        <div className="flex items-center gap-0.5">
          {TABS.map(({ id, label, Icon }) => {
            const active   = activeSheet === id;
            const disabled = id === "edit" && !selectedSection;
            return (
              <button
                key={id}
                onClick={() => handleTab(id)}
                disabled={disabled}
                className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all active:scale-90"
                style={{
                  background: active ? "rgba(108,111,238,0.15)" : "transparent",
                  color: disabled ? "#333640" : active ? "#6c6fee" : "#8b8f9a",
                  minWidth: 48,
                  opacity: disabled ? 0.4 : 1,
                }}
              >
                <Icon className="h-5 w-5" />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.03em" }}>{label}</span>
                {active && (
                  <div className="absolute top-0 h-0.5 w-8 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function SheetLabel({ children }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#555a66" }}>
      {children}
    </span>
  );
}

function UndoIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  );
}
