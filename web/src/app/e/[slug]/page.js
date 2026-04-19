import { notFound } from "next/navigation";
import EventPublicRenderer from "@/components/events/public/EventPublicRenderer";
import { publicApi } from "@/lib/public-api";

/* =========================
   FETCH EVENT
========================= */
async function getPublicEvent(slug) {
  try {
    const res = await publicApi.get(`/events/public/${slug}`);
    return res.data?.data || null;
  } catch (error) {
    console.error("Public event error:", error?.message);
    return null;
  }
}

/* =========================
   FETCH BUILDER (OPTIONAL)
========================= */
async function getPublicBuilder(slug) {
  try {
    const res = await publicApi.get(`/public/pages/${slug}`);
    return res.data?.data || null;
  } catch {
    return null;
  }
}

/* =========================
   SEO METADATA (FIXED)
========================= */
export async function generateMetadata({ params }) {
  const { slug } = await params; // ✅ FIX

  const event = await getPublicEvent(slug);

  if (!event) {
    return { title: "Event not found" };
  }

  return {
    title: event.title,
    description:
      event.short_description ||
      event.description ||
      "Join this event",
  };
}

/* =========================
   PAGE (FIXED)
========================= */
export default async function PublicEventPage({ params }) {
  const { slug } = await params; // ✅ FIX (MAIN BUG)

  console.log("Slug:", slug);

  const event = await getPublicEvent(slug);

  if (!event) {
    return (
      <div className="p-10 text-center text-red-500">
        ❌ Event not found — {slug}
      </div>
    );
  }

  const builder = await getPublicBuilder(slug);

  return (
    <main className="min-h-screen bg-white">
      <EventPublicRenderer event={event} builder={builder} />
    </main>
  );
}