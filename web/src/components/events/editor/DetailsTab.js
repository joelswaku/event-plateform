import ImageUpload from "./ImageUpload";

export default function DetailsTab({ form, updateField }) {
  return (
    <div className="space-y-4">
      <input
        value={form.title || ""}
        onChange={(e) => updateField("title", e.target.value)}
        placeholder="Event title"
        className="w-full border p-3 rounded"
      />

      <textarea
        value={form.description || ""}
        onChange={(e) => updateField("description", e.target.value)}
        placeholder="Description"
        className="w-full border p-3 rounded"
      />

      <ImageUpload
        value={form.banner_url}
        onChange={(url) => updateField("banner_url", url)}
      />
    </div>
  );
}