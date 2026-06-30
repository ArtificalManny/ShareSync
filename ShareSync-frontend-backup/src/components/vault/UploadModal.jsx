import React, { useState, useRef } from 'react';
import { X, UploadCloud, File, AlertCircle } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUpload, folders = [] }) {
  const [file, setFile] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) return;

    setIsUploading(true);
    await onUpload(file, selectedFolderId === 'root' ? null : selectedFolderId);
    setIsUploading(false);
    setFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 dark:bg-black/65 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <style>
        {`
          .upload-modal-submit-button {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 Available) !important;
            color: #ffffff !important;
            border: 1px solid rgba(124, 58, 237, 0.92) !important;
            box-shadow: 0 14px 32px rgba(109, 40, 217, 0.34) !important;
            opacity: 1 !important;
          }

          .upload-modal-submit-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 Available) !important;
            box-shadow: 0 18px 40px rgba(109, 40, 217, 0.46) !important;
            transform: translateY(-1px);
          }

          .upload-modal-submit-button:disabled {
            background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed Available) !important;
            color: #ffffff !important;
            opacity: 0.88 !important;
            cursor: not-allowed !important;
            box-shadow: 0 10px 24px rgba(109, 40, 217, 0.22) !important;
          }

          .upload-modal-submit-button,
          .upload-modal-submit-button span,
          .upload-modal-submit-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }
        `}
      </style>
      <div
        className="
          relative w-full max-w-md overflow-hidden rounded-3xl
          border border-violet-200/70 dark:border-white/[0.08]
          bg-white/95 dark:bg-[#101014]/95
          shadow-2xl shadow-violet-900/10 dark:shadow-black/40
        "
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />
        <div className="pointer-events-none absolute -top-24 right-8 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex justify-between items-center px-6 py-4 border-b border-slate-200/70 dark:border-white/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
              Upload File
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              Add assets to this project vault.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              h-9 w-9 rounded-xl
              text-slate-500 hover:text-slate-900 hover:bg-slate-100
              dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]
              transition-colors
              flex items-center justify-center
            "
            aria-label="Close upload modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative p-6 space-y-6">
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-8
                flex flex-col items-center justify-center text-center cursor-pointer
                transition-all duration-200
                ${
                  isDragging
                    ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_0_6px_rgba(139,92,246,0.10)]'
                    : 'border-violet-200 bg-violet-50/60 hover:border-violet-400 hover:bg-violet-50 dark:border-white/[0.10] dark:bg-white/[0.03] dark:hover:border-violet-400/70 dark:hover:bg-violet-500/10'
                }
              `}
            >
              <div
                className={`
                  mb-4 h-14 w-14 rounded-2xl
                  flex items-center justify-center
                  transition-colors
                  ${
                    isDragging
                      ? 'bg-violet-600 text-white'
                      : 'bg-white text-violet-600 shadow-sm shadow-violet-900/10 dark:bg-white/[0.06] dark:text-violet-300'
                  }
                `}
              >
                <UploadCloud className="w-7 h-7" />
              </div>

              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Click to upload or drag and drop
              </p>

              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Max file size: 50MB
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08]">
              <div className="w-11 h-11 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <File className="w-5 h-5 text-violet-600 dark:text-violet-300" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                className="
                  h-8 w-8 rounded-lg
                  text-slate-500 hover:text-slate-900 hover:bg-slate-100
                  dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.08]
                  transition-colors
                  flex items-center justify-center
                "
                aria-label="Remove selected file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-200 mb-2">
              Destination Folder
            </label>

            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="
                w-full rounded-2xl px-4 py-3
                bg-white dark:bg-white/[0.04]
                border border-slate-200 dark:border-white/[0.08]
                text-slate-900 dark:text-white text-sm
                outline-none appearance-none
                focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10
                transition-all
              "
            >
              <option value="root">Project Root (No Folder)</option>
              {folders.map((f) => (
                <option key={f._id || f.id} value={f._id || f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                px-4 py-2.5 rounded-xl
                text-sm font-semibold
                text-slate-600 hover:text-slate-950 hover:bg-slate-100
                dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/[0.06]
                transition-colors
              "
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || !file}
              className="
                upload-modal-submit-button
                relative isolate overflow-hidden
                px-6 py-2.5 rounded-xl
                text-sm font-black text-white
                transition-all
                flex items-center gap-2
                disabled:cursor-not-allowed disabled:opacity-100
              "
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  background: file
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 Available)'
                    : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed Available)',
                  boxShadow: file
                    ? '0 14px 32px rgba(109, 40, 217, 0.34)'
                    : '0 10px 24px rgba(109, 40, 217, 0.22)',
                }}
              />

              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl border border-violet-200/90"
              />

              {isUploading ? (
                <div className="relative z-10 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UploadCloud className="relative z-10 w-4 h-4 text-white" />
              )}

              <span className="relative z-10 text-white drop-shadow-sm">
                {isUploading ? 'Uploading...' : 'Upload'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
