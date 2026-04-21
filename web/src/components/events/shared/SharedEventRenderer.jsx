"use client";

import { useEffect, useState, useMemo, Component } from "react";
import { motion } from "framer-motion";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import SECTION_REGISTRY from "./sections/sectionRegistry";

// ── Luxury sticky nav (public page only) ─────────────────────────────────────
function LuxuryNav({ event }) {
  const [scrolled, setScrolled]   = useState(false);
  const [visible, setVisible]     = useState(true);
  const [lastY,   setLastY]       = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setVisible(y < lastY || y < 100);
      setLastY(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastY]);

  const dateStr = event?.starts_at_local
    ? new Date(event.starts_at_local).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <motion.header
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: visible ? 0 : -80, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      role="banner"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-stone-200/50 bg-[#FAF9F6]/80 shadow-sm backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <p
          className={`font-serif text-sm font-semibold italic tracking-wide transition-colors duration-300 ${
            scrolled ? "text-stone-900" : "text-white/90"
          }`}
        >
          {event?.title || ""}
        </p>

        {dateStr && (
          <p
            className={`hidden text-[11px] font-medium uppercase tracking-[0.25em] transition-colors duration-300 sm:block ${
              scrolled ? "text-[#C9A96E]" : "text-white/60"
            }`}
          >
            {dateStr}
          </p>
        )}
      </div>
    </motion.header>
  );
}

// ── Public renderer ───────────────────────────────────────────────────────────
export default function SharedEventRenderer({
  event,
  sections = [],
  isEditor = false,
  onSectionClick,
  onReorder,
  selectedSectionId,
}) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!event?.starts_at_utc) return;
    const tick = () => {
      const diff = new Date(event.starts_at_utc) - new Date();
      if (diff <= 0) { setTimeLeft("🎉 Happening now!"); return; }
      const d = Math.floor(diff / 864e5);
      const h = Math.floor((diff / 36e5) % 24);
      const m = Math.floor((diff / 6e4) % 60);
      setTimeLeft(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [event?.starts_at_utc]);

  const orderedSections = useMemo(
    () =>
      [...sections]
        .filter((s) => isEditor || s.is_visible !== false)
        .sort((a, b) => (a.position_order ?? 0) - (b.position_order ?? 0)),
    [sections, isEditor]
  );

  if (orderedSections.length === 0) {
    if (isEditor) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#f8f9fa] px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(108,111,238,0.1)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="#6c6fee" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">Your canvas is empty</p>
          <p className="mt-1 max-w-xs text-xs text-gray-400">Add a block from the sidebar, or choose a preset template to get started.</p>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] px-6 py-20 text-center">
        <h1 className="mb-2 font-serif text-4xl font-bold text-stone-900">{event?.title || "Event"}</h1>
        <p className="text-sm text-stone-400">This page is being set up. Check back soon!</p>
        {timeLeft && <p className="mt-6 font-serif text-base italic text-[#C9A96E]">{timeLeft}</p>}
      </div>
    );
  }

  if (isEditor) {
    return (
      <EditorCanvas
        event={event}
        sections={orderedSections}
        timeLeft={timeLeft}
        onSectionClick={onSectionClick}
        onReorder={onReorder}
        selectedSectionId={selectedSectionId}
      />
    );
  }

  return (
    <div className="luxury-page min-h-screen bg-[#FAF9F6]">
      <LuxuryNav event={event} />
      {orderedSections.map((section) => (
        <SectionErrorBoundary key={section.id} sectionType={section.section_type}>
          <SectionRenderer section={section} event={event} timeLeft={timeLeft} isEditor={false} />
        </SectionErrorBoundary>
      ))}
    </div>
  );
}

// ── Editor canvas with DnD ────────────────────────────────────────────────────
function EditorCanvas({ event, sections, timeLeft, onSectionClick, onReorder, selectedSectionId }) {
  const handleDragEnd = (dndEvent) => {
    const { active, over } = dndEvent;
    if (!over || active.id === over.id || !onReorder) return;
    const oldIdx = sections.findIndex((s) => s.id === active.id);
    const newIdx = sections.findIndex((s) => s.id === over.id);
    onReorder(arrayMove(sections, oldIdx, newIdx));
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-screen bg-white">
          {sections.map((section) => (
            <SectionErrorBoundary key={section.id} sectionType={section.section_type} isEditor>
              <SortableSection
                section={section}
                event={event}
                timeLeft={timeLeft}
                onSectionClick={onSectionClick}
                isSelected={selectedSectionId === section.id}
              />
            </SectionErrorBoundary>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableSection({ section, event, timeLeft, onSectionClick, isSelected }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : "auto", opacity: isDragging ? 0.7 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${isSelected ? "ring-2 ring-inset ring-indigo-500" : ""}`}>
      <div {...attributes} {...listeners} className="absolute left-2 top-1/2 z-30 -translate-y-1/2 cursor-grab rounded-lg bg-white/90 p-1.5 shadow opacity-0 group-hover:opacity-100 transition" title="Drag to reorder">
        <DragIcon />
      </div>
      <div className={`absolute inset-0 z-20 transition ${isSelected ? "ring-2 ring-inset ring-indigo-500" : "hover:ring-2 hover:ring-inset hover:ring-indigo-300/60"}`} onClick={() => onSectionClick?.(section)} />
      <SectionRenderer section={section} event={event} timeLeft={timeLeft} isEditor />
    </div>
  );
}

function SectionRenderer({ section, event, timeLeft, isEditor }) {
  const SectionComponent = SECTION_REGISTRY[section.section_type];
  if (!SectionComponent) {
    if (!isEditor) return null;
    return <div className="border border-dashed border-red-300 bg-red-50 p-6 text-center text-sm text-red-600">Unknown section type: <code>{section.section_type}</code></div>;
  }
  return <SectionComponent section={section} event={event} timeLeft={timeLeft} isEditor={isEditor} />;
}

class SectionErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error(`[Section:${this.props.sectionType}]`, error); }
  render() {
    if (!this.state.hasError) return this.props.children;
    if (!this.props.isEditor) return null;
    return <div className="border border-dashed border-red-300 bg-red-50 p-6 text-center text-sm text-red-500">Section <strong>{this.props.sectionType}</strong> failed to render.</div>;
  }
}

function DragIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" />
    </svg>
  );
}
