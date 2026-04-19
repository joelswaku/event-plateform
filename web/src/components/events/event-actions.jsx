"use client";

import { useState } from "react";
import { useEventStore } from "@/store/event.store";

export default function EventActions({ event }) {
  const {
    publishEvent,
    unpublishEvent,
    cancelEvent,
    archiveEvent,
    restoreEvent,
    deleteEvent,
  } = useEventStore();

  const [loading, setLoading] = useState(null);

  const handle = async (e, action, name) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    setLoading(name);
    await action(event.id);
    setLoading(null);
  };

  const btn = (label, name, action, color) => (
    <button
      disabled={loading !== null}
      onClick={(e) => handle(e, action, name)}
      className={`text-xs px-2 py-1 rounded transition
        ${color}
        ${
          loading === name
            ? "opacity-50 cursor-not-allowed"
            : "hover:scale-105"
        }
      `}
    >
      {loading === name ? "..." : label}
    </button>
  );

  const status = event.status;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {/* DRAFT */}
      {status === "DRAFT" &&
        btn("Publish", "publish", publishEvent, "bg-green-100")}

      {/* PUBLISHED */}
      {status === "PUBLISHED" && (
        <>
          {btn("Unpublish", "unpublish", unpublishEvent, "bg-blue-100")}
          {btn("Cancel", "cancel", cancelEvent, "bg-yellow-100")}
          {btn("Archive", "archive", archiveEvent, "bg-gray-200")}
        </>
      )}

      {/* CANCELLED or ARCHIVED */}
      {(status === "CANCELLED" || status === "ARCHIVED") &&
        btn("Restore", "restore", restoreEvent, "bg-indigo-100")}

      {/* ALWAYS */}
      {btn("Delete", "delete", deleteEvent, "bg-red-100")}
    </div>
  );
}


// "use client";

// import { useEventStore } from "@/store/event.store";

// export default function EventActions({ event }) {
//   const {
//     deleteEvent,
//     publishEvent,
//     cancelEvent,
//     archiveEvent,
//   } = useEventStore();

//   const handleClick = (e, fn) => {
//     e.preventDefault();
//     e.stopPropagation();
//     fn(event.id);
//   };

//   return (
//     <div className="flex flex-wrap gap-2 mt-4">
//       <button
//         onClick={(e) => handleClick(e, publishEvent)}
//         className="text-xs bg-green-100 px-2 py-1 rounded"
//       >
//         Publish
//       </button>

//       <button
//         onClick={(e) => handleClick(e, cancelEvent)}
//         className="text-xs bg-yellow-100 px-2 py-1 rounded"
//       >
//         Cancel
//       </button>

//       <button
//         onClick={(e) => handleClick(e, archiveEvent)}
//         className="text-xs bg-gray-200 px-2 py-1 rounded"
//       >
//         Archive
//       </button>

//       <button
//         onClick={(e) => handleClick(e, deleteEvent)}
//         className="text-xs bg-red-100 px-2 py-1 rounded"
//       >
//         Delete
//       </button>
//     </div>
//   );
// }