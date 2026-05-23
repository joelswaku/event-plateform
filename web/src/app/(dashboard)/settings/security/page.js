"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, EyeOff, Check, Loader2, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function SecurityPage() {
  const router         = useRouter();
  const changePassword = useAuthStore((s) => s.changePassword);

  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!current || !next || !confirm) { setError("All fields are required"); return; }
    if (next.length < 8)               { setError("New password must be at least 8 characters"); return; }
    if (next !== confirm)              { setError("New passwords do not match"); return; }
    setSaving(true);
    const res = await changePassword({ currentPassword: current, newPassword: next });
    setSaving(false);
    if (res.success) {
      setSaved(true);
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(res.message ?? "Failed to change password");
    }
  }

  const field = (label, val, set, show, toggle, placeholder) => (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-(--text-muted)">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-(--bg-elevated) px-4 py-3 focus-within:border-indigo-400 transition">
        <input
          type={show ? "text" : "password"}
          value={val}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-(--text-primary) outline-none placeholder:text-(--text-muted)"
        />
        <button type="button" onClick={toggle} className="text-(--text-muted) hover:text-(--text-secondary)">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-(--bg-surface) transition hover:bg-(--bg-elevated)"
        >
          <ChevronLeft className="h-4 w-4 text-(--text-muted)" />
        </button>
        <div>
          <h1 className="text-lg font-black text-(--text-primary)">Security</h1>
          <p className="text-xs text-(--text-muted)">Manage your password and account security</p>
        </div>
      </div>

      {/* Icon hero */}
      <div className="flex flex-col items-center gap-2 py-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
        >
          <ShieldCheck className="h-8 w-8" style={{ color: "#6366f1" }} />
        </div>
        <p className="text-xs text-(--text-muted)">Your account is protected</p>
      </div>

      {/* Change password */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border bg-(--bg-surface) p-6">
        <p className="text-sm font-bold text-(--text-primary)">Change Password</p>

        {field("Current password", current, setCurrent, showCur, () => setShowCur((v) => !v), "Enter current password")}
        {field("New password",     next,    setNext,    showNew, () => setShowNew((v) => !v), "At least 8 characters")}

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-(--text-muted)">
            Confirm new password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password"
            className="w-full rounded-xl border border-border bg-(--bg-elevated) px-4 py-3 text-sm text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-indigo-400 transition"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 border border-red-500/20">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            Password updated successfully!
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saving ? "Saving…" : saved ? "Updated!" : "Update Password"}
        </button>
      </form>

      {/* Security tips */}
      <div className="rounded-3xl border border-border bg-(--bg-surface) p-6 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">Tips</p>
        {[
          "Use at least 12 characters for a stronger password",
          "Mix uppercase, lowercase, numbers, and symbols",
          "Never reuse passwords across different sites",
          "Enable 2FA for extra protection (coming soon)",
        ].map((tip) => (
          <div key={tip} className="flex items-start gap-2.5 text-xs text-(--text-muted)">
            <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
            {tip}
          </div>
        ))}
      </div>
    </div>
  );
}
