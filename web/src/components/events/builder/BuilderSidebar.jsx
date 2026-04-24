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

  const isSubscribed    = useSubscriptionStore((s) => s.isSubscribed);
  const plan            = useSubscriptionStore((s) => s.plan);
  const openUpgradeModal = useSubscriptionStore((s) => s.openUpgradeModal);
  const isPremium = isSubscribed && plan === "premium";

  const activeTheme = useMemo(() => {
    const first = sections?.find((s) => s?.config?._theme);
    return first?.config?._theme || "CLASSIC";
  }, [sections]);

  const handleThemeChange = (themeId) => {
    if (themeId !== "CLASSIC" && !isPremium) {
      openUpgradeModal("templates");
      return;
    }
    if (sections?.length) setTheme(eventId, themeId);
  };

  const handlePresetSelect = async (e) => {
    const presetKey = e.target.value;
    const preset = PAGE_PRESETS[presetKey];
    if (!preset) return;
    e.target.value = "";

    // Free users: always apply CLASSIC theme regardless of chosen preset
    const themeId = isPremium && STYLE_META[presetKey] ? presetKey : "CLASSIC";
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
            style={{ opacity: isOpen ? 1 : 0, maxWidth: isOpen ? 140 : 0 }}
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
              style={{ color: "#8b8f9a", borderRadius: 8 }}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}

      {/* ── Expanded body ───────────────────────────────────────────── */}
      {isOpen && (
        <div className="flex flex-col gap-5 overflow-y-auto p-4">

          {/* ── Style / Theme Switcher ──────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <SidebarLabel>Style</SidebarLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(STYLE_META).map(([id, meta]) => {
                const isActive  = activeTheme === id;
                const locked    = id !== "CLASSIC" && !isPremium;
                return (
                  <button
                    key={id}
                    onClick={() => handleThemeChange(id)}
                    title={locked ? `${meta.label} — Premium` : meta.description}
                    style={{
                      border: `1px solid ${isActive ? meta.preview.accent : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 7,
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
                    {/* Hero preview strip */}
                    <div style={{ height: 28, background: meta.preview.hero, position: "relative", overflow: "hidden" }}>
                      <div style={{
                        position: "absolute", inset: 0,
                        background: `repeating-linear-gradient(135deg, transparent, transparent 4px, ${meta.preview.accent}08 4px, ${meta.preview.accent}08 8px)`,
                      }} />
                      <div style={{ position: "absolute", bottom: 4, left: 5, right: 5 }}>
                        <div style={{ height: 2.5, background: "rgba(255,255,255,0.6)", borderRadius: 2, width: "72%", marginBottom: 2 }} />
                        <div style={{ height: 1.5, background: meta.preview.accent, opacity: 0.85, borderRadius: 2, width: "44%" }} />
                      </div>
                      {locked && (
                        <div style={{
                          position: "absolute", top: 3, right: 3,
                          background: "rgba(0,0,0,0.55)",
                          borderRadius: 4, padding: "1px 3px",
                          display: "flex", alignItems: "center",
                        }}>
                          <LockClosedIcon style={{ width: 8, height: 8, color: "#f0c060" }} />
                        </div>
                      )}
                    </div>

                    {/* Content preview strip */}
                    <div style={{ background: meta.preview.bg, padding: "4px 5px 5px" }}>
                      <div style={{ height: 1.5, background: "rgba(0,0,0,0.2)", borderRadius: 1, width: "88%", marginBottom: 2 }} />
                      <div style={{ height: 1.5, background: "rgba(0,0,0,0.12)", borderRadius: 1, width: "65%", marginBottom: 2 }} />
                      <div style={{ height: 1.5, background: meta.preview.accent, opacity: 0.45, borderRadius: 1, width: "38%" }} />
                    </div>

                    {/* Label */}
                    <div style={{
                      background: isActive ? `${meta.preview.hero}ee` : "#1a1b1f",
                      padding: "2.5px 4px",
                      fontSize: 8.5,
                      textAlign: "center",
                      color: isActive ? meta.preview.accent : "#4a5060",
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      transition: "all 0.18s",
                    }}>
                      {meta.label}
                    </div>
                  </button>
                );
              })}
            </div>
            {!isPremium && (
              <p style={{ fontSize: 10, color: "#44495a", lineHeight: 1.5, marginTop: 2 }}>
                Classic is free. Upgrade to unlock all styles.
              </p>
            )}
          </div>

          {/* ── Layout Presets ──────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <SidebarLabel>Layout</SidebarLabel>
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
              <option value="" disabled>Apply a preset layout…</option>
              {Object.entries(PAGE_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}{k !== "CLASSIC" && !isPremium ? " (Classic style)" : ""}
                </option>
              ))}
            </select>
            {!isPremium && (
              <p style={{ fontSize: 10, color: "#44495a", lineHeight: 1.5 }}>
                All layouts available. Premium styles applied only for Pro users.
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
                    color: "#8b8f9a",
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
    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#555a66" }}>
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
