import { NextResponse } from "next/server";

function friendlyError(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("expired") || m.includes("api key") || m.includes("key not valid"))
    return "Place details are temporarily unavailable.";
  if (m.includes("quota"))  return "Quota exceeded. Please try again later.";
  if (m.includes("not found")) return null; // silent — just no data
  return "Place details are temporarily unavailable.";
}

export async function POST(request) {
  const key = process.env.VENDOR_GOOGLE_KEY;
  if (!key) {
    return NextResponse.json({}, { status: 200 }); // silent — details are optional
  }

  const { placeId } = await request.json();
  if (!placeId?.trim()) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
  }

  const fields = [
    "reviews",
    "editorialSummary",
    "regularOpeningHours",
    "priceLevel",
    "rating",
    "userRatingCount",
    "displayName",
    "formattedAddress",
    "internationalPhoneNumber",
    "websiteUri",
    "photos",
  ].join(",");

  try {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": fields,
        "Referer": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
      },
    }
  );

  const data = await res.json();
  if (!res.ok) {
    const msg = friendlyError(data.error?.message || "");
    console.error("[google-place-details] API error:", data.error?.message);
    // Return empty object — place details are optional, not worth blocking the UI
    if (!msg) return NextResponse.json({});
    return NextResponse.json({ _error: msg });
  }

  const reviews = (data.reviews || []).map(r => ({
    ...r,
    authorPhotoUrl: r.authorAttribution?.photoUri || null,
  }));

  return NextResponse.json({
    editorialSummary: data.editorialSummary?.text || null,
    openingHours: data.regularOpeningHours?.weekdayDescriptions || null,
    priceLevel: data.priceLevel || null,
    rating: data.rating || null,
    userRatingCount: data.userRatingCount || null,
    reviews,
  });
  } catch (err) {
    console.error("[google-place-details] fetch error:", err.message);
    return NextResponse.json({}); // silent — details are non-critical
  }
}
