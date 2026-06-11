"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import debounce from "lodash.debounce";
import { XMarkIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useBuilderStore } from "@/store/builder.store";
import ImageUploader from "./ImageUploader";
import ConfirmModal, { useConfirm } from "@/components/ui/confirm-modal";

const AUTOSAVE_DELAY = 800;

export default function SectionConfigPanel({ section, eventId }) {
  const updateSection  = useBuilderStore((s) => s.updateSection);
  const createSpeaker       = useBuilderStore((s) => s.createSpeaker);
  const updateSpeaker       = useBuilderStore((s) => s.updateSpeaker);
  const deleteSpeaker       = useBuilderStore((s) => s.deleteSpeaker);
  const speakers            = useBuilderStore((s) => s.builder?.speakers ?? []);
  const createScheduleItem  = useBuilderStore((s) => s.createScheduleItem);
  const updateScheduleItem  = useBuilderStore((s) => s.updateScheduleItem);
  const deleteScheduleItem  = useBuilderStore((s) => s.deleteScheduleItem);
  const scheduleItems       = useBuilderStore((s) => s.builder?.schedule_items ?? []);
  const builderEvent        = useBuilderStore((s) => s.builder?.event ?? null);
  const updateEventDetails  = useBuilderStore((s) => s.updateEventDetails);

  // Local controlled state — updates UI immediately; debounced save fires after idle
  const [localTitle,  setLocalTitle]  = useState(section?.title  ?? "");
  const [localBody,   setLocalBody]   = useState(section?.body   ?? "");
  const [localConfig, setLocalConfig] = useState(section?.config ?? {});

  // Sync local state only when the selected section changes (different id)
  useEffect(() => {
    if (!section) return;
    setLocalTitle(section.title ?? "");
    setLocalBody(section.body   ?? "");
    const cfg = section.config ?? {};
    // For VENUE, pre-fill address fields from event data if config is empty
    if (section.section_type === "VENUE" && builderEvent) {
      const merged = {
        venue_name:    cfg.venue_name    ?? builderEvent.venue_name    ?? "",
        venue_address: cfg.venue_address ?? builderEvent.venue_address ?? "",
        city:          cfg.city          ?? builderEvent.city          ?? "",
        state:         cfg.state         ?? builderEvent.state         ?? "",
        zip_code:      cfg.zip_code      ?? builderEvent.zip_code      ?? "",
        country:       cfg.country       ?? builderEvent.country       ?? "",
        ...cfg,
      };
      setLocalConfig(merged);
    } else {
      setLocalConfig(cfg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section?.id]);

  // Stable debounced save — recreated only if eventId changes
  const debouncedSave = useMemo(
    () => debounce((sectionId, payload) => {
      updateSection(eventId, sectionId, payload);
    }, AUTOSAVE_DELAY),
    [eventId, updateSection]
  );

  // Debounced event-record sync for venue fields
  const VENUE_EVENT_KEYS = ["venue_name", "venue_address", "city", "state", "zip_code", "country"];
  const debouncedEventSync = useMemo(
    () => debounce((key, value) => {
      if (VENUE_EVENT_KEYS.includes(key)) {
        updateEventDetails(eventId, { [key]: value });
      }
    }, AUTOSAVE_DELAY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventId, updateEventDetails]
  );

  useEffect(() => () => { debouncedSave.cancel(); debouncedEventSync.cancel(); }, [debouncedSave, debouncedEventSync]);

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
      debouncedSave(section.id, { config: { ...section.config, ...next } });
      debouncedEventSync(key, value);
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

  // These section types manage their own content — generic title/body not needed
  const hideCommonFields = ["GALLERY", "FAQ", "CTA", "COUPLE", "VENUE", "SPEAKERS", "SCHEDULE"].includes(section.section_type);

  return (
    <div className="space-y-5">
      {/* Common: title + body — hidden for sections with their own content structure */}
      {!hideCommonFields && (
        <>
          <Field label="Section Title">
            <Input
              value={localTitle}
              onChange={(e) => handleTitle(e.target.value)}
              placeholder="Section title"
            />
          </Field>
          <Field label="Body Text">
            <Textarea
              value={localBody}
              onChange={(e) => handleBody(e.target.value)}
              placeholder="Supporting text…"
              rows={3}
            />
          </Field>
        </>
      )}

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
          <Field label="Venue Name">
            <Input
              value={localConfig.venue_name ?? ""}
              onChange={(e) => handleConfig("venue_name", e.target.value)}
              placeholder="e.g. Grand Ballroom"
            />
          </Field>
          <Field label="Street Address">
            <Input
              value={localConfig.venue_address ?? ""}
              onChange={(e) => handleConfig("venue_address", e.target.value)}
              placeholder="123 Main St"
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="City">
              <Input
                value={localConfig.city ?? ""}
                onChange={(e) => handleConfig("city", e.target.value)}
                placeholder="New York"
              />
            </Field>
            <Field label="State / Region">
              <Input
                value={localConfig.state ?? ""}
                onChange={(e) => handleConfig("state", e.target.value)}
                placeholder="NY"
              />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
            <Field label="Zip / Postal">
              <Input
                value={localConfig.zip_code ?? ""}
                onChange={(e) => handleConfig("zip_code", e.target.value)}
                placeholder="10001"
              />
            </Field>
            <Field label="Country">
              <Input
                value={localConfig.country ?? ""}
                onChange={(e) => handleConfig("country", e.target.value)}
                placeholder="United States"
              />
            </Field>
          </div>
          <Field label="Directions Note">
            <Textarea
              value={localConfig.directions ?? ""}
              onChange={(e) => handleConfig("directions", e.target.value)}
              placeholder="e.g. Enter through the main lobby, take the elevator to floor 3…"
              rows={2}
            />
          </Field>
          <Field label="Show Map">
            <Toggle
              checked={localConfig.show_map ?? true}
              onChange={(v) => handleConfig("show_map", v)}
              label="Embed Google Maps"
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

      {/* ── COUNTDOWN ───────────────────────────────────────────────────── */}
      {section.section_type === "COUNTDOWN" && (
        <>
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
            Countdown uses your event&apos;s start date automatically.
          </div>
          <Field label="Display Style">
            <Select
              value={localConfig.display_style ?? "blocks"}
              onChange={(e) => {
                const value = e.target.value;
                setLocalConfig((prev) => ({ ...prev, display_style: value }));
                updateSection(eventId, section.id, {
                  config: { ...(section.config ?? {}), display_style: value },
                });
              }}
              options={[
                { value: "blocks",  label: "Blocks — grid of big number tiles"       },
                { value: "flip",    label: "Flip — flip-clock with divider line"     },
                { value: "minimal", label: "Minimal — colon-separated compact view"  },
                { value: "text",    label: "Text — inline sentence"                  },
              ]}
            />
          </Field>
        </>
      )}

      {/* ── SPEAKERS ─────────────────────────────────────────────────────── */}
      {section.section_type === "SPEAKERS" && (
        <SpeakersPanel
          eventId={eventId}
          speakers={speakers}
          onCreate={createSpeaker}
          onUpdate={updateSpeaker}
          onDelete={deleteSpeaker}
        />
      )}

      {/* ── SCHEDULE ─────────────────────────────────────────────────────── */}
      {section.section_type === "SCHEDULE" && (
        <SchedulePanel
          eventId={eventId}
          items={scheduleItems}
          onCreate={createScheduleItem}
          onUpdate={updateScheduleItem}
          onDelete={deleteScheduleItem}
        />
      )}
    </div>
  );
}

/* ── Speakers panel ──────────────────────────────────────────────────────────── */

const EMPTY_SPEAKER = { full_name: "", title: "", bio: "", avatar_url: "", social_links: {} };

function SpeakersPanel({ eventId, speakers, onCreate, onUpdate, onDelete }) {
  const [saving,     setSaving]     = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [drafts,     setDrafts]     = useState({});   // id → partial edits
  const [newForm,    setNewForm]    = useState(null);  // null = hidden
  const { openConfirm, confirmProps } = useConfirm();

  const getDraft = (s) => ({ ...s, ...(drafts[s.id] ?? {}) });

  const setDraft = (id, key, val) =>
    setDrafts((p) => ({ ...p, [id]: { ...(p[id] ?? {}), [key]: val } }));

  const handleSave = async (speaker) => {
    const draft = getDraft(speaker);
    if (!draft.full_name?.trim()) return;
    setSaving(true);
    await onUpdate(eventId, speaker.id, {
      full_name:    draft.full_name,
      title:        draft.title        || null,
      bio:          draft.bio          || null,
      avatar_url:   draft.avatar_url   || null,
      social_links: draft.social_links || {},
    });
    setDrafts((p) => { const n = { ...p }; delete n[speaker.id]; return n; });
    setSaving(false);
  };

  const handleCreate = async () => {
    if (!newForm?.full_name?.trim()) return;
    setSaving(true);
    await onCreate(eventId, {
      full_name:    newForm.full_name,
      title:        newForm.title        || null,
      bio:          newForm.bio          || null,
      avatar_url:   newForm.avatar_url   || null,
      social_links: newForm.social_links || {},
    });
    setNewForm(null);
    setSaving(false);
  };

  const handleDelete = (id) => {
    openConfirm({
      title: "Remove speaker?",
      description: "This speaker will be removed from the event page.",
      confirmText: "Remove",
      variant: "danger",
      onConfirm: async () => {
        await onDelete(eventId, id);
        setExpandedId((p) => p === id ? null : p);
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {speakers.map((sp) => {
        const draft    = getDraft(sp);
        const expanded = expandedId === sp.id;
        const initials = (sp.full_name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div key={sp.id} style={{ background: "#1e2026", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer" }}
              onClick={() => setExpandedId(expanded ? null : sp.id)}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                background: "#2a2d35", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {sp.avatar_url
                  ? <img src={sp.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 11, fontWeight: 700, color: "#6c6fee" }}>{initials}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#f0f1f3", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {sp.full_name}
                </p>
                {sp.title && <p style={{ fontSize: 11, color: "#555a66", margin: 0 }}>{sp.title}</p>}
              </div>
              {expanded
                ? <ChevronUpIcon   style={{ width: 14, height: 14, color: "#555a66", flexShrink: 0 }} />
                : <ChevronDownIcon style={{ width: 14, height: 14, color: "#555a66", flexShrink: 0 }} />}
            </div>

            {/* Expanded edit form */}
            {expanded && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <ImageUploader
                  eventId={eventId}
                  value={draft.avatar_url ?? ""}
                  onChange={(url) => setDraft(sp.id, "avatar_url", url)}
                  label="Photo"
                />
                <Field label="Full Name">
                  <Input value={draft.full_name ?? ""} onChange={(e) => setDraft(sp.id, "full_name", e.target.value)} placeholder="Jane Doe" />
                </Field>
                <Field label="Role / Company">
                  <Input value={draft.title ?? ""} onChange={(e) => setDraft(sp.id, "title", e.target.value)} placeholder="CEO at Acme" />
                </Field>
                <Field label="Bio">
                  <Textarea value={draft.bio ?? ""} onChange={(e) => setDraft(sp.id, "bio", e.target.value)} placeholder="Short bio…" rows={3} />
                </Field>
                <Field label="Website">
                  <Input value={draft.social_links?.website ?? ""} onChange={(e) => setDraft(sp.id, "social_links", { ...(draft.social_links ?? {}), website: e.target.value })} placeholder="https://…" />
                </Field>
                <Field label="LinkedIn">
                  <Input value={draft.social_links?.linkedin ?? ""} onChange={(e) => setDraft(sp.id, "social_links", { ...(draft.social_links ?? {}), linkedin: e.target.value })} placeholder="linkedin.com/in/…" />
                </Field>
                <Field label="Twitter / X">
                  <Input value={draft.social_links?.twitter ?? ""} onChange={(e) => setDraft(sp.id, "social_links", { ...(draft.social_links ?? {}), twitter: e.target.value })} placeholder="@handle" />
                </Field>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => handleSave(sp)} disabled={saving}
                    style={{
                      flex: 1, height: 36, borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: "#6c6fee", color: "#fff", border: "none", cursor: "pointer",
                      opacity: saving ? 0.6 : 1,
                    }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => handleDelete(sp.id)} disabled={saving}
                    style={{
                      height: 36, width: 36, borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)",
                      background: "rgba(248,113,113,0.08)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                    <XMarkIcon style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* New speaker form */}
      {newForm !== null ? (
        <div style={{ background: "#1e2026", border: "1px solid rgba(108,111,238,0.3)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#6c6fee", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>New Speaker</p>
          <ImageUploader
            eventId={eventId}
            value={newForm.avatar_url ?? ""}
            onChange={(url) => setNewForm((p) => ({ ...p, avatar_url: url }))}
            label="Photo"
          />
          <Field label="Full Name *">
            <Input value={newForm.full_name ?? ""} onChange={(e) => setNewForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Jane Doe" />
          </Field>
          <Field label="Role / Company">
            <Input value={newForm.title ?? ""} onChange={(e) => setNewForm((p) => ({ ...p, title: e.target.value }))} placeholder="CEO at Acme" />
          </Field>
          <Field label="Bio">
            <Textarea value={newForm.bio ?? ""} onChange={(e) => setNewForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Short bio…" rows={3} />
          </Field>
          <Field label="Website">
            <Input value={newForm.social_links?.website ?? ""} onChange={(e) => setNewForm((p) => ({ ...p, social_links: { ...(p.social_links ?? {}), website: e.target.value } }))} placeholder="https://…" />
          </Field>
          <Field label="LinkedIn">
            <Input value={newForm.social_links?.linkedin ?? ""} onChange={(e) => setNewForm((p) => ({ ...p, social_links: { ...(p.social_links ?? {}), linkedin: e.target.value } }))} placeholder="linkedin.com/in/…" />
          </Field>
          <Field label="Twitter / X">
            <Input value={newForm.social_links?.twitter ?? ""} onChange={(e) => setNewForm((p) => ({ ...p, social_links: { ...(p.social_links ?? {}), twitter: e.target.value } }))} placeholder="@handle" />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleCreate} disabled={saving || !newForm.full_name?.trim()}
              style={{
                flex: 1, height: 36, borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "#6c6fee", color: "#fff", border: "none", cursor: "pointer",
                opacity: (saving || !newForm.full_name?.trim()) ? 0.5 : 1,
              }}>
              {saving ? "Adding…" : "Add Speaker"}
            </button>
            <button
              onClick={() => setNewForm(null)}
              style={{
                height: 36, width: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "#8b8f9a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <XMarkIcon style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setNewForm({ ...EMPTY_SPEAKER })}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            height: 40, borderRadius: 10, fontSize: 12, fontWeight: 600,
            border: "1px dashed rgba(255,255,255,0.12)", background: "transparent",
            color: "#8b8f9a", cursor: "pointer", width: "100%",
          }}>
          <PlusIcon style={{ width: 14, height: 14 }} />
          Add Speaker
        </button>
      )}
      <ConfirmModal {...confirmProps} />
    </div>
  );
}

/* ── Schedule panel ──────────────────────────────────────────────────────────── */

const EMPTY_ITEM = { title: "", description: "", starts_at: "", ends_at: "", location: "" };

function SchedulePanel({ eventId, items, onCreate, onUpdate, onDelete }) {
  const [saving,     setSaving]     = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [drafts,     setDrafts]     = useState({});
  const [newForm,    setNewForm]    = useState(null);
  const { openConfirm, confirmProps } = useConfirm();

  const getDraft = (item) => ({ ...item, ...(drafts[item.id] ?? {}) });

  const setDraft = (id, key, val) =>
    setDrafts((p) => ({ ...p, [id]: { ...(p[id] ?? {}), [key]: val } }));

  const handleSave = async (item) => {
    const d = getDraft(item);
    if (!d.title?.trim() || !d.starts_at) return;
    setSaving(true);
    await onUpdate(eventId, item.id, {
      title:          d.title,
      description:    d.description    || null,
      starts_at:      d.starts_at,
      ends_at:        d.ends_at        || null,
      location:       d.location       || null,
      position_order: item.position_order ?? 0,
    });
    setDrafts((p) => { const n = { ...p }; delete n[item.id]; return n; });
    setSaving(false);
  };

  const handleCreate = async () => {
    if (!newForm?.title?.trim() || !newForm.starts_at) return;
    setSaving(true);
    await onCreate(eventId, {
      title:          newForm.title,
      description:    newForm.description    || null,
      starts_at:      newForm.starts_at,
      ends_at:        newForm.ends_at        || null,
      location:       newForm.location       || null,
      position_order: items.length,
    });
    setNewForm(null);
    setSaving(false);
  };

  const handleDelete = (id) => {
    openConfirm({
      title: "Remove schedule item?",
      description: "This item will be deleted from the schedule.",
      confirmText: "Remove",
      variant: "danger",
      onConfirm: async () => {
        await onDelete(eventId, id);
        setExpandedId((p) => p === id ? null : p);
      },
    });
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return iso; }
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => {
        const draft    = getDraft(item);
        const expanded = expandedId === item.id;
        return (
          <div key={item.id} style={{ background: "#1e2026", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer" }}
              onClick={() => setExpandedId(expanded ? null : item.id)}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "rgba(108,111,238,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6c6fee" }}>{idx + 1}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#f0f1f3", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.title || "Untitled"}
                </p>
                {item.starts_at && (
                  <p style={{ fontSize: 11, color: "#555a66", margin: 0 }}>{fmtTime(item.starts_at)}{item.ends_at ? ` – ${fmtTime(item.ends_at)}` : ""}</p>
                )}
              </div>
              {expanded
                ? <ChevronUpIcon   style={{ width: 14, height: 14, color: "#555a66", flexShrink: 0 }} />
                : <ChevronDownIcon style={{ width: 14, height: 14, color: "#555a66", flexShrink: 0 }} />}
            </div>

            {expanded && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <Field label="Title *">
                  <Input value={draft.title ?? ""} onChange={(e) => setDraft(item.id, "title", e.target.value)} placeholder="Session title" />
                </Field>
                <Field label="Start Time *">
                  <input
                    type="datetime-local"
                    value={draft.starts_at ? draft.starts_at.slice(0, 16) : ""}
                    onChange={(e) => setDraft(item.id, "starts_at", e.target.value ? new Date(e.target.value).toISOString() : "")}
                    style={{
                      width: "100%", height: 44, borderRadius: 12, padding: "0 14px",
                      background: "#1e2026", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#f0f1f3", fontSize: 13, outline: "none",
                      colorScheme: "dark",
                    }}
                  />
                </Field>
                <Field label="End Time">
                  <input
                    type="datetime-local"
                    value={draft.ends_at ? draft.ends_at.slice(0, 16) : ""}
                    onChange={(e) => setDraft(item.id, "ends_at", e.target.value ? new Date(e.target.value).toISOString() : "")}
                    style={{
                      width: "100%", height: 44, borderRadius: 12, padding: "0 14px",
                      background: "#1e2026", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#f0f1f3", fontSize: 13, outline: "none",
                      colorScheme: "dark",
                    }}
                  />
                </Field>
                <Field label="Location">
                  <Input value={draft.location ?? ""} onChange={(e) => setDraft(item.id, "location", e.target.value)} placeholder="Room / stage name" />
                </Field>
                <Field label="Description">
                  <Textarea value={draft.description ?? ""} onChange={(e) => setDraft(item.id, "description", e.target.value)} placeholder="Short description…" rows={2} />
                </Field>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => handleSave(item)} disabled={saving}
                    style={{
                      flex: 1, height: 36, borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: "#6c6fee", color: "#fff", border: "none", cursor: "pointer",
                      opacity: saving ? 0.6 : 1,
                    }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)} disabled={saving}
                    style={{
                      height: 36, width: 36, borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)",
                      background: "rgba(248,113,113,0.08)", color: "#f87171", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                    <XMarkIcon style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {newForm !== null ? (
        <div style={{ background: "#1e2026", border: "1px solid rgba(108,111,238,0.3)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#6c6fee", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>New Item</p>
          <Field label="Title *">
            <Input value={newForm.title ?? ""} onChange={(e) => setNewForm((p) => ({ ...p, title: e.target.value }))} placeholder="Session title" />
          </Field>
          <Field label="Start Time *">
            <input
              type="datetime-local"
              value={newForm.starts_at ? newForm.starts_at.slice(0, 16) : ""}
              onChange={(e) => setNewForm((p) => ({ ...p, starts_at: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
              style={{
                width: "100%", height: 44, borderRadius: 12, padding: "0 14px",
                background: "#1e2026", border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0f1f3", fontSize: 13, outline: "none",
                colorScheme: "dark",
              }}
            />
          </Field>
          <Field label="End Time">
            <input
              type="datetime-local"
              value={newForm.ends_at ? newForm.ends_at.slice(0, 16) : ""}
              onChange={(e) => setNewForm((p) => ({ ...p, ends_at: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
              style={{
                width: "100%", height: 44, borderRadius: 12, padding: "0 14px",
                background: "#1e2026", border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0f1f3", fontSize: 13, outline: "none",
                colorScheme: "dark",
              }}
            />
          </Field>
          <Field label="Location">
            <Input value={newForm.location ?? ""} onChange={(e) => setNewForm((p) => ({ ...p, location: e.target.value }))} placeholder="Room / stage name" />
          </Field>
          <Field label="Description">
            <Textarea value={newForm.description ?? ""} onChange={(e) => setNewForm((p) => ({ ...p, description: e.target.value }))} placeholder="Short description…" rows={2} />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleCreate} disabled={saving || !newForm.title?.trim() || !newForm.starts_at}
              style={{
                flex: 1, height: 36, borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "#6c6fee", color: "#fff", border: "none", cursor: "pointer",
                opacity: (saving || !newForm.title?.trim() || !newForm.starts_at) ? 0.5 : 1,
              }}>
              {saving ? "Adding…" : "Add Item"}
            </button>
            <button
              onClick={() => setNewForm(null)}
              style={{
                height: 36, width: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "#8b8f9a", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <XMarkIcon style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setNewForm({ ...EMPTY_ITEM })}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            height: 40, borderRadius: 10, fontSize: 12, fontWeight: 600,
            border: "1px dashed rgba(255,255,255,0.12)", background: "transparent",
            color: "#8b8f9a", cursor: "pointer", width: "100%",
          }}>
          <PlusIcon style={{ width: 14, height: 14 }} />
          Add Item
        </button>
      )}
      <ConfirmModal {...confirmProps} />
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
          className="absolute top-0.75 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: checked ? "translateX(20px)" : "translateX(3px)" }}
        />
      </div>
      <span style={{ fontSize: 13, color: checked ? "#f0f1f3" : "#8b8f9a", fontWeight: checked ? 500 : 400 }}>{label}</span>
    </button>
  );
}
