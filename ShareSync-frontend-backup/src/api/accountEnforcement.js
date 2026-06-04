// src/api/accountEnforcement.js

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5050/api"
).replace(/\/$/, "");

function getToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken")
  );
}

async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${res.status}`;

    const error = new Error(
      Array.isArray(message) ? message.join(", ") : String(message)
    );

    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function getUserEnforcement(userId) {
  return request(`/admin/users/${userId}/enforcement`);
}

export function updateUserAccountStatus(userId, payload) {
  return request(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function warnUser(userId, payload) {
  return request(`/admin/users/${userId}/warn`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function suspendUser(userId, payload) {
  return request(`/admin/users/${userId}/suspend`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function disableUser(userId, payload) {
  return request(`/admin/users/${userId}/disable`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function banUser(userId, payload) {
  return request(`/admin/users/${userId}/ban`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function restoreUser(userId, payload) {
  return request(`/admin/users/${userId}/restore`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
