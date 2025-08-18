// /src/api/user.js
import client from './client';

/** GET the current user */
export async function getMe() {
  const { data } = await client.get('/user/me'); // matches your existing usage elsewhere
  return data;
}

/** PATCH profile + visibility + appearance settings */
export async function updateProfile(payload) {
  // e.g. { displayName, visibility, appearance: 'light'|'dark'|'system' }
  const { data } = await client.patch('/user/me', payload);
  return data;
}

/** PATCH notification preferences */
export async function updateNotifications(payload) {
  // e.g. { email: true, push: false, weeklyReport: true }
  const { data } = await client.patch('/user/me/notifications', payload);
  return data;
}

// (optional) default export bundle
export default {
  getMe,
  updateProfile,
  updateNotifications,
};
