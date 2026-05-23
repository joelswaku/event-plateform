import { notFound } from "next/navigation";
import { publicApi } from "@/lib/public-api";
import EventPreviewClient from "./EventPreviewClient";
import EventPageClient from "./EventPageClient";
import EventNotAvailable from "./EventNotAvailable";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchEventData(slug, token) {
  // Try public endpoint first (works for PUBLIC + PUBLISHED events)
  try {
    const res = await publicApi.get(`/public/pages/${slug}`);
    if (res.data?.data) return res.data.data;
  } catch {
    // fall through
  }

  // If token provided, try the invited endpoint (covers PRIVATE events)
  if (token) {
    try {
      const res = await publicApi.get(
        `/public/pages/${slug}/invited?token=${encodeURIComponent(token)}`
      );
      if (res.data?.data) return res.data.data;
    } catch {
      // fall through
    }
  }

  return null;
}

async function checkSlug(slug, token) {
  try {
    const qs  = token ? `?token=${encodeURIComponent(token)}` : "";
    const res = await publicApi.get(`/public/pages/${slug}/check${qs}`);
    return res.data?.data ?? { exists: false };
  } catch {
    return { exists: false };
  }
}

// ── SEO metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await fetchEventData(slug, null);
  const event = data?.event;

  if (!event) return { title: "Event" };

  return {
    title: event.title,
    description: event.short_description || event.description || "Join this event",
    openGraph: {
      title: event.title,
      description: event.short_description || event.description || "",
      images: event.cover_image_url ? [{ url: event.cover_image_url }] : [],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PublicEventPage({ params, searchParams }) {
  const { slug }    = await params;
  const { preview, token } = await searchParams;

  // Preview mode — authenticated owner only, handled client-side
  if (preview === "1") {
    return <EventPreviewClient slug={slug} />;
  }

  const data = await fetchEventData(slug, token);

  if (!data?.event) {
    // Check why it's not available before showing a generic 404
    const status = await checkSlug(slug, token);

    if (!status.exists) {
      notFound(); // truly doesn't exist — show Next.js 404
    }

    // Event exists but is private or not published
    return <EventNotAvailable reason={status.reason} />;
  }

  return (
    <EventPageClient
      event={{ ...data.event, speakers: data.speakers || [], schedule_items: data.schedule_items || [] }}
      sections={data.sections || []}
      token={token || null}
    />
  );
}
