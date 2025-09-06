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
  // service returns { items, nextCursor }
  const items = Array.isArray(data?.items) ? data.items : [];
  return { items, nextCursor: data?.nextCursor || null };
}

/**
 * POST /projects/:projectId/files
 * Link one or many already-uploaded files (use server’s shape).
 *
 * Each file should include, at minimum:
 *  - storageKey (required)
 *  - url? / thumbKey? / thumbUrl?
 *  - name, size, mime, kind?
 *  - status? ('pending'|'approved'|'blocked')
 *  - moderation? ({ reason?, tags? })
 *
 * Accepts either a single object or an array.
 * Returns created doc(s).
 */
export async function createFiles(projectId, files) {
  if (!projectId) throw new Error('projectId is required');
  if (!files) throw new Error('files payload is required');

  const norm = (f) => ({
    storageKey: f.storageKey,            // required
    url: f.url,
    thumbKey: f.thumbKey,
    thumbUrl: f.thumbUrl,
    name: f.name,
    size: f.size,
    mime: f.mime,
    kind: f.kind,                        // 'image' | 'video' | 'doc' | 'audio' | 'other'
    status: f.status,                    // optional
    moderation: f.moderation,            // optional
  });

  const payload = Array.isArray(files)
    ? { files: files.map(norm) }
    : { file: norm(files) };

  const { data } = await client.post(`/projects/${projectId}/files`, payload);
  return data; // array or object depending on input
}

/**
 * DELETE /projects/:projectId/files/:fileId
 * Owner-only by default (guarded by @CanManageProject)
 */
export async function deleteFile(projectId, fileId) {
  if (!projectId) throw new Error('projectId is required');
  if (!fileId) throw new Error('fileId is required');
  const { data } = await client.delete(`/projects/${projectId}/files/${fileId}`);
  return data; // { ok: true }
}
