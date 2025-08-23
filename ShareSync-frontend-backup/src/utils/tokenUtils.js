// /src/utils/tokenUtils.js

// Single source of truth for tokens + user
export const getAccessToken = () => {
  try {
    return localStorage.getItem('access_token') || '';
  } catch {
    return '';
  }
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
    if (accessToken) localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    if (userData) localStorage.setItem('user', JSON.stringify(userData));
  } catch {}
};

export const clearTokens = () => {
  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  } catch {}
};
