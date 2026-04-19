"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  variant = "danger",
}) {
  if (!open) return null;

  const colors =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-gray-900 hover:bg-black";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-gray-500">{description}</p>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm text-white rounded-xl ${colors}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}