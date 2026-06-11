"use client";

/**
 * ConfirmModal + useConfirm — production-ready replacement for confirm() dialogs.
 *
 * Usage:
 *   const { confirmProps, openConfirm } = useConfirm();
 *
 *   openConfirm({
 *     title:        'Delete ticket type?',
 *     description:  '"VIP Access" will be permanently removed.',
 *     confirmText:  'Delete',
 *     variant:      'danger',
 *     onConfirm:    async () => await deleteTicket(id),
 *   });
 *
 *   // In JSX:
 *   <ConfirmModal {...confirmProps} />
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Archive, Info, CheckCircle2, Loader2, X } from "lucide-react";

/* ── Variant config ─────────────────────────────────────────────── */
const VARIANTS = {
  danger: {
    icon:        Trash2,
    iconBg:      "bg-red-50 dark:bg-red-500/10",
    iconBorder:  "border-red-100 dark:border-red-500/20",
    iconColor:   "text-red-500 dark:text-red-400",
    topBar:      "from-red-500 to-rose-400",
    btnBg:       "bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600",
  },
  warning: {
    icon:        AlertTriangle,
    iconBg:      "bg-amber-50 dark:bg-amber-500/10",
    iconBorder:  "border-amber-100 dark:border-amber-500/20",
    iconColor:   "text-amber-500 dark:text-amber-400",
    topBar:      "from-amber-400 to-orange-400",
    btnBg:       "bg-amber-500 hover:bg-amber-600",
  },
  archive: {
    icon:        Archive,
    iconBg:      "bg-indigo-50 dark:bg-indigo-500/10",
    iconBorder:  "border-indigo-100 dark:border-indigo-500/20",
    iconColor:   "text-indigo-500 dark:text-indigo-400",
    topBar:      "from-indigo-500 to-violet-400",
    btnBg:       "bg-indigo-600 hover:bg-indigo-700",
  },
  info: {
    icon:        Info,
    iconBg:      "bg-blue-50 dark:bg-blue-500/10",
    iconBorder:  "border-blue-100 dark:border-blue-500/20",
    iconColor:   "text-blue-500 dark:text-blue-400",
    topBar:      "from-blue-500 to-cyan-400",
    btnBg:       "bg-blue-600 hover:bg-blue-700",
  },
  success: {
    icon:        CheckCircle2,
    iconBg:      "bg-emerald-50 dark:bg-emerald-500/10",
    iconBorder:  "border-emerald-100 dark:border-emerald-500/20",
    iconColor:   "text-emerald-500 dark:text-emerald-400",
    topBar:      "from-emerald-500 to-teal-400",
    btnBg:       "bg-emerald-600 hover:bg-emerald-700",
  },
};

/* ── ConfirmModal component ─────────────────────────────────────── */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText  = "Confirm",
  cancelText   = "Cancel",
  variant      = "danger",
  loading      = false,
}) {
  const v = VARIANTS[variant] ?? VARIANTS.danger;
  const Icon = v.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(8px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* colored top bar */}
            <div className={`h-1 w-full bg-linear-to-r ${v.topBar}`} />

            <div className="p-6">
              {/* close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition"
              >
                <X size={14} />
              </button>

              {/* icon + text */}
              <div className="flex flex-col items-center text-center gap-3 mb-6">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${v.iconBg} ${v.iconBorder}`}>
                  <Icon size={24} className={v.iconColor} />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{title}</p>
                  {description && (
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-white/40 leading-relaxed">{description}</p>
                  )}
                </div>
              </div>

              {/* buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 text-sm font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/8 transition disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-60 ${v.btnBg}`}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── useConfirm hook ─────────────────────────────────────────────── */
export function useConfirm() {
  const [state,   setState]   = useState(null);  // { title, description, confirmText, cancelText, variant, onConfirm }
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);

  const openConfirm = useCallback((config) => {
    setState(config);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    setOpen(false);
    setTimeout(() => setState(null), 300);
  }, [loading]);

  const handleConfirm = useCallback(async () => {
    if (!state?.onConfirm) return;
    setLoading(true);
    try { await state.onConfirm(); } finally { setLoading(false); }
    setOpen(false);
    setTimeout(() => setState(null), 300);
  }, [state]);

  const confirmProps = {
    open,
    onClose:      handleClose,
    onConfirm:    handleConfirm,
    title:        state?.title        ?? "",
    description:  state?.description  ?? state?.message,
    confirmText:  state?.confirmText  ?? "Confirm",
    cancelText:   state?.cancelText   ?? "Cancel",
    variant:      state?.variant      ?? "danger",
    loading,
  };

  return { openConfirm, confirmProps };
}
