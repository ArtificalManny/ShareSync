import client from './client';

/**
 * Sends a chat prompt to the AI Coach
 * Automatically includes mentor tone from saved settings
 * @param {Object} payload - { prompt: string, projectId?: string, scope?: string, items?: any[] }
 */
export async function askAiChat(payload) {
  // Read mentor tone from localStorage settings cache
  let mentorTone = '';
  try {
    const raw = localStorage.getItem('ss.settings');
    if (raw) {
      const settings = JSON.parse(raw);
      mentorTone = settings?.mentor?.tone || '';
    }
  } catch (_) {}

  const res = await client.post('/ai/chat', {
    ...payload,
    mentorTone,
  });
  return res.data;
}

/**
 * Fetches a single, context-aware productivity suggestion
 */
export async function getAiSuggestion() {
  const res = await client.get('/ai/suggestion');
  return res.data;
}

export default { askAiChat, getAiSuggestion };
