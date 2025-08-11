// /src/api/invite.js
import axios from 'axios';
import { getAccessToken } from '../utils/tokenUtils'; // adjust if yours lives elsewhere

export async function sendInvite({ email, message, inviterId, projectId }) {
  const token = getAccessToken?.();
  const res = await axios.post(
    '/api/invites/send',
    { email, message, inviterId, projectId },
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );
  return res.data; // { ok, inviteId, token }
}
