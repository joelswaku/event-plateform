"use client";

import { useEffect } from "react";

export default function BuilderError({ error, reset }) {
  useEffect(() => {
    console.error("[Builder]", error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0e0f11]">
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2 className="text-base font-semibold" style={{ color: "#f0f1f3" }}>
          Builder failed to load
        </h2>
        <p className="text-sm" style={{ color: "#555a66" }}>
          {error?.message || "Something went wrong. Your work is saved."}
        </p>
        <button
          onClick={reset}
          className="mt-1 rounded-md px-4 py-2 text-sm font-semibold"
          style={{ background: "#6c6fee", color: "#fff" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
