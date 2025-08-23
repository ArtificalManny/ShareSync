// /src/api/user.js
import client from './client';

// Me
export async function getMe() {
  const { data } = await client.get('/users/me'); // -> /api/users/me
  return data;
}

// Public profile
export async function getPublicUser(username) {
  const { data } = await client.get(`/users/public/${encodeURIComponent(username)}`);
  return data;
}

// PATCH profile
export async function updateProfile(patch) {
  const { data } = await client.patch('/users/me', patch);
  return data;
}

// PATCH notifications
export async function updateNotifications(patch) {
  const { data } = await client.patch('/users/me/notifications', patch);
  return data;
}
