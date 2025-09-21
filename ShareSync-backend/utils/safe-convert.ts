// /ShareSync-backend/utils/safe-convert.ts
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";

export type Sniff = { mime: string; ext: string };

export async function sniffMime(buf: Buffer): Promise<Sniff> {
  const ft = await fileTypeFromBuffer(buf);
  return {
    mime: ft?.mime || "application/octet-stream",
    ext: ft?.ext || "bin",
  };
}

/**
 * Normalize an image buffer:
 * - auto-orient via EXIF
 * - strip metadata
 * - encode to target (jpeg/png/webp)
 */
export async function normalizeImageBuffer(
  buf: Buffer,
  target?: "jpeg" | "png" | "webp"
): Promise<{ buffer: Buffer; mime: string; width: number; height: number }> {
  const s = sharp(buf, { failOn: "none" }).rotate();
  const meta = await s.metadata();
  let out = s;

  switch (target) {
    case "jpeg": out = out.jpeg({ mozjpeg: true, quality: 84 }); break;
    case "png":  out = out.png({ compressionLevel: 9 }); break;
    case "webp":
    default:     out = out.webp({ quality: 84 }); break;
  }

  const buffer = await out.toBuffer();
  const mime =
    target === "jpeg" ? "image/jpeg" :
    target === "png"  ? "image/png"  :
                        "image/webp";

  return { buffer, mime, width: meta.width || 0, height: meta.height || 0 };
}

export async function toPreviewWebp(buf: Buffer, width = 480, quality = 82) {
  return sharp(buf).resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
}
