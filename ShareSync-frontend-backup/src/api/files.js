// src/api/files.js
import client from './client';

/**
 * Link one or more already-uploaded files to a project.
 * Each file: { url, thumbUrl?, name, size, mime, moderationStatus? }
 */
export async function linkFilesToProject(projectId, files) {
  if (!projectId) throw new Error('projectId is required');
  const payload = Array.isArray(files)
    ? { projectId, files }
    : { projectId, file: files };
  const { data } = await client.post('/files', payload);
  return data;
}

/** List files for a project (role ≥ viewer) */
export async function listFiles(projectId) {
  if (!projectId) throw new Error('projectId is required');
  const { data } = await client.get(`/files/by-project/${projectId}`);
  // API returns an array already
  return Array.isArray(data) ? data : [];
}

/** Delete a file (role ≥ member) */
export async function deleteFile(fileId) {
  if (!fileId) throw new Error('fileId is required');
  const { data } = await client.delete(`/files/${fileId}`);
  return data; // { ok: true }
}
