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
          <Field label="RSVP Button">
            <Toggle
              checked={localConfig.show_cta ?? false}
              onChange={(v) => handleConfig("show_cta", v)}
              label="Show RSVP button on hero"
            />
          </Field>
          {localConfig.show_cta && (
            <Field label="Button Label">
              <Input
                value={localConfig.cta_text ?? ""}
                onChange={(e) => handleConfig("cta_text", e.target.value)}
                placeholder="Confirm Attendance"
              />
            </Field>
          )}
          <Field label={`Overlay Opacity: ${localConfig.overlay_opacity ?? 40}%`}>
            <input
              type="range" min={0} max={100}
              value={localConfig.overlay_opacity ?? 40}
              onChange={(e) => handleConfig("overlay_opacity", Number(e.target.value))}
              className="w-full"
              style={{ height: 36, cursor: "pointer", accentColor: "#6c6fee" }}
            />
          </Field>
          <p style={{ fontSize: 11, color: "#555a66", lineHeight: 1.5 }}>
            ⓘ The RSVP button is only visible to guests who open the event via their personal invitation link.
          </p>
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
              className="mb-3 flex flex-col gap-2 rounded-xl p-3"
              style={{ background: "#1e2026", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 10, color: "#555a66", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Q{i + 1}
                </span>
                <button
                  onClick={() => {
                    const next = (localConfig.items ?? []).filter((_, j) => j !== i);
                    handleConfigItems(next);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors"
                  style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
              <Input
                value={item.question}
                onChange={(e) => {
                  const next = [...(localConfig.items ?? [])];
                  next[i] = { ...next[i], question: e.target.value };
                  handleConfigItems(next);
                }}
                placeholder="Question"
              />
              <Textarea
                value={item.answer}
                onChange={(e) => {
                  const next = [...(localConfig.items ?? [])];
                  next[i] = { ...next[i], answer: e.target.value };
                  handleConfigItems(next);
                }}
                placeholder="Answer"
                rows={2}
              />
            </div>
          ))}
          <button
            onClick={() => handleConfigItems([...(localConfig.items ?? []), { question: "", answer: "" }])}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-semibold transition-colors"
            style={{ background: "#1e2026", border: "1px dashed rgba(255,255,255,0.12)", color: "#8b8f9a", height: 44 }}
          >
            + Add Question
          </button>
        </Field>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      {section.section_type === "CTA" && (
        <>
          <Field label="Button Label">
            <Input
              value={localConfig.button_text ?? ""}
              onChange={(e) => handleConfig("button_text", e.target.value)}
              placeholder="Confirm Attendance"
            />
          </Field>
          <p style={{ fontSize: 11, color: "#555a66", lineHeight: 1.5 }}>
            ⓘ This button is only visible to guests who open the event via their personal invitation link. Clicking it opens their RSVP panel.
          </p>
        </>
      )}

      {/* ── COUPLE ───────────────────────────────────────────────────── */}
      {section.section_type === "COUPLE" && (
        <>
          {/* Partner 1 */}
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 16, marginBottom: 4 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 12 }}>Partner One</p>
            <ImageUploader
              eventId={eventId}
              value={localConfig.bride_image ?? ""}
              onChange={(url) => handleConfig("bride_image", url)}
              label="Photo"
            />
            <div className="mt-3 space-y-3">
              <Field label="Name">
                <Input value={localConfig.bride_name ?? ""} onChange={(e) => handleConfig("bride_name", e.target.value)} placeholder="e.g. Sarah" />
              </Field>
              <Field label="Role / Title">
                <Input value={localConfig.bride_role ?? ""} onChange={(e) => handleConfig("bride_role", e.target.value)} placeholder="e.g. Bride" />
              </Field>
              <Field label="Short Bio">
                <Textarea value={localConfig.bride_bio ?? ""} onChange={(e) => handleConfig("bride_bio", e.target.value)} placeholder="A sentence or two about them…" rows={2} />
              </Field>
              <Field label="Personal Quote (flip card)">
                <Input value={localConfig.bride_quote ?? ""} onChange={(e) => handleConfig("bride_quote", e.target.value)} placeholder="Something meaningful…" />
              </Field>
            </div>
          </div>

          {/* Partner 2 */}
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 12 }}>Partner Two</p>
            <ImageUploader
              eventId={eventId}
              value={localConfig.groom_image ?? ""}
              onChange={(url) => handleConfig("groom_image", url)}
              label="Photo"
            />
            <div className="mt-3 space-y-3">
              <Field label="Name">
                <Input value={localConfig.groom_name ?? ""} onChange={(e) => handleConfig("groom_name", e.target.value)} placeholder="e.g. James" />
              </Field>
              <Field label="Role / Title">
                <Input value={localConfig.groom_role ?? ""} onChange={(e) => handleConfig("groom_role", e.target.value)} placeholder="e.g. Groom" />
              </Field>
              <Field label="Short Bio">
                <Textarea value={localConfig.groom_bio ?? ""} onChange={(e) => handleConfig("groom_bio", e.target.value)} placeholder="A sentence or two about them…" rows={2} />
              </Field>
              <Field label="Personal Quote (flip card)">
                <Input value={localConfig.groom_quote ?? ""} onChange={(e) => handleConfig("groom_quote", e.target.value)} placeholder="Something meaningful…" />
              </Field>
            </div>
          </div>
        </>
      )}

      {/* ── STORY ────────────────────────────────────────────────────── */}
      {section.section_type === "STORY" && (
        <>
          <ImageUploader
            eventId={eventId}
            value={localConfig.story_image ?? ""}
            onChange={(url) => handleConfig("story_image", url)}
            label="Story Photo"
          />
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
          <Field label="Pull Quote (optional)">
            <Input
              value={localConfig.quote ?? ""}
              onChange={(e) => handleConfig("quote", e.target.value)}
              placeholder="A meaningful quote…"
            />
          </Field>
        </>
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
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#555a66" }}>
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
      className={`w-full rounded-xl px-3.5 text-sm ${className}`}
      style={{
        background: "#1e2026",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#f0f1f3",
        outline: "none",
        height: 44,           // 44px min touch target
        touchAction: "manipulation",
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
      className="w-full rounded-xl px-3.5 py-3 text-sm resize-none"
      style={{
        background: "#1e2026",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#f0f1f3",
        outline: "none",
        touchAction: "manipulation",
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl px-3.5 text-sm appearance-none"
      style={{
        background: "#1e2026",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#f0f1f3",
        height: 44,
        touchAction: "manipulation",
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
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 w-full rounded-xl px-3 transition-colors"
      style={{
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.07)",
        height: 44,
        touchAction: "manipulation",
        cursor: "pointer",
      }}
    >
      <div
        className="relative shrink-0 rounded-full transition-colors duration-200"
        style={{ width: 40, height: 22, background: checked ? "#6c6fee" : "#2a2d35" }}
      >
        <span
          className="absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: checked ? "translateX(20px)" : "translateX(3px)" }}
        />
      </div>
      <span style={{ fontSize: 13, color: checked ? "#f0f1f3" : "#8b8f9a", fontWeight: checked ? 500 : 400 }}>{label}</span>
    </button>
  );
}
