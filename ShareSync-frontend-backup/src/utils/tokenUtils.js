// /src/utils/tokenUtils.js
// openshare-persistent-session-frontend-v1
// Canonical persistent auth storage with legacy compatibility aliases.

const ACCESS_TOKEN_KEYS = [
  'access_token',
  'ss.jwt',
  'token',
  'authToken',
  'accessToken',
];

export const getAccessToken = () => {
  try {
    for (const key of ACCESS_TOKEN_KEYS) {
      const token = localStorage.getItem(key);
      if (token) return token;
    }
  } catch {}

  return '';
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem('refresh_token') || '';
  } catch {
    return '';
  }
};

export const setTokens = (accessToken, refreshToken, userData) => {
  try {
    if (accessToken) {
      for (const key of ACCESS_TOKEN_KEYS) {
        localStorage.setItem(key, accessToken);
      }
    }

    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    if (userData) {
      const serialized = JSON.stringify(userData);
      localStorage.setItem('user', serialized);
      localStorage.setItem('ss.user', serialized);
    }
  } catch {}
};

export const clearTokens = () => {
  try {
    for (const key of ACCESS_TOKEN_KEYS) {
      localStorage.removeItem(key);
    }

    localStorage.removeItem('ss.token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('ss.user');
  } catch {}
};
