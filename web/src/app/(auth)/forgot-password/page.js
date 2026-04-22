"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import AuthShell from "@/components/auth/AuthShell";

const BASE   = "w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-all bg-white/4 border";
const NORMAL = `${BASE} border-white/8 focus:border-indigo-500/50 focus:bg-white/6`;
const ERR    = `${BASE} border-red-500/50 focus:border-red-500/70`;

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
        className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-300 transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to sign in
      </Link>

      {!sent ? (
        <>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Forgot password?</h1>
            <p className="text-gray-500 text-sm mt-1.5">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-gray-400 mb-1.5">
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
                <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldError}
                </p>
              )}
            </div>

            {serverError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send reset link
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        /* ── Sent state ─────────────────────────────────────────── */
        <div className="text-center">
          <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-emerald-400" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">Check your inbox</h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            We sent a reset link to{" "}
            <span className="text-gray-300 font-medium">{email}</span>.
            <br />
            It may take a minute to arrive.
          </p>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => { setSent(false); setTouched(false); setServerError(""); }}
              className="w-full py-3 rounded-xl border border-white/8 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
            >
              Try a different email
            </button>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold text-center transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
