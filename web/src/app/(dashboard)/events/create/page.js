

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEventStore } from "@/store/event.store";
import PageHeader from "@/components/ui/page-header";

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent, isLoading } = useEventStore();

  const [form, setForm] = useState({
    title: "",
    event_type: "",
    timezone: "UTC",
    starts_at: "",
    ends_at: "",
    visibility: "PRIVATE",
    city: "",
    country: "",
    allow_rsvp: true,
    allow_ticketing: false,
    allow_donations: false,
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validate = () => {
    if (!form.title.trim()) {
      alert("Event title is required");
      return false;
    }

    if (!form.event_type) {
      alert("Event type is required");
      return false;
    }

    if (!form.starts_at) {
      alert("Start date is required");
      return false;
    }

    if (!form.ends_at) {
      alert("End date is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const payload = {
        ...form,

        // ✅ ENUM FIX
        event_type: form.event_type.toUpperCase(),

        // ✅ DATE FIX
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),

        // ✅ CLEAN STRINGS
        title: form.title.trim(),
        city: form.city.trim(),
        country: form.country.toUpperCase(),
      };

      console.log("🚀 PAYLOAD:", payload);

      const res = await createEvent(payload);

      const eventId = res?.data?.id || res?.id;

      router.push(`/events/${eventId}`);
    } catch (error) {
      console.error(
        "❌ CREATE EVENT ERROR:",
        error?.response?.data || error.message
      );
      alert(
        error?.response?.data?.message ||
          "Failed to create event. Check console."
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Events"
        title="Create event"
        description="Start a new event and configure the basics first."
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[#e5e7eb] bg-white p-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Event title"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Wedding Ceremony"
          />

          {/* ✅ SELECT INSTEAD OF INPUT */}
          <SelectField
            label="Event type"
            value={form.event_type}
            onChange={(e) =>
              handleChange("event_type", e.target.value)
            }
            options={[
              { value: "WEDDING", label: "Wedding" },
              { value: "FUNERAL", label: "Funeral" },
              { value: "MEETING", label: "Meeting" },
              { value: "BIRTHDAY", label: "Birthday" },
              { value: "CORPORATE_EVENT", label: "Corporate Event" },
              { value: "OTHER", label: "Other" },
            ]}
          />

          <Field
            label="Timezone"
            value={form.timezone}
            onChange={(e) => handleChange("timezone", e.target.value)}
            placeholder="UTC"
          />

          <SelectField
            label="Visibility"
            value={form.visibility}
            onChange={(e) =>
              handleChange("visibility", e.target.value)
            }
            options={[
              { value: "PRIVATE", label: "Private" },
              { value: "PUBLIC", label: "Public" },
              { value: "UNLISTED", label: "Unlisted" },
            ]}
          />

          <Field
            label="City"
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Denver"
          />

          <Field
            label="Country"
            value={form.country}
            onChange={(e) => handleChange("country", e.target.value)}
            placeholder="USA"
          />

          <Field
            label="Starts at"
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) =>
              handleChange("starts_at", e.target.value)
            }
          />

          <Field
            label="Ends at"
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) =>
              handleChange("ends_at", e.target.value)
            }
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Checkbox
            label="Allow RSVP"
            checked={form.allow_rsvp}
            onChange={(v) => handleChange("allow_rsvp", v)}
          />

          <Checkbox
            label="Allow ticketing"
            checked={form.allow_ticketing}
            onChange={(v) => handleChange("allow_ticketing", v)}
          />

          <Checkbox
            label="Allow donations"
            checked={form.allow_donations}
            onChange={(v) => handleChange("allow_donations", v)}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-2xl bg-[#111827] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create event"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#d1d5db] px-4 py-3 text-sm outline-none focus:border-[#111827]"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-[#d1d5db] px-4 py-3 text-sm"
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

