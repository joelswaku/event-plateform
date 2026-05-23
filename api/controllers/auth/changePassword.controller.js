import bcrypt from "bcryptjs";
import { db } from "../../config/db.js";

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }

    const row = await db.query("SELECT password_hash FROM users WHERE id=$1", [userId]);
    if (!row.rows[0]) return res.status(404).json({ success: false, message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, row.rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: "Current password is incorrect" });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query("UPDATE users SET password_hash=$1 WHERE id=$2", [hash, userId]);

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to change password" });
  }
}
