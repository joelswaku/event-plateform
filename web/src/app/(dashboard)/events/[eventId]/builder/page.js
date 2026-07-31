"use client";

import { useEffect, useRef, useState, useMemo, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useBuilderStore } from "@/store/builder.store";
import { useSubscriptionStore } from "@/store/subscription.store";
import BuilderSidebar   from "@/components/events/builder/BuilderSidebar";
import BuilderTopbar    from "@/components/events/builder/BuilderTopbar";
import SectionConfigPanel from "@/components/events/builder/SectionConfigPanel";
import MobileBottomBar  from "@/components/events/builder/MobileBottomBar";
import SharedEventRenderer from "@/components/events/shared/SharedEventRenderer";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { resolveTemplate } from "@/lib/defaultTemplates";
import { PAGE_PRESETS } from "@/builder/page-presets";
import TemplatePicker from "@/components/templates/TemplatePicker";

function makeLayoutPreviewSections(layoutKey, currentSections = []) {
  const preset = PAGE_PRESETS[layoutKey];
  if (!preset) return currentSections;

  return preset.sections.map((type, index) => {
    const existing = currentSections.find((section) => section.section_type === type);
    return {
      ...(existing ?? {}),
      id: `layout-preview-${layoutKey}-${type}-${index}`,
      section_type: type,
      position_order: index + 1,
      is_visible: true,
      config: { ...(existing?.config ?? {}), _theme: layoutKey },
    };
  });
}

function PremiumLayoutPreviewGate({ open, layoutLabel, onCancel, onUpgrade }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-5 backdrop-blur-[2px]"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 360 }}
            className="w-full max-w-sm overflow-hidden rounded-3xl p-6 text-center"
            style={{ background: "#171B25", border: "1px solid rgba(255,255,255,0.13)", boxShadow: "0 28px 80px rgba(0,0,0,0.55)" }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${layoutLabel} layout preview`}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.28), rgba(249,115,22,0.18))", border: "1px solid rgba(245,158,11,0.35)", color: "#FBBF24" }}>
              <span className="text-xl">✦</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "#FBBF24" }}>Premium layout preview</p>
            <h2 className="mt-2 text-[22px] font-black tracking-tight text-white">{layoutLabel} looks great on your event.</h2>
            <p className="mt-2 text-[13px] leading-6" style={{ color: "rgba(255,255,255,0.62)" }}>
              You can preview this design, but a paid plan is required to keep it on your event page.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl px-3 py-3 text-[12px] font-bold transition hover:bg-white/[0.08]"
                style={{ color: "rgba(255,255,255,0.78)", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                Back to free layout
              </button>
              <button
                onClick={onUpgrade}
                className="flex-1 rounded-xl px-3 py-3 text-[12px] font-black transition hover:brightness-110 active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", color: "#211504", boxShadow: "0 8px 22px rgba(245,158,11,0.28)" }}
              >
                Upgrade to use it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BuilderContent() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const fromCreate   = searchParams.get("from") === "create";
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;

  const builder             = useBuilderStore((s) => s.builder);
  const fetchBuilder        = useBuilderStore((s) => s.fetchBuilder);
  const batchCreateSections = useBuilderStore((s) => s.batchCreateSections);
  const updateSection       = useBuilderStore((s) => s.updateSection);
  const reorderSections     = useBuilderStore((s) => s.reorderSections);
  const undo                = useBuilderStore((s) => s.undo);
  const redo                = useBuilderStore((s) => s.redo);
  const openUpgradeModal    = useSubscriptionStore((s) => s.openUpgradeModal);

  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const selectedSection = useMemo(
    () => builder?.sections?.find((s) => s.id === selectedSectionId) ?? null,
    [builder?.sections, selectedSectionId]
  );

  const [isSidebarOpen,     setIsSidebarOpen]     = useState(true);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(fromCreate);
  const [device,             setDevice]             = useState("desktop");
  const [panelWidth,    setPanelWidth]    = useState(340);
  const [mobileSheet,   setMobileSheet]   = useState(null); // 'blocks' | 'layers' | 'edit' | null
  const [previewLayout, setPreviewLayout] = useState(null);
  const [showPreviewGate, setShowPreviewGate] = useState(false);
  const resizing        = useRef(false);
  const templateApplied = useRef(false);
  const previewGateTimer = useRef(null);

  const previewSections = useMemo(
    () => previewLayout ? makeLayoutPreviewSections(previewLayout, builder?.sections ?? []) : null,
    [previewLayout, builder?.sections]
  );
  const displayedSections = previewSections ?? builder?.sections ?? [];

  useEffect(() => {
    if (eventId) fetchBuilder(eventId);
  }, [eventId, fetchBuilder]);

  useEffect(() => () => {
    if (previewGateTimer.current) clearTimeout(previewGateTimer.current);
  }, []);

  // Auto-apply default template when builder loads with no sections
  useEffect(() => {
    if (!builder || templateApplied.current) return;
    if ((builder.sections?.length ?? 0) > 0) { templateApplied.current = true; return; }
    templateApplied.current = true;
    const event = builder.event;
    const keys  = resolveTemplate(event?.event_type);

    batchCreateSections(eventId, keys).then((newSections) => {
      if (!newSections?.length || !event) return;
      const prefills = [];
      for (const s of newSections) {
        switch (s.section_type) {
          case "HERO":
            prefills.push(updateSection(eventId, s.id, {
              title: event.title || s.title,
              body:  event.short_description || event.description || s.body,
              config: { ...(s.config ?? {}), ...(event.cover_image_url ? { background_image: event.cover_image_url } : {}) },
            }));
            break;
          case "VENUE":
            if (event.venue_name || event.venue_address || event.city) {
              prefills.push(updateSection(eventId, s.id, {
                config: { ...(s.config ?? {}), venue_name: event.venue_name ?? "", venue_address: event.venue_address ?? "", city: event.city ?? "", state: event.state ?? "", country: event.country ?? "" },
              }));
            }
            break;
          case "COUNTDOWN":
            if (event.starts_at_utc) {
              prefills.push(updateSection(eventId, s.id, { config: { ...(s.config ?? {}), starts_at: event.starts_at_utc } }));
            }
            break;
          default: break;
        }
      }
      Promise.all(prefills);
    });
  }, [builder, eventId, batchCreateSections, updateSection]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  // Drag-to-resize config panel (desktop only)
  useEffect(() => {
    const move = (e) => {
      if (!resizing.current) return;
      const w = window.innerWidth - e.clientX;
      if (w > 280 && w < 600) setPanelWidth(w);
    };
    const stop = () => { resizing.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup",   stop);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", stop); };
  }, []);

  const handleSectionClick = useCallback((section) => {
    setSelectedSectionId((prev) => (prev === section.id ? null : section.id));
    // On mobile/tablet open edit sheet automatically
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileSheet("edit");
    }
  }, []);

  const handleReorder = useCallback((reorderedSections) => {
    if (previewLayout) return;
    const payload = reorderedSections.map((s, i) => ({ id: s.id, position_order: i + 1 }));
    reorderSections(eventId, payload);
  }, [eventId, reorderSections, previewLayout]);

  const dismissLayoutPreview = useCallback(() => {
    if (previewGateTimer.current) clearTimeout(previewGateTimer.current);
    previewGateTimer.current = null;
    setShowPreviewGate(false);
    setPreviewLayout(null);
  }, []);

  const previewLockedLayout = useCallback((layoutKey) => {
    if (!PAGE_PRESETS[layoutKey]) return;
    const scrollPreviewToTop = () => {
      document.querySelectorAll("[data-builder-preview-scroll]").forEach((element) => {
        element.scrollTo({ top: 0, behavior: "smooth" });
      });
    };
    if (previewGateTimer.current) clearTimeout(previewGateTimer.current);
    setSelectedSectionId(null);
    setMobileSheet(null);
    setShowPreviewGate(false);
    setPreviewLayout(layoutKey);
    requestAnimationFrame(scrollPreviewToTop);
    previewGateTimer.current = setTimeout(() => {
      scrollPreviewToTop();
      setShowPreviewGate(true);
      previewGateTimer.current = null;
    }, 700);
  }, []);

  const upgradeFromLayoutPreview = useCallback(() => {
    dismissLayoutPreview();
    openUpgradeModal("templates");
  }, [dismissLayoutPreview, openUpgradeModal]);

  const previewWidth = {
    mobile:  "w-[390px]",
    tablet:  "w-[768px]",
    desktop: "w-full",
  }[device];

  if (!builder) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#0e0f11]">
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
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <div className="hidden lg:flex shrink-0">
        <BuilderSidebar
          eventId={eventId}
          sections={displayedSections}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((v) => !v)}
          selectedSectionId={selectedSectionId}
          onSectionSelect={handleSectionClick}
          onBrowseTemplates={() => setTemplatePickerOpen(true)}
          onLockedPresetPreview={previewLockedLayout}
        />
      </div>

      {/* ── Main column ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <BuilderTopbar
          eventId={eventId}
          device={device}
          onDeviceChange={setDevice}
          onTemplatesOpen={() => setTemplatePickerOpen(true)}
          showDone={fromCreate}
        />

        {/* Canvas + config row */}
        <div className="flex flex-1 overflow-hidden">

          {/* Canvas area */}
          <div className="flex flex-1 min-h-0 overflow-hidden" data-canvas-scroll style={{ background: "#1a1b1f" }}>

            {/* ── Mobile canvas: full-width, no device frame ── */}
            <div data-builder-preview-scroll className="flex w-full flex-col overflow-y-auto lg:hidden">
              <SharedEventRenderer
                event={{ ...builder.event, speakers: builder.speakers || [], schedule_items: builder.schedule_items || [] }}
                sections={displayedSections}
                isEditor
                onSectionClick={handleSectionClick}
                onReorder={handleReorder}
                selectedSectionId={selectedSectionId}
              />
            </div>

            {/* ── Desktop canvas: device frame ── */}
            <div data-builder-preview-scroll className={`hidden lg:flex flex-1 min-h-0 overflow-y-auto ${device !== "desktop" ? "items-start justify-center p-6" : ""}`}>
              <div className={`${previewWidth} transition-all duration-300 ${device === "desktop" ? "min-h-full" : ""}`}>
                <div
                  className="overflow-hidden shadow-2xl"
                  style={{ borderRadius: device !== "desktop" ? 12 : 0, border: device !== "desktop" ? "1px solid rgba(255,255,255,0.08)" : "none" }}
                >
                  {/* Browser chrome bar — only for tablet/mobile frames */}
                  {device !== "desktop" && (
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
                  )}
                  <SharedEventRenderer
                    event={{ ...builder.event, speakers: builder.speakers || [], schedule_items: builder.schedule_items || [] }}
                    sections={displayedSections}
                    isEditor
                    onSectionClick={handleSectionClick}
                    onReorder={handleReorder}
                    selectedSectionId={selectedSectionId}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Desktop config panel ─────────────────────────────── */}
          {selectedSection && (
            <>
              <div
                className="hidden lg:flex cursor-col-resize items-center justify-center shrink-0"
                style={{ width: 6, background: "rgba(255,255,255,0.04)" }}
                onMouseDown={() => { resizing.current = true; }}
              >
                <div className="h-12 w-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
              </div>

              <aside
                className="hidden lg:flex flex-col shrink-0"
                style={{
                  width: panelWidth,
                  background: "#16181c",
                  borderLeft: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="flex h-14 shrink-0 items-center justify-between px-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex flex-col">
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6c6fee" }}>
                      {selectedSection.section_type}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f1f3" }}>Edit Section</span>
                  </div>
                  <button
                    onClick={() => setSelectedSectionId(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#8b8f9a" }}
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <SectionConfigPanel section={selectedSection} eventId={eventId} />
                </div>
              </aside>
            </>
          )}
        </div>

        {/* ── Template Picker ───────────────────────────────────────── */}
        <TemplatePicker
          eventId={eventId}
          isOpen={templatePickerOpen}
          onClose={() => setTemplatePickerOpen(false)}
          eventType={builder.event?.event_type}
        />

        <PremiumLayoutPreviewGate
          open={showPreviewGate}
          layoutLabel={PAGE_PRESETS[previewLayout]?.label ?? "Premium"}
          onCancel={dismissLayoutPreview}
          onUpgrade={upgradeFromLayoutPreview}
        />

        {/* ── Mobile bottom bar ─────────────────────────────────────── */}
        <div className="lg:hidden shrink-0">
          <MobileBottomBar
            eventId={eventId}
            sections={displayedSections}
            selectedSectionId={selectedSectionId}
            selectedSection={selectedSection}
            onSectionSelect={handleSectionClick}
            onDeselectSection={() => setSelectedSectionId(null)}
            activeSheet={mobileSheet}
            onSheetChange={setMobileSheet}
            onBrowseTemplates={() => setTemplatePickerOpen(true)}
            onLockedPresetPreview={previewLockedLayout}
          />
        </div>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense>
      <BuilderContent />
    </Suspense>
  );
}
