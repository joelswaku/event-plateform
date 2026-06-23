import { notFound } from "next/navigation";
import { publicApi } from "@/lib/public-api";
import EventPreviewClient from "./EventPreviewClient";
import EventPageClient from "./EventPageClient";
import EventNotAvailable from "./EventNotAvailable";
import EventChatbotLoader from "./EventChatbotLoader";

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://liteevent.com";

  return {
    title: event.title,
    description: event.short_description || event.description || "Join this event",
    keywords: [
      event.event_type,
      event.title,
      event.city,
      event.country,
      "event",
      "tickets",
      "registration",
    ].filter(Boolean),
    openGraph: {
      title: event.title,
      description: event.short_description || event.description || "",
      images: event.cover_image_url ? [{ url: event.cover_image_url }] : [],
      type: "website",
      url: `${appUrl}/e/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.short_description || event.description || "",
      images: event.cover_image_url ? [event.cover_image_url] : [],
    },
    robots: {
      index: event.visibility === "PUBLIC" && event.status === "PUBLISHED",
      follow: event.visibility === "PUBLIC" && event.status === "PUBLISHED",
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

  const ev = data.event;
  const showChatbot = ev?.allow_rsvp || ev?.allow_ticketing;

  // Generate JSON-LD structured data for SEO
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://liteevent.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    description: ev.short_description || ev.description || "",
    image: ev.cover_image_url || "",
    url: `${appUrl}/e/${slug}`,
    startDate: ev.starts_at,
    endDate: ev.ends_at,
    eventStatus: ev.status === "PUBLISHED" ? "https://schema.org/EventScheduled" : "https://schema.org/EventCancelled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: ev.venue_name
      ? {
          "@type": "Place",
          name: ev.venue_name,
          address: {
            "@type": "PostalAddress",
            streetAddress: ev.venue_address || "",
            addressLocality: ev.city || "",
            addressRegion: ev.state || "",
            postalCode: ev.zip_code || "",
            addressCountry: ev.country || "",
          },
        }
      : undefined,
    organizer: {
      "@type": "Organization",
      name: "LiteEvent",
      url: appUrl,
    },
    offers: ev.allow_ticketing
      ? {
          "@type": "Offer",
          url: `${appUrl}/e/${slug}/tickets`,
          availability: "https://schema.org/InStock",
          validFrom: ev.published_at || ev.created_at,
        }
      : undefined,
  };

  return (
    <>
      {/* JSON-LD structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <EventPageClient
        event={{ ...ev, speakers: data.speakers || [], schedule_items: data.schedule_items || [] }}
        sections={data.sections || []}
        token={token || null}
      />
      {showChatbot && <EventChatbotLoader eventId={ev.id} />}
    </>
  );
}
