const path = require('path');
const fs = require('fs').promises;

const ROOT = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const AVATARS_DIR = path.join(ROOT, 'avatars');

// Ensure upload dirs exist
async function ensureDirs() {
  await fs.mkdir(AVATARS_DIR, { recursive: true });
}

function extFromMime(mime = '') {
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'png';
}

/**
 * Save avatar buffer to disk (or adapt to S3, etc.)
 * Returns: { url, filePath }
 */
exports.saveAvatarBuffer = async function saveAvatarBuffer(userId, buffer, mimetype) {
  await ensureDirs();

  const ext = extFromMime(mimetype);
  const fileName = `${String(userId)}-${Date.now()}.${ext}`;
  const filePath = path.join(AVATARS_DIR, fileName);

  await fs.writeFile(filePath, buffer);

  // Public URL path — ensure your server serves `uploads/` statically
  const urlBase = process.env.UPLOADS_PUBLIC_BASE || '/uploads';
  const url = `${urlBase}/avatars/${fileName}`;

  return { url, filePath };
};
