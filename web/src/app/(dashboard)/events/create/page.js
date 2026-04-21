"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEventStore } from "@/store/event.store";
import { api } from "@/lib/api";
import { resolveTemplate } from "@/lib/defaultTemplates";
import PageHeader from "@/components/ui/page-header";

const INITIAL_FORM = {
  title:             "",
  event_type:        "",
  description:       "",
  short_description: "",
  venue_name:        "",
  venue_address:     "",
  city:              "",
  state:             "",
  country:           "",
  timezone:          "UTC",
  starts_at:         "",
  ends_at:           "",
  visibility:        "PRIVATE",
  allow_rsvp:        true,
  allow_ticketing:   false,
  allow_donations:   false,
};

export default function CreateEventPage() {
  const router       = useRouter();
  const { createEvent } = useEventStore();
  const [form, setForm]           = useState(INITIAL_FORM);
  const [errors, setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())   e.title      = "Event title is required";
    if (!form.event_type)     e.event_type = "Event type is required";
    if (!form.starts_at)      e.starts_at  = "Start date is required";
    if (!form.ends_at)        e.ends_at    = "End date is required";
    if (
      form.starts_at &&
      form.ends_at &&
      new Date(form.ends_at) <= new Date(form.starts_at)
    ) e.ends_at = "End date must be after start date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title:             form.title.trim(),
        event_type:        form.event_type.toUpperCase(),
        description:       form.description.trim(),
        short_description: form.short_description.trim(),
        venue_name:        form.venue_name.trim(),
        venue_address:     form.venue_address.trim(),
        city:              form.city.trim(),
        state:             form.state.trim(),
        country:           form.country.trim().toUpperCase(),
        timezone:          form.timezone || "UTC",
        starts_at:         new Date(form.starts_at).toISOString(),
        ends_at:           new Date(form.ends_at).toISOString(),
        visibility:        form.visibility,
        allow_rsvp:        form.allow_rsvp,
        allow_ticketing:   form.allow_ticketing,
        allow_donations:   form.allow_donations,
      };

      const res     = await createEvent(payload);
      const eventId = res?.data?.id || res?.id;
      if (!eventId) throw new Error("Event creation failed — no ID returned");

      // Pre-create default sections so builder is ready instantly
      try {
        const keys     = resolveTemplate(payload.event_type);
        const batchRes = await api.post(`/builder/events/${eventId}/sections/batch`, {
          sections: keys.map((k) => ({ template_key: k })),
        });
        const newSections = batchRes.data?.data || [];

        const prefills = [];

        const hero = newSections.find((s) => s.section_type === "HERO");
        if (hero) {
          prefills.push(
            api.patch(`/builder/events/${eventId}/sections/${hero.id}`, {
              title: payload.title,
              body:  payload.short_description || payload.description || "",
              config: { ...(hero.config ?? {}) },
            })
          );
        }

        const countdown = newSections.find((s) => s.section_type === "COUNTDOWN");
        if (countdown) {
          prefills.push(
            api.patch(`/builder/events/${eventId}/sections/${countdown.id}`, {
              config: { ...(countdown.config ?? {}), starts_at: payload.starts_at },
            })
          );
        }

        const venue = newSections.find((s) => s.section_type === "VENUE");
        if (venue) {
          prefills.push(
            api.patch(`/builder/events/${eventId}/sections/${venue.id}`, {
              config: {
                ...(venue.config ?? {}),
                venue_name:    payload.venue_name,
                venue_address: payload.venue_address,
                city:          payload.city,
                state:         payload.state,
                country:       payload.country,
              },
            })
          );
        }

        await Promise.all(prefills);
      } catch {
        // Non-fatal — builder will auto-apply template on first open
      }

      router.push(`/events/${eventId}`);
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || "Failed to create event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        eyebrow="Events"
        title="Create event"
        description="Fill in the details below to launch your event."
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">

        {/* ── Basic Info ─────────────────────────────────────────── */}
        <Card title="Basic Info" subtitle="Name and type of your event">
          <Grid>
            <Field label="Event title *" error={errors.title} span={2}>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Sarah & James Wedding"
                error={!!errors.title}
              />
            </Field>

            <Field label="Event type *" error={errors.event_type}>
              <Select
                value={form.event_type}
                onChange={(e) => set("event_type", e.target.value)}
                error={!!errors.event_type}
                options={[
                  { value: "WEDDING",        label: "Wedding" },
                  { value: "BIRTHDAY",       label: "Birthday" },
                  { value: "CORPORATE_EVENT",label: "Corporate Event" },
                  { value: "MEETING",        label: "Meeting" },
                  { value: "FUNERAL",        label: "Funeral" },
                  { value: "CONCERT",        label: "Concert" },
                  { value: "CHURCH",         label: "Church Service" },
                  { value: "OTHER",          label: "Other" },
                ]}
              />
            </Field>

            <Field label="Visibility">
              <Select
                value={form.visibility}
                onChange={(e) => set("visibility", e.target.value)}
                options={[
                  { value: "PRIVATE",  label: "Private" },
                  { value: "PUBLIC",   label: "Public" },
                  { value: "UNLISTED", label: "Unlisted" },
                ]}
              />
            </Field>

            <Field label="Short description" span={2}>
              <Input
                value={form.short_description}
                onChange={(e) => set("short_description", e.target.value)}
                placeholder="One-line summary shown in previews"
              />
            </Field>

            <Field label="Full description" span={2}>
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Tell guests what to expect…"
                rows={3}
              />
            </Field>
          </Grid>
        </Card>

        {/* ── Date & Time ────────────────────────────────────────── */}
        <Card title="Date & Time" subtitle="When does your event take place?">
          <Grid>
            <Field label="Start date & time *" error={errors.starts_at}>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => set("starts_at", e.target.value)}
                error={!!errors.starts_at}
              />
            </Field>

            <Field label="End date & time *" error={errors.ends_at}>
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => set("ends_at", e.target.value)}
                error={!!errors.ends_at}
              />
            </Field>

            <Field label="Timezone">
              <Select
                value={form.timezone}
                onChange={(e) => set("timezone", e.target.value)}
                options={[
                  { value: "UTC",                    label: "UTC" },
                  { value: "America/New_York",        label: "Eastern (ET)" },
                  { value: "America/Chicago",         label: "Central (CT)" },
                  { value: "America/Denver",          label: "Mountain (MT)" },
                  { value: "America/Los_Angeles",     label: "Pacific (PT)" },
                  { value: "Europe/London",           label: "London (GMT)" },
                  { value: "Europe/Paris",            label: "Paris (CET)" },
                  { value: "Africa/Lagos",            label: "Lagos (WAT)" },
                  { value: "Africa/Nairobi",          label: "Nairobi (EAT)" },
                  { value: "Asia/Dubai",              label: "Dubai (GST)" },
                  { value: "Asia/Kolkata",            label: "India (IST)" },
                  { value: "Asia/Tokyo",              label: "Tokyo (JST)" },
                  { value: "Australia/Sydney",        label: "Sydney (AEDT)" },
                ]}
              />
            </Field>
          </Grid>
        </Card>

        {/* ── Location ───────────────────────────────────────────── */}
        <Card title="Location" subtitle="Where is your event being held?">
          <Grid>
            <Field label="Venue name" span={2}>
              <Input
                value={form.venue_name}
                onChange={(e) => set("venue_name", e.target.value)}
                placeholder="e.g. The Grand Ballroom"
              />
            </Field>

            <Field label="Street address" span={2}>
              <Input
                value={form.venue_address}
                onChange={(e) => set("venue_address", e.target.value)}
                placeholder="e.g. 123 Main St"
              />
            </Field>

            <Field label="City">
              <Input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Denver"
              />
            </Field>

            <Field label="State / Region">
              <Input
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="Colorado"
              />
            </Field>

            <Field label="Country">
              <Input
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="US"
              />
            </Field>
          </Grid>
        </Card>

        {/* ── Features ───────────────────────────────────────────── */}
        <Card title="Features" subtitle="Enable guest interactions for this event">
          <div className="grid gap-3 sm:grid-cols-3">
            <Toggle
              label="RSVP"
              description="Let guests confirm attendance"
              checked={form.allow_rsvp}
              onChange={(v) => set("allow_rsvp", v)}
            />
            <Toggle
              label="Ticketing"
              description="Sell or distribute tickets"
              checked={form.allow_ticketing}
              onChange={(v) => set("allow_ticketing", v)}
            />
            <Toggle
              label="Donations"
              description="Accept gifts or contributions"
              checked={form.allow_donations}
              onChange={(v) => set("allow_donations", v)}
            />
          </div>
        </Card>

        {/* ── Submit ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating…" : "Create event →"}
          </button>
        </div>

      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Layout primitives
═══════════════════════════════════════════ */

function Card({ title, subtitle, children }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Grid({ children }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function Field({ label, error, span, children }) {
  const colSpan = span === 2 ? "sm:col-span-2" : span === 3 ? "sm:col-span-2 lg:col-span-3" : "";
  return (
    <div className={`flex flex-col gap-1.5 ${colSpan}`}>
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-gray-100/10";

function Input({ value, onChange, placeholder, type = "text", error }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${inputBase} ${
        error
          ? "border-red-300 focus:border-red-400 dark:border-red-700"
          : "border-gray-200 focus:border-gray-400 dark:border-gray-700 dark:focus:border-gray-500"
      }`}
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
      className={`${inputBase} resize-none border-gray-200 focus:border-gray-400 dark:border-gray-700 dark:focus:border-gray-500`}
    />
  );
}

function Select({ value, onChange, options, error }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`${inputBase} ${
        error
          ? "border-red-300 focus:border-red-400 dark:border-red-700"
          : "border-gray-200 focus:border-gray-400 dark:border-gray-700 dark:focus:border-gray-500"
      }`}
    >
      <option value="">Select…</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-600"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <div
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
          checked ? "border-white bg-white" : "border-gray-300"
        }`}
      >
        {checked && (
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className={`mt-0.5 text-xs ${checked ? "text-white/60" : "text-gray-400 dark:text-gray-500"}`}>
          {description}
        </p>
      </div>
    </button>
  );
}
