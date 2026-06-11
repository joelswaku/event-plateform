"use client";

import { useState } from "react";
import { FileText, Lock, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { api }          from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import LegalModal       from "./LegalModal";

const CURRENT_VERSION = "2025.1";

export default function TermsGate({ children }) {
  const user      = useAuthStore(s => s.user);
  const setUser   = useAuthStore(s => s.setUser);

  const needsAcceptance =
    user &&
    !user.terms_accepted_at;

  const [checked,   setChecked]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [legalSlug, setLegalSlug] = useState(null);

  if (!needsAcceptance) return children;

  const handleAccept = async () => {
    if (!checked) return setError("Please check the box to accept the terms.");
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/accept-terms", { version: CURRENT_VERSION });
      if (res.data?.success) {
        // Patch user in store so the gate disappears without a full page reload
        setUser({ ...user, terms_accepted_at: res.data.terms_accepted_at, terms_version_accepted: CURRENT_VERSION });
      }
    } catch (e) {
      setError(e?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Blur the content behind */}
      <div className="pointer-events-none select-none opacity-20 blur-sm">{children}</div>

      {/* Blocking overlay */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>

        <div
          className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
          style={{ background: "#0a0a14", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          {/* Top accent */}
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg,#6366f1,#a78bfa,transparent)" }} />

          <div className="px-8 py-8">
            {/* Icon */}
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.28)" }}>
              <ShieldCheck size={26} style={{ color: "#818cf8" }} />
            </div>

            {/* Heading */}
            <h2 className="text-center text-xl font-black text-white mb-2">
              Review our updated terms
            </h2>
            <p className="text-center text-sm text-white/40 mb-6 leading-relaxed">
              Before you continue, please read and accept our Terms of Service and Privacy Policy.
              These govern your use of LiteEvent as an event organizer and attendee.
            </p>

            {/* Legal document buttons */}
            <div className="space-y-2 mb-6">
              {[
                { slug: "terms",          Icon: FileText, label: "Terms of Service",  color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
                { slug: "privacy-policy", Icon: Lock,     label: "Privacy Policy",    color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
              ].map(({ slug, Icon, label, color, bg }) => (
                <button key={slug} onClick={() => setLegalSlug(slug)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition hover:brightness-110 text-left"
                  style={{ background: bg, border: `1px solid ${color}28` }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${color}18` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-white/80">{label}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: `${color}99` }}>Read →</span>
                </button>
              ))}
            </div>

            {/* Checkbox */}
            <div className="mb-5 flex items-start gap-3 select-none">
              <button
                type="button"
                onClick={() => setChecked(v => !v)}
                className={`mt-0.5 shrink-0 flex h-4.5 w-4.5 items-center justify-center rounded-md border-2 transition-all ${
                  checked ? "bg-indigo-600 border-indigo-600" : "border-white/25 bg-white/5"
                }`}>
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span className="text-xs text-white/50 leading-relaxed">
                I have read and agree to the{" "}
                <button type="button" onClick={() => setLegalSlug("terms")}
                  className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors">
                  Terms of Service
                </button>
                {" "}and{" "}
                <button type="button" onClick={() => setLegalSlug("privacy-policy")}
                  className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors">
                  Privacy Policy
                </button>
                . I confirm I am at least 18 years old.
              </span>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                <AlertCircle size={13} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white transition disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : "Accept & Continue"}
            </button>
          </div>
        </div>
      </div>

      <LegalModal slug={legalSlug} onClose={() => setLegalSlug(null)} />
    </>
  );
}
