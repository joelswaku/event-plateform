import { db } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "organizer-secret-key";

export class OrganizerError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function toToken(organizer) {
  return jwt.sign({ organizerId: organizer.id, email: organizer.email, role: "organizer" }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyOrganizerToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function sanitize({ password_hash, ...safe }) {
  return safe;
}

// ── AUTH ──────────────────────────────────────────────────────────────────

export async function registerOrganizerService({ name, email, password, company, phone, city, country }) {
  const exists = await db.query("SELECT id FROM organizers WHERE email = $1", [email]);
  if (exists.rows.length) throw new OrganizerError("Email already registered", 409);

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await db.query(`
    INSERT INTO organizers (name, email, password_hash, company, phone, city, country)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
  `, [name, email, hash, company || null, phone || null, city || null, country || null]);

  const organizer = rows[0];
  return { organizer: sanitize(organizer), token: toToken(organizer) };
}

export async function loginOrganizerService({ email, password }) {
  const { rows } = await db.query("SELECT * FROM organizers WHERE email = $1", [email]);
  if (!rows.length) throw new OrganizerError("Invalid email or password", 401);
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) throw new OrganizerError("Invalid email or password", 401);
  await db.query("UPDATE organizers SET updated_at = NOW() WHERE id = $1", [rows[0].id]);
  return { organizer: sanitize(rows[0]), token: toToken(rows[0]) };
}

// ── PROFILE ───────────────────────────────────────────────────────────────

export async function getOrganizerMeService(id) {
  const { rows } = await db.query("SELECT * FROM organizers WHERE id = $1", [id]);
  if (!rows.length) throw new OrganizerError("Not found", 404);
  return sanitize(rows[0]);
}

export async function updateOrganizerProfileService(id, payload) {
  const allowed = ["name","company","phone","city","country","website","event_types","avatar_url","bio"];
  const fields = [], vals = [];
  let i = 1;
  for (const [k, v] of Object.entries(payload)) {
    if (allowed.includes(k)) { fields.push(`${k} = $${i++}`); vals.push(v); }
  }
  if (!fields.length) throw new OrganizerError("No valid fields", 400);
  fields.push("updated_at = NOW()");
  vals.push(id);
  const { rows } = await db.query(
    `UPDATE organizers SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, vals
  );
  return sanitize(rows[0]);
}

// ── SAVED VENDORS ─────────────────────────────────────────────────────────

export async function getSavedVendorsService(organizerId) {
  const { rows } = await db.query(`
    SELECT v.id, v.business_name, v.slug, v.category, v.tagline, v.logo_url,
           v.city, v.country, v.rating, v.review_count, v.base_price,
           v.currency, v.price_label, v.verification_status, osv.created_at as saved_at
    FROM organizer_saved_vendors osv
    JOIN vendors v ON v.id = osv.vendor_id
    WHERE osv.organizer_id = $1
    ORDER BY osv.created_at DESC
  `, [organizerId]);
  return rows;
}

export async function saveVendorService(organizerId, vendorId) {
  const { rows } = await db.query("SELECT id FROM vendors WHERE id = $1", [vendorId]);
  if (!rows.length) throw new OrganizerError("Vendor not found", 404);
  await db.query(
    "INSERT INTO organizer_saved_vendors (organizer_id, vendor_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    [organizerId, vendorId]
  );
  return { saved: true };
}

export async function unsaveVendorService(organizerId, vendorId) {
  await db.query(
    "DELETE FROM organizer_saved_vendors WHERE organizer_id = $1 AND vendor_id = $2",
    [organizerId, vendorId]
  );
  return { saved: false };
}
