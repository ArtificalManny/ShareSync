/**
 * Fetch helper used by some legacy modules (WelcomeBack / Context, etc.)
 * Makes sure requests always hit the correct backend route whether:
 * - VITE_API_URL = "http://localhost:5050"
 * - VITE_API_URL = "http://localhost:5050/api"
 */

function getApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  const base = (envUrl && typeof envUrl === "string" ? envUrl : "").replace(/\/+$/, "");
  return base || window.location.origin;
}

function baseHasApiSuffix(base) {
  return /\/api$/.test(String(base || ""));
}

function withApiPrefix(path) {
  const base = getApiBase();
  const needsApi = !baseHasApiSuffix(base);
  if (!path.startsWith("/")) path = `/${path}`;

  // If base is missing /api, add it.
  if (needsApi) {
    return path.startsWith("/api") ? path : `/api${path}`;
  }

  // If base already has /api, avoid "/api/api"
  return path.replace(/^\/api/, "");
}

function getToken() {
  try {
    return (
      localStorage.getItem("ss.jwt") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  } catch {
    return "";
  }
}

export async function apiRequest(path, options = {}) {
  const base = getApiBase();
  const url = `${base}${withApiPrefix(path)}`;

  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });

  // Try to parse JSON, fall back to text
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export default apiRequest;
