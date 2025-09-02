// src/components/files/FileGrid.jsx
import React, { useEffect, useState } from 'react';
import FileCard from './FileCard';
import { listFiles, deleteFile } from '../../api/files';

/**
 * Props:
 * - projectId (required)
 * - initialFiles?: array (optional—if you already have some)
 * - canEdit?: boolean   (role ≥ member)
 */
export default function FileGrid({ projectId, initialFiles = [], canEdit = false }) {
  const [files, setFiles] = useState(() => initialFiles);
  const [loading, setLoading] = useState(!initialFiles.length);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    if (!projectId) return;

    setLoading(true);
    setError('');
    listFiles(projectId)
      .then((list) => { if (!ignore) setFiles(Array.isArray(list) ? list : []); })
      .catch((e) => { if (!ignore) setError(e?.message || 'Failed to load files'); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [projectId]);

  const handleRemove = async (id) => {
    const prev = files;
    setFiles((f) => f.filter((x) => x.id !== id));
    try {
      await deleteFile(id);
    } catch (e) {
      // rollback on failure
      setFiles(prev);
      alert(e?.response?.data?.message || e?.message || 'Failed to delete file.');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3">
        {error}
      </div>
    );
  }

  if (!files.length) {
    return <div className="text-sm text-muted">No files yet.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {files.map((f) => (
        <FileCard key={f.id} file={f} onRemove={handleRemove} canEdit={canEdit} />
      ))}
    </div>
  );
}