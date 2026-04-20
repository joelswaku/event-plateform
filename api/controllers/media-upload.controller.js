import streamifier from "streamifier";
import { cloudinary } from "../config/cloudinary.js";
import * as builderService from "../services/event-builder.service.js";

function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export async function uploadBuilderImage(req, res) {
  try {
    const { eventId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: `meetcraft/events/${eventId}`,
      resource_type: "image",
    });

    const media = await builderService.uploadEventMediaService({
      eventId,
      organizationId: req.organizationId,
      userId: req.user?.id,
      payload: {
        upload_id: null,
        media_type: "IMAGE",
        file_url: uploadResult.secure_url,
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        caption: req.body.caption || null,
        is_public: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        media,
        cloudinary: {
          public_id: uploadResult.public_id,
          secure_url: uploadResult.secure_url,
          width: uploadResult.width,
          height: uploadResult.height,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Upload failed",
    });
  }
}