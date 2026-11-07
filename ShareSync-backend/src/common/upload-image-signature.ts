// src/common/upload-image-signature.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Detects real raster-image types by magic bytes, so upload routes do not have to
// trust the client-declared Content-Type. Covers the accepted avatar set:
// jpeg, png, gif, webp, avif, bmp, tiff. Returns null for anything else —
// including SVG, which is XML text with no reliable binary signature.
// ═══════════════════════════════════════════════════════════════════════════════
import { open } from 'node:fs/promises';

/**
 * Identify a raster image from its leading bytes. Returns the detected MIME, or
 * null when the bytes are not one of the recognized raster-image formats.
 */
export function detectImageSignature(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 12) return null;
  const b = buffer;

  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) return 'image/png';

  // GIF: "GIF87a" / "GIF89a"
  const head6 = b.subarray(0, 6).toString('ascii');
  if (head6 === 'GIF87a' || head6 === 'GIF89a') return 'image/gif';

  // WEBP: "RIFF" .... "WEBP"
  if (
    b.subarray(0, 4).toString('ascii') === 'RIFF' &&
    b.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'image/webp';

  // BMP: "BM"
  if (b[0] === 0x42 && b[1] === 0x4d) return 'image/bmp';

  // TIFF: "II*\0" (little-endian) or "MM\0*" (big-endian)
  if (
    (b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00) ||
    (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a)
  ) return 'image/tiff';

  // AVIF: ISO-BMFF "ftyp" box at offset 4 with an avif brand.
  if (b.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = b.subarray(8, 24).toString('ascii');
    if (brand.includes('avif') || brand.includes('avis')) return 'image/avif';
  }

  return null;
}

/**
 * Read only the header of an on-disk upload and detect its real image type.
 * Returns the detected MIME, or null when the file is unreadable or is not a
 * recognized raster image. Reads at most 32 bytes — it never loads the whole file.
 */
export async function detectUploadImageSignature(
  filePath: string,
): Promise<string | null> {
  if (!filePath) return null;
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(filePath, 'r');
    const header = Buffer.alloc(32);
    const { bytesRead } = await handle.read(header, 0, 32, 0);
    return detectImageSignature(header.subarray(0, bytesRead));
  } catch {
    return null;
  } finally {
    if (handle) {
      try {
        await handle.close();
      } catch {
        // ignore close errors
      }
    }
  }
}

// Normal file extensions (without the dot) for each detected image type.
// The first entry is the canonical one.
const IMAGE_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg', 'jpe', 'jfif'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
  'image/avif': ['avif'],
  'image/bmp': ['bmp'],
  'image/tiff': ['tif', 'tiff'],
};

/** True when a file extension (with or without the dot) is normal for the detected image type. */
export function imageExtensionMatches(ext: string, mime: string): boolean {
  const list = IMAGE_EXTENSIONS[mime];
  return !!list && list.includes(String(ext || '').replace(/^\./, '').toLowerCase());
}

/** The canonical file extension (without the dot) for a detected image type, or null. */
export function canonicalImageExtension(mime: string): string | null {
  const list = IMAGE_EXTENSIONS[mime];
  return list ? list[0] : null;
}
