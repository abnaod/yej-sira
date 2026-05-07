import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import sharp from "sharp";

import { requireUserId } from "../../lib/auth";
import { logger } from "../../lib/logger";
import { getPublicUploadsDir } from "../../lib/paths";
import { getS3Config, putObject } from "../../lib/storage/s3";

export const uploadsRouter = new Hono();

/** Allowed image MIME types and their canonical extensions. */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type OptimizedImage = {
  buffer: Buffer;
  contentType: "image/webp";
  ext: string;
};

/** Limit a single upload to 5MB — covers logos and listing photos without
 *  encouraging oversized originals to be served directly from `/static/*`. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2_400;

async function optimizeImageUpload(buffer: Buffer, contentType: string): Promise<OptimizedImage> {
  const optimized = await sharp(buffer, { animated: contentType === "image/gif" })
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();

  return {
    buffer: optimized,
    contentType: "image/webp",
    ext: ALLOWED_IMAGE_TYPES["image/webp"],
  };
}

/** Allowed folder namespaces — requests specifying a `folder` form field are
 *  validated against this list so the server only ever writes into known,
 *  reviewable locations. */
const ALLOWED_FOLDERS = new Set(["shops", "listings", "categories", "misc"]);

uploadsRouter.post("/uploads", async (c) => {
  await requireUserId(c);

  const form = await c.req.formData().catch(() => null);
  if (!form) {
    throw new HTTPException(400, { message: "Expected multipart/form-data" });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new HTTPException(400, { message: "Missing file field" });
  }

  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    throw new HTTPException(415, { message: "Unsupported image type" });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new HTTPException(413, { message: "File too large (max 5MB)" });
  }

  const folderInput = String(form.get("folder") ?? "misc");
  const folder = ALLOWED_FOLDERS.has(folderInput) ? folderInput : "misc";

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const optimized = await optimizeImageUpload(originalBuffer, file.type).catch((err) => {
    logger.warn("uploads.optimization_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    throw new HTTPException(422, { message: "Invalid image file" });
  });

  const filename = `${randomUUID()}.${optimized.ext}`;
  const key = `uploads/${folder}/${filename}`;

  const s3 = getS3Config();
  if (s3) {
    try {
      const url = await putObject(s3, key, optimized.buffer, optimized.contentType);
      return c.json({ url });
    } catch (err) {
      logger.error("uploads.s3_failed", {
        err: err instanceof Error ? err.message : String(err),
      });
      throw new HTTPException(502, { message: "Upload failed" });
    }
  }

  // Local disk fallback (development / single-host deploys only).
  const targetDir = path.join(getPublicUploadsDir(), folder);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, filename), optimized.buffer);
  return c.json({ url: `/static/uploads/${folder}/${filename}` });
});
