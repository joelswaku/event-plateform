"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import SharedEventRenderer from "@/components/events/shared/SharedEventRenderer";

export default function EventPreviewClient({ slug }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace(`/login?redirect=/e/${slug}?preview=1`);
      return;
    }

    api
      .get(`/public/pages/${slug}/preview`)
      .then((res) => setData(res.data?.data || null))
      .catch((err) =>
        setError(err.response?.data?.message || "Preview not available")
      )
      .finally(() => setLoading(false));
  }, [slug, isAuthenticated, isHydrated, router]);

  if (!isHydrated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-sm font-medium text-gray-700">{error}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    );
  }

  if (!data) return null;

  const enrichedEvent = {
    ...data.event,
    starts_at_utc: data.event.starts_at_utc ?? data.event.starts_at ?? null,
    ends_at_utc:   data.event.ends_at_utc   ?? data.event.ends_at   ?? null,
    speakers: data.speakers || [],
    schedule_items: data.schedule_items || [],
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Preview banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-400 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Preview — this event is not publicly visible yet (status:{" "}
            <span className="uppercase">{data.event.status}</span>, visibility:{" "}
            <span className="uppercase">{data.event.visibility}</span>)
          </span>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-950/10 px-3 py-1 text-xs font-semibold text-amber-950 transition hover:bg-amber-950/20"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </button>
      </div>

      <SharedEventRenderer
        event={enrichedEvent}
        sections={data.sections || []}
        isEditor={false}
      />
    </main>
  );
}
