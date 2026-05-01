import client from './client';

function notifyAiUsageUpdated(detail = {}) {
  if (typeof window === 'undefined') return;

  const payload = {
    source: 'ai',
    resource: 'aiCalls',
    updatedAt: Date.now(),
    ...detail,
  };

  window.dispatchEvent(new CustomEvent('ai:usage-updated', { detail: payload }));
  window.dispatchEvent(new CustomEvent('subscription:refresh', { detail: payload }));
  window.dispatchEvent(new CustomEvent('subscription:changed', { detail: payload }));
  window.dispatchEvent(new CustomEvent('subscription-usage-updated', { detail: payload }));
}

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

  notifyAiUsageUpdated({ endpoint: '/ai/chat' });

  return res.data;
}

/**
 * Fetches a single, context-aware productivity suggestion
 */
export async function getAiSuggestion() {
  const res = await client.get('/ai/suggestion');

  notifyAiUsageUpdated({ endpoint: '/ai/suggestion' });

  return res.data;
}

export default { askAiChat, getAiSuggestion };
