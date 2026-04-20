"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useBuilderStore } from "@/store/builder.store";
import BuilderSidebar from "@/components/events/builder/BuilderSidebar";
import BuilderTopbar from "@/components/events/builder/BuilderTopbar";
import SectionConfigPanel from "@/components/events/builder/SectionConfigPanel";
import SharedEventRenderer from "@/components/events/shared/SharedEventRenderer";
import { XMarkIcon } from "@heroicons/react/24/outline";

const btn =
  "inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus:outline-none disabled:opacity-40";

export default function BuilderPage() {
  const params  = useParams();
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;

  const builder        = useBuilderStore((s) => s.builder);
  const fetchBuilder   = useBuilderStore((s) => s.fetchBuilder);
  const reorderSections = useBuilderStore((s) => s.reorderSections);
  const undo           = useBuilderStore((s) => s.undo);
  const redo           = useBuilderStore((s) => s.redo);

  // Track selection by ID — derive actual section from live store data
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const selectedSection = useMemo(
    () => builder?.sections?.find((s) => s.id === selectedSectionId) ?? null,
    [builder?.sections, selectedSectionId]
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [device,        setDevice]        = useState("desktop");
  const [panelWidth,    setPanelWidth]    = useState(340);
  const resizing = useRef(false);

  // Initial load
  useEffect(() => {
    if (eventId) fetchBuilder(eventId);
  }, [eventId, fetchBuilder]);

  // Keyboard shortcuts: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z = redo
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  // Drag-to-resize config panel
  useEffect(() => {
    const move = (e) => {
      if (!resizing.current) return;
      const w = window.innerWidth - e.clientX;
      if (w > 280 && w < 600) setPanelWidth(w);
    };
    const stop = () => { resizing.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup",   stop);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup",   stop);
    };
  }, []);

  const handleSectionClick = useCallback((section) => {
    setSelectedSectionId((prev) => (prev === section.id ? null : section.id));
  }, []);

  const handleReorder = useCallback((reorderedSections) => {
    const payload = reorderedSections.map((s, i) => ({ id: s.id, position_order: i + 1 }));
    reorderSections(eventId, payload);
  }, [eventId, reorderSections]);

  const previewWidth = {
    mobile:  "w-[390px]",
    tablet:  "w-[768px]",
    desktop: "w-full max-w-[1200px]",
  }[device];

  if (!builder) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e0f11]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-xs text-white/40">Loading builder…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: "#0e0f11", color: "#f0f1f3" }}
    >
      <BuilderSidebar
        eventId={eventId}
        sections={builder.sections || []}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((v) => !v)}
        selectedSectionId={selectedSectionId}
        onSectionSelect={handleSectionClick}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <BuilderTopbar
          eventId={eventId}
          device={device}
          onDeviceChange={setDevice}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Preview canvas */}
          <div
            className="flex flex-1 items-start justify-center overflow-auto"
            style={{ background: "#1a1b1f", padding: 24 }}
          >
            <div className={`${previewWidth} transition-all duration-300`}>
              <div
                className="overflow-hidden shadow-2xl"
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* Browser chrome bar */}
                <div
                  className="flex h-10 items-center gap-2 px-4"
                  style={{ background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <div className="ml-3 flex-1 rounded-md bg-white border border-gray-200 px-3 py-1 text-xs text-gray-400">
                    {builder.event?.slug
                      ? `yoursite.com/e/${builder.event.slug}`
                      : "yoursite.com/e/event-slug"}
                  </div>
                </div>

                <SharedEventRenderer
                  event={builder.event}
                  sections={builder.sections || []}
                  isEditor={true}
                  onSectionClick={handleSectionClick}
                  onReorder={handleReorder}
                  selectedSectionId={selectedSectionId}
                />
              </div>
            </div>
          </div>

          {/* Drag resize handle */}
          {selectedSection && (
            <div
              onMouseDown={() => { resizing.current = true; }}
              className="flex cursor-col-resize items-center justify-center"
              style={{ width: 6, background: "rgba(255,255,255,0.04)", flexShrink: 0 }}
            >
              <div
                className="h-12 w-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)" }}
              />
            </div>
          )}

          {/* Config panel */}
          {selectedSection && (
            <aside
              style={{
                width: panelWidth,
                minWidth: panelWidth,
                background: "#16181c",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="flex h-14 shrink-0 items-center justify-between px-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex flex-col">
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#6c6fee",
                    }}
                  >
                    {selectedSection.section_type}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f1f3" }}>
                    Edit Section
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSectionId(null)}
                  className={`${btn} h-7 w-7`}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#8b8f9a",
                  }}
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <SectionConfigPanel
                  section={selectedSection}
                  eventId={eventId}
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
