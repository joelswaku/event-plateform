"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import AuthShell from "@/components/auth/AuthShell";

const BASE   = "w-full px-4 py-3.5 rounded-[14px] text-white text-[15px] font-medium placeholder:text-white/25 outline-none transition-all bg-[#0a0a14] border";
const NORMAL = `${BASE} border-white/10 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20`;
const ERROR  = `${BASE} border-[#ef4444]/60 focus:border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/20`;

function validate(form) {
  const e = {};
  if (!form.email)                            e.email    = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = "Enter a valid email";
  if (!form.password)                         e.password = "Password is required";
  return e;
}

function Field({ label, id, error, touched, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-white/45 tracking-wide mb-1.5">
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

function LoginForm() {
  const { login, isLoading, isAuthenticated, isHydrated } = useAuthStore();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [form,        setForm]        = useState({ email: "", password: "" });
  const [touched,     setTouched]     = useState({});
  const [showPass,    setShowPass]    = useState(false);
  const [serverError, setServerError] = useState("");

  // Single redirect point — fires when auth state becomes true
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace(searchParams.get("redirect") || "/dashboard");
    }
  }, [isHydrated, isAuthenticated]);

  const errors = validate(form);
  const touch  = (f) => setTouched((t) => ({ ...t, [f]: true }));
  const cls    = (f) => (touched[f] && errors[f] ? ERROR : NORMAL);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setServerError("");
    if (errors.email || errors.password) return;

    const res = await login(form);

    // Check if email verification is required
    if (res.requiresVerification && res.verificationToken) {
      router.push(`/verify-email?token=${res.verificationToken}`);
      return;
    }

    // Redirect is handled by the useEffect above when isAuthenticated flips to true
    if (!res.success) {
      setServerError(res.message || "Invalid credentials. Please try again.");
    }
  };

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  return (
    <AuthShell
      headline="Manage your events like a pro."
      subline="Create, sell tickets, track guests, and grow your events effortlessly."
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
        <p className="text-gray-500 text-sm mt-1">Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Email" id="email" error={errors.email} touched={touched.email}>
          <input
            id="email"
            type="email"
            name="login-email"
            autoComplete="off"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            onBlur={() => touch("email")}
            className={cls("email")}
            suppressHydrationWarning
          />
        </Field>

        <Field label="Password" id="password" error={errors.password} touched={touched.password}>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              name="login-password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              onBlur={() => touch("password")}
              className={`${cls("password")} pr-11`}
              suppressHydrationWarning
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end -mt-1">
          <Link href="/forgot-password" className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors font-semibold">
            Forgot password?
          </Link>
        </div>

        {serverError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/10 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
            <p className="text-[#ef4444] text-sm">{serverError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#6366f1] hover:bg-[#818cf8] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-lg shadow-[#6366f1]/20"
          suppressHydrationWarning
        >
          {isLoading ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Signing in…</>
          ) : "Sign In"}
        </button>
      </form>

      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
       process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE' && (
        <>
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          <GoogleLoginButton redirectTo={redirectTo} />
        </>
      )}

      <p className="text-center text-sm text-white/40 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#6366f1] font-bold hover:text-[#818cf8] transition-colors">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
