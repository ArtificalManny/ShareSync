export default function formatProfilePicture(path) {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return `http://localhost:3000/${path}`;
  }
  