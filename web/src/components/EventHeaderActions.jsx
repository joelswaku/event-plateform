
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEventStore } from "@/store/event.store";
import ConfirmModal from "@/components/ui/confirm-modal";
// 👉 optional (if you have toast)
// import { toast } from "sonner";

export default function EventHeaderActions({ event }) {
  const router = useRouter();

  const {
    publishEvent,
    cancelEvent,
    archiveEvent,
    deleteEvent,
    restoreEvent,
  } = useEventStore();

  const [loading, setLoading] = useState(null);
  const [modal, setModal] = useState(null);

  /* =========================
     RUN ACTION
  ========================= */
  const run = async (fn, name) => {
    try {
      setLoading(name);

      const res = await fn(event.id);

      // 👉 toast (optional)
      // if (res?.success) toast.success(`${name} success`);
      // else toast.error(`${name} failed`);

    } catch (err) {
      // toast.error("Something went wrong");
      console.error(err);
    } finally {
      setLoading(null);
      setModal(null);
    }
  };

  /* =========================
     BUTTON HELPER
  ========================= */
  const btn = (label, name, fn, color, confirm = false) => (
    <button
      disabled={loading !== null}
      onClick={() => {
        if (confirm) {
          setModal({ fn, name, label });
        } else {
          run(fn, name);
        }
      }}
      className={`
        px-3 py-1.5 rounded-xl text-sm font-medium transition
        ${loading === name ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
        ${color}
      `}
    >
      {loading === name ? "..." : label}
    </button>
  );

  const status = event.status;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* 🔥 EDIT BUTTON (NEW) */}
        <button
          onClick={() => router.push(`/events/${event.id}/edit`)}
          className="px-3 py-1.5 rounded-xl text-sm font-medium bg-white border hover:bg-gray-50"
        >
          Edit
        </button>

        {/* =========================
           STATUS ACTIONS
        ========================= */}

        {status === "DRAFT" &&
          btn("Publish", "publish", publishEvent, "bg-green-100")}

        {status === "PUBLISHED" && (
          <>
            {btn("Cancel", "cancel", cancelEvent, "bg-yellow-100", true)}
            {btn("Archive", "archive", archiveEvent, "bg-gray-200", true)}
          </>
        )}

        {(status === "CANCELLED" || status === "ARCHIVED") &&
          btn("Restore", "restore", restoreEvent, "bg-blue-100")}

        {/* 🔥 ALWAYS LAST (DANGER) */}
        {btn("Delete", "delete", deleteEvent, "bg-red-100", true)}
      </div>

      {/* =========================
         CONFIRM MODAL
      ========================= */}
      <ConfirmModal
        open={!!modal}
        onClose={() => setModal(null)}
        onConfirm={() => run(modal.fn, modal.name)}
        title={`Confirm ${modal?.label}`}
        description={`Are you sure you want to ${modal?.label?.toLowerCase()} this event? This action may affect guests, tickets, and analytics.`}
        confirmText={modal?.label}
        variant="danger"
      />
    </>
  );
}


// "use client";

// import { useState } from "react";
// import { useEventStore } from "@/store/event.store";
// import ConfirmModal from "@/components/ui/confirm-modal";

// export default function EventHeaderActions({ event }) {
//   const {
//     publishEvent,
//     cancelEvent,
//     archiveEvent,
//     deleteEvent,
//     restoreEvent,
//   } = useEventStore();

//   const [loading, setLoading] = useState(null);
//   const [modal, setModal] = useState(null);

//   const run = async (fn, name) => {
//     setLoading(name);
//     await fn(event.id);
//     setLoading(null);
//     setModal(null);
//   };

//   const btn = (label, name, fn, color, confirm = false) => (
//     <button
//       disabled={loading !== null}
//       onClick={() => {
//         if (confirm) {
//           setModal({ fn, name, label });
//         } else {
//           run(fn, name);
//         }
//       }}
//       className={`px-3 py-1.5 rounded-xl text-sm transition
//         ${loading === name ? "opacity-50" : "hover:scale-105"}
//         ${color}`}
//     >
//       {loading === name ? "..." : label}
//     </button>
//   );

//   const status = event.status;

//   return (
//     <>
//       <div className="flex flex-wrap gap-2">
//         {status === "DRAFT" &&
//           btn("Publish", "publish", publishEvent, "bg-green-100")}

//         {status === "PUBLISHED" && (
//           <>
//             {btn("Cancel", "cancel", cancelEvent, "bg-yellow-100", true)}
//             {btn("Archive", "archive", archiveEvent, "bg-gray-200", true)}
//           </>
//         )}

//         {(status === "CANCELLED" || status === "ARCHIVED") &&
//           btn("Restore", "restore", restoreEvent, "bg-blue-100")}

//         {btn("Delete", "delete", deleteEvent, "bg-red-100", true)}

//       </div>

//       {/* 🔥 MODAL */}
//       <ConfirmModal
//         open={!!modal}
//         onClose={() => setModal(null)}
//         onConfirm={() => run(modal.fn, modal.name)}
//         title={`Confirm ${modal?.label}`}
//         description={`Are you sure you want to ${modal?.label.toLowerCase()} this event? This action can affect your attendees.`}
//         confirmText={modal?.label}
//         variant="danger"
//       />
//     </>
//   );
// }