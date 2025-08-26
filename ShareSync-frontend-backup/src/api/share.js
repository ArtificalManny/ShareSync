import api from './client';

export async function getPublicProject(token) {
  const { data } = await api.get(`/public/projects/${token}`);
  return data;
}
