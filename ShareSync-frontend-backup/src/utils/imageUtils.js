// src/utils/imageUtils.js
export function formatProfilePicture(path) {
    if (!path || typeof path !== 'string') return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:3000/${path}`;
  }