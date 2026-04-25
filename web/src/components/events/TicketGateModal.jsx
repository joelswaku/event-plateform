"use client";

/**
 * web/src/components/events/TicketGateModal.jsx  ← REPLACE
 *
 * Shown when user clicks "Tickets" on a non-Ticketed & Entertainment event.
 * CTA redirects to /events/${eventId}/tickets to create tickets for THIS event.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Ticket, AlertCircle } from "lucide-react";

export default function TicketGateModal({ open, onClose, event }) {
  const overlayRef = useRef(null);
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Redirect to THIS event's ticket creation page
  const handleGoToTickets = () => {
    onClose();
    router.push(`/events/${event?.id}/tickets`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleBackdrop}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#fff" }}
          >
            {/* Accent bar */}
            <div
              className="h-1 w-full"
              style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444, #a855f7)" }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <X size={14} />
            </button>

            {/* Body */}
            <div className="px-6 pt-6 pb-7 space-y-5">

              {/* Icon + title */}
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, #fef3c720, #f59e0b15)",
                    border: "1px solid rgba(245,158,11,0.25)",
                  }}
                >
                  <AlertCircle size={24} style={{ color: "#f59e0b" }} />
                </div>

                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    This event is not ticketed
                  </h2>
                  <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-800">
                      {event?.title ?? "This event"}
                    </span>{" "}
                    is not in the{" "}
                    <span className="font-semibold text-amber-600">
                      Ticketed &amp; Entertainment
                    </span>{" "}
                    category, but you can still create tickets for it.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* Info box */}
              <div
                className="rounded-xl p-4 space-y-2"
                style={{
                  background: "rgba(99,102,241,0.04)",
                  border: "1px solid rgba(99,102,241,0.12)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Ticket size={14} style={{ color: "#6366f1" }} />
                  <p className="text-xs font-bold text-indigo-700">
                    Create tickets for this event
                  </p>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  You can add ticket tiers, set pricing, manage capacity, and accept
                  payments — even for non-entertainment events.
                </p>
              </div>

              {/* Primary CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGoToTickets}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white transition"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
                }}
              >
                Create tickets for this event
                <ArrowRight size={15} />
              </motion.button>

              {/* Cancel */}
              <button
                onClick={onClose}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition"
              >
                Cancel
              </button>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


// "use client";

// /**
//  * web/src/components/events/TicketGateModal.jsx  ← NEW FILE
//  *
//  * Shown when user clicks "Tickets" quick action on a non-Ticketed event.
//  * Clicking the CTA navigates to /events/create?category=entertainment&from=tickets
//  * which pre-selects the Ticketed & Entertainment category in the wizard.
//  */

// import { useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { X, ArrowRight, Lock } from "lucide-react";

// export default function TicketGateModal({ open, onClose, event }) {
//   const overlayRef = useRef(null);
//   const router = useRouter();

//   // Close on Escape
//   useEffect(() => {
//     if (!open) return;
//     const handler = (e) => {
//       if (e.key === "Escape") onClose();
//     };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [open, onClose]);

//   // Close on backdrop click
//   const handleBackdrop = (e) => {
//     if (e.target === overlayRef.current) onClose();
//   };

//   const handleCreate = () => {
//     onClose();
//     router.push("/events/create?category=entertainment&from=tickets");
//   };

//   return (
//     <AnimatePresence>
//       {open && (
//         <motion.div
//           ref={overlayRef}
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.18 }}
//           onClick={handleBackdrop}
//           className="fixed inset-0 z-50 flex items-center justify-center px-4"
//           style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
//         >
//           <motion.div
//             initial={{ opacity: 0, scale: 0.94, y: 14 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.94, y: 8 }}
//             transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
//             className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
//             style={{ background: "#fff" }}
//           >
//             {/* Accent bar */}
//             <div
//               className="h-1 w-full"
//               style={{
//                 background: "linear-gradient(90deg, #f59e0b, #ef4444, #a855f7)",
//               }}
//             />

//             {/* Close button */}
//             <button
//               onClick={onClose}
//               className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
//             >
//               <X size={14} />
//             </button>

//             {/* Body */}
//             <div className="px-6 pt-6 pb-7 space-y-5">

//               {/* Icon + title */}
//               <div className="flex flex-col items-center text-center gap-3">
//                 <div
//                   className="flex h-14 w-14 items-center justify-center rounded-2xl"
//                   style={{
//                     background: "linear-gradient(135deg, #fef3c720, #f59e0b15)",
//                     border: "1px solid rgba(245,158,11,0.25)",
//                   }}
//                 >
//                   <Lock size={22} style={{ color: "#f59e0b" }} />
//                 </div>

//                 <div>
//                   <h2 className="text-lg font-black text-gray-900">
//                     Ticketing not available
//                   </h2>
//                   <p className="mt-1 text-sm text-gray-500 leading-relaxed">
//                     <span className="font-semibold text-gray-700">
//                       {event?.title ?? "This event"}
//                     </span>{" "}
//                     is not in the{" "}
//                     <span className="font-semibold text-amber-600">
//                       Ticketed &amp; Entertainment
//                     </span>{" "}
//                     category. Ticket management is only available for concerts,
//                     festivals, live shows, and similar events.
//                   </p>
//                 </div>
//               </div>

//               {/* Divider */}
//               <div className="h-px bg-gray-100" />

//               {/* Category preview chips */}
//               <div
//                 className="rounded-xl p-4 space-y-3"
//                 style={{
//                   background: "linear-gradient(135deg, #fef3c710, #f59e0b08)",
//                   border: "1px solid rgba(245,158,11,0.18)",
//                 }}
//               >
//                 <p className="text-[11px] font-black uppercase tracking-widest text-amber-500">
//                   🎟️ Ticketed &amp; Entertainment
//                 </p>
//                 <div className="flex flex-wrap gap-1.5">
//                   {[
//                     "Concert", "Festival", "Live Show",
//                     "Nightclub", "Theater", "Comedy",
//                     "Sports", "Exhibition",
//                   ].map((t) => (
//                     <span
//                       key={t}
//                       className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
//                       style={{
//                         background: "rgba(245,158,11,0.1)",
//                         color: "#b45309",
//                         border: "1px solid rgba(245,158,11,0.2)",
//                       }}
//                     >
//                       {t}
//                     </span>
//                   ))}
//                 </div>
//                 <p className="text-xs text-gray-400 leading-relaxed">
//                   Full ticket tiers, pricing, capacity limits, and Stripe payments.
//                 </p>
//               </div>

//               {/* Primary CTA */}
//               <motion.button
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.97 }}
//                 onClick={handleCreate}
//                 className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white transition"
//                 style={{
//                   background: "linear-gradient(135deg, #f59e0b, #ef4444)",
//                   boxShadow: "0 6px 20px rgba(245,158,11,0.35)",
//                 }}
//               >
//                 Create a ticketed event
//                 <ArrowRight size={15} />
//               </motion.button>

//               {/* Cancel */}
//               <button
//                 onClick={onClose}
//                 className="w-full rounded-xl py-2.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition"
//               >
//                 Cancel
//               </button>

//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }













// "use client";

// /**
//  * TicketGateModal
//  *
//  * Shown when a user clicks "Tickets" on an event that is NOT in the
//  * Ticketed & Entertainment category (i.e. allow_ticketing is false /
//  * dashboard_mode is not an entertainment sub).
//  *
//  * Two actions:
//  *  1. Share the event's public ticket page URL (read-only link)
//  *  2. Create a new Ticketed & Entertainment event
//  */

// import { useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { X, Ticket, ExternalLink, Plus, Copy, Check } from "lucide-react";
// import { useState } from "react";
// import Link from "next/link";

// const PUBLIC_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "";

// export default function TicketGateModal({ open, onClose, event }) {
//   const overlayRef = useRef(null);
//   const [copied, setCopied] = useState(false);

//   // Close on Escape
//   useEffect(() => {
//     if (!open) return;
//     const handler = (e) => { if (e.key === "Escape") onClose(); };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [open, onClose]);

//   // Close on backdrop click
//   const handleBackdrop = (e) => {
//     if (e.target === overlayRef.current) onClose();
//   };

//   // The public ticket page URL for sharing
//   const ticketPageUrl = event?.id
//     ? `${PUBLIC_BASE}/events/${event.id}/tickets`
//     : null;

//   const handleCopy = async () => {
//     if (!ticketPageUrl) return;
//     try {
//       await navigator.clipboard.writeText(ticketPageUrl);
//       setCopied(true);
//       setTimeout(() => setCopied(false), 2000);
//     } catch {
//       // fallback silent fail
//     }
//   };

//   return (
//     <AnimatePresence>
//       {open && (
//         <motion.div
//           ref={overlayRef}
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.18 }}
//           onClick={handleBackdrop}
//           className="fixed inset-0 z-50 flex items-center justify-center px-4"
//           style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
//         >
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95, y: 12 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.95, y: 8 }}
//             transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
//             className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
//             style={{ background: "#fff" }}
//           >
//             {/* Top accent bar */}
//             <div
//               className="h-1 w-full"
//               style={{
//                 background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
//               }}
//             />

//             {/* Header */}
//             <div className="flex items-start justify-between px-6 pt-5 pb-0">
//               <div className="flex items-center gap-3">
//                 <div
//                   className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
//                   style={{
//                     background: "rgba(99,102,241,0.1)",
//                     border: "1px solid rgba(99,102,241,0.2)",
//                   }}
//                 >
//                   <Ticket size={18} style={{ color: "#6366f1" }} />
//                 </div>
//                 <div>
//                   <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
//                     Ticketing
//                   </p>
//                   <h2 className="text-base font-bold text-gray-900 leading-tight">
//                     Tickets not enabled for this event
//                   </h2>
//                 </div>
//               </div>
//               <button
//                 onClick={onClose}
//                 className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
//               >
//                 <X size={15} />
//               </button>
//             </div>

//             {/* Body */}
//             <div className="px-6 pt-4 pb-6 space-y-5">
//               <p className="text-sm text-gray-500 leading-relaxed">
//                 <span className="font-semibold text-gray-800">{event?.title ?? "This event"}</span>{" "}
//                 is not in the <span className="font-semibold text-indigo-600">Ticketed &amp; Entertainment</span> category,
//                 so ticket management is not available here.
//               </p>

//               {/* Share ticket page */}
//               {ticketPageUrl && (
//                 <div
//                   className="rounded-xl border p-4 space-y-3"
//                   style={{
//                     background: "rgba(99,102,241,0.04)",
//                     borderColor: "rgba(99,102,241,0.15)",
//                   }}
//                 >
//                   <div className="flex items-center justify-between">
//                     <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
//                       Public Ticket Page
//                     </p>
//                     <a
//                       href={ticketPageUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
//                     >
//                       Open <ExternalLink size={11} />
//                     </a>
//                   </div>

//                   <div
//                     className="flex items-center gap-2 rounded-lg px-3 py-2"
//                     style={{ background: "rgba(0,0,0,0.04)" }}
//                   >
//                     <p className="flex-1 truncate text-xs font-mono text-gray-500">
//                       {ticketPageUrl}
//                     </p>
//                     <button
//                       onClick={handleCopy}
//                       className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition"
//                       style={{
//                         background: copied ? "rgba(34,197,94,0.1)" : "rgba(99,102,241,0.1)",
//                         color: copied ? "#16a34a" : "#6366f1",
//                       }}
//                     >
//                       {copied ? <Check size={11} /> : <Copy size={11} />}
//                       {copied ? "Copied!" : "Copy"}
//                     </button>
//                   </div>

//                   <p className="text-xs text-gray-400">
//                     You can share this link — attendees can view available tickets on the public page.
//                   </p>
//                 </div>
//               )}

//               {/* Divider */}
//               <div className="flex items-center gap-3">
//                 <div className="flex-1 h-px bg-gray-100" />
//                 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
//                   Want full ticketing?
//                 </p>
//                 <div className="flex-1 h-px bg-gray-100" />
//               </div>

//               {/* CTA: create ticketed event */}
//               <div
//                 className="rounded-xl border p-4 space-y-3"
//                 style={{
//                   background: "linear-gradient(135deg, #fef3c708, #f59e0b06)",
//                   borderColor: "rgba(245,158,11,0.2)",
//                 }}
//               >
//                 <div className="flex items-start gap-3">
//                   <span className="text-2xl leading-none mt-0.5">🎟️</span>
//                   <div>
//                     <p className="text-sm font-bold text-gray-800">
//                       Create a Ticketed &amp; Entertainment event
//                     </p>
//                     <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
//                       Concerts, festivals, live shows, nightclub events and more — with full
//                       ticket tiers, pricing, capacity, and Stripe payments.
//                     </p>
//                   </div>
//                 </div>
//                 <Link
//                   href="/events/create"
//                   onClick={onClose}
//                   className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition active:scale-[0.98]"
//                   style={{
//                     background: "linear-gradient(135deg, #f59e0b, #ef4444)",
//                     boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
//                   }}
//                 >
//                   <Plus size={14} />
//                   Create ticketed event
//                 </Link>
//               </div>
//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }
