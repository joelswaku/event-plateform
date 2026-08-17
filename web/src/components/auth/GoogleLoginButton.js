"use client";

import { useState } from "react";
import { clearLogoutMarker } from "@/store/auth.store";

export default function GoogleLoginButton({ redirectTo = "/dashboard" }) {
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) &&
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE";
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);

    // Google sign-in leaves this page and returns through /auth-success. A
    // previous explicit logout must not block that new successful session.
    clearLogoutMarker();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const destination = encodeURIComponent(
      typeof redirectTo === "string" &&
      redirectTo.startsWith("/") &&
      !redirectTo.startsWith("//")
        ? redirectTo
        : "/dashboard"
    );

    // Redirect to API endpoint which will handle Google OAuth redirect flow
    window.location.href = `${apiUrl}/auth/google/redirect?redirect_to=${destination}`;
  };

  if (!isConfigured) return null;

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        suppressHydrationWarning
        className={`flex min-h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-[#77739d] bg-white/10 px-4 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.24)] transition-all duration-200 ${
          loading ? "pointer-events-none opacity-60" : "hover:border-[#b7b2ed] hover:bg-white/[0.14]"
        }`}
      >
        <GoogleIcon />
        <span className="text-sm font-medium text-white">
          {loading ? "Redirecting to Google..." : "Continue with Google"}
        </span>
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
