import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
const KEY  = () => process.env.VENDOR_GOOGLE_KEY;
const BASE = "https://places.googleapis.com/v1";

/* GET /api/google-places/photo?ref=places/XXX/photos/YYY
 * Public — no auth. Proxies Google Places photo so mobile clients
 * don't need to handle redirects or referrer-restricted API keys. */
router.get("/photo", async (req, res) => {
  const { ref } = req.query;
  if (!ref?.trim()) return res.status(400).end();

  const url = `${BASE}/${ref}/media?maxHeightPx=600&maxWidthPx=600&key=${KEY()}`;
  try {
    const r = await fetch(url, {
      redirect: "follow",
      headers: {
        Referer: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
      },
    });
    if (!r.ok) return res.status(r.status).end();
    res.set("Content-Type", r.headers.get("content-type") || "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    const buf = await r.arrayBuffer();
    return res.send(Buffer.from(buf));
  } catch {
    return res.status(502).end();
  }
});

router.use(authenticate);

/* POST /api/google-places/search */
router.post("/search", async (req, res) => {
  const { query, location } = req.body;
  if (!query?.trim()) return res.status(400).json({ error: "query is required" });

  const textQuery = location?.trim() ? `${query.trim()} in ${location.trim()}` : query.trim();

  try {
    const r = await fetch(`${BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY(),
        "Referer": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
        "X-Goog-FieldMask": [
          "places.id", "places.displayName", "places.formattedAddress",
          "places.rating", "places.userRatingCount", "places.websiteUri",
          "places.internationalPhoneNumber", "places.nationalPhoneNumber",
          "places.businessStatus", "places.photos",
        ].join(","),
      },
      body: JSON.stringify({ textQuery, languageCode: "en", maxResultCount: 20 }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Places API error" });

    // Build photo URLs server-side
    const places = (data.places || []).map(p => ({
      ...p,
      photoUrl: p.photos?.[0]?.name
        ? `${BASE}/${p.photos[0].name}/media?maxHeightPx=600&maxWidthPx=600&key=${KEY()}`
        : null,
    }));

    return res.json({ places });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/* POST /api/google-places/details */
router.post("/details", async (req, res) => {
  const { placeId } = req.body;
  if (!placeId?.trim()) return res.status(400).json({ error: "placeId is required" });

  try {
    const r = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": KEY(),
        "Referer": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
        "X-Goog-FieldMask": [
          "reviews", "editorialSummary", "regularOpeningHours",
          "priceLevel", "rating", "userRatingCount",
          "displayName", "formattedAddress",
          "internationalPhoneNumber", "websiteUri", "photos",
        ].join(","),
      },
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Places API error" });

    return res.json({
      editorialSummary: data.editorialSummary?.text || null,
      openingHours: data.regularOpeningHours?.weekdayDescriptions || null,
      rating: data.rating || null,
      userRatingCount: data.userRatingCount || null,
      reviews: (data.reviews || []).map(r => ({
        ...r,
        authorPhotoUrl: r.authorAttribution?.photoUri || null,
      })),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
