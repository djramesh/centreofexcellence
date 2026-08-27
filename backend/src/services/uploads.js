import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* Admin uploads live under /uploads, kept separate from /assets (the seeded
   artwork that also ships in the SPA's own public folder). Without that split,
   a relative "/assets/foo.jpg" is ambiguous - it could be served by either
   origin - and newly uploaded images 404 on the storefront. */
const UPLOADS_DIR = path.join(__dirname, "../../public/uploads");

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_GALLERY_IMAGES = 8;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export const isCloudinaryEnabled = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  logger.warn({
    message:
      "Cloudinary is not configured - product images will be stored on local disk. " +
      "On an ephemeral host (Railway, Heroku) these are lost on every redeploy.",
  });
}

const storage = isCloudinaryEnabled
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "assamcrafts/products",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto" }],
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOADS_DIR),
      filename: (req, file, cb) => {
        // Never trust the client's filename - derive our own so a crafted
        // "../../server.js" or a double extension cannot escape the folder.
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
        const safeExt = /^\.(jpe?g|png|webp|avif)$/.test(ext) ? ext : ".jpg";
        cb(null, `product-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${safeExt}`);
      },
    });

function fileFilter(req, file, cb) {
  // The declared mimetype is client-controlled, so also require a plausible
  // extension. Together they keep obvious non-images out.
  const extOk = /\.(jpe?g|png|webp|avif)$/i.test(file.originalname || "");
  if (ALLOWED_MIME.has(file.mimetype) && extOk) return cb(null, true);
  return cb(new Error("Only image files are allowed"));
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_GALLERY_IMAGES },
  fileFilter,
});

/** The public URL for a freshly uploaded file, whichever backend stored it. */
export function uploadedUrl(file) {
  if (!file) return null;
  return isCloudinaryEnabled ? file.path : `/uploads/${file.filename}`;
}

/**
 * Remove a previously uploaded image. Best-effort: a failure here must never
 * fail the request that triggered it, since the DB row is already gone.
 */
export async function deleteUploadedImage(url) {
  if (!url) return;

  try {
    if (url.includes("cloudinary.com")) {
      // .../upload/v1234567890/folder/name.jpg -> folder/name
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
      if (match?.[1]) await cloudinary.uploader.destroy(match[1]);
      return;
    }

    if (url.startsWith("/uploads/")) {
      const filename = path.basename(url);
      const target = path.join(UPLOADS_DIR, filename);
      // Confirm the resolved path is still inside the uploads directory before
      // unlinking anything.
      if (target.startsWith(UPLOADS_DIR + path.sep) && fs.existsSync(target)) {
        await fs.promises.unlink(target);
      }
    }
  } catch (err) {
    logger.warn({ message: "Failed to delete image", url, error: err.message });
  }
}

/** Discard everything a request uploaded, used when validation rejects it. */
export async function discardUploads(files) {
  const list = Array.isArray(files) ? files : files ? [files] : [];
  await Promise.all(list.map((file) => deleteUploadedImage(uploadedUrl(file))));
}
