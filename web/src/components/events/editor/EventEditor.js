
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useEventStore } from "@/store/event.store";
import ImageUpload from "./ImageUpload";

export default function EventEditor() {
  const { eventId } = useParams();

  const { dashboard, fetchEventDashboard, updateEvent } =
    useEventStore();

  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const initializedRef = useRef(false);
  const debounceRef = useRef(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (eventId) fetchEventDashboard(eventId);
  }, [eventId]);

  /* ================= INIT ================= */
  useEffect(() => {
    if (!dashboard?.event) return;
    if (initializedRef.current) return;

    const e = dashboard.event;
    setForm({
      title:             e.title             ?? "",
      description:       e.description       ?? "",
      short_description: e.short_description ?? "",
      event_type:        e.event_type        ?? "",
      cover_image_url:   e.cover_image_url   ?? "",
      venue_name:        e.venue_name        ?? "",
      venue_address:     e.venue_address     ?? "",
      city:              e.city              ?? "",
      state:             e.state             ?? "",
      country:           e.country           ?? "",
      // backend stores as starts_at_utc; input sends as starts_at
      starts_at:         e.starts_at_utc     ?? "",
      ends_at:           e.ends_at_utc       ?? "",
      timezone:          e.timezone          ?? "",
      visibility:        e.visibility        ?? "PRIVATE",
      allow_rsvp:        e.allow_rsvp        ?? false,
      allow_plus_ones:   e.allow_plus_ones   ?? false,
      allow_qr_checkin:  e.allow_qr_checkin  ?? false,
      allow_ticketing:   e.allow_ticketing    ?? false,
      allow_donations:   e.allow_donations   ?? false,
    });
    initializedRef.current = true;
  }, [dashboard]);

  /* ================= AUTO SAVE ================= */
  useEffect(() => {
    if (!initializedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      setSaved(false);
      setError(null);

      const payload = {
        title:             form.title,
        description:       form.description,
        short_description: form.short_description,
        event_type:        form.event_type,
        cover_image_url:   form.cover_image_url,
        venue_name:        form.venue_name,
        venue_address:     form.venue_address,
        city:              form.city,
        state:             form.state,
        country:           form.country,
        starts_at:         form.starts_at  || undefined,
        ends_at:           form.ends_at    || undefined,
        timezone:          form.timezone,
        visibility:        form.visibility,
        allow_rsvp:        form.allow_rsvp,
        allow_plus_ones:   form.allow_plus_ones,
        allow_qr_checkin:  form.allow_qr_checkin,
        allow_ticketing:   form.allow_ticketing,
        allow_donations:   form.allow_donations,
      };

      const result = await updateEvent(eventId, payload);

      if (result?.success === false) {
        setError("Auto-save failed — check your inputs");
      } else {
        setSaved(true);
      }

      setSaving(false);
    }, 800);

    return () => clearTimeout(debounceRef.current);
  }, [form]);

  /* ================= HANDLER ================= */
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (!initializedRef.current) {
    return <div className="p-6 text-gray-500 dark:text-gray-400">Loading editor...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Edit Event</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Auto-saves changes instantly
          </p>
        </div>

        <div className="flex gap-3">
          {saving && <span className="text-gray-500 dark:text-gray-400 text-sm">Saving...</span>}
          {saved && !saving && <span className="text-green-600 text-sm">Saved ✅</span>}
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
      </div>

      {/* IMAGE */}
      <Section title="Cover Image">
        <ImageUpload
          value={form.cover_image_url}
          onChange={(url) => handleChange("cover_image_url", url)}
        />
      </Section>

      {/* BASIC */}
      <Section title="Basic Info">
        <Input
          label="Title"
          value={form.title}
          onChange={(v) => handleChange("title", v)}
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={(v) => handleChange("description", v)}
        />

        <Input
          label="Short Description"
          value={form.short_description}
          onChange={(v) => handleChange("short_description", v)}
        />

        <Input
          label="Event Type"
          value={form.event_type}
          onChange={(v) => handleChange("event_type", v)}
        />
      </Section>

      {/* LOCATION */}
      <Section title="Location">
        <Input
          label="Venue"
          value={form.venue_name}
          onChange={(v) => handleChange("venue_name", v)}
        />

        <Input
          label="Address"
          value={form.venue_address}
          onChange={(v) => handleChange("venue_address", v)}
        />

        <Grid>
          <Input label="City" value={form.city} onChange={(v) => handleChange("city", v)} />
          <Input label="State" value={form.state} onChange={(v) => handleChange("state", v)} />
          <Input label="Country" value={form.country} onChange={(v) => handleChange("country", v)} />
        </Grid>
      </Section>

      {/* TIME */}
      <Section title="Time">
        <Input
          label="Start"
          type="datetime-local"
          value={formatDate(form.starts_at)}
          onChange={(v) => handleChange("starts_at", v)}
        />

        <Input
          label="End"
          type="datetime-local"
          value={formatDate(form.ends_at)}
          onChange={(v) => handleChange("ends_at", v)}
        />

        {form.starts_at && form.ends_at && new Date(form.ends_at) < new Date(form.starts_at) && (
          <p className="text-xs text-red-500">End date must be after start date</p>
        )}

        <Input
          label="Timezone"
          value={form.timezone}
          onChange={(v) => handleChange("timezone", v)}
        />
      </Section>

      {/* SETTINGS */}
      <Section title="Settings">

        <Select
          label="Visibility"
          value={form.visibility}
          onChange={(v) => handleChange("visibility", v)}
          options={[
            { label: "🔒 Private", value: "PRIVATE" },
            { label: "🌍 Public", value: "PUBLIC" },
          ]}
        />

        <Toggle
          label="Allow RSVP"
          checked={form.allow_rsvp}
          onChange={(v) => handleChange("allow_rsvp", v)}
        />

        <Toggle
          label="Allow Plus Ones"
          checked={form.allow_plus_ones}
          onChange={(v) => handleChange("allow_plus_ones", v)}
        />

        <Toggle
          label="QR Check-in"
          checked={form.allow_qr_checkin}
          onChange={(v) => handleChange("allow_qr_checkin", v)}
        />

        <Toggle
          label="Ticketing"
          checked={form.allow_ticketing}
          onChange={(v) => handleChange("allow_ticketing", v)}
        />

        <Toggle
          label="Donations"
          checked={form.allow_donations}
          onChange={(v) => handleChange("allow_donations", v)}
        />
      </Section>

    </div>
  );
}

/* ================= COMPONENTS ================= */

function Section({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl space-y-4">
      <h2 className="font-medium text-gray-900 dark:text-gray-100">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, value = "", onChange, type = "text" }) {
  return (
    <div>
      <label className="text-sm text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      />
    </div>
  );
}

function Textarea({ label, value = "", onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-700 dark:text-gray-300">{label}</label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm text-gray-700 dark:text-gray-300">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-gray-800 dark:text-gray-200 cursor-pointer">
      <input
        type="checkbox"
        checked={checked || false}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-indigo-500"
      />
      {label}
    </label>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-3 gap-3">{children}</div>;
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}
// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useParams } from "next/navigation";
// import { useEventStore } from "@/store/event.store";

// export default function EventEditor() {
//   const { eventId } = useParams();

//   const {
//     dashboard,
//     fetchEventDashboard,
//     updateEvent,
//   } = useEventStore();

//   const [form, setForm] = useState({});
//   const [saving, setSaving] = useState(false);
//   const [saved, setSaved] = useState(false);
//   const [error, setError] = useState(null);

//   const initializedRef = useRef(false);
//   const debounceRef = useRef(null);

//   /* =========================
//      LOAD EVENT
//   ========================= */
//   useEffect(() => {
//     if (eventId) {
//       fetchEventDashboard(eventId);
//     }
//   }, [eventId]);

//   /* =========================
//      INIT FORM (ONLY ONCE)
//   ========================= */
//   useEffect(() => {
//     if (!dashboard?.event) return;
//     if (initializedRef.current) return;

//     setForm(dashboard.event);
//     initializedRef.current = true;
//   }, [dashboard]);

//   /* =========================
//      AUTO SAVE (DEBOUNCE)
//   ========================= */
//   useEffect(() => {
//     if (!initializedRef.current) return;

//     // clear previous debounce
//     if (debounceRef.current) {
//       clearTimeout(debounceRef.current);
//     }

//     debounceRef.current = setTimeout(async () => {
//       try {
//         setSaving(true);
//         setSaved(false);
//         setError(null);

//         await updateEvent(eventId, form);

//         setSaved(true);
//       } catch (err) {
//         console.error(err);
//         setError("Auto-save failed");
//       } finally {
//         setSaving(false);
//       }
//     }, 1000);

//     return () => clearTimeout(debounceRef.current);
//   }, [form, eventId]);

//   /* =========================
//      MANUAL SAVE
//   ========================= */
//   const handleSave = async () => {
//     try {
//       setSaving(true);
//       setSaved(false);
//       setError(null);

//       await updateEvent(eventId, form);

//       setSaved(true);
//     } catch (err) {
//       console.error(err);
//       setError("Save failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* =========================
//      INPUT HANDLER
//   ========================= */
//   const handleChange = (field, value) => {
//     setForm((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   /* =========================
//      UI
//   ========================= */
//   if (!initializedRef.current) {
//     return <div className="p-6">Loading editor...</div>;
//   }

//   return (
//     <div className="space-y-6 p-6">

//       {/* HEADER */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-xl font-semibold">Edit Event</h1>

//         <div className="flex items-center gap-3">
//           {/* STATUS */}
//           {saving && (
//             <span className="text-sm text-gray-500">Saving...</span>
//           )}
//           {saved && !saving && (
//             <span className="text-sm text-green-600">Saved ✅</span>
//           )}
//           {error && (
//             <span className="text-sm text-red-500">{error}</span>
//           )}

//           {/* SAVE BUTTON */}
//           <button
//             onClick={handleSave}
//             disabled={saving}
//             className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
//           >
//             {saving ? "Saving..." : "Save"}
//           </button>
//         </div>
//       </div>

//       {/* FORM */}
//       <div className="space-y-4">

//         {/* TITLE */}
//         <input
//           value={form.title || ""}
//           onChange={(e) => handleChange("title", e.target.value)}
//           placeholder="Event title"
//           className="w-full border p-2 rounded"
//         />

//         {/* DESCRIPTION */}
//         <textarea
//           value={form.description || ""}
//           onChange={(e) =>
//             handleChange("description", e.target.value)
//           }
//           placeholder="Description"
//           className="w-full border p-2 rounded"
//         />

//       </div>
//     </div>
//   );
// }