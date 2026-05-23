import { db } from "../../config/db.js";

export async function updateProfile(req, res) {
  try {
    const { full_name } = req.body;
    const userId = req.user.id;

    if (!full_name?.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const result = await db.query(
      "UPDATE users SET full_name=$1 WHERE id=$2 RETURNING id, full_name, email, avatar_url, default_organization_id",
      [full_name.trim(), userId]
    );

    return res.status(200).json({ success: true, data: { user: result.rows[0] } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Update failed" });
  }
}
