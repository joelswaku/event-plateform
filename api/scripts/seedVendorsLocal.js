/**
 * Local vendor seed — no Apify token needed.
 * Creates 40 realistic-looking vendors across all categories.
 *
 * Usage (from api/ folder):
 *   node scripts/seedVendorsLocal.js
 */

import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const VENDORS = [
  // Photography
  { business_name: "Lumière Photo Studio",     category: "Photography",     city: "New York",      country: "USA", base_price: 2500, rating: 4.9, review_count: 87, tagline: "Capturing timeless moments with cinematic flair" },
  { business_name: "Golden Hour Photography",   category: "Photography",     city: "Los Angeles",   country: "USA", base_price: 1800, rating: 4.7, review_count: 63, tagline: "Natural light portraits & editorial wedding photography" },
  { business_name: "Noir & White Studios",      category: "Photography",     city: "Chicago",       country: "USA", base_price: 3200, rating: 4.8, review_count: 104, tagline: "Award-winning wedding and event photography" },
  { business_name: "Frame & Story",             category: "Photography",     city: "Austin",        country: "USA", base_price: 1500, rating: 4.6, review_count: 45, tagline: "Authentic storytelling through documentary-style photography" },

  // Videography
  { business_name: "Cinematic Events Co.",      category: "Videography",     city: "Miami",         country: "USA", base_price: 3500, rating: 4.9, review_count: 58, tagline: "Cinematic wedding films that feel like movies" },
  { business_name: "Reel Moments Studio",       category: "Videography",     city: "New York",      country: "USA", base_price: 2800, rating: 4.7, review_count: 39, tagline: "4K drone footage and same-day edits" },
  { business_name: "Motion & Memory Films",     category: "Videography",     city: "Seattle",       country: "USA", base_price: 2200, rating: 4.5, review_count: 27, tagline: "Emotional highlight reels for your most special day" },

  // Music & DJ
  { business_name: "DJ Luxe Entertainment",     category: "Music & DJ",      city: "Las Vegas",     country: "USA", base_price: 1200, rating: 4.8, review_count: 152, tagline: "Premium DJ & MC services for weddings and corporate events" },
  { business_name: "The Soundwave Band",        category: "Music & DJ",      city: "Nashville",     country: "USA", base_price: 4500, rating: 4.9, review_count: 76, tagline: "7-piece live band covering pop, jazz, and R&B classics" },
  { business_name: "Vibe DJ Services",          category: "Music & DJ",      city: "Atlanta",       country: "USA", base_price: 900,  rating: 4.6, review_count: 88, tagline: "Keeping your guests on the dance floor all night long" },
  { business_name: "Harmony String Quartet",    category: "Music & DJ",      city: "Boston",        country: "USA", base_price: 1800, rating: 4.9, review_count: 44, tagline: "Classical & contemporary music for ceremonies and cocktail hours" },

  // Catering
  { business_name: "La Belle Cuisine",          category: "Catering",        city: "San Francisco", country: "USA", base_price: 95,   rating: 4.8, review_count: 203, tagline: "Farm-to-table catering for weddings and corporate events" },
  { business_name: "The Grand Table Co.",       category: "Catering",        city: "New York",      country: "USA", base_price: 120,  rating: 4.7, review_count: 167, tagline: "Elegant plated dinners and cocktail receptions" },
  { business_name: "Spice Route Catering",      category: "Catering",        city: "Houston",       country: "USA", base_price: 75,   rating: 4.6, review_count: 91,  tagline: "Fusion cuisine blending global flavors for your event" },
  { business_name: "Chef Marcus Events",        category: "Catering",        city: "Chicago",       country: "USA", base_price: 110,  rating: 4.9, review_count: 118, tagline: "Private chef experience for intimate and large-scale events" },

  // Flowers & Décor
  { business_name: "Bloom & Co. Floral",        category: "Flowers & Décor", city: "Los Angeles",   country: "USA", base_price: 2000, rating: 4.8, review_count: 95,  tagline: "Lush, romantic florals for weddings and special occasions" },
  { business_name: "Petals & Pearls Design",    category: "Flowers & Décor", city: "New York",      country: "USA", base_price: 3500, rating: 4.9, review_count: 72,  tagline: "Luxury floral design and full event styling" },
  { business_name: "Wild Garden Events",        category: "Flowers & Décor", city: "Portland",      country: "USA", base_price: 1200, rating: 4.7, review_count: 54,  tagline: "Bohemian, wildflower-inspired décor for outdoor events" },

  // Venue
  { business_name: "The Grand Pavilion",        category: "Venue",           city: "New York",      country: "USA", base_price: 8000, rating: 4.8, review_count: 136, tagline: "Stunning rooftop venue with panoramic city views" },
  { business_name: "Rosewood Estate",           category: "Venue",           city: "Napa Valley",   country: "USA", base_price: 12000, rating: 4.9, review_count: 89, tagline: "Vineyard estate for intimate weddings and corporate retreats" },
  { business_name: "The Industrial Loft",       category: "Venue",           city: "Brooklyn",      country: "USA", base_price: 5500, rating: 4.6, review_count: 61,  tagline: "Modern industrial space for up to 300 guests" },

  // Hair & Makeup
  { business_name: "Glow Studio by Mia",        category: "Hair & Makeup",   city: "Los Angeles",   country: "USA", base_price: 350,  rating: 4.9, review_count: 211, tagline: "Bridal beauty specialists with 10+ years experience" },
  { business_name: "The Bridal Beauty Bar",     category: "Hair & Makeup",   city: "New York",      country: "USA", base_price: 450,  rating: 4.8, review_count: 178, tagline: "Airbrush makeup and up-do styling for your entire bridal party" },
  { business_name: "Velvet Vanity Co.",         category: "Hair & Makeup",   city: "Miami",         country: "USA", base_price: 280,  rating: 4.7, review_count: 93,  tagline: "On-location bridal glam for weddings and editorial shoots" },

  // Lighting
  { business_name: "Luminary Event Lighting",   category: "Lighting",        city: "Dallas",        country: "USA", base_price: 1800, rating: 4.8, review_count: 67,  tagline: "Custom uplighting, gobo projections and LED installations" },
  { business_name: "Aurora Lighting Design",    category: "Lighting",        city: "Chicago",       country: "USA", base_price: 2400, rating: 4.7, review_count: 49,  tagline: "Transforming venues with award-winning lighting design" },

  // Transportation
  { business_name: "Elite Limo & Car Service",  category: "Transportation",  city: "New York",      country: "USA", base_price: 800,  rating: 4.7, review_count: 143, tagline: "Luxury fleet of limos, SUVs and party buses" },
  { business_name: "Classic Wheels Rentals",    category: "Transportation",  city: "Los Angeles",   country: "USA", base_price: 600,  rating: 4.6, review_count: 77,  tagline: "Vintage and classic cars for weddings and film productions" },

  // Sound & AV
  { business_name: "Soundscape AV Pro",         category: "Sound & AV",      city: "Nashville",     country: "USA", base_price: 1500, rating: 4.8, review_count: 58,  tagline: "Full AV production: PA systems, screens, streaming" },
  { business_name: "Crystal Clear Audio",       category: "Sound & AV",      city: "Miami",         country: "USA", base_price: 1100, rating: 4.6, review_count: 41,  tagline: "Professional sound engineering for indoor and outdoor events" },

  // Officiant
  { business_name: "Sacred Vows Ceremonies",    category: "Officiant",       city: "New York",      country: "USA", base_price: 400,  rating: 4.9, review_count: 187, tagline: "Personalized, heartfelt ceremonies — religious, civil & symbolic" },
  { business_name: "Rev. James Monroe",         category: "Officiant",       city: "Los Angeles",   country: "USA", base_price: 350,  rating: 4.8, review_count: 122, tagline: "Interfaith officiant bringing warmth and humor to your ceremony" },

  // Cake & Desserts
  { business_name: "Sweet Architecture Cakes",  category: "Cake & Desserts", city: "New York",      country: "USA", base_price: 800,  rating: 4.9, review_count: 94,  tagline: "Custom sculpted wedding cakes and dessert tables" },
  { business_name: "The Pastry Atelier",        category: "Cake & Desserts", city: "San Francisco", country: "USA", base_price: 650,  rating: 4.8, review_count: 71,  tagline: "French patisserie-inspired wedding cakes and macaroon towers" },

  // Entertainment
  { business_name: "Wonder Entertainment",      category: "Entertainment",   city: "Las Vegas",     country: "USA", base_price: 2500, rating: 4.8, review_count: 83,  tagline: "Magicians, caricaturists, photo booths and more" },
  { business_name: "The Photo Booth Co.",       category: "Entertainment",   city: "Chicago",       country: "USA", base_price: 900,  rating: 4.7, review_count: 129, tagline: "360° video booths, GIF stations, and instant print kiosks" },

  // Rentals
  { business_name: "TableTop Event Rentals",    category: "Rentals",         city: "Los Angeles",   country: "USA", base_price: 500,  rating: 4.6, review_count: 55,  tagline: "Premium linen, charger plates, glassware and furniture rental" },
  { business_name: "Luxe Tent & Linen Co.",     category: "Rentals",         city: "Houston",       country: "USA", base_price: 1200, rating: 4.7, review_count: 48,  tagline: "Tent structures, lounge furniture and specialty rentals" },

  // Security
  { business_name: "Shield Event Security",     category: "Security",        city: "New York",      country: "USA", base_price: 1200, rating: 4.7, review_count: 36,  tagline: "Licensed and insured event security for all venue types" },
];

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uniqueSlug(client, name) {
  const base = toSlug(name);
  const { rows } = await client.query("SELECT id FROM vendors WHERE slug = $1", [base]);
  if (!rows.length) return base;
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

async function main() {
  const client = await pool.connect();
  const hash   = await bcrypt.hash("VendorSeed2024!", 10);
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
          business_name, slug, category, email, city, country,
          base_price, currency, price_label, rating, review_count,
          tagline, verification_status, is_active, is_featured, password_hash
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          v.business_name, slug, v.category, email, v.city, v.country,
          v.base_price, "USD", "Starting from", v.rating, v.review_count,
          v.tagline, "verified", true, false, hash,
        ]
      );
      inserted++;
    }

    await client.query("COMMIT");
    console.log(`✅  Seeded ${inserted} vendors (${skipped} already existed)`);
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
