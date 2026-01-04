import React, { useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import TrustBadge from '../trust/TrustBadge';

const FileUploadZone = ({ onFilesSelected, maxFiles = 5, acceptedTypes = '*' }) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [files, setFiles] = React.useState([]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).slice(0, maxFiles - files.length);
    setFiles(prev => [...prev, ...newFiles]);
    onFilesSelected?.(newFiles);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all
          ${dragActive
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-slate-700 bg-slate-900/50 hover:border-purple-500/50'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        
        <h3 className="text-lg font-bold text-white mb-2">
          Drop files here or click to upload
        </h3>
        
        <p className="text-sm text-slate-400 mb-4">
          Up to {maxFiles} files, any format
        </p>

        {/* ⭐ WEEK 7: Trust Badge */}
        <div className="flex justify-center">
          <TrustBadge type="file-encrypted" size="sm" />
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white">Selected Files:</h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50"
            >
              <FileText className="w-5 h-5 text-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
