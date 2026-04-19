
"use client";

import { useState } from "react";

export default function EditableSection({ section, onSave }) {
  const [title, setTitle] = useState(section.title || "");
  const [body, setBody] = useState(section.body || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // We await the onSave so we know when the API is done
      await onSave(section.id, { title, body });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4 space-y-3 bg-white shadow-sm">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Section title"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/5"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Content</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Section content"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/5 min-h-[100px]"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
          isSaving 
            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
            : "bg-black text-white hover:bg-gray-800 active:scale-[0.98]"
        }`}
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}








// "use client";

// import { useState } from "react";

// export default function EditableSection({ section, onSave }) {
//   const [title, setTitle] = useState(section.title || "");
//   const [body, setBody] = useState(section.body || "");

//   const handleSave = () => {
//     onSave(section.id, {
//       title,
//       body,
//     });
//   };

//   return (
//     <div className="rounded-2xl border p-4 space-y-3 bg-white">
//       <input
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         placeholder="Section title"
//         className="w-full border rounded px-3 py-2"
//       />

//       <textarea
//         value={body}
//         onChange={(e) => setBody(e.target.value)}
//         placeholder="Section content"
//         className="w-full border rounded px-3 py-2"
//       />

//       <button
//         onClick={handleSave}
//         className="px-4 py-2 bg-black text-white rounded"
//       >
//         Save
//       </button>
//     </div>
//   );
// }