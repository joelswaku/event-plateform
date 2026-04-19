export default function LocationTab({ form, updateField }) {
    return (
      <div className="space-y-4">
        <input
          value={form.venue_name || ""}
          onChange={(e) => updateField("venue_name", e.target.value)}
          placeholder="Venue"
          className="w-full border p-3 rounded"
        />
  
        <input
          value={form.city || ""}
          onChange={(e) => updateField("city", e.target.value)}
          placeholder="City"
          className="w-full border p-3 rounded"
        />
      </div>
    );
  }