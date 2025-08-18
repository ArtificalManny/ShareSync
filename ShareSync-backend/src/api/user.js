// /src/api/users.js
import client from './client';

// Load the current user (you already use /user/me elsewhere)
export async function getMe() {
  const { data } = await client.get('/user/me');
  return data;
}

// Update profile-ish things (publicProfile, appearance/theme, display name, etc)
export async function updateProfile(payload) {
  // matches your existing controller mapping: /api/api/users/profile (PUT)
  const { data } = await client.put('/api/users/profile', payload);
  return data;
}

// Update notification prefs
export async function updateNotifications(payload) {
  // matches: /api/api/users/notifications (PUT)
  const { data } = await client.put('/api/users/notifications', payload);
  return data;
}
