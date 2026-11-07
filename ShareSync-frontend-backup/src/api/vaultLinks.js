// src/api/vaultLinks.js
// openshare-vault-private-links-v1
//
// Vault files open through short-lived links the backend hands out after checking
// that the viewer may see the file. Never open a Vault file's stored fileUrl: for
// files in private storage it is only a placeholder, and older public links stop
// working once files are migrated to private storage.

import { useCallback, useEffect, useState } from 'react';
import client from './client';
import { toast } from '../components/ui/toast';

const MAX_IDS_PER_REQUEST = 100;

// Reuse a thumbnail link until shortly before it expires.
const LINK_REUSE_MARGIN_MS = 30 * 1000;

function apiOrigin() {
  return String(client?.defaults?.baseURL || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');
}

// Absolute links are used as given. Older files stored on the backend's own disk
// come back as /uploads/... and are resolved against the API origin. Anything else
// (including the private-storage placeholder) is never treated as a link.
export function resolveVaultLinkUrl(rawUrl) {
  const value = String(rawUrl || '').trim();

  if (!value) return '';

  if (/^https?:\/\//i.test(value)) return value;

  const origin = apiOrigin();

  if (value.startsWith('/uploads/')) {
    return origin ? `${origin}${value}` : value;
  }

  if (value.startsWith('uploads/')) {
    return origin ? `${origin}/${value}` : `/${value}`;
  }

  return '';
}

export async function getVaultFileLink(fileId, { download = false } = {}) {
  const id = String(fileId || '').trim();

  if (!id) {
    throw new Error('File ID is required');
  }

  const response = await client.get(
    `/vault/files/${encodeURIComponent(id)}/link`,
    download ? { params: { download: 1 } } : undefined
  );

  const data = response?.data?.data || {};
  const url = resolveVaultLinkUrl(data.url);

  if (!url) {
    throw new Error('No link was returned for this file');
  }

  return { ...data, url };
}

// Links for many files at once (thumbnails). Files the viewer may not see are
// simply missing from the result.
export async function getVaultFileLinks(fileIds) {
  const ids = Array.from(
    new Set(
      (Array.isArray(fileIds) ? fileIds : [])
        .map((id) => String(id || '').trim())
        .filter(Boolean)
    )
  );

  const links = new Map();

  for (let start = 0; start < ids.length; start += MAX_IDS_PER_REQUEST) {
    const chunk = ids.slice(start, start + MAX_IDS_PER_REQUEST);
    const response = await client.post('/vault/files/links', { fileIds: chunk });
    const items = Array.isArray(response?.data?.data?.links)
      ? response.data.data.links
      : [];

    for (const item of items) {
      const id = String(item?.fileId || '');
      const url = resolveVaultLinkUrl(item?.url);

      if (id && url && chunk.includes(id)) {
        links.set(id, { ...item, url });
      }
    }
  }

  return links;
}

function describeOpenError(error) {
  const status = error?.response?.status;

  if (status === 403 || status === 404) {
    return {
      title: "You don't have access to this file",
      variant: 'error',
    };
  }

  return {
    title: "This file couldn't be opened",
    description: 'Please try again.',
    variant: 'error',
  };
}

// Open (or download) a Vault file. The new tab is opened inside the click itself so
// the browser's popup blocker allows it, then sent to the fresh link once the
// backend has checked access.
export async function openVaultFile(fileId, { download = false } = {}) {
  let tab = null;

  try {
    tab = window.open('', '_blank');
  } catch {
    tab = null;
  }

  if (tab) {
    try {
      tab.opener = null;
    } catch {
      // ignore
    }
  }

  try {
    const link = await getVaultFileLink(fileId, { download });

    if (tab && !tab.closed) {
      tab.location.replace(link.url);
    } else {
      window.location.assign(link.url);
    }

    return true;
  } catch (error) {
    if (tab && !tab.closed) {
      try {
        tab.close();
      } catch {
        // ignore
      }
    }

    try {
      toast?.(describeOpenError(error));
    } catch {
      // ignore
    }

    return false;
  }
}

// Thumbnails: requests made at the same moment are combined into one batch call.
const thumbnailCache = new Map();
let pendingThumbnailIds = new Set();
let pendingThumbnailWaiters = [];
let thumbnailFlushTimer = null;

function cachedThumbnailUrl(fileId) {
  const hit = thumbnailCache.get(fileId);

  if (!hit) return '';

  if (!hit.expiresAtMs || hit.expiresAtMs - LINK_REUSE_MARGIN_MS > Date.now()) {
    return hit.url;
  }

  thumbnailCache.delete(fileId);
  return '';
}

async function flushThumbnailRequests() {
  const ids = Array.from(pendingThumbnailIds);
  const waiters = pendingThumbnailWaiters;

  pendingThumbnailIds = new Set();
  pendingThumbnailWaiters = [];
  thumbnailFlushTimer = null;

  let links = new Map();

  try {
    links = await getVaultFileLinks(ids);
  } catch {
    links = new Map();
  }

  for (const [id, link] of links) {
    const expiresAtMs = link?.expiresAt ? Date.parse(link.expiresAt) : 0;

    thumbnailCache.set(id, {
      url: link.url,
      expiresAtMs: Number.isFinite(expiresAtMs) ? expiresAtMs : 0,
    });
  }

  for (const { fileId, resolve } of waiters) {
    resolve(links.get(fileId)?.url || '');
  }
}

export function fetchVaultThumbnailUrl(fileId, { fresh = false } = {}) {
  const id = String(fileId || '').trim();

  if (!id) return Promise.resolve('');

  if (fresh) {
    thumbnailCache.delete(id);
  } else {
    const hit = cachedThumbnailUrl(id);
    if (hit) return Promise.resolve(hit);
  }

  return new Promise((resolve) => {
    pendingThumbnailIds.add(id);
    pendingThumbnailWaiters.push({ fileId: id, resolve });

    if (!thumbnailFlushTimer) {
      thumbnailFlushTimer = setTimeout(flushThumbnailRequests, 0);
    }
  });
}

export function useVaultThumbnailUrl(fileId, { enabled = true } = {}) {
  const id = String(fileId || '').trim();
  const [state, setState] = useState({ url: '', retried: false });

  useEffect(() => {
    if (!enabled || !id) {
      setState({ url: '', retried: false });
      return undefined;
    }

    let active = true;

    fetchVaultThumbnailUrl(id).then((url) => {
      if (active) setState({ url, retried: false });
    });

    return () => {
      active = false;
    };
  }, [id, enabled]);

  // After an <img> fails (for example a link that expired before a lazy image
  // loaded), fetch one fresh link. A second failure is left to the caller.
  const retry = useCallback(() => {
    if (!enabled || !id) return;

    fetchVaultThumbnailUrl(id, { fresh: true }).then((url) => {
      setState({ url, retried: true });
    });
  }, [id, enabled]);

  return { url: state.url, retried: state.retried, retry };
}
