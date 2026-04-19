// src/api/settings.js
import client from './client';

export async function getSettings() {
  const res = await client.get('/users/me/settings');
  // Extract the nested data object so Settings.jsx can read fields directly
  return res.data?.data || res.data;
}

export async function updateSettings(payload) {
  const res = await client.put('/users/me/settings', payload);
  return res.data?.data || res.data;
}
