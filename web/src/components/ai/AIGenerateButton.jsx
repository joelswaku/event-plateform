"use client";
import { Sparkles, Loader2 } from "lucide-react";

export default function AIGenerateButton({ onClick, loading, label = "Generate with AI", variant = "primary", className = "", disabled = false }) {
  const base = "inline-flex items-center gap-2 rounded-xl font-semibold transition-all text-sm";
  const variants = {
    primary: "px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60",
    ghost: "px-4 py-2.5 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10",
    inline: "px-2.5 py-1.5 text-indigo-400 hover:text-indigo-300 text-xs",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={`${base} ${variants[variant] || variants.primary} ${className} disabled:cursor-not-allowed`}
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="animate-pulse">Generating…</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5" />
          {label}
        </>
      )}
    </button>
  );
}
