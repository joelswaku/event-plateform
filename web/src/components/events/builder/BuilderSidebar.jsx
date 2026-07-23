"use client";

import { useMemo } from "react";
import {
  ChevronLeftIcon, ChevronRightIcon,
  RectangleStackIcon, InformationCircleIcon, PhotoIcon,
  QuestionMarkCircleIcon, MegaphoneIcon, UserGroupIcon,
  ClockIcon, MapPinIcon, CalendarDaysIcon,
  TicketIcon, HeartIcon, BookOpenIcon, LockClosedIcon,
} from "@heroicons/react/24/outline";

import SortableSectionList from "@/components/builder/SortableSectionList";
import { PAGE_PRESETS } from "@/builder/page-presets";
import { STYLE_META } from "@/lib/styleThemes";
import { useBuilderStore } from "@/store/builder.store";
import { useSubscriptionStore } from "@/store/subscription.store";

const btn =
  "inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus:outline-none disabled:opacity-40";

const BLOCK_ITEMS = [
  { type: "HERO",      Icon: RectangleStackIcon,    label: "Hero"      },
  { type: "ABOUT",     Icon: InformationCircleIcon,  label: "About"     },
  { type: "GALLERY",   Icon: PhotoIcon,              label: "Gallery"   },
  { type: "SCHEDULE",  Icon: CalendarDaysIcon,       label: "Schedule"  },
  { type: "VENUE",     Icon: MapPinIcon,             label: "Venue"     },
  { type: "COUNTDOWN", Icon: ClockIcon,              label: "Countdown" },
  { type: "FAQ",       Icon: QuestionMarkCircleIcon, label: "FAQ"       },
  { type: "CTA",       Icon: MegaphoneIcon,          label: "CTA"       },
  { type: "SPEAKERS",  Icon: UserGroupIcon,          label: "Speakers"  },
  { type: "TICKETS",   Icon: TicketIcon,             label: "Tickets"   },
  { type: "COUPLE",    Icon: HeartIcon,              label: "Couple"    },
  { type: "STORY",     Icon: BookOpenIcon,           label: "Story"     },
];

export default function BuilderSidebar({
  eventId, sections, isOpen, onToggle, selectedSectionId, onSectionSelect,
}) {
  const createSectionFromTemplate = useBuilderStore((s) => s.createSectionFromTemplate);
  const applyPreset               = useBuilderStore((s) => s.applyPreset);
  const setTheme                  = useBuilderStore((s) => s.setTheme);

  const features        = useSubscriptionStore((s) => s.features);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
  // Locked when server says templates are locked (free plan); unlocked on starter+
  const lockedTemplates = features?.lockedTemplates ?? true;

  const activeTheme = useMemo(() => {
    const first = sections?.find((s) => s?.config?._theme);
    return first?.config?._theme || "CLASSIC";
  }, [sections]);

  const handlePresetSelect = async (presetKey) => {
    if (lockedTemplates && presetKey !== "CLASSIC") {
      openUpgradeModal("templates");
      return;
    }
    const preset = PAGE_PRESETS[presetKey];
    if (!preset) return;

    const themeId = STYLE_META[presetKey] ? presetKey : "CLASSIC";
    const sectionsWithTheme = preset.sections.map((s) => ({
      type: s,
      config: { _theme: themeId },
    }));
    const newSections = await applyPreset(eventId, sectionsWithTheme);
    if (newSections?.length && newSections[0]?.config?._theme !== themeId) {
      await setTheme(eventId, themeId);
    }
  };

  return (
    <aside
      className="flex flex-col border-r shrink-0 transition-all duration-300"
      style={{
        width: isOpen ? 272 : 56,
        background: "#16181c",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className="flex h-14 items-center justify-between px-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <LogoMark />
          <span
            className="text-[13px] font-semibold whitespace-nowrap overflow-hidden transition-all duration-300"
            style={{ opacity: isOpen ? 1 : 0, maxWidth: isOpen ? 140 : 0, color: "#e4e6eb" }}
          >
            Page Builder
          </span>
        </div>
        <button
          onClick={onToggle}
          className={`${btn} h-7 w-7 shrink-0`}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#8b8f9a" }}
        >
          {isOpen ? <ChevronLeftIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ── Collapsed: icon strip ───────────────────────────────────── */}
      {!isOpen && (
        <div className="flex flex-col items-center gap-2 pt-4">
          {BLOCK_ITEMS.map(({ type, Icon, label }) => (
            <button
              key={type}
              title={label}
              onClick={() => createSectionFromTemplate(eventId, type)}
              className={`${btn} h-9 w-9`}
              style={{ color: "#b8bdc9", borderRadius: 8 }}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}

      {/* ── Expanded body ───────────────────────────────────────────── */}
      {isOpen && (
        <div className="flex flex-col gap-5 overflow-y-auto p-4">

          {/* ── Layout Presets ──────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <SidebarLabel>Layout</SidebarLabel>
            <div className="flex flex-col gap-1">
              {Object.entries(PAGE_PRESETS).map(([k, v]) => {
                const locked  = lockedTemplates && k !== "CLASSIC";
                const isActive = activeTheme === k;
                const meta    = STYLE_META[k];
                return (
                  <button
                    key={k}
                    onClick={() => handlePresetSelect(k)}
                    className="flex items-center gap-2.5 w-full text-left rounded-md px-3 py-2 transition-colors"
                    style={{
                      background: isActive ? "rgba(108,111,238,0.12)" : "#1e2026",
                      border: `1px solid ${isActive ? "rgba(108,111,238,0.4)" : "rgba(255,255,255,0.07)"}`,
                      cursor: "pointer",
                    }}
                  >
                    {meta && (
                      <div
                        style={{
                          width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                          background: meta.preview.accent,
                          opacity: locked ? 0.4 : 1,
                        }}
                      />
                    )}
                    <span
                      style={{
                        flex: 1, fontSize: 12, fontWeight: 500,
                        color: locked ? "#7a7f8e" : isActive ? "#c4c6ff" : "#d4d7df",
                      }}
                    >
                      {v.label}
                    </span>
                    <span style={{ fontSize: 10, color: "#8b909e" }}>
                      {v.sections.length} blocks
                    </span>
                    {locked && (
                      <LockClosedIcon style={{ width: 11, height: 11, color: "#f0c060", flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
            {lockedTemplates && (
              <p style={{ fontSize: 10, color: "#9096a3", lineHeight: 1.5, marginTop: 2 }}>
                Classic is free. Upgrade to Starter to unlock all layouts and styles.
              </p>
            )}
          </div>

          {/* ── Add Block ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <SidebarLabel>Add Block</SidebarLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {BLOCK_ITEMS.map(({ type, Icon, label }) => (
                <button
                  key={type}
                  onClick={() => createSectionFromTemplate(eventId, type)}
                  className={`${btn} flex-col gap-1.5 py-2.5`}
                  style={{
                    background: "#1e2026",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "#b8bdc9",
                    borderRadius: 7,
                    fontSize: 10,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

          {/* ── Layers ──────────────────────────────────────────────── */}
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
    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#9ca3b4" }}>
      {children}
    </span>
  );
}

function LogoMark() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: "#6c6fee" }}>
      <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
        <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" opacity="0.9" />
        <rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" opacity="0.55" />
        <rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" opacity="0.55" />
        <rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" opacity="0.25" />
      </svg>
    </div>
  );
}
