// src/api/files.js
import client from './client';

/**
 * Link one or more already-uploaded files to a project.
 * Backend route: POST /projects/:projectId/files
 *
 * Each file: { url, thumbUrl?, name, size, mime, moderationStatus? }
 */
export async function linkFilesToProject(projectId, files) {
  if (!projectId) throw new Error('projectId is required');

  // New controller reads projectId from the URL param, not from the body.
  const payload = Array.isArray(files) ? { files } : { file: files };

  const { data } = await client.post(`/projects/${projectId}/files`, payload);
  return data; // service returns created doc(s)
}

/** List files for a project (role ≥ viewer)
 * Backend route: GET /projects/:projectId/files
 */
export async function listFiles(projectId) {
  if (!projectId) throw new Error('projectId is required');
  const { data } = await client.get(`/projects/${projectId}/files`);
  return Array.isArray(data) ? data : [];
}

/** Delete a file (role = owner)
 * Backend route: DELETE /projects/:projectId/files/:fileId
 */
export async function deleteFile(projectId, fileId) {
  if (!projectId) throw new Error('projectId is required');
  if (!fileId) throw new Error('fileId is required');
  const { data } = await client.delete(`/projects/${projectId}/files/${fileId}`);
  return data; // { ok: true }
}