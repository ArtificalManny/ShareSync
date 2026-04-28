// src/pages/profile/PublicProfile.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC PROFILE ROUTE BRIDGE
//
// /profile/:username is mounted through App.jsx using this file.
// The real API-driven public profile implementation lives at:
//   src/pages/public/PublicProfile.jsx
//
// Keep this wrapper so existing imports/routes remain stable.
// ═══════════════════════════════════════════════════════════════════════════════

import PublicProfile from "../public/PublicProfile.jsx";

export default PublicProfile;
