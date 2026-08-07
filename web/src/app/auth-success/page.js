"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

/**
 * Intermediate page after Google OAuth callback
 * Fetches user data then redirects to dashboard
 */
export default function AuthSuccessPage() {
  const router = useRouter();
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await fetchMe();
        if (user) {
          // Successfully authenticated, get redirect destination
          const params = new URLSearchParams(window.location.search);
          const requestedPath = params.get("redirect_to");
          const redirectTo =
            requestedPath &&
            requestedPath.startsWith("/") &&
            !requestedPath.startsWith("//") &&
            !requestedPath.includes("\\")
              ? requestedPath
              : "/dashboard";
          router.replace(redirectTo);
        } else {
          // Not authenticated, go back to login
          router.replace("/login?error=auth_failed");
        }
      } catch (error) {
        router.replace("/login?error=auth_failed");
      }
    };

    checkAuth();
  }, [fetchMe, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
        <p className="mt-4 text-sm font-medium text-white/80">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
