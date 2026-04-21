"use client";

import { useRef } from "react";
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
} from "@heroicons/react/24/outline";
import SortableSectionList from "@/components/builder/SortableSectionList";
import { useBuilderStore } from "@/store/builder.store";
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
  { id: "blocks", label: "Add",    Icon: Squares2X2Icon   },
  { id: "layers", label: "Layers", Icon: ListBulletIcon   },
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
  const undo    = useBuilderStore((s) => s.undo);
  const redo    = useBuilderStore((s) => s.redo);
  const canUndo = useBuilderStore((s) => s._historyIndex > 0);
  const canRedo = useBuilderStore((s) => s._historyIndex < s._history.length - 1);

  const sheetTitle = {
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
              bottom: 64, // sits just above the tab bar (h-16)
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
                  {/* Section type badge */}
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

              {/* Edit sheet but no section selected */}
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
        className="relative z-50 flex h-16 shrink-0 items-center justify-between px-4"
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

        {/* Add / Layers / Edit tabs */}
        <div className="flex items-center gap-1">
          {TABS.map(({ id, label, Icon }) => {
            const active   = activeSheet === id;
            const disabled = id === "edit" && !selectedSection;
            return (
              <button
                key={id}
                onClick={() => handleTab(id)}
                disabled={disabled}
                className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-all active:scale-90"
                style={{
                  background: active ? "rgba(108,111,238,0.15)" : "transparent",
                  color: disabled ? "#333640" : active ? "#6c6fee" : "#8b8f9a",
                  minWidth: 56,
                  opacity: disabled ? 0.4 : 1,
                }}
              >
                <Icon className="h-5 w-5" />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.03em" }}>{label}</span>
                {/* Active dot */}
                {active && (
                  <div className="absolute -top-0 h-0.5 w-8 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
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
