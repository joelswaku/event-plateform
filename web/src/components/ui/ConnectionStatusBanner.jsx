"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function ConnectionStatusBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setOffline(!window.navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 top-3 z-[200] mx-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-5 sm:w-[420px] sm:-translate-x-1/2"
      role="status"
      aria-live="polite"
      style={{
        background: "rgba(28, 22, 10, 0.96)",
        border: "1px solid rgba(245, 158, 11, 0.38)",
        boxShadow: "0 14px 36px rgba(0,0,0,0.28)",
      }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(245,158,11,0.16)", color: "#FBBF24" }}>
        <WifiOff className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">You&apos;re offline</p>
        <p className="mt-0.5 text-xs leading-5 text-white/65">Check your Wi-Fi or mobile data, then try again.</p>
      </div>
    </div>
  );
}
