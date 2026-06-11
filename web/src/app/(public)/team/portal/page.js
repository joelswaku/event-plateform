"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useTeamStore } from "@/store/team.store";

export default function TeamPortalPage() {
  const router          = useRouter();
  const { portalLogin } = useTeamStore();

  const [email,      setEmail]      = useState("");
  const [code,       setCode]       = useState("");
  const [busy,       setBusy]       = useState(false);
  const [errorMsg,   setErrorMsg]   = useState("");

  // "existing_user" phase: code verified, user already has account
  const [phase,      setPhase]      = useState("form"); // "form" | "existing_user"
  const [eventTitle, setEventTitle] = useState("");

  /* ── Auto-format code as ABC-123 ── */
  function handleCodeChange(raw) {
    const clean   = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
    const display = clean.length > 3 ? clean.slice(0, 3) + "-" + clean.slice(3) : clean;
    setCode(display);
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !code.trim()) {
      setErrorMsg("Please enter both your email and the invite code.");
      return;
    }

    setBusy(true);
    const res = await portalLogin({ email: email.trim(), code: code.trim() });
    setBusy(false);

    if (!res.success) {
      setErrorMsg(res.error || "Something went wrong. Please try again.");
      return;
    }

    const d = res.data;

    if (d.userExists) {
      // Existing user — they're already added to the event, just need to sign in
      setEventTitle(d.eventTitle ?? "the event");
      setPhase("existing_user");
      return;
    }

    if (d.isNewUser) {
      // New user — redirect to setup page to set name + password
      router.replace(`/team/setup?token=${d.token}`);
    }
  }

  /* ── Existing user confirmation screen ── */
  if (phase === "existing_user") {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4">
        <div className="bg-[#111127] rounded-3xl border border-white/8 max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 px-8 py-8 text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-1">You&apos;re on the team</p>
            <h1 className="text-xl font-black text-white tracking-tight">{eventTitle}</h1>
          </div>

          <div className="px-8 py-8 text-center space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              You already have an LiteEvent account. Sign in with your email and password to access the event dashboard.
            </p>

            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
              <p className="text-emerald-400 text-xs font-semibold">
                You&apos;ve been added as an admin — the event will appear in your dashboard after sign in.
              </p>
            </div>

            <a
              href={`/login?redirect=${encodeURIComponent("/dashboard")}`}
              className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
            >
              Sign in to your account
            </a>

            <p className="text-center text-xs text-gray-600">
              Signed in on another device?{" "}
              <a href="/events" className="text-indigo-400 hover:text-indigo-300 font-medium">Go to events</a>
            </p>
          </div>
          <div className="px-8 pb-6 text-center text-xs text-gray-700">Powered by LiteEvent</div>
        </div>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center px-4 py-10">
      <div className="bg-[#111127] rounded-3xl border border-white/8 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-8 py-8 text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">Team Portal</p>
          <h1 className="text-xl font-black text-white tracking-tight">Access Your Invite</h1>
          <p className="text-indigo-200 text-sm mt-1">Enter the code from your invite email</p>
        </div>

        <div className="px-8 py-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Email address</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all bg-white/4 border border-white/8 focus:border-indigo-500/50 focus:bg-white/6"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Invite code</label>
              <input
                type="text"
                autoComplete="off"
                placeholder="ABC-123"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all bg-white/4 border border-white/8 focus:border-indigo-500/50 focus:bg-white/6 font-mono tracking-widest uppercase text-center text-lg"
                maxLength={7}
              />
              <p className="text-xs text-gray-600 mt-1.5 text-center">6-character code from your invite email</p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {busy
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                : "Access Portal"}
            </button>
          </form>

          <div className="flex flex-col gap-2 text-center text-xs text-gray-600">
            <p>
              Already have an account?{" "}
              <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</a>
            </p>
            <p>
              New to LiteEvent?{" "}
              <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create a free account</a>
            </p>
          </div>
        </div>
        <div className="px-8 pb-6 text-center text-xs text-gray-700">Powered by LiteEvent</div>
      </div>
    </div>
  );
}
