"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PhotoIcon,
  InformationCircleIcon,
  BookOpenIcon,
  HeartIcon,
  ClockIcon,
  MapPinIcon,
  GiftIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  TicketIcon,
  CurrencyDollarIcon,
  QuestionMarkCircleIcon,
  MegaphoneIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";
import { useBuilderStore } from "@/store/builder.store";

const SECTION_META = {
  HERO:      { label: "Hero",      Icon: PhotoIcon },
  ABOUT:     { label: "About",     Icon: InformationCircleIcon },
  STORY:     { label: "Story",     Icon: BookOpenIcon },
  COUPLE:    { label: "Couple",    Icon: HeartIcon },
  COUNTDOWN: { label: "Countdown", Icon: ClockIcon },
  VENUE:     { label: "Venue",     Icon: MapPinIcon },
  REGISTRY:  { label: "Registry",  Icon: GiftIcon },
  GALLERY:   { label: "Gallery",   Icon: Square2StackIcon },
  SCHEDULE:  { label: "Schedule",  Icon: CalendarDaysIcon },
  SPEAKERS:  { label: "Speakers",  Icon: UserGroupIcon },
  TICKETS:   { label: "Tickets",   Icon: TicketIcon },
  DONATIONS: { label: "Donations", Icon: CurrencyDollarIcon },
  FAQ:       { label: "FAQ",       Icon: QuestionMarkCircleIcon },
  CTA:       { label: "CTA",       Icon: MegaphoneIcon },
};

function DragHandle(props) {
  return (
    <button
      {...props}
      onClick={(e) => e.stopPropagation()}
      className="flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded active:cursor-grabbing"
      style={{ color: "#3d4150" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7280")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#3d4150")}
    >
      <svg width="10" height="14" viewBox="0 0 10 16" fill="currentColor">
        <circle cx="2.5" cy="2"  r="1.5" />
        <circle cx="7.5" cy="2"  r="1.5" />
        <circle cx="2.5" cy="8"  r="1.5" />
        <circle cx="7.5" cy="8"  r="1.5" />
        <circle cx="2.5" cy="14" r="1.5" />
        <circle cx="7.5" cy="14" r="1.5" />
      </svg>
    </button>
  );
}

function SortableItem({ section, eventId, isSelected, onSelect }) {
  const updateSection = useBuilderStore((s) => s.updateSection);
  const deleteSection = useBuilderStore((s) => s.deleteSection);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const meta = SECTION_META[section.section_type] ?? {
    label: section.section_type,
    Icon: Square2StackIcon,
  };
  const { Icon } = meta;
  const displayName = section.title || meta.label;
  const isVisible = section.is_visible !== false;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const handleVisibilityToggle = (e) => {
    e.stopPropagation();
    updateSection(eventId, section.id, { is_visible: !isVisible });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteSection(eventId, section.id);
  };

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelect(section)}
      className="group flex items-center gap-1.5 rounded-md px-1.5 py-1.5 cursor-pointer select-none"
      style={{
        ...style,
        background: isSelected
          ? "rgba(99,102,241,0.15)"
          : isDragging
          ? "#1e2026"
          : "transparent",
        boxShadow: isSelected ? "inset 0 0 0 1px rgba(99,102,241,0.35)" : "none",
        transition: `${style.transition ?? ""}, background 150ms, box-shadow 150ms`,
      }}
    >
      <DragHandle {...attributes} {...listeners} />

      <Icon
        className="h-3.5 w-3.5 shrink-0"
        style={{ color: isSelected ? "#818cf8" : "#555a66" }}
      />

      <span
        className="flex-1 truncate text-[12px] font-medium leading-none"
        style={{ color: isSelected ? "#e2e4e9" : "#8b8f9a" }}
      >
        {displayName}
      </span>

      {/* Visibility toggle — always shown when hidden, hover-only when visible */}
      <button
        onClick={handleVisibilityToggle}
        className={`shrink-0 p-0.5 rounded transition-opacity ${
          isVisible ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
        style={{ color: isVisible ? "#555a66" : "#6b7280" }}
        title={isVisible ? "Hide section" : "Show section"}
      >
        {isVisible
          ? <EyeIcon className="h-3.5 w-3.5" />
          : <EyeSlashIcon className="h-3.5 w-3.5" />}
      </button>

      <button
        onClick={handleDelete}
        className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
        style={{ color: "#555a66" }}
        title="Delete section"
      >
        <TrashIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function SortableSectionList({
  eventId,
  sections,
  selectedSectionId,
  onSectionSelect,
}) {
  const reorderSections = useBuilderStore((s) => s.reorderSections);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);
    reorderSections(
      eventId,
      reordered.map((s, i) => ({ id: s.id, position_order: i + 1 }))
    );
  };

  if (!sections?.length) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-1 rounded-md px-4 py-6 text-center"
        style={{
          border: "1px dashed rgba(255,255,255,0.08)",
          color: "#3d4150",
        }}
      >
        <Square2StackIcon className="h-5 w-5 opacity-40" />
        <span className="text-[11px]">No sections yet.</span>
        <span className="text-[11px]">Add a block above to get started.</span>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-0.5">
          {sections.map((section) => (
            <SortableItem
              key={section.id}
              section={section}
              eventId={eventId}
              isSelected={section.id === selectedSectionId}
              onSelect={onSectionSelect ?? (() => {})}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
