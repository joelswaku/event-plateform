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
import { resolveThemeFromSections } from "@/lib/styleThemes";
import ThemedNav from "./ThemedNav";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC RENDERER
// ─────────────────────────────────────────────────────────────────────────────
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

  // CSS-var object injected on the wrapper
  const theme = useMemo(() => resolveThemeFromSections(orderedSections), [orderedSections]);

  // Theme key string — drives nav and layout decisions
  const themeKey = useMemo(() => {
    for (const s of orderedSections) {
      const t = s?.config?._theme;
      if (t) return t;
    }
    return "CLASSIC";
  }, [orderedSections]);

  // LUXURY sidebar is 72px wide — shift content right on xl screens only
  const luxuryShift = themeKey === "LUXURY" ? { paddingLeft: "72px" } : {};

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (orderedSections.length === 0) {
    if (isEditor) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#f8f9fa] px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(108,111,238,0.1)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="#6c6fee" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">Your canvas is empty</p>
          <p className="mt-1 max-w-xs text-xs text-gray-400">
            Add a block from the sidebar, or choose a style template to get started.
          </p>
        </div>
      );
    }
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center"
        style={{ background: "var(--t-bg)" }}
      >
        <h1
          className="mb-2 text-4xl font-bold"
          style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-text)" }}
        >
          {event?.title || "Event"}
        </h1>
        <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>
          This page is being set up. Check back soon!
        </p>
        {timeLeft && (
          <p
            className="mt-6 text-base italic"
            style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-accent)" }}
          >
            {timeLeft}
          </p>
        )}
      </div>
    );
  }

  const themeWrapper = (children) => <div style={theme}>{children}</div>;

  // ── Editor mode ─────────────────────────────────────────────────────────────
  if (isEditor) {
    return themeWrapper(
      <EditorCanvas
        event={event}
        sections={orderedSections}
        themeKey={themeKey}
        timeLeft={timeLeft}
        onSectionClick={onSectionClick}
        onReorder={onReorder}
        selectedSectionId={selectedSectionId}
      />
    );
  }

  // ── Public mode ─────────────────────────────────────────────────────────────
  return themeWrapper(
    <div className="min-h-screen" style={{ background: "var(--t-bg)", ...luxuryShift }}>
      <ThemedNav event={event} sections={orderedSections} themeKey={themeKey} />
      {orderedSections.map((section) => (
        <div key={section.id} id={`s-${section.id}`}>
          <SectionErrorBoundary sectionType={section.section_type}>
            <SectionRenderer
              section={section}
              event={event}
              timeLeft={timeLeft}
              isEditor={false}
            />
          </SectionErrorBoundary>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR CANVAS — drag-and-drop reordering
// ─────────────────────────────────────────────────────────────────────────────
function EditorCanvas({ event, sections, themeKey, timeLeft, onSectionClick, onReorder, selectedSectionId }) {
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id || !onReorder) return;
    const oldIdx = sections.findIndex((s) => s.id === active.id);
    const newIdx = sections.findIndex((s) => s.id === over.id);
    onReorder(arrayMove(sections, oldIdx, newIdx));
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-screen" style={{ background: "var(--t-bg)" }}>
          <ThemedNav event={event} sections={sections} themeKey={themeKey} isEditor />
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
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 z-30 -translate-y-1/2 cursor-grab rounded-lg bg-white/90 p-1.5 shadow opacity-0 group-hover:opacity-100 transition"
        title="Drag to reorder"
      >
        <DragIcon />
      </div>
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

function SectionRenderer({ section, event, timeLeft, isEditor }) {
  const SectionComponent = SECTION_REGISTRY[section.section_type];
  if (!SectionComponent) {
    if (!isEditor) return null;
    return (
      <div className="border border-dashed border-red-300 bg-red-50 p-6 text-center text-sm text-red-600">
        Unknown section type: <code>{section.section_type}</code>
      </div>
    );
  }
  return (
    <SectionComponent
      section={section}
      event={event}
      timeLeft={timeLeft}
      isEditor={isEditor}
    />
  );
}

class SectionErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error(`[Section:${this.props.sectionType}]`, error); }
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

function DragIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9"  cy="5"  r="1" /><circle cx="15" cy="5"  r="1" />
      <circle cx="9"  cy="12" r="1" /><circle cx="15" cy="12" r="1" />
      <circle cx="9"  cy="19" r="1" /><circle cx="15" cy="19" r="1" />
    </svg>
  );
}
