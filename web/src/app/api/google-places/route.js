import { NextResponse } from "next/server";

function friendlyError(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("expired"))              return "Location search is temporarily unavailable. Please contact support to renew the API key.";
  if (m.includes("api key") || m.includes("key not valid")) return "Location search is temporarily unavailable.";
  if (m.includes("quota") || m.includes("resource exhausted")) return "Search quota exceeded. Please try again in a few minutes.";
  if (m.includes("billing") || m.includes("not enabled"))   return "Location search is not enabled for this project.";
  return "Location search is temporarily unavailable. Please try again.";
}

export async function POST(request) {
  const key = process.env.VENDOR_GOOGLE_KEY;
  if (!key) {
    return NextResponse.json({ error: "Location search is not configured.", places: [] }, { status: 503 });
  }

  const { query, location } = await request.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const textQuery = location?.trim() ? `${query.trim()} in ${location.trim()}` : query.trim();

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "Referer": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.rating",
          "places.userRatingCount",
          "places.websiteUri",
          "places.internationalPhoneNumber",
          "places.nationalPhoneNumber",
          "places.businessStatus",
          "places.photos",
        ].join(","),
      },
      body: JSON.stringify({ textQuery, languageCode: "en", maxResultCount: 20 }),
    });

    const data = await res.json();
    if (!res.ok) {
      const raw = data.error?.message || "";
      console.error("[google-places] API error:", raw);
      return NextResponse.json({ error: friendlyError(raw), places: [] }, { status: 503 });
    }

    const places = (data.places || []).map(place => {
      const photoName = place.photos?.[0]?.name;
      return {
        ...place,
        photoUrl: photoName
          ? `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=600&maxWidthPx=600&key=${key}`
          : null,
      };
    });

    return NextResponse.json({ places });
  } catch (err) {
    console.error("[google-places] fetch error:", err.message);
    return NextResponse.json({ error: "Location search is temporarily unavailable.", places: [] }, { status: 503 });
  }
}
