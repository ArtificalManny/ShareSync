// activation-funnel-api-v1
import client from './client';

export async function touchActivation() {
  const response = await client.post(
    '/analytics/activation/touch',
  );

  return response?.data || null;
}
