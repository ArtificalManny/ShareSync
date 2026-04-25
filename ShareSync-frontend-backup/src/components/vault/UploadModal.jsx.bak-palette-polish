import React, { useState, useRef } from 'react';
import { X, UploadCloud, File, AlertCircle } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUpload, folders = [] }) {
  const [file, setFile] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.04]">
          <h2 className="text-sm font-medium text-text-primary">Upload File</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {!file ? (
            <div 
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                isDragging ? 'border-brand-500 bg-brand-500/5' : 'border-white/[0.1] hover:border-brand-500/50 hover:bg-surface-2'
              }`}
            >
              <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? 'text-brand-400' : 'text-text-tertiary'}`} />
              <p className="text-sm font-medium text-text-primary mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-text-tertiary">Max file size: 50MB</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-2 border border-white/[0.04]">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                <File className="w-5 h-5 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                <p className="text-xs text-text-tertiary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => setFile(null)} className="p-1 hover:bg-white/[0.1] rounded transition-colors text-text-tertiary">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Destination Folder</label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand-500 appearance-none"
            >
              <option value="root">Project Root (No Folder)</option>
              {folders.map(f => (
                <option key={f._id || f.id} value={f._id || f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
            <button 
              onClick={handleSubmit} 
              disabled={isUploading || !file}
              className="px-6 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
