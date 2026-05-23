"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera, Check, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function EditProfilePage() {
  const router        = useRouter();
  const user          = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const updateAvatar  = useAuthStore((s) => s.updateAvatar);

  const [name,          setName]          = useState(user?.name ?? "");
  const [saving,        setSaving]        = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState("");
  const fileRef = useRef(null);

  const initials = (user?.name ?? user?.email ?? "U")
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Name cannot be empty"); return; }
    setSaving(true);
    setError("");
    const res = await updateProfile({ full_name: name.trim() });
    setSaving(false);
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(res.message ?? "Update failed");
    }
  }

  async function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    await updateAvatar(file);
    setAvatarLoading(false);
    e.target.value = "";
  }

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
          <h1 className="text-lg font-black text-(--text-primary)">Edit Profile</h1>
          <p className="text-xs text-(--text-muted)">Update your name and photo</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
        <button
          onClick={() => fileRef.current?.click()}
          className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[22px] text-3xl font-black text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #4f46e5, #818cf8)", boxShadow: "0 6px 24px rgba(99,102,241,0.4)" }}
        >
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="avatar" className="h-full w-full object-cover" />
            : initials}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/35">
            {avatarLoading
              ? <Loader2 className="h-6 w-6 animate-spin text-white opacity-0 transition-opacity group-hover:opacity-100" />
              : <Camera className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />}
          </div>
        </button>
        <p className="text-xs text-(--text-muted)">Tap to change photo</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4 rounded-3xl border border-border bg-(--bg-surface) p-6">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-(--text-muted)">
            Full name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-border bg-(--bg-elevated) px-4 py-3 text-sm text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-indigo-400 transition"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-(--text-muted)">
            Email
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-(--bg-elevated) px-4 py-3">
            <span className="flex-1 text-sm text-(--text-secondary)">{user?.email ?? "—"}</span>
            <span className="rounded-full bg-(--bg-surface) px-2 py-0.5 text-[10px] font-semibold text-(--text-muted)">
              Read-only
            </span>
          </div>
          <p className="mt-1 text-[11px] text-(--text-muted)">Email changes require identity verification — contact support.</p>
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 border border-red-500/20">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || avatarLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
