import { db } from "../config/db.js";

export async function requireSuperAdmin(req, res, next) {
  // Fast path: sadm claim present in JWT
  if (req.user?.isSuperAdmin === true) return next();

  // Fallback: JWT was issued before sadm was added — verify against DB
  if (!req.user?.id) {
    return res.status(403).json({ success: false, message: "Super admin access required" });
  }

  try {
    const { rows } = await db.query(
      "SELECT is_super_admin FROM users WHERE id=$1 AND deleted_at IS NULL LIMIT 1",
      [req.user.id]
    );
    if (rows[0]?.is_super_admin === true) return next();
  } catch (e) {
    console.error("[requireSuperAdmin]", e.message);
  }

  return res.status(403).json({ success: false, message: "Super admin access required" });
}
