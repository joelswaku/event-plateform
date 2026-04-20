"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RectangleStackIcon,
  InformationCircleIcon,
  PhotoIcon,
  QuestionMarkCircleIcon,
  MegaphoneIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import SortableSectionList from "@/components/builder/SortableSectionList";
import { PAGE_PRESETS } from "@/builder/page-presets";
import { useBuilderStore } from "@/store/builder.store";

const btn =
  "inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus:outline-none disabled:opacity-40";

const BLOCK_ITEMS = [
  { type: "HERO",     Icon: RectangleStackIcon,    label: "Hero"     },
  { type: "ABOUT",    Icon: InformationCircleIcon,  label: "About"    },
  { type: "GALLERY",  Icon: PhotoIcon,              label: "Gallery"  },
  { type: "FAQ",      Icon: QuestionMarkCircleIcon, label: "FAQ"      },
  { type: "CTA",      Icon: MegaphoneIcon,          label: "CTA"      },
  { type: "SPEAKERS", Icon: UserGroupIcon,          label: "Speakers" },
];

export default function BuilderSidebar({ eventId, sections, isOpen, onToggle, selectedSectionId, onSectionSelect }) {
  const createSectionFromTemplate = useBuilderStore((s) => s.createSectionFromTemplate);
  const applyPreset               = useBuilderStore((s) => s.applyPreset);

  const handlePresetSelect = async (e) => {
    const preset = PAGE_PRESETS[e.target.value];
    if (!preset) return;
    e.target.value = "";
    await applyPreset(eventId, preset.sections);
  };

  return (
    <aside
      className="flex flex-col border-r shrink-0 transition-all duration-300"
      style={{
        width: isOpen ? 268 : 56,
        background: "#16181c",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      {/* Header */}
      <div
        className="flex h-14 items-center justify-between px-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <LogoMark />
          <span
            className="text-[13px] font-semibold whitespace-nowrap overflow-hidden transition-all duration-300"
            style={{ opacity: isOpen ? 1 : 0, maxWidth: isOpen ? 120 : 0 }}
          >
            Page Builder
          </span>
        </div>
        <button
          onClick={onToggle}
          className={`${btn} h-7 w-7 shrink-0`}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#8b8f9a",
          }}
        >
          {isOpen
            ? <ChevronLeftIcon className="h-3.5 w-3.5" />
            : <ChevronRightIcon className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Collapsed: icon strip */}
      {!isOpen && (
        <div className="flex flex-col items-center gap-2 pt-4">
          {BLOCK_ITEMS.map(({ type, Icon, label }) => (
            <button
              key={type}
              title={label}
              onClick={() => createSectionFromTemplate(eventId, type)}
              className={`${btn} h-9 w-9`}
              style={{ color: "#8b8f9a", borderRadius: 8 }}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}

      {/* Expanded body */}
      {isOpen && (
        <div className="flex flex-col gap-5 overflow-y-auto p-4">
          {/* Preset template */}
          <div className="flex flex-col gap-2">
            <SidebarLabel>Template</SidebarLabel>
            <select
              defaultValue=""
              onChange={handlePresetSelect}
              className="w-full rounded-md px-3 py-2 text-xs"
              style={{
                background: "#1e2026",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0f1f3",
              }}
            >
              <option value="" disabled>Select a preset…</option>
              {Object.entries(PAGE_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Add block grid */}
          <div className="flex flex-col gap-2">
            <SidebarLabel>Add Block</SidebarLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {BLOCK_ITEMS.map(({ type, Icon, label }) => (
                <button
                  key={type}
                  onClick={() => createSectionFromTemplate(eventId, type)}
                  className={`${btn} flex-col gap-1.5 py-3`}
                  style={{
                    background: "#1e2026",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "#8b8f9a",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

          {/* Layers */}
          <div className="flex flex-col gap-2">
            <SidebarLabel>Layers</SidebarLabel>
            <SortableSectionList
              eventId={eventId}
              sections={sections}
              selectedSectionId={selectedSectionId}
              onSectionSelect={onSectionSelect}
            />
          </div>
        </div>
      )}
    </aside>
  );
}

function SidebarLabel({ children }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-widest"
      style={{ color: "#555a66" }}
    >
      {children}
    </span>
  );
}

function LogoMark() {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
      style={{ background: "#6c6fee" }}
    >
      <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
        <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" opacity="0.9" />
        <rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" opacity="0.55" />
        <rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" opacity="0.55" />
        <rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" opacity="0.25" />
      </svg>
    </div>
  );
}
