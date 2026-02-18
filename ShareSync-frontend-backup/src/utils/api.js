/**
 * src/utils/api.js
 * Thin API client used across the app.
 *
 * Exports:
 *  - apiRequest (named) ✅
 *  - default export apiRequest ✅
 */

const DEFAULT_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5050/api';

function getToken() {
  try {
    return localStorage.getItem('authToken') || localStorage.getItem('accessToken') || null;
  } catch {
    return null;
  }
}

export async function apiRequest(path, method = 'GET', body) {
  const url = path.startsWith('http')
    ? path
    : `${DEFAULT_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export default apiRequest;
