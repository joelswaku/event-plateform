"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";

export default function DeleteModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", isDeleting = false }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && !isDeleting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "#0e0e16",
          border: "1px solid rgba(239,68,68,0.3)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(239,68,68,0.15)" }}
            >
              <AlertTriangle size={20} style={{ color: "#ef4444" }} />
            </div>
            <h3 className="text-lg font-black text-white">{title}</h3>
          </div>
          {!isDeleting && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-40"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
            }}
            onMouseEnter={(e) => !isDeleting && (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
            onMouseLeave={(e) => !isDeleting && (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:opacity-40 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
            }}
            onMouseEnter={(e) => !isDeleting && (e.currentTarget.style.boxShadow = "0 6px 20px rgba(239,68,68,0.4)")}
            onMouseLeave={(e) => !isDeleting && (e.currentTarget.style.boxShadow = "0 4px 16px rgba(239,68,68,0.3)")}
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
