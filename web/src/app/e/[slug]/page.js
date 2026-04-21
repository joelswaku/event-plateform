import { notFound } from "next/navigation";
import SharedEventRenderer from "@/components/events/shared/SharedEventRenderer";
import { publicApi } from "@/lib/public-api";
import EventPreviewClient from "./EventPreviewClient";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getPageData(slug) {
  try {
    const res = await publicApi.get(`/public/pages/${slug}`);
    return res.data?.data || null;
  } catch {
    return null;
  }
}

// ── SEO metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getPageData(slug);
  const event = data?.event;

  if (!event) return { title: "Event Not Found" };

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
  const { slug } = await params;
  const { preview } = await searchParams;

  // Preview mode — requires auth, handled client-side (token is in memory)
  if (preview === "1") {
    return <EventPreviewClient slug={slug} />;
  }

  // Public mode — only PUBLISHED + PUBLIC events served here
  const data = await getPageData(slug);
  if (!data?.event) notFound();

  const enrichedEvent = {
    ...data.event,
    speakers: data.speakers || [],
    schedule_items: data.schedule_items || [],
  };

  return (
    <main className="min-h-screen bg-white">
      <SharedEventRenderer
        event={enrichedEvent}
        sections={data.sections || []}
        isEditor={false}
      />
    </main>
  );
}
