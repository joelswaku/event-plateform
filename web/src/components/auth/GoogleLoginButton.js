"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function GoogleLoginButton() {
  const router = useRouter();
  const buttonRef = useRef(null);
  const [gisReady, setGisReady] = useState(false);

  const { googleLogin, isLoading, error } = useAuthStore();

  useEffect(() => {
    if (!gisReady) return;
    if (!window.google || !buttonRef.current) return;

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

    buttonRef.current.innerHTML = "";

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: 380,
    });
  }, [gisReady, googleLogin, router]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGisReady(true)}
      />

      <div className="space-y-3">
        <div
          ref={buttonRef}
          className="flex w-full justify-center"
        />

        {isLoading && (
          <p className="text-center text-sm text-gray-400">
            Signing in with Google...
          </p>
        )}

        {error && (
          <p className="text-center text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    </>
  );
}