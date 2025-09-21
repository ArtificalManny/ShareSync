// Minimal stub. Most modern browsers + createImageBitmap handle EXIF orientation.
// Keep this here if you later want to add explicit EXIF parsing.
export type Orientation = 1|2|3|4|5|6|7|8;

export async function readExifOrientation(_blob: Blob): Promise<Orientation> {
  return 1; // default (no rotation)
}
