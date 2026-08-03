import { http } from './http';

export async function getMyWork() {
  const response = await http.get('/my-work');

  return response?.data?.data || {
    generatedAt: null,
    projects: [],
    summary: {},
    items: [],
  };
}
