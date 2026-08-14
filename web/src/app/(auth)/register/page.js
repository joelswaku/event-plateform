"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import AuthShell from "@/components/auth/AuthShell";

const BASE   = "w-full rounded-[14px] border bg-[#0e0f1b] px-4 py-3.5 text-[15px] font-medium text-white outline-none transition-all placeholder:text-[#e2e8f0]";
const NORMAL = `${BASE} border-[#67648b] focus:border-[#a5b4fc] focus:ring-2 focus:ring-[#6366f1]/30`;
const ERR    = `${BASE} border-[#ef4444]/60 focus:border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/20`;

const STRENGTH_META = [
  { label: "Weak",   bar: "bg-red-500"    },
  { label: "Fair",   bar: "bg-orange-400" },
  { label: "Good",   bar: "bg-blue-400"   },
  { label: "Strong", bar: "bg-emerald-500"},
];

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function PasswordStrength({ password }) {
  const score = getStrength(password);
  if (!password) return null;
  const meta = STRENGTH_META[score - 1] ?? STRENGTH_META[0];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? meta.bar : "bg-white/15"}`}
          />
        ))}
      </div>
      <p className="text-[11px] font-medium text-gray-300">{meta.label} password</p>
    </div>
  );
}

function Field({ label, id, error, touched, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold tracking-wide text-white">
        {label}
      </label>
      {children}
      {touched && error && (
        <p className="flex items-center gap-1.5 text-[#ef4444] text-[11px] mt-1.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function RegisterForm() {
  const { register, login, isLoading, error: serverError } = useAuthStore();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const inviteToken  = searchParams.get("invite");

  const [form,    setForm]    = useState({ full_name: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({});
  const [showPw,  setShowPw]  = useState(false);

  const validate = (vals) => {
    const e = {};
    if (!vals.full_name || vals.full_name.trim().length < 2) e.full_name = "Full name is required";
    if (!vals.email)                                         e.email     = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(vals.email))              e.email     = "Enter a valid email";
    if (!vals.password)                                      e.password  = "Password is required";
    else if (vals.password.length < 8)                      e.password  = "Min. 8 characters";
    if (vals.confirmPassword !== vals.password)              e.confirmPassword = "Passwords do not match";
    return e;
  };

  const errors = validate(form);
  const touch  = (f) => setTouched((t) => ({ ...t, [f]: true }));
  const cls    = (f) => (touched[f] && errors[f] ? ERR : NORMAL);
  const set    = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ full_name: true, email: true, password: true, confirmPassword: true });
    if (Object.keys(errors).length) return;

    const res = await register({ full_name: form.full_name.trim(), email: form.email, password: form.password });

    console.log('Register response:', res); // DEBUG
    console.log('requiresVerification:', res.data?.requiresVerification); // DEBUG

    if (res.success) {
      // Check if email verification is required
      if (res.data?.requiresVerification && res.data?.verificationToken) {
        console.log('Redirecting to verify-email'); // DEBUG
        router.push(`/verify-email?token=${res.data.verificationToken}`);
      } else if (inviteToken) {
        const loginRes = await login({ email: form.email, password: form.password });
        router.push(loginRes.success ? `/invite/${inviteToken}` : `/login?redirect=/invite/${inviteToken}`);
      } else {
        router.push("/login?registered=1");
      }
    }
  };

  return (
    <AuthShell
      headline="Start your event journey today."
      subline="Create events, invite guests, and grow your audience with powerful tools."
      denseMobile
    >
      {/* Glass card container - compact on mobile */}
      <div className="space-y-4 rounded-3xl border border-[#5b5878] bg-white/[0.08] p-4 shadow-xl shadow-black/20 backdrop-blur-sm sm:space-y-6 sm:p-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Create account</h1>
          <p className="mt-1 text-xs text-[#cbd5e1] sm:text-sm">Join thousands of event organizers</p>
        </div>

        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE' && (
          <>
            <GoogleLoginButton />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#514f70]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[#aeb4c7]">or</span>
              <div className="h-px flex-1 bg-[#514f70]" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
        <Field label="Full Name" id="full_name" error={errors.full_name} touched={touched.full_name}>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            value={form.full_name}
            onChange={set("full_name")}
            onBlur={() => touch("full_name")}
            className={cls("full_name")}
          />
        </Field>

        <Field label="Email" id="email" error={errors.email} touched={touched.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            onBlur={() => touch("email")}
            className={cls("email")}
          />
        </Field>

        <Field label="Password" id="password" error={errors.password} touched={touched.password}>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set("password")}
              onBlur={() => touch("password")}
              className={`${cls("password")} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors hover:text-white"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </Field>

        <Field label="Confirm Password" id="confirmPassword" error={errors.confirmPassword} touched={touched.confirmPassword}>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            onBlur={() => touch("confirmPassword")}
            className={cls("confirmPassword")}
          />
        </Field>

        {serverError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/10 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
            <p className="text-sm text-[#ef4444]">{serverError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#6366f1] hover:bg-[#818cf8] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-lg shadow-[#6366f1]/20"
        >
          {isLoading ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating account…</>
          ) : "Create Account"}
        </button>
        </form>

        <p className="text-center text-sm text-[#cbd5e1]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#6366f1] font-bold hover:text-[#818cf8] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
