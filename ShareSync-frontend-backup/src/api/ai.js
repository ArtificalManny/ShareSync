// /src/api/ai.js
import client from './client'

// Posts metrics to backend and returns { suggestion }
export async function fetchAISuggestion(payload) {
  // If your client baseURL isn't '/api', change to '/api/ai/suggestion'
  const { data } = await client.post('/ai/suggestion', payload)
  return data
}
