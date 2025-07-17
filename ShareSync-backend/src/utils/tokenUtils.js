// src/utils/tokenUtils.js

export const getAccessToken = () => localStorage.getItem('access_token');
export const setTokens = (accessToken, refreshToken, userData) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('user', JSON.stringify(userData));
};
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export function getAccessToken() {
  return localStorage.getItem('access_token');
}
