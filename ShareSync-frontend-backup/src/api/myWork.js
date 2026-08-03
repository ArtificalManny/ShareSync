import client from './client';

export async function getMyWork() {
  const response = await client.get('/my-work');

  /*
   * Support both shared-client response conventions:
   *
   * Axios response:
   *   { data: { success: true, data: MyWorkPayload } }
   *
   * Already-unwrapped response body:
   *   { success: true, data: MyWorkPayload }
   */
  const body = response?.data ?? response;
  const payload = body?.data ?? body;

  return {
    generatedAt: payload?.generatedAt || null,
    projects: Array.isArray(payload?.projects)
      ? payload.projects
      : [],
    summary: payload?.summary || {},
    items: Array.isArray(payload?.items)
      ? payload.items
      : [],
  };
}
