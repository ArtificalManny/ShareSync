// src/utils/constants.ts
// Updated for Vite (import.meta.env). Removes legacy REACT_APP_* usage.

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5050").replace(/\/$/, "");
export const SOCKET_URL = (import.meta.env.VITE_WS_URL || API_URL).replace(/\/$/, "");

