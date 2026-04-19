"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function GoogleLoginCustomButton() {
  const router = useRouter();
  const [gisReady, setGisReady] = useState(false);

  const { googleLogin, isLoading, error } = useAuthStore();

  useEffect(() => {
    if (!gisReady) return;
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        const res = await googleLogin({
          id_token: response.credential,
        });

        if (res.success) {
          router.push("/dashboard");
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }, [gisReady, googleLogin, router]);

  const handleGoogleLogin = () => {
    if (!window.google) return;
    window.google.accounts.id.prompt();
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGisReady(true)}
      />

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={!gisReady || isLoading}
          className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition disabled:opacity-50"
        >
          {isLoading ? "Signing in..." : "Continue with Google"}
        </button>

        {error && (
          <p className="text-center text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    </>
  );
}