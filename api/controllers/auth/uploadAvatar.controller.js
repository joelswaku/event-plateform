import streamifier from "streamifier";
import { cloudinary } from "../../config/cloudinary.js";
import { db } from "../../config/db.js";

function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image file is required" });
    }

    const userId = req.user.id;

    const result = await uploadToCloudinary(req.file.buffer, {
      folder:        `meetcraft/avatars`,
      public_id:     `user_${userId}`,
      overwrite:     true,
      resource_type: "image",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    await db.query("UPDATE users SET avatar_url=$1 WHERE id=$2", [result.secure_url, userId]);

    return res.status(200).json({
      success: true,
      data: { avatar_url: result.secure_url },
    });
  } catch (err) {
    console.error("Avatar upload error:", err);
    return res.status(500).json({ success: false, message: err.message || "Upload failed" });
  }
}
