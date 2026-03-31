// src/api/settings.js
import client from './client';

export async function getSettings() {
  // Pointing to the correct NestJS UserController endpoint
  const res = await client.get('/users/me/settings');
  return res.data;
}

export async function updateSettings(payload) {
  // Pointing to the correct NestJS UserController endpoint
  const res = await client.put('/users/me/settings', payload);
  return res.data;
}
