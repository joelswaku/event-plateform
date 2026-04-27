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
