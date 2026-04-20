"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import debounce from "lodash.debounce";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useBuilderStore } from "@/store/builder.store";
import ImageUploader from "./ImageUploader";

const AUTOSAVE_DELAY = 800;

export default function SectionConfigPanel({ section, eventId }) {
  const updateSection = useBuilderStore((s) => s.updateSection);

  // Local controlled state — updates UI immediately; debounced save fires after idle
  const [localTitle,  setLocalTitle]  = useState(section?.title  ?? "");
  const [localBody,   setLocalBody]   = useState(section?.body   ?? "");
  const [localConfig, setLocalConfig] = useState(section?.config ?? {});

  // Sync local state only when the selected section changes (different id)
  useEffect(() => {
    if (!section) return;
    setLocalTitle(section.title  ?? "");
    setLocalBody(section.body    ?? "");
    setLocalConfig(section.config ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section?.id]);

  // Stable debounced save — recreated only if eventId changes
  const debouncedSave = useMemo(
    () => debounce((sectionId, payload) => {
      updateSection(eventId, sectionId, payload);
    }, AUTOSAVE_DELAY),
    [eventId, updateSection]
  );

  useEffect(() => () => debouncedSave.cancel(), [debouncedSave]);

  const handleTitle = useCallback((value) => {
    setLocalTitle(value);
    debouncedSave(section.id, { title: value });
  }, [section?.id, debouncedSave]);

  const handleBody = useCallback((value) => {
    setLocalBody(value);
    debouncedSave(section.id, { body: value });
  }, [section?.id, debouncedSave]);

  const handleConfig = useCallback((key, value) => {
    setLocalConfig((prev) => {
      const next = { ...prev, [key]: value };
      // Use the full merged config so the server always receives the complete object
      debouncedSave(section.id, { config: { ...section.config, ...next } });
      return next;
    });
  }, [section?.id, section?.config, debouncedSave]);

  const handleConfigItems = useCallback((items) => {
    handleConfig("items", items);
  }, [handleConfig]);

  // Gallery: reads prev.images inside the updater to avoid stale-closure bug
  const handleGalleryAddImage = useCallback((url) => {
    if (!url) return;
    setLocalConfig((prev) => {
      const next = { ...prev, images: [...(prev.images ?? []), url] };
      debouncedSave(section.id, { config: { ...section.config, ...next } });
      return next;
    });
  }, [section?.id, section?.config, debouncedSave]);

  const handleGalleryRemoveImage = useCallback((idx) => {
    setLocalConfig((prev) => {
      const next = { ...prev, images: (prev.images ?? []).filter((_, i) => i !== idx) };
      debouncedSave(section.id, { config: { ...section.config, ...next } });
      return next;
    });
  }, [section?.id, section?.config, debouncedSave]);

  if (!section) return null;

  return (
    <div className="space-y-5">
      {/* Common: title */}
      <Field label="Section Title">
        <Input
          value={localTitle}
          onChange={(e) => handleTitle(e.target.value)}
          placeholder="Section title"
        />
      </Field>

      {/* Common: body */}
      <Field label="Body Text">
        <Textarea
          value={localBody}
          onChange={(e) => handleBody(e.target.value)}
          placeholder="Supporting text…"
          rows={3}
        />
      </Field>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      {section.section_type === "HERO" && (
        <>
          <ImageUploader
            eventId={eventId}
            value={localConfig.background_image ?? ""}
            onChange={(url) => handleConfig("background_image", url)}
            label="Background Image"
          />
          <Field label="Text Alignment">
            <Select
              value={localConfig.headline_align ?? "center"}
              onChange={(e) => handleConfig("headline_align", e.target.value)}
              options={[
                { value: "left",   label: "Left"   },
                { value: "center", label: "Center" },
                { value: "right",  label: "Right"  },
              ]}
            />
          </Field>
          <Field label="CTA Button Text">
            <Input
              value={localConfig.cta_text ?? ""}
              onChange={(e) => handleConfig("cta_text", e.target.value)}
              placeholder="RSVP Now"
            />
          </Field>
          <Field label={`Overlay Opacity: ${localConfig.overlay_opacity ?? 40}%`}>
            <input
              type="range" min={0} max={100}
              value={localConfig.overlay_opacity ?? 40}
              onChange={(e) => handleConfig("overlay_opacity", Number(e.target.value))}
              className="w-full"
            />
          </Field>
        </>
      )}

      {/* ── GALLERY ──────────────────────────────────────────────────── */}
      {section.section_type === "GALLERY" && (
        <>
          <Field label="Layout">
            <Select
              value={localConfig.layout ?? "grid"}
              onChange={(e) => handleConfig("layout", e.target.value)}
              options={[
                { value: "grid",     label: "Grid"     },
                { value: "carousel", label: "Carousel" },
              ]}
            />
          </Field>

          <Field label="Images">
            <div className="flex flex-col gap-2">
              {(localConfig.images ?? []).map((url, i) => (
                <div key={i} className="relative overflow-hidden rounded-md" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Gallery ${i + 1}`} className="h-20 w-full object-cover" />
                  <button
                    onClick={() => handleGalleryRemoveImage(i)}
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ background: "rgba(0,0,0,0.65)", color: "#fff" }}
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <ImageUploader
                eventId={eventId}
                value=""
                onChange={handleGalleryAddImage}
                label=""
              />
            </div>
          </Field>
        </>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      {section.section_type === "FAQ" && (
        <Field label="Questions">
          {(localConfig.items ?? []).map((item, i) => (
            <div
              key={i}
              className="mb-3 rounded-md p-3"
              style={{
                background: "#1e2026",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Input
                value={item.question}
                onChange={(e) => {
                  const next = [...(localConfig.items ?? [])];
                  next[i] = { ...next[i], question: e.target.value };
                  handleConfigItems(next);
                }}
                placeholder="Question"
                className="mb-2"
              />
              <Input
                value={item.answer}
                onChange={(e) => {
                  const next = [...(localConfig.items ?? [])];
                  next[i] = { ...next[i], answer: e.target.value };
                  handleConfigItems(next);
                }}
                placeholder="Answer"
              />
            </div>
          ))}
          <button
            onClick={() =>
              handleConfigItems([
                ...(localConfig.items ?? []),
                { question: "", answer: "" },
              ])
            }
            className="w-full rounded-md px-3 py-1.5 text-xs"
            style={{
              background: "#1e2026",
              border: "1px dashed rgba(255,255,255,0.12)",
              color: "#8b8f9a",
            }}
          >
            + Add Question
          </button>
        </Field>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      {section.section_type === "CTA" && (
        <>
          <Field label="Button Text">
            <Input
              value={localConfig.button_text ?? ""}
              onChange={(e) => handleConfig("button_text", e.target.value)}
              placeholder="Get Started"
            />
          </Field>
          <Field label="Button URL">
            <Input
              value={localConfig.button_url ?? ""}
              onChange={(e) => handleConfig("button_url", e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </>
      )}

      {/* ── COUPLE ───────────────────────────────────────────────────── */}
      {section.section_type === "COUPLE" && (
        <>
          <ImageUploader
            eventId={eventId}
            value={localConfig.bride_image ?? ""}
            onChange={(url) => handleConfig("bride_image", url)}
            label="Bride Photo"
          />
          <Field label="Bride Name">
            <Input
              value={localConfig.bride_name ?? ""}
              onChange={(e) => handleConfig("bride_name", e.target.value)}
              placeholder="e.g. Sarah"
            />
          </Field>

          <ImageUploader
            eventId={eventId}
            value={localConfig.groom_image ?? ""}
            onChange={(url) => handleConfig("groom_image", url)}
            label="Groom Photo"
          />
          <Field label="Groom Name">
            <Input
              value={localConfig.groom_name ?? ""}
              onChange={(e) => handleConfig("groom_name", e.target.value)}
              placeholder="e.g. James"
            />
          </Field>
        </>
      )}

      {/* ── STORY ────────────────────────────────────────────────────── */}
      {section.section_type === "STORY" && (
        <Field label="Image Position">
          <Select
            value={localConfig.image_position ?? "left"}
            onChange={(e) => handleConfig("image_position", e.target.value)}
            options={[
              { value: "left",  label: "Left"  },
              { value: "right", label: "Right" },
            ]}
          />
        </Field>
      )}

      {/* ── VENUE ────────────────────────────────────────────────────── */}
      {section.section_type === "VENUE" && (
        <>
          <Field label="Show Map">
            <Toggle
              checked={localConfig.show_map ?? true}
              onChange={(v) => handleConfig("show_map", v)}
              label="Embed map"
            />
          </Field>
          <Field label="Show Parking">
            <Toggle
              checked={localConfig.show_parking ?? true}
              onChange={(v) => handleConfig("show_parking", v)}
              label="Parking info"
            />
          </Field>
        </>
      )}
    </div>
  );
}

// ── Primitive form components ─────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[11px] font-medium"
        style={{ color: "#8b8f9a" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, className = "" }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-md px-3 py-2 text-sm ${className}`}
      style={{
        background: "#1e2026",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#f0f1f3",
        outline: "none",
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-md px-3 py-2 text-sm resize-none"
      style={{
        background: "#1e2026",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#f0f1f3",
        outline: "none",
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-md px-3 py-2 text-sm"
      style={{
        background: "#1e2026",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#f0f1f3",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className="relative h-5 w-9 rounded-full transition-colors cursor-pointer"
        style={{ background: checked ? "#6c6fee" : "#2a2d35" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(16px)" : "translateX(2px)" }}
        />
      </div>
      <span style={{ fontSize: 12, color: "#8b8f9a" }}>{label}</span>
    </label>
  );
}
