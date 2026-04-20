"use client";

import { useEffect } from "react";

export default function PublicEventError({ error, reset }) {
  useEffect(() => {
    console.error("[PublicEvent]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        {error?.message || "This event page could not be loaded. Please try again."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </main>
  );
}
