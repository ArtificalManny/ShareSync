// /ShareSync-backend/routes/uploads.ts
import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { sniffMime, normalizeImageBuffer, toPreviewWebp } from "../utils/safe-convert";
import { sendError } from "../middleware/errors";

const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.resolve(process.cwd(), "uploads");
const PUBLIC_BASE = process.env.PUBLIC_BASE || "/uploads";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export const uploadsRouter = Router();

uploadsRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, "NO_FILE", "No file uploaded");
    const original = req.file.buffer;

    const sniff = await sniffMime(original);
    const declared = req.file.mimetype || "application/octet-stream";
    const realMime = sniff.mime;

    // Very basic mismatch notice (soft)
    if (declared.split("/")[0] !== realMime.split("/")[0]) {
      console.warn("[upload] MIME mismatch:", { declared, real: realMime });
    }

    const id = randomUUID();
    const day = new Date().toISOString().slice(0, 10);
    const dir = path.join(UPLOAD_ROOT, day);
    await ensureDir(dir);

    let finalBuf = original;
    let finalMime = realMime;
    let width = 0;
    let height = 0;

    if (realMime.startsWith("image/")) {
      // Choose a canonical target
      const target =
        realMime === "image/jpeg" || realMime === "image/jpg" ? "jpeg" :
        realMime === "image/png" ? "png" : "webp";

      const norm = await normalizeImageBuffer(original, target);
      finalBuf = norm.buffer;
      finalMime = norm.mime;
      width = norm.width;
      height = norm.height;
    }

    const ext =
      finalMime === "image/jpeg" ? "jpg" :
      finalMime === "image/png"  ? "png" :
      finalMime === "image/webp" ? "webp" : sniff.ext;

    const obj = `${id}.${ext}`;
    const abs = path.join(dir, obj);
    await fs.writeFile(abs, finalBuf);

    let previewUrl = "";
    if (finalMime.startsWith("image/")) {
      const pName = `${id}.preview.webp`;
      const pAbs = path.join(dir, pName);
      const pBuf = await toPreviewWebp(finalBuf, 480, 82);
      await fs.writeFile(pAbs, pBuf);
      previewUrl = path.posix.join(PUBLIC_BASE, day, pName);
    }

    const url = path.posix.join(PUBLIC_BASE, day, obj);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    return res.json({
      id,
      url,
      mime: finalMime,
      size: finalBuf.length,
      width,
      height,
      hasPreview: Boolean(previewUrl),
      previewUrl,
    });
  } catch (e: any) {
    console.error("[uploads] error", e);
    return sendError(res, 500, "UPLOAD_FAILED", e?.message || "Upload failed");
  }
});
