"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import AuthShell from "@/components/auth/AuthShell";

const BASE   = "w-full px-4 py-3.5 rounded-[14px] text-white text-[15px] font-medium placeholder:text-[#cbd5e1] outline-none transition-all bg-[#0e0f1b] border";
const NORMAL = `${BASE} border-white/20 focus:border-[#818cf8] focus:ring-2 focus:ring-[#6366f1]/25`;
const ERR    = `${BASE} border-[#ef4444]/60 focus:border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/20`;

function validateEmail(v) {
  if (!v) return "Email is required";
  if (!/\S+@\S+\.\S+/.test(v)) return "Enter a valid email address";
  return "";
}

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuthStore();

  const [email,       setEmail]       = useState("");
  const [touched,     setTouched]     = useState(false);
  const [serverError, setServerError] = useState("");
  const [sent,        setSent]        = useState(false);

  const fieldError = touched ? validateEmail(email) : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setServerError("");
    if (validateEmail(email)) return;

    const res = await forgotPassword({ email });
    if (res.success) {
      setSent(true);
    } else {
      setServerError(res.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <AuthShell
      headline="Regain access to your account."
      subline="We'll send a secure link to your inbox so you can set a new password."
    >
      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#6366f1] hover:text-[#818cf8] transition-colors mb-6 font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to sign in
      </Link>

      {/* Glass card container - compact on mobile */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-3xl p-4 sm:p-6">
        {!sent ? (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Forgot password?</h1>
              <p className="text-white/75 text-xs sm:text-sm mt-1 font-medium">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-white/85 tracking-wide mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                className={fieldError ? ERR : NORMAL}
              />
              {fieldError && (
                <p className="flex items-center gap-1.5 text-[#ef4444] text-[11px] mt-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldError}
                </p>
              )}
            </div>

            {serverError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                <p className="text-[#ef4444] text-sm">{serverError}</p>
              </div>
            )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#6366f1] hover:bg-[#818cf8] active:scale-[0.99] text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6366f1]/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ── Sent state ─────────────────────────────────────────── */
          <div className="text-center">
          <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-emerald-400" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">Check your inbox</h1>
          <p className="text-white/70 text-sm mt-2 leading-relaxed font-medium">
            We sent a reset link to{" "}
            <span className="text-gray-300 font-medium">{email}</span>.
            <br />
            It may take a minute to arrive.
          </p>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => { setSent(false); setTouched(false); setServerError(""); }}
                className="w-full py-3 rounded-xl border border-white/20 text-white/75 hover:text-white hover:border-white/35 text-sm font-bold transition-all"
              >
                Try a different email
              </button>
              <Link
                href="/login"
                className="block w-full py-3.5 rounded-xl bg-[#6366f1] hover:bg-[#818cf8] text-white text-sm font-bold text-center transition-colors shadow-lg shadow-[#6366f1]/20"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
