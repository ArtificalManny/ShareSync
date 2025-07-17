// src/api/user.js
import client from './client';

export const updateLoginActivity = async () => {
  try {
    const res = await client.post('/users/login-activity');
    return res.data;
  } catch (err) {
    console.error('[updateLoginActivity] Failed:', err);
    return null;
  }
};