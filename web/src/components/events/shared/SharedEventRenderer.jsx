"use client";

import { useEffect, useState, useMemo, Component } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import SECTION_REGISTRY from "./sections/sectionRegistry";

/**
 * SharedEventRenderer
 *
 * Single source of truth for rendering event pages.
 * Used in both builder (isEditor=true) and public (isEditor=false) modes.
 */
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

  const orderedSections = useMemo(() => {
    return [...sections]
      .filter((s) => isEditor || s.is_visible !== false)
      .sort((a, b) => (a.position_order ?? 0) - (b.position_order ?? 0));
  }, [sections, isEditor]);

  if (orderedSections.length === 0) {
    if (isEditor) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#f8f9fa] text-center px-6">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(108,111,238,0.1)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="#6c6fee" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">Your canvas is empty</p>
          <p className="mt-1 text-xs text-gray-400 max-w-xs">
            Add a block from the sidebar, or choose a preset template to get started.
          </p>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white text-center px-6 py-20">
        <h1 className="text-3xl font-black text-gray-900 mb-2">{event?.title || "Event"}</h1>
        <p className="text-gray-400 text-sm">
          This page is being set up. Check back soon!
        </p>
        {timeLeft && (
          <p className="mt-6 text-base font-semibold text-rose-500">{timeLeft}</p>
        )}
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
    <div className="min-h-screen bg-white">
      {orderedSections.map((section) => (
        <SectionErrorBoundary key={section.id} sectionType={section.section_type}>
          <SectionRenderer
            section={section}
            event={event}
            timeLeft={timeLeft}
            isEditor={false}
          />
        </SectionErrorBoundary>
      ))}
    </div>
  );
}

// ─── Editor canvas with DnD ────────────────────────────────────────────────────
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

// ─── Sortable wrapper ─────────────────────────────────────────────────────────
function SortableSection({ section, event, timeLeft, onSectionClick, isSelected }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isSelected ? "ring-2 ring-inset ring-indigo-500" : ""}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 z-30 -translate-y-1/2 cursor-grab rounded-lg bg-white/90 p-1.5 shadow opacity-0 group-hover:opacity-100 transition"
        title="Drag to reorder"
      >
        <DragIcon />
      </div>

      {/* Click-to-select overlay */}
      <div
        className={`absolute inset-0 z-20 transition ${
          isSelected
            ? "ring-2 ring-inset ring-indigo-500"
            : "hover:ring-2 hover:ring-inset hover:ring-indigo-300/60"
        }`}
        onClick={() => onSectionClick?.(section)}
      />

      <SectionRenderer section={section} event={event} timeLeft={timeLeft} isEditor />
    </div>
  );
}

// ─── Section renderer — resolves from registry ────────────────────────────────
function SectionRenderer({ section, event, timeLeft, isEditor }) {
  const Component = SECTION_REGISTRY[section.section_type];

  if (!Component) {
    if (!isEditor) return null;
    return (
      <div className="border border-dashed border-red-300 bg-red-50 p-6 text-center text-sm text-red-600">
        Unknown section type: <code>{section.section_type}</code>
      </div>
    );
  }

  return (
    <Component section={section} event={event} timeLeft={timeLeft} isEditor={isEditor} />
  );
}

// ─── Per-section error boundary (class component — only option for render errors)
class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error(`[Section:${this.props.sectionType}]`, error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (!this.props.isEditor) return null;

    return (
      <div className="border border-dashed border-red-300 bg-red-50 p-6 text-center text-sm text-red-500">
        Section <strong>{this.props.sectionType}</strong> failed to render.
      </div>
    );
  }
}

// ─── Drag icon ────────────────────────────────────────────────────────────────
function DragIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9"  cy="5"  r="1" /><circle cx="15" cy="5"  r="1" />
      <circle cx="9"  cy="12" r="1" /><circle cx="15" cy="12" r="1" />
      <circle cx="9"  cy="19" r="1" /><circle cx="15" cy="19" r="1" />
    </svg>
  );
}
