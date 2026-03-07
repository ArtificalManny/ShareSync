import client from './client';

/**
 * Sends a chat prompt to the AI Coach
 * @param {Object} payload - { prompt: string, projectId?: string, scope?: string, items?: any[] }
 */
export async function askAiChat(payload) {
  const res = await client.post('/ai/chat', payload);
  return res.data; // { text: "AI response here..." }
}

/**
 * Fetches a single, context-aware productivity suggestion
 */
export async function getAiSuggestion() {
  const res = await client.get('/ai/suggestion');
  return res.data; // { suggestion: "Your suggestion here..." }
}

export default { askAiChat, getAiSuggestion };
