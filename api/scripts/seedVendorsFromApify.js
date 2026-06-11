/**
 * Seed vendors from Apify wedding-vendor-scraper
 *
 * Usage:
 *   APIFY_TOKEN=your_token node scripts/seedVendorsFromApify.js
 *
 * Options (env vars):
 *   APIFY_TOKEN          required — get from https://console.apify.com/account/integrations
 *   SEED_LOCATION        default "new-york-ny"
 *   SEED_CATEGORY        default "photographers"
 *   SEED_MAX_PER_SOURCE  default 50
 *   SEED_SOURCES         comma-separated, default "the-knot,wedding-wire"
 */

import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ACTOR_ID      = "fortuitous_pirate~wedding-vendor-scraper";
const APIFY_TOKEN   = process.env.APIFY_TOKEN;
const LOCATION      = process.env.SEED_LOCATION      || "new-york-ny";
const CATEGORY      = process.env.SEED_CATEGORY      || "photographers";
const MAX_PER_SRC   = parseInt(process.env.SEED_MAX_PER_SOURCE || "50", 10);
const SOURCES       = (process.env.SEED_SOURCES || "the-knot,wedding-wire").split(",");

/* ── Category mapping ─────────────────────────────────────────────────── */
const CATEGORY_MAP = {
  photographers:   "Photography",
  videographers:   "Videography",
  caterers:        "Catering",
  florists:        "Flowers & Décor",
  "djs":           "Music & DJ",
  bands:           "Music & DJ",
  venues:          "Venue",
  "hair-makeup":   "Hair & Makeup",
  transportation:  "Transportation",
  lighting:        "Lighting",
  officiants:      "Officiant",
  cakes:           "Cake & Desserts",
  invitations:     "Invitations",
  rentals:         "Rentals",
  entertainment:   "Entertainment",
};

function mapCategory(raw) {
  if (!raw) return "Entertainment";
  const key = raw.toLowerCase().replace(/\s+/g, "-");
  for (const [k, v] of Object.entries(CATEGORY_MAP)) {
    if (key.includes(k)) return v;
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/* ── Slug builder ─────────────────────────────────────────────────────── */
function toSlug(name, suffix = "") {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return suffix ? `${base}-${suffix}` : base;
}

async function uniqueSlug(client, name) {
  let slug = toSlug(name);
  const { rows } = await client.query("SELECT id FROM vendors WHERE slug = $1", [slug]);
  if (rows.length === 0) return slug;
  // Append random suffix on collision
  return toSlug(name, Math.random().toString(36).slice(2, 7));
}

/* ── Run Apify actor and wait for result ──────────────────────────────── */
async function runApifyActor() {
  if (!APIFY_TOKEN) throw new Error("APIFY_TOKEN env var is required");

  console.log(`\n▶  Starting Apify actor (location=${LOCATION}, category=${CATEGORY}, max=${MAX_PER_SRC})…`);

  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sources:            SOURCES,
        vendorCategory:     CATEGORY,
        location:           LOCATION,
        maxVendorsPerSource: MAX_PER_SRC,
        scrapeDetails:      true,
      }),
    }
  );

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Apify start failed (${startRes.status}): ${err}`);
  }

  const { data: runData } = await startRes.json();
  const runId     = runData.id;
  const datasetId = runData.defaultDatasetId;
  console.log(`   Run ID: ${runId}`);

  /* Poll until finished */
  console.log("   Waiting for run to finish…");
  for (let attempt = 0; attempt < 120; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));

    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    const { data: statusData } = await statusRes.json();
    const status = statusData.status;
    process.stdout.write(`\r   Status: ${status} (${attempt * 5}s)`);

    if (status === "SUCCEEDED") { console.log("\n   ✅ Run succeeded"); break; }
    if (["FAILED", "TIMED-OUT", "ABORTED"].includes(status)) {
      throw new Error(`Apify run ended with status: ${status}`);
    }
  }

  /* Fetch results */
  console.log("   Fetching dataset…");
  const dataRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json&clean=true`
  );
  if (!dataRes.ok) throw new Error(`Dataset fetch failed: ${dataRes.status}`);
  const items = await dataRes.json();
  console.log(`   ${items.length} vendors fetched`);
  return items;
}

/* ── Insert vendors ───────────────────────────────────────────────────── */
async function seedVendors(items) {
  const client = await pool.connect();
  const dummyHash = await bcrypt.hash("VendorSeed2024!", 10);
  let inserted = 0, skipped = 0;

  try {
    await client.query("BEGIN");

    for (const item of items) {
      const businessName = item.name?.trim();
      if (!businessName) { skipped++; continue; }

      /* Skip duplicates by business_name */
      const { rows: exists } = await client.query(
        "SELECT id FROM vendors WHERE business_name ILIKE $1 LIMIT 1",
        [businessName]
      );
      if (exists.length) { skipped++; continue; }

      const slug     = await uniqueSlug(client, businessName);
      const category = mapCategory(item.vendorType || CATEGORY);
      const email    = item.email?.trim() || `${slug}@liteevent.demo`;
      const city     = item.city?.trim()  || null;
      const state    = item.state?.trim() || null;
      const country  = state ? "USA" : null;

      const basePrice   = item.startingPrice ? parseFloat(String(item.startingPrice).replace(/[^0-9.]/g, "")) || null : null;
      const rating      = item.rating      ? Math.min(5, Math.max(0, parseFloat(item.rating)))      : 0;
      const reviewCount = item.reviewCount ? parseInt(item.reviewCount, 10) : 0;
      const phone       = item.phone?.trim() || null;

      /* Build a tagline from available info */
      const tagline = [
        category,
        city && state ? `based in ${city}, ${state}` : city ? `based in ${city}` : null,
        reviewCount > 0 ? `· ${reviewCount} reviews` : null,
      ].filter(Boolean).join(" ");

      await client.query(
        `INSERT INTO vendors (
          business_name, slug, category, email, phone,
          city, country, base_price, currency, price_label,
          rating, review_count, tagline,
          verification_status, is_active, is_featured,
          password_hash
        ) VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,$10,
          $11,$12,$13,
          $14,$15,$16,
          $17
        )`,
        [
          businessName, slug, category, email, phone,
          city, country, basePrice, "USD", "Starting from",
          rating, reviewCount, tagline,
          "pending", true, false,
          dummyHash,
        ]
      );
      inserted++;
      if (inserted % 10 === 0) process.stdout.write(`\r   Inserted ${inserted}…`);
    }

    await client.query("COMMIT");
    console.log(`\n\n✅  Done — inserted: ${inserted}, skipped (dup/empty): ${skipped}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/* ── Main ─────────────────────────────────────────────────────────────── */
async function main() {
  try {
    const items = await runApifyActor();
    if (items.length === 0) { console.log("No items returned — nothing to insert."); return; }
    await seedVendors(items);
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error("\n❌ Error:", err.message); process.exit(1); });
