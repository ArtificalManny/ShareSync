// src/utils/formatProfilePicture.js
export default function formatProfilePicture(src) {
  if (!src) return '/default-profile.png';
  try {
    const v = window.__SS_AVATAR_VERSION__ || 0;
    const hasQ = src.includes('?');
    return `${src}${hasQ ? '&' : '?'}v=${v}`;
  } catch {
    return src;
  }
}
