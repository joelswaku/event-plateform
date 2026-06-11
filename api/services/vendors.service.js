import { db } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "vendor-secret-key";

export class VendorError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
}

function toVendorToken(vendor) {
  return jwt.sign({ vendorId: vendor.id, email: vendor.email }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyVendorToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// ── AUTH ──────────────────────────────────────────────────────────────────

export async function registerVendorService({ businessName, category, email, password, fullName, city, country, phone }) {
  const exists = await db.query("SELECT id FROM vendors WHERE email = $1", [email]);
  if (exists.rows.length) throw new VendorError("Email already registered", 409);

  const hash = await bcrypt.hash(password, 12);
  const slug = generateSlug(businessName);

  const { rows } = await db.query(`
    INSERT INTO vendors (business_name, slug, category, email, password_hash, city, country, phone)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
  `, [businessName, slug, category || 'General', email, hash, city || null, country || null, phone || null]);

  const vendor = rows[0];
  const token = toVendorToken(vendor);
  return { vendor: sanitize(vendor), token };
}

export async function loginVendorService({ email, password }) {
  const { rows } = await db.query("SELECT * FROM vendors WHERE email = $1", [email]);
  if (!rows.length) throw new VendorError("Invalid email or password", 401);
  const vendor = rows[0];
  const ok = await bcrypt.compare(password, vendor.password_hash);
  if (!ok) throw new VendorError("Invalid email or password", 401);
  await db.query("UPDATE vendors SET updated_at = NOW() WHERE id = $1", [vendor.id]);
  return { vendor: sanitize(vendor), token: toVendorToken(vendor) };
}

// ── PROFILE ───────────────────────────────────────────────────────────────

export async function getVendorMeService(vendorId) {
  const { rows } = await db.query("SELECT * FROM vendors WHERE id = $1", [vendorId]);
  if (!rows.length) throw new VendorError("Vendor not found", 404);
  return sanitize(rows[0]);
}

export async function updateVendorProfileService(vendorId, payload) {
  const allowed = ["business_name","tagline","bio","category","subcategories","city","country",
    "phone","website_url","service_area","base_price","currency","price_label",
    "logo_url","cover_url","portfolio","services","social_links","verification_status","is_active"];
  const fields = [], vals = [];
  let i = 1;
  for (const [k, v] of Object.entries(payload)) {
    if (allowed.includes(k)) { fields.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!fields.length) throw new VendorError("No valid fields", 400);
  fields.push("updated_at = NOW()");
  vals.push(vendorId);
  const { rows } = await db.query(
    `UPDATE vendors SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, vals
  );
  return sanitize(rows[0]);
}

// ── MARKETPLACE ───────────────────────────────────────────────────────────

export async function listVendorsService({ category, city, country, minRating, maxPrice, minPrice, verified, search, sort, page = 1, limit = 12 }) {
  const conditions = ["v.is_active = true"];
  const vals = [];
  let i = 1;

  if (category)   { conditions.push(`v.category ILIKE $${i++}`); vals.push(category); }
  if (city)       { conditions.push(`v.city ILIKE $${i++}`); vals.push(`%${city}%`); }
  if (country)    { conditions.push(`v.country ILIKE $${i++}`); vals.push(`%${country}%`); }
  if (minRating)  { conditions.push(`v.rating >= $${i++}`); vals.push(parseFloat(minRating)); }
  if (minPrice)   { conditions.push(`v.base_price >= $${i++}`); vals.push(parseFloat(minPrice)); }
  if (maxPrice)   { conditions.push(`v.base_price <= $${i++}`); vals.push(parseFloat(maxPrice)); }
  if (verified === "true") { conditions.push(`v.verification_status = 'verified'`); }
  if (search) {
    conditions.push(`(v.business_name ILIKE $${i} OR v.bio ILIKE $${i+1} OR v.category ILIKE $${i+2})`);
    vals.push(`%${search}%`, `%${search}%`, `%${search}%`);
    i += 3;
  }

  const orderMap = {
    rating: "v.rating DESC, v.review_count DESC",
    price_asc: "v.base_price ASC NULLS LAST",
    price_desc: "v.base_price DESC NULLS LAST",
    newest: "v.created_at DESC",
    default: "v.is_featured DESC, v.rating DESC, v.review_count DESC",
  };
  const orderBy = orderMap[sort] || orderMap.default;
  const offset = (page - 1) * limit;

  const where = `WHERE ${conditions.join(" AND ")}`;
  const [{ rows: vendors }, { rows: [{ count }] }] = await Promise.all([
    db.query(`SELECT v.id, v.business_name, v.slug, v.category, v.tagline, v.logo_url, v.cover_url, v.city, v.country, v.rating, v.review_count, v.base_price, v.currency, v.price_label, v.verification_status, v.is_featured, v.tier FROM vendors v ${where} ORDER BY ${orderBy} LIMIT $${i} OFFSET $${i+1}`, [...vals, limit, offset]),
    db.query(`SELECT COUNT(*) FROM vendors v ${where}`, vals),
  ]);

  return { vendors, total: parseInt(count), page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) };
}

export async function getVendorBySlugService(slug) {
  const { rows } = await db.query("SELECT * FROM vendors WHERE slug = $1", [slug]);
  if (!rows.length) throw new VendorError("Vendor not found", 404);
  const vendor = rows[0];
  await db.query("UPDATE vendors SET profile_views = profile_views + 1 WHERE id = $1", [vendor.id]);
  const { rows: reviews } = await db.query(
    "SELECT id, reviewer_name, reviewer_initial, reviewer_color, event_type, rating, title, body, reply, replied_at, is_verified, created_at FROM vendor_reviews WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 20",
    [vendor.id]
  );
  return { ...sanitize(vendor), reviews };
}

// ── INQUIRIES ─────────────────────────────────────────────────────────────

export async function createInquiryService(vendorId, { senderName, senderEmail, eventType, eventDate, guestCount, budget, message }) {
  const { rows } = await db.query(`
    INSERT INTO vendor_inquiries (vendor_id, sender_name, sender_email, event_type, event_date, guest_count, budget, message)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
  `, [vendorId, senderName, senderEmail, eventType || null, eventDate || null, guestCount || null, budget || null, message]);
  await db.query("UPDATE vendors SET inquiry_count = inquiry_count + 1 WHERE id = $1", [vendorId]);
  return rows[0];
}

export async function listInquiriesService(vendorId, status) {
  const conditions = ["vendor_id = $1"];
  const vals = [vendorId];
  if (status && status !== "all") { conditions.push(`status = $2`); vals.push(status); }
  const { rows } = await db.query(
    `SELECT * FROM vendor_inquiries WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`, vals
  );
  return rows;
}

export async function replyInquiryService(vendorId, inquiryId, reply, newStatus) {
  const { rows } = await db.query(
    `UPDATE vendor_inquiries SET vendor_reply = $1, replied_at = NOW(), status = $2, is_read = true
     WHERE id = $3 AND vendor_id = $4 RETURNING *`,
    [reply, newStatus || "responded", inquiryId, vendorId]
  );
  if (!rows.length) throw new VendorError("Inquiry not found", 404);
  return rows[0];
}

export async function markInquiryStatusService(vendorId, inquiryId, status) {
  const { rows } = await db.query(
    `UPDATE vendor_inquiries SET status = $1 WHERE id = $2 AND vendor_id = $3 RETURNING *`,
    [status, inquiryId, vendorId]
  );
  if (!rows.length) throw new VendorError("Inquiry not found", 404);
  return rows[0];
}

// ── REVIEWS ───────────────────────────────────────────────────────────────

export async function listReviewsService(vendorId) {
  const { rows } = await db.query(
    "SELECT * FROM vendor_reviews WHERE vendor_id = $1 ORDER BY created_at DESC", [vendorId]
  );
  return rows;
}

export async function replyReviewService(vendorId, reviewId, reply) {
  const { rows } = await db.query(
    `UPDATE vendor_reviews SET reply = $1, replied_at = NOW()
     WHERE id = $2 AND vendor_id = $3 RETURNING *`,
    [reply, reviewId, vendorId]
  );
  if (!rows.length) throw new VendorError("Review not found", 404);
  await recalcRating(vendorId);
  return rows[0];
}

export async function createReviewService(vendorId, { reviewerName, reviewerEmail, eventType, rating, title, body }) {
  const color = ["#6366f1","#10b981","#f59e0b","#f43f5e","#a78bfa"][Math.floor(Math.random()*5)];
  const { rows } = await db.query(`
    INSERT INTO vendor_reviews (vendor_id, reviewer_name, reviewer_email, reviewer_initial, reviewer_color, event_type, rating, title, body)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
  `, [vendorId, reviewerName, reviewerEmail || null, (reviewerName[0] || "?").toUpperCase(), color, eventType || null, rating, title || null, body]);
  await recalcRating(vendorId);
  return rows[0];
}

async function recalcRating(vendorId) {
  await db.query(`
    UPDATE vendors SET
      rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM vendor_reviews WHERE vendor_id = $1),
      review_count = (SELECT COUNT(*) FROM vendor_reviews WHERE vendor_id = $1)
    WHERE id = $1
  `, [vendorId]);
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────

export async function getAnalyticsService(vendorId) {
  const { rows: [v] } = await db.query(
    "SELECT profile_views, inquiry_count, booking_count, rating, review_count FROM vendors WHERE id = $1", [vendorId]
  );
  const { rows: recentInquiries } = await db.query(
    "SELECT DATE(created_at) as day, COUNT(*) FROM vendor_inquiries WHERE vendor_id = $1 AND created_at > NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day",
    [vendorId]
  );
  const inquiryRate = v.profile_views > 0 ? ((v.inquiry_count / v.profile_views) * 100).toFixed(1) : "0.0";
  const conversionRate = v.inquiry_count > 0 ? ((v.booking_count / v.inquiry_count) * 100).toFixed(1) : "0.0";
  return { ...v, inquiryRate, conversionRate, recentInquiries };
}

// ── HELPERS ───────────────────────────────────────────────────────────────

function sanitize(v) {
  const { password_hash, ...safe } = v;
  return safe;
}
