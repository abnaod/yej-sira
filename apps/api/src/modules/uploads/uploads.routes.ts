import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { requireUserId } from "../../lib/authz";

export const uploadsRouter = new Hono();

/** Allowed image MIME types and their canonical extensions. */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Limit a single upload to 5MB — covers logos and listing photos without
 *  encouraging oversized originals to be served directly from `/static/*`. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(moduleDir, "../../../../../public/uploads");

/** Allowed folder namespaces under `public/uploads/` — requests specifying a
 *  `folder` form field are validated against this list so the server only ever
 *  writes into known, reviewable locations. */
const ALLOWED_FOLDERS = new Set(["shops", "listings", "misc"]);

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

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    throw new HTTPException(415, { message: "Unsupported image type" });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new HTTPException(413, { message: "File too large (max 5MB)" });
  }

  const folderInput = String(form.get("folder") ?? "misc");
  const folder = ALLOWED_FOLDERS.has(folderInput) ? folderInput : "misc";

  const filename = `${randomUUID()}.${ext}`;
  const targetDir = path.join(uploadsDir, folder);
  await mkdir(targetDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(targetDir, filename), buffer);

  return c.json({ url: `/static/uploads/${folder}/${filename}` });
});
