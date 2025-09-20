import client from './client';

/**
 * GET /projects/:projectId/files
 * Supports cursor pagination.
 * Returns { items, nextCursor }
 */
export async function listFiles(projectId, { cursor = null, limit = 20 } = {}) {
  if (!projectId) throw new Error('projectId is required');
  const { data } = await client.get(`/projects/${projectId}/files`, {
    params: {
      cursor: cursor || undefined,
      limit: Number(limit) || undefined,
    },
  });
  const items = Array.isArray(data?.items) ? data.items : [];
  return { items, nextCursor: data?.nextCursor || null };
}

/**
 * POST /projects/:projectId/files
 * Link one or many already-uploaded files (use server’s shape).
 *
 * Accepts either a single object or an array. Flexible keys:
 *  - key|storageKey (required)
 *  - url, thumbUrl|thumbKey
 *  - name, size, type|mime, kind
 *  - status, moderation
 *
 * Returns created doc(s).
 */
export async function createFiles(projectId, files) {
  if (!projectId) throw new Error('projectId is required');
  if (!files) throw new Error('files payload is required');

  const norm = (f) => ({
    storageKey: f.storageKey || f.key,   // required
    url: f.url,
    thumbKey: f.thumbKey,
    thumbUrl: f.thumbUrl,
    name: f.name,
    size: f.size,
    mime: f.mime || f.type,
    kind: f.kind,                        // 'image' | 'video' | 'doc' | 'audio' | 'archive' | 'other'
    status: f.status,
    moderation: f.moderation,
  });

  const payload = Array.isArray(files)
    ? { files: files.map(norm) }
    : { file: norm(files) };

  const { data } = await client.post(`/projects/${projectId}/files`, payload);
  return data; // array or object depending on input
}

/**
 * DELETE /projects/:projectId/files/:fileId
 */
export async function deleteFile(projectId, fileId) {
  if (!projectId) throw new Error('projectId is required');
  if (!fileId) throw new Error('fileId is required');
  const { data } = await client.delete(`/projects/${projectId}/files/${fileId}`);
  return data; // { ok: true }
}

export default { listFiles, createFiles, deleteFile };
