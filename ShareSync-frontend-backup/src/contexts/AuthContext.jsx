// src/contexts/AuthContext.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// COMPAT LAYER — re-export the real AuthContext from /src/context/AuthContext.jsx
// This prevents "useAuth must be used within AuthProvider" when imports differ.
// ═══════════════════════════════════════════════════════════════════════════════

export * from "../context/AuthContext.jsx";
export { default } from "../context/AuthContext.jsx";
