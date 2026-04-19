

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useBuilderStore } from "@/store/builder.store";
import SortableSectionList from "@/components/builder/SortableSectionList";
import EventPagePreview from "@/components/events/builder/EventPagePreview";
import SectionConfigPanel from "@/components/events/builder/SectionConfigPanel";
import { PAGE_PRESETS } from "@/builder/page-presets";

import {
  RectangleStackIcon,
  InformationCircleIcon,
  PhotoIcon,
  QuestionMarkCircleIcon,
  MegaphoneIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  DevicePhoneMobileIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// ── Tailwind utility helpers (avoids long className strings inline) ──────────
const btn =
  "inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-[#0e0f11] disabled:opacity-40";

const DEVICE_ICONS = {
  desktop: ComputerDesktopIcon,
  tablet: DeviceTabletIcon,
  mobile: DevicePhoneMobileIcon,
};

const MINI_ITEMS = [
  { type: "HERO",     icon: RectangleStackIcon,    label: "Hero"     },
  { type: "ABOUT",    icon: InformationCircleIcon,  label: "About"    },
  { type: "GALLERY",  icon: PhotoIcon,              label: "Gallery"  },
  { type: "FAQ",      icon: QuestionMarkCircleIcon, label: "FAQ"      },
  { type: "CTA",      icon: MegaphoneIcon,          label: "CTA"      },
  { type: "SPEAKERS", icon: UserGroupIcon,          label: "Speakers" },
];

const BLOCK_TYPES = ["HERO", "ABOUT", "GALLERY", "FAQ", "CTA", "SPEAKERS"];

export default function BuilderPage() {
  const params  = useParams();
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;

  const { builder, fetchBuilder, createSectionFromTemplate } = useBuilderStore();

  const [selectedSection, setSelectedSection] = useState(null);
  const [isEditorOpen,    setIsEditorOpen]    = useState(false);
  const [isSidebarOpen,   setIsSidebarOpen]   = useState(true);
  const [device,          setDevice]          = useState("desktop");
  const [panelWidth,      setPanelWidth]      = useState(360);

  const resizing = useRef(false);

  // ── Fetch builder on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (eventId) fetchBuilder(eventId);
  }, [eventId]);

  // ── Drag-to-resize panel ─────────────────────────────────────────────────
  useEffect(() => {
    const move = (e) => {
      if (!resizing.current) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 280 && newWidth < 600) setPanelWidth(newWidth);
    };
    const stop = () => (resizing.current = false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup",   stop);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup",   stop);
    };
  }, []);

  // ── Section select / deselect ────────────────────────────────────────────
  const handleSectionSelect = (section) => {
    if (selectedSection?.id === section.id) {
      setSelectedSection(null);
      setIsEditorOpen(false);
    } else {
      setSelectedSection(section);
      setIsEditorOpen(true);
      const el = document.getElementById(`section-${section.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // ── Preview width by device ──────────────────────────────────────────────
  const getDeviceWidth = () => {
    if (device === "mobile") return "w-[375px]";
    if (device === "tablet") return "w-[768px]";
    return "w-full max-w-[1200px]";
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!builder)
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e0f11]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-xs text-[#8b8f9a]">Loading builder…</span>
        </div>
      </div>
    );

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: "#0e0f11", fontFamily: "'DM Sans', sans-serif", color: "#f0f1f3" }}
    >

      {/* ═══════════════════════════════════════════════════════ SIDEBAR ══ */}
      <aside
        className="flex flex-col border-r transition-all duration-300"
        style={{
          width: isSidebarOpen ? 268 : 56,
          minWidth: isSidebarOpen ? 268 : 56,
          background: "#16181c",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        {/* ── Sidebar header ── */}
        <div
          className="flex h-14 items-center justify-between px-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
              style={{ background: "#6c6fee" }}
            >
              <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
                <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" opacity="0.55"/>
                <rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" opacity="0.25"/>
              </svg>
            </div>
            <span
              className="text-[13px] font-semibold whitespace-nowrap overflow-hidden transition-all duration-300"
              style={{ opacity: isSidebarOpen ? 1 : 0, maxWidth: isSidebarOpen ? 120 : 0 }}
            >
              Page Builder
            </span>
          </div>

          {/* Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`${btn} h-7 w-7 shrink-0`}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#8b8f9a" }}
          >
            {isSidebarOpen
              ? <ChevronLeftIcon className="h-3.5 w-3.5" />
              : <ChevronRightIcon className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* ── Collapsed: icon strip ── */}
        {!isSidebarOpen && (
          <div className="flex flex-col items-center gap-2 pt-4">
            {MINI_ITEMS.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                title={label}
                onClick={() => createSectionFromTemplate(eventId, type)}
                className={`${btn} h-9 w-9`}
                style={{ color: "#8b8f9a", borderRadius: 8 }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1e2026"; e.currentTarget.style.color = "#f0f1f3"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b8f9a"; }}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}

        {/* ── Expanded sidebar body ── */}
        {isSidebarOpen && (
          <div className="flex flex-col gap-5 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>

            {/* Template preset */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#555a66" }}>
                Template
              </span>
              <select
                onChange={async (e) => {
                  const preset = PAGE_PRESETS[e.target.value];
                  if (!preset) return;
                  for (const type of preset.sections) {
                    await createSectionFromTemplate(eventId, type);
                  }
                }}
                className="w-full rounded-md px-3 py-2 text-xs"
                style={{
                  background: "#1e2026",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f0f1f3",
                  fontFamily: "inherit",
                }}
              >
                <option value="">Select a preset…</option>
                {Object.entries(PAGE_PRESETS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Add block grid */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#555a66" }}>
                Add block
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {MINI_ITEMS.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => createSectionFromTemplate(eventId, type)}
                    className={`${btn} flex-col gap-1.5 py-3`}
                    style={{
                      background: "#1e2026",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "#8b8f9a",
                      borderRadius: 8,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#252830"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#f0f1f3"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#1e2026"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#8b8f9a"; }}
                  >
                    <Icon className="h-4 w-4" />
                    <span style={{ fontSize: 11 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

            {/* Layers / section list */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#555a66" }}>
                Layers
              </span>
              <SortableSectionList
                eventId={eventId}
                sections={builder.sections || []}
              />
            </div>

          </div>
        )}
      </aside>

      {/* ═══════════════════════════════════════════════════════════ MAIN ══ */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Topbar ── */}
        <div
          className="flex h-14 shrink-0 items-center justify-between px-4 gap-4"
          style={{ background: "#16181c", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Device switcher */}
          <div
            className="flex items-center rounded-md overflow-hidden"
            style={{ background: "#1e2026", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {["desktop", "tablet", "mobile"].map((d) => {
              const Icon = DEVICE_ICONS[d];
              const active = device === d;
              return (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  title={d.charAt(0).toUpperCase() + d.slice(1)}
                  className={`${btn} h-8 gap-1.5 px-3`}
                  style={{
                    background: active ? "#252830" : "transparent",
                    color: active ? "#f0f1f3" : "#8b8f9a",
                    fontSize: 11,
                    borderRadius: 0,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline capitalize">{d}</span>
                </button>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Live badge */}
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
              style={{ background: "rgba(62,207,142,0.1)", border: "1px solid rgba(62,207,142,0.2)", color: "#3ecf8e" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#3ecf8e" }} />
              Live
            </div>

            <button
              className={`${btn} h-8 px-3`}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#8b8f9a", fontSize: 12 }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1e2026"; e.currentTarget.style.color = "#f0f1f3"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b8f9a"; }}
            >
              Save
            </button>

            <button
              className={`${btn} h-8 px-4`}
              style={{ background: "#6c6fee", color: "#fff", fontSize: 12, fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = "#8b8ef5"}
              onMouseLeave={e => e.currentTarget.style.background = "#6c6fee"}
            >
              Publish
            </button>
          </div>
        </div>

        {/* ── Content row: preview + resize handle + panel ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Preview canvas */}
          <div
            className="flex flex-1 items-start justify-center overflow-auto"
            style={{ background: "#1a1b1f", padding: isSidebarOpen ? 24 : 0 }}
          >
            <div
              className={`${getDeviceWidth()} transition-all duration-300`}
            >
              <div
                className="overflow-hidden"
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                }}
              >
                <EventPagePreview
                  eventId={eventId}
                  sections={builder.sections || []}
                  onSelect={handleSectionSelect}
                  selectedSection={selectedSection}
                />
              </div>
            </div>
          </div>

          {/* Drag resize handle */}
          {isEditorOpen && (
            <div
              onMouseDown={() => (resizing.current = true)}
              className="group flex cursor-col-resize items-center justify-center"
              style={{ width: 6, background: "rgba(255,255,255,0.04)", flexShrink: 0 }}
            >
              <div
                className="h-12 w-1 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.15)" }}
              />
            </div>
          )}

          {/* Config panel */}
          {isEditorOpen && selectedSection && (
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
              {/* Panel header */}
              <div
                className="flex h-14 shrink-0 items-center justify-between px-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex flex-col">
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6c6fee" }}>
                    {selectedSection.section_type}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f1f3" }}>
                    Edit section
                  </span>
                </div>

                <button
                  onClick={() => {
                    setIsEditorOpen(false);
                    setSelectedSection(null);
                  }}
                  className={`${btn} h-7 w-7`}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#8b8f9a" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1e2026"; e.currentTarget.style.color = "#f0f1f3"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b8f9a"; }}
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
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
















// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useParams } from "next/navigation";
// import { useBuilderStore } from "@/store/builder.store";
// import SortableSectionList from "@/components/builder/SortableSectionList";
// import EventPagePreview from "@/components/events/builder/EventPagePreview";
// import SectionConfigPanel from "@/components/events/builder/SectionConfigPanel";
// import { PAGE_PRESETS } from "@/builder/page-presets";

// import {
//   RectangleStackIcon,
//   InformationCircleIcon,
//   PhotoIcon,
//   QuestionMarkCircleIcon,
//   MegaphoneIcon,
//   UserGroupIcon,
// } from "@heroicons/react/24/outline";

// export default function BuilderPage() {
//   const [selectedSection, setSelectedSection] = useState(null);
//   const [isEditorOpen, setIsEditorOpen] = useState(false);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [device, setDevice] = useState("desktop");

//   // 🔥 resize state
//   const [panelWidth, setPanelWidth] = useState(360);
//   const isResizing = useRef(false);

//   const params = useParams();
//   const eventId = Array.isArray(params.eventId)
//     ? params.eventId[0]
//     : params.eventId;

//   const { builder, fetchBuilder, createSectionFromTemplate } =
//     useBuilderStore();

//   useEffect(() => {
//     if (eventId) fetchBuilder(eventId);
//   }, [eventId, fetchBuilder]);

//   // 🔥 resize handlers
//   useEffect(() => {
//     const handleMouseMove = (e) => {
//       if (!isResizing.current) return;
//       const newWidth = window.innerWidth - e.clientX;
//       if (newWidth > 280 && newWidth < 600) {
//         setPanelWidth(newWidth);
//       }
//     };

//     const stopResize = () => {
//       isResizing.current = false;
//     };

//     window.addEventListener("mousemove", handleMouseMove);
//     window.addEventListener("mouseup", stopResize);

//     return () => {
//       window.removeEventListener("mousemove", handleMouseMove);
//       window.removeEventListener("mouseup", stopResize);
//     };
//   }, []);

//   const handleSectionSelect = (section) => {
//     if (selectedSection?.id === section.id) {
//       setSelectedSection(null);
//       setIsEditorOpen(false);
//     } else {
//       setSelectedSection(section);
//       setIsEditorOpen(true);
//     }
//   };

//   const handleCloseEditor = () => {
//     setSelectedSection(null);
//     setIsEditorOpen(false);
//   };

//   const MINI_ITEMS = [
//     { type: "HERO", icon: RectangleStackIcon },
//     { type: "ABOUT", icon: InformationCircleIcon },
//     { type: "GALLERY", icon: PhotoIcon },
//     { type: "FAQ", icon: QuestionMarkCircleIcon },
//     { type: "CTA", icon: MegaphoneIcon },
//     { type: "SPEAKERS", icon: UserGroupIcon },
//   ];

//   const getWidth = () => {
//     if (device === "mobile") return "max-w-[375px]";
//     if (device === "tablet") return "max-w-[768px]";
//     return "max-w-[1200px]";
//   };

//   if (!builder) return <div className="p-10">Loading...</div>;

//   return (
//     <div className="flex h-screen w-full bg-gray-100 overflow-hidden">

//       {/* SIDEBAR */}
//       <aside
//         className={`${
//           isSidebarOpen ? "w-[260px]" : "w-[64px]"
//         } transition-all duration-300 bg-white border-r flex flex-col`}
//       >
//         <div className="h-14 flex items-center justify-between px-3 border-b">
//           {isSidebarOpen && <span className="text-sm">Builder</span>}
//           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
//             {isSidebarOpen ? "←" : "→"}
//           </button>
//         </div>

//         {!isSidebarOpen && (
//           <div className="flex flex-col items-center gap-3 mt-4">
//             {MINI_ITEMS.map(({ type, icon: Icon }) => (
//               <button
//                 key={type}
//                 title={type}
//                 onClick={() => createSectionFromTemplate(eventId, type)}
//                 className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100"
//               >
//                 <Icon className="w-5 h-5" />
//               </button>
//             ))}
//           </div>
//         )}

//         {isSidebarOpen && (
//           <div className="p-4 space-y-6 overflow-auto">
//             <select
//               onChange={async (e) => {
//                 const preset = PAGE_PRESETS[e.target.value];
//                 if (!preset) return;
//                 for (const type of preset.sections) {
//                   await createSectionFromTemplate(eventId, type);
//                 }
//               }}
//               className="w-full border p-2 rounded"
//             >
//               <option>Select template</option>
//               {Object.entries(PAGE_PRESETS).map(([k, v]) => (
//                 <option key={k} value={k}>
//                   {v.label}
//                 </option>
//               ))}
//             </select>

//             <SortableSectionList
//               eventId={eventId}
//               sections={builder.sections || []}
//             />
//           </div>
//         )}
//       </aside>

//       {/* MAIN */}
//       <div className="flex-1 flex flex-col">

//         {/* TOP BAR */}
//         <div className="h-14 bg-white border-b flex items-center justify-between px-4">

//           {/* DEVICE TOGGLE */}
//           <div className="flex gap-2">
//             {["desktop", "tablet", "mobile"].map((d) => (
//               <button
//                 key={d}
//                 onClick={() => setDevice(d)}
//                 className={`px-3 py-1 text-xs border rounded
//                   ${device === d ? "bg-black text-white" : ""}
//                 `}
//               >
//                 {d}
//               </button>
//             ))}
//           </div>

//           <div className="flex gap-2">
//             <button className="border px-3 py-1 text-xs">Save</button>
//             <button className="bg-black text-white px-3 py-1 text-xs">
//               Publish
//             </button>
//           </div>
//         </div>

//         {/* CONTENT */}
//         <div className="flex flex-1 overflow-hidden">

//           {/* PREVIEW */}
//           <div
//             className={`flex-1 overflow-auto flex ${
//               isSidebarOpen ? "justify-center p-6" : "p-0"
//             }`}
//           >
//             <div
//               className={`bg-white border rounded-xl shadow
//                 ${isSidebarOpen ? `w-full ${getWidth()}` : "w-full"}
//               `}
//             >
//               <EventPagePreview
//                 eventId={eventId}
//                 sections={builder.sections || []}
//                 onSelect={handleSectionSelect}
//                 selectedSection={selectedSection}
//               />
//             </div>
//           </div>

//           {/* RESIZE HANDLE */}
//           {isEditorOpen && (
//             <div
//               onMouseDown={() => (isResizing.current = true)}
//               className="w-1 cursor-col-resize bg-gray-200 hover:bg-gray-400"
//             />
//           )}

//           {/* PANEL */}
//           {isEditorOpen && selectedSection && (
//             <aside
//               style={{ width: panelWidth }}
//               className="bg-white border-l flex flex-col"
//             >
//               <div className="h-14 flex items-center justify-between px-4 border-b">
//                 <span className="text-sm font-semibold">
//                   {selectedSection.section_type}
//                 </span>
//                 <button onClick={handleCloseEditor}>✕</button>
//               </div>

//               <div className="flex-1 overflow-auto p-4">
//                 <SectionConfigPanel
//                   section={selectedSection}
//                   eventId={eventId}
//                   onClose={handleCloseEditor}
//                 />
//               </div>
//             </aside>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }




// "use client";

// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import { useBuilderStore } from "@/store/builder.store";
// import SortableSectionList from "@/components/builder/SortableSectionList";
// import EventPagePreview from "@/components/events/builder/EventPagePreview";
// import SectionConfigPanel from "@/components/events/builder/SectionConfigPanel";
// import { PAGE_PRESETS } from "@/builder/page-presets";

// import {
//   RectangleStackIcon,
//   InformationCircleIcon,
//   PhotoIcon,
//   QuestionMarkCircleIcon,
//   MegaphoneIcon,
//   UserGroupIcon,
// } from "@heroicons/react/24/outline";

// export default function BuilderPage() {
//   const [selectedSection, setSelectedSection] = useState(null);
//   const [isEditorOpen, setIsEditorOpen] = useState(false);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);

//   const params = useParams();
//   const eventId = Array.isArray(params.eventId)
//     ? params.eventId[0]
//     : params.eventId;

//   const { builder, fetchBuilder, createSectionFromTemplate } =
//     useBuilderStore();

//   useEffect(() => {
//     if (eventId) fetchBuilder(eventId);
//   }, [eventId, fetchBuilder]);

//   // ✅ TOGGLE FROM PREVIEW CLICK
//   const handleSectionSelect = (section) => {
//     if (selectedSection?.id === section.id) {
//       setSelectedSection(null);
//       setIsEditorOpen(false);
//     } else {
//       setSelectedSection(section);
//       setIsEditorOpen(true);
//     }
//   };

//   const handleCloseEditor = () => {
//     setSelectedSection(null);
//     setIsEditorOpen(false);
//   };

//   const MINI_ITEMS = [
//     { type: "HERO", icon: RectangleStackIcon },
//     { type: "ABOUT", icon: InformationCircleIcon },
//     { type: "GALLERY", icon: PhotoIcon },
//     { type: "FAQ", icon: QuestionMarkCircleIcon },
//     { type: "CTA", icon: MegaphoneIcon },
//     { type: "SPEAKERS", icon: UserGroupIcon },
//   ];

//   if (!builder) return <div className="p-10">Loading...</div>;

//   return (
//     <div className="flex h-screen bg-gray-100 overflow-hidden">

//       {/* SIDEBAR */}
//       <aside
//         className={`${
//           isSidebarOpen ? "w-[280px]" : "w-[64px]"
//         } transition-all duration-300 bg-white border-r flex flex-col`}
//       >
//         {/* HEADER */}
//         <div className="h-14 flex items-center justify-between px-3 border-b">
//           {isSidebarOpen && (
//             <span className="font-semibold text-sm">Builder</span>
//           )}

//           <button
//             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             className="text-gray-500 hover:text-black"
//           >
//             {isSidebarOpen ? "←" : "→"}
//           </button>
//         </div>

//         {/* MINI SIDEBAR */}
//         {!isSidebarOpen && (
//           <div className="flex flex-col items-center gap-3 mt-4">
//             {MINI_ITEMS.map(({ type, icon: Icon }) => {
//               const isActive =
//                 selectedSection?.section_type === type;

//               return (
//                 <button
//                   key={type}
//                   title={type}
//                   draggable
//                   onDragStart={(e) =>
//                     e.dataTransfer.setData("sectionType", type)
//                   }
//                   onClick={() => {
//                     const existing = builder.sections?.find(
//                       (s) => s.section_type === type
//                     );

//                     if (existing) {
//                       if (selectedSection?.id === existing.id) {
//                         setSelectedSection(null);
//                         setIsEditorOpen(false);
//                       } else {
//                         setSelectedSection(existing);
//                         setIsEditorOpen(true);
//                       }
//                     } else {
//                       createSectionFromTemplate(eventId, type);
//                     }
//                   }}
//                   className={`w-11 h-11 flex items-center justify-center rounded-xl transition
//                     ${
//                       isActive
//                         ? "bg-black text-white"
//                         : "text-gray-600 hover:bg-gray-100"
//                     }`}
//                 >
//                   <Icon className="w-5 h-5" />
//                 </button>
//               );
//             })}
//           </div>
//         )}

//         {/* FULL SIDEBAR */}
//         {isSidebarOpen && (
//           <div className="p-4 space-y-6 overflow-auto">

//             {/* TEMPLATE */}
//             <div>
//               <label className="text-xs text-gray-500 mb-1 block">
//                 Template
//               </label>
//               <select
//                 onChange={async (e) => {
//                   const preset = PAGE_PRESETS[e.target.value];
//                   if (!preset) return;

//                   for (const type of preset.sections) {
//                     await createSectionFromTemplate(eventId, type);
//                   }
//                 }}
//                 className="w-full border rounded-lg p-2 text-sm"
//               >
//                 <option>Select template</option>
//                 {Object.entries(PAGE_PRESETS).map(([k, v]) => (
//                   <option key={k} value={k}>
//                     {v.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* ADD SECTION */}
//             <div>
//               <label className="text-xs text-gray-500 mb-2 block">
//                 Add Section
//               </label>

//               <div className="grid grid-cols-2 gap-2">
//                 {MINI_ITEMS.map(({ type, icon: Icon }) => (
//                   <button
//                     key={type}
//                     onClick={() =>
//                       createSectionFromTemplate(eventId, type)
//                     }
//                     className="flex items-center gap-2 border rounded-lg px-2 py-2 text-xs hover:bg-gray-50"
//                   >
//                     <Icon className="w-4 h-4" />
//                     {type}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* LAYERS */}
//             <SortableSectionList
//               eventId={eventId}
//               sections={builder.sections || []}
//             />
//           </div>
//         )}
//       </aside>

//       {/* MAIN */}
//       <div className="flex-1 relative flex flex-col">

//         {/* TOP BAR */}
//         <div className="h-14 border-b bg-white flex items-center px-4 justify-between">
//           <span className="text-sm font-medium">
//             Event Preview
//           </span>

//           <div className="flex gap-2">
//             <button className="text-xs px-3 py-1 border rounded">
//               Save
//             </button>
//             <button className="text-xs px-3 py-1 bg-black text-white rounded">
//               Publish
//             </button>
//           </div>
//         </div>

//         {/* PREVIEW */}
//         <div className="flex-1 overflow-auto flex justify-center p-6">
//           <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm border">
//             <EventPagePreview
//               eventId={eventId}
//               sections={builder.sections || []}
//               onSelect={handleSectionSelect}
//             />
//           </div>
//         </div>

//         {/* RIGHT PANEL */}
//         {isEditorOpen && selectedSection && (
//           <div className="absolute right-0 top-0 h-full w-[380px] bg-white shadow-2xl border-l z-50 flex flex-col">

//             <div className="h-14 flex items-center justify-between px-4 border-b">
//               <span className="text-sm font-semibold">
//                 {selectedSection.section_type}
//               </span>

//               <button
//                 onClick={handleCloseEditor}
//                 className="text-gray-500 hover:text-black"
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="flex-1 overflow-auto p-4">
//               <SectionConfigPanel
//                 section={selectedSection}
//                 eventId={eventId}
//                 onClose={handleCloseEditor}
//               />
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }