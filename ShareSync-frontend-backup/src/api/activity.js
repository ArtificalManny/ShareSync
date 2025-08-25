// src/api/activity.js
import api from './client';

/**
 * List activity with filters.
 * @param {{ scope:'user'|'project'|'global', userId?:string, projectId?:string, type?:string|string[], range?:'24h'|'7d'|'30d'|'all', cursor?:string, limit?:number }} params
 */
export async function getActivity(params) {
  const { data } = await api.get('/activities', { params });
  return data;
}

/** Download CSV export using same filters */
export async function exportActivity(params = {}) {
  const res = await api.get('/activities/export.csv', { params, responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'activity_export.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}
