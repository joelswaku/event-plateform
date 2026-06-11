/**
 * Seed vendors from the Apify run result (fetched 2026-06-06).
 * Run: node scripts/seedVendorsApifyResult.js
 */
import pg      from "pg";
import bcrypt  from "bcryptjs";
import dotenv  from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const VENDORS = [
  {
    business_name: "Dreamlife Wedding Photo & Video",
    category:      "Photography",
    city:          "New York",
    country:       "USA",
    base_price:    1590,
    rating:        4.9,
    review_count:  187,
    tagline:       "Professional photographers & videographers — New York & Los Angeles, coast to coast.",
    bio:           "Our team of professional photographers and wedding videographers in New York and Los Angeles are skilled and creative artists who are passionate about documenting your wedding.",
    verification_status: "verified",
  },
  {
    business_name: "George Street Photo & Video",
    category:      "Photography",
    city:          "New York",
    country:       "USA",
    base_price:    1695,
    rating:        4.3,
    review_count:  2698,
    tagline:       "NYC wedding photography & videography with a polished, textured aesthetic.",
    bio:           "New York City Wedding Photography & Videography with a Polished, Textured Aesthetic. Serving the NYC Metro Area with destination options.",
    verification_status: "verified",
  },
  {
    business_name: "Symboll® New York / Photo & Video",
    category:      "Photography",
    city:          "New York",
    country:       "USA",
    base_price:    3400,
    rating:        5.0,
    review_count:  110,
    tagline:       "Award-winning NYC photography & videography — capturing every meaningful moment.",
    bio:           "Based in New York City, Symboll® captures all the meaningful moments during your wedding celebrations with an artistic, documentary eye.",
    verification_status: "verified",
  },
  {
    business_name: "Eivan's Photo & Video",
    category:      "Photography",
    city:          "New York",
    country:       "USA",
    base_price:    1249,
    rating:        4.7,
    review_count:  246,
    tagline:       "Manhattan wedding photo & video packages from $1,299.",
    bio:           "Local Manhattan Wedding Photography & Videography with packages starting at $1,299. Offering drone, day-after sessions and same-day edits.",
    verification_status: "verified",
  },
  {
    business_name: "Emma Cleary Photo & Video",
    category:      "Photography",
    city:          "New York",
    country:       "USA",
    base_price:    3900,
    rating:        5.0,
    review_count:  291,
    tagline:       "Award-winning international wedding photography & videography collective.",
    bio:           "Emma Cleary Photo & Video is an award-winning, international wedding photography and videography collaborative based in New York City. Serving NY & the Tri-state area.",
    verification_status: "verified",
  },
  {
    business_name: "Lily & Lime",
    category:      "Photography",
    city:          "New York",
    country:       "USA",
    base_price:    995,
    rating:        4.6,
    review_count:  177,
    tagline:       "Budget-friendly wedding photo & video nationwide from $895.",
    bio:           "Lily & Lime offers budget-friendly wedding photo and video to couples in the New York City area and nationwide, starting at $895.",
    verification_status: "verified",
  },
  {
    business_name: "Justin McCallum Photography",
    category:      "Photography",
    city:          "New York",
    country:       "USA",
    base_price:    5200,
    rating:        5.0,
    review_count:  126,
    tagline:       "Belly laughs, lens flare, outrageous dance moves — and most of all, love.",
    bio:           "I look for belly laughs, lens flare, outrageous dance moves, quiet moments, but most of all LOVE. New York City + Beyond. LGBTQ+-owned business.",
    verification_status: "verified",
  },
  {
    business_name: "Melo Photo + Video",
    category:      "Photography",
    city:          "New York",
    country:       "USA",
    base_price:    600,
    rating:        4.8,
    review_count:  209,
    tagline:       "Affordable NYC wedding photo + video from $600.",
    bio:           "Melo Photo + Video offers affordable wedding photo + video services in the New York City area, beginning at $600. Film photography and printed proofs available.",
    verification_status: "verified",
  },
  {
    business_name: "Bryan Sargent Photography",
    category:      "Photography",
    city:          "New York",
    country:       "USA",
    base_price:    1500,
    rating:        5.0,
    review_count:  170,
    tagline:       "Award-winning wedding & engagement photographer from New York City.",
    bio:           "Bryan Sargent is an award-winning wedding and engagement photographer from New York City, specialising in film photography and destination weddings.",
    verification_status: "verified",
  },
  {
    business_name: "Moments by Ioana",
    category:      "Photography",
    city:          "Astoria",
    country:       "USA",
    base_price:    3500,
    rating:        5.0,
    review_count:  13,
    tagline:       "Documentary-style wedding photography across New York and Long Island.",
    bio:           "New York Wedding Photographer capturing authentic, documentary-style wedding photography. Serving New York City and Long Island.",
    verification_status: "verified",
  },
];

function toSlug(name) {
  return name.toLowerCase().replace(/[®&+]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

async function uniqueSlug(client, name) {
  const base = toSlug(name);
  const { rows } = await client.query("SELECT id FROM vendors WHERE slug = $1", [base]);
  if (!rows.length) return base;
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

async function main() {
  const client = await pool.connect();
  const hash   = await bcrypt.hash("ApifyVendor2024!", 10);
  let inserted = 0, skipped = 0;

  try {
    await client.query("BEGIN");

    for (const v of VENDORS) {
      const { rows: exists } = await client.query(
        "SELECT id FROM vendors WHERE business_name ILIKE $1 LIMIT 1",
        [v.business_name]
      );
      if (exists.length) { skipped++; continue; }

      const slug  = await uniqueSlug(client, v.business_name);
      const email = `${slug}@liteevent.demo`;

      await client.query(
        `INSERT INTO vendors (
          business_name, slug, category, email,
          city, country, base_price, currency, price_label,
          rating, review_count, tagline, bio,
          verification_status, is_active, is_featured,
          password_hash
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          v.business_name, slug, v.category, email,
          v.city, v.country, v.base_price, "USD", "Starting from",
          v.rating, v.review_count, v.tagline, v.bio,
          v.verification_status, true, false,
          hash,
        ]
      );
      inserted++;
      console.log(`  ✓ ${v.business_name}`);
    }

    await client.query("COMMIT");
    console.log(`\n✅  Done — inserted: ${inserted}, skipped (already exists): ${skipped}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
