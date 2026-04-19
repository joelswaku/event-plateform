"use client";

import { useBuilderStore } from "@/store/builder.store";

export default function SectionConfigPanel({ section, eventId }) {
  const updateSection = useBuilderStore((s) => s.updateSection);

  if (!section) {
    return (
      <div className="w-[320px] border-l bg-white flex items-center justify-center text-gray-400 text-sm">
        Select a section to edit
      </div>
    );
  }

  const handleChange = (key, value) => {
    updateSection(eventId, section.id, {
      config: {
        ...section.config,
        [key]: value,
      },
    });
  };

  return (
    <aside className="w-[320px] border-l bg-white p-5 space-y-6">
      <div>
        <h2 className="text-sm font-bold text-gray-900">
          {section.section_type}
        </h2>
        <p className="text-xs text-gray-400">Section Settings</p>
      </div>

      {/* HERO SETTINGS */}
      {section.section_type === "HERO" && (
        <>
          <div>
            <label className="text-xs text-gray-500">Text Alignment</label>
            <select
              value={section.config?.headline_align || "center"}
              onChange={(e) => handleChange("headline_align", e.target.value)}
              className="mt-1 w-full border rounded-lg p-2 text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">CTA Text</label>
            <input
              value={section.config?.cta_text || ""}
              onChange={(e) => handleChange("cta_text", e.target.value)}
              className="mt-1 w-full border rounded-lg p-2 text-sm"
            />
          </div>
        </>
      )}

      {/* GALLERY SETTINGS */}
      {section.section_type === "GALLERY" && (
        <div>
          <label className="text-xs text-gray-500">Layout</label>
          <select
            value={section.config?.layout || "grid"}
            onChange={(e) => handleChange("layout", e.target.value)}
            className="mt-1 w-full border rounded-lg p-2 text-sm"
          >
            <option value="grid">Grid</option>
            <option value="carousel">Carousel</option>
          </select>
        </div>
      )}
    </aside>
  );
}