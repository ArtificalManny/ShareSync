import React, { useState, useMemo, useEffect } from 'react';
import {
  Upload, FolderPlus, Search, Grid, List, MoreHorizontal,
  File, FileText, Image, Film, Music, Archive, Code,
  Link2, Download, Star, Eye, ChevronRight, ChevronDown, Folder
} from 'lucide-react';
import { getProjectVault, createFolder, uploadVaultFile } from '../../api/vault';
import CreateFolderModal from '../vault/CreateFolderModal';
import UploadModal from '../vault/UploadModal';
import UpgradeStorageModal from '../vault/UpgradeStorageModal';
import { toast } from '../ui/toast'; // Assuming you have a toast component

const FILE_ICONS = {
  document: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  image: { icon: Image, color: 'text-green-400', bg: 'bg-green-500/10' },
  video: { icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  audio: { icon: Music, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  archive: { icon: Archive, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  code: { icon: Code, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  default: { icon: File, color: 'text-text-tertiary', bg: 'bg-surface-2' },
};

function getFileType(filename) {
  if (!filename) return 'default';
  const ext = filename.split('.').pop()?.toLowerCase();
  const types = {
    document: ['doc', 'docx', 'pdf', 'txt', 'rtf', 'md', 'xlsx', 'xls', 'pptx', 'ppt'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'],
    video: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    audio: ['mp3', 'wav', 'ogg', 'flac'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz'],
    code: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'css', 'html', 'json'],
  };
  for (const [type, exts] of Object.entries(types)) {
    if (exts.includes(ext)) return type;
  }
  return 'default';
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function FileCard({ file }) {
  const fileType = getFileType(file.originalName);
  const style = FILE_ICONS[fileType];
  const Icon = style.icon;
  
  return (
    <div className="group p-4 rounded-xl bg-surface-1 border border-white/[0.06] hover:border-white/[0.12] hover:bg-surface-2 transition-all cursor-pointer">
      <div className={`w-full aspect-square rounded-lg ${style.bg} flex items-center justify-center mb-3 relative overflow-hidden`}>
        <Icon className={`w-10 h-10 ${style.color}`} />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
          <a href={file.fileUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-text-primary text-sm truncate mb-1" title={file.originalName}>{file.originalName}</h4>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span>{formatBytes(file.sizeInBytes)}</span>
          <span>•</span>
          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function FolderSection({ folder, files, viewMode, isExpanded, onToggle }) {
  return (
    <div className="mb-6">
      <button onClick={onToggle} className="flex items-center gap-3 px-2 py-2 w-full hover:bg-surface-1 rounded-lg transition-colors">
        {isExpanded ? <ChevronDown className="w-4 h-4 text-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-text-tertiary" />}
        <Folder className={`w-5 h-5 ${folder.accessLevel === 'private' ? 'text-brand-400' : 'text-warning-400'}`} />
        <span className="font-medium text-text-primary">{folder.name}</span>
        <span className="text-sm text-text-tertiary">({files.length} files)</span>
        {folder.accessLevel === 'private' && <span className="px-2 py-0.5 rounded-md bg-surface-2 text-xs text-text-tertiary ml-2 border border-white/[0.04]">Private</span>}
      </button>
      
      {isExpanded && files.length > 0 && (
        <div className="mt-3 ml-7 grid grid-cols-4 gap-4">
          {files.map(file => <FileCard key={file._id} file={file} />)}
        </div>
      )}
      {isExpanded && files.length === 0 && (
        <div className="mt-3 ml-7 py-4 text-sm text-text-tertiary border-l-2 border-surface-2 pl-4">Folder is empty</div>
      )}
    </div>
  );
}

export default function VaultView({ projectId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ folders: [], files: [], storage: { usedBytes: 0, limitBytes: 5 * 1024 * 1024 * 1024 } });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState([]);
  
  // Modals
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const loadVault = async () => {
    if (!projectId) return;
    try {
      const vaultData = await getProjectVault(projectId);
      setData(vaultData);
      setExpandedFolders(vaultData.folders.map(f => f._id)); // Expand all by default
    } catch (err) {
      console.error("Failed to load vault:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVault(); }, [projectId]);

  const handleCreateFolder = async (name, isPrivate) => {
    try {
      await createFolder(projectId, name, isPrivate);
      toast?.({ title: "Folder created", variant: "success" });
      loadVault();
    } catch (err) {
      toast?.({ title: "Error creating folder", variant: "error" });
    }
  };

  const handleUploadFile = async (file, folderId) => {
    try {
      await uploadVaultFile(projectId, folderId, file);
      toast?.({ title: "File uploaded successfully", variant: "success" });
      loadVault();
    } catch (err) {
      // ✅ CATCH HTTP 402 - Trigger Upgrade Modal
      if (err.response?.status === 402) {
        setIsUpgradeModalOpen(true);
      } else {
        toast?.({ title: "Upload failed", description: err.message, variant: "error" });
      }
    }
  };

  const filteredFiles = data.files.filter(f => f.originalName.toLowerCase().includes(searchQuery.toLowerCase()));
  const rootFiles = filteredFiles.filter(f => !f.folderId);
  const usagePercentage = Math.min((data.storage.usedBytes / data.storage.limitBytes) * 100, 100);

  return (
    <div className="p-10 max-w-[1400px] mx-auto relative">
      {loading && <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface-0/50 backdrop-blur-sm"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}

      {/* Storage Progress Bar */}
      <div className="mb-8 p-5 rounded-2xl bg-surface-1 border border-white/[0.04]">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Workspace Storage</h3>
            <p className="text-xs text-text-tertiary">Using {formatBytes(data.storage.usedBytes)} of {formatBytes(data.storage.limitBytes)}</p>
          </div>
          <button onClick={() => setIsUpgradeModalOpen(true)} className="text-xs font-medium text-brand-400 hover:text-brand-300">Upgrade Plan</button>
        </div>
        <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${usagePercentage > 90 ? 'bg-error-500' : 'bg-brand-500'}`} style={{ width: `${usagePercentage}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          
          {/* THE SILENT CONSUMER: Upload Button + Mini Storage Indicator */}
          <div className="relative flex flex-col group">
            <button 
              onClick={() => setIsUploadModalOpen(true)} 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors relative z-10"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
            {/* Tiny silent storage indicator underneath */}
            <div 
              className="absolute -bottom-1.5 left-1.5 right-1.5 h-1 rounded-full overflow-hidden bg-black/10 dark:bg-white/10"
              title={`${formatBytes(data.storage.usedBytes)} / ${formatBytes(data.storage.limitBytes)} used`}
            >
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercentage > 90 
                    ? 'bg-error-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
                    : usagePercentage > 75 
                      ? 'bg-warning-500' 
                      : 'bg-white/40'
                }`} 
                style={{ width: `${usagePercentage}%` }} 
              />
            </div>
          </div>

          <button onClick={() => setIsFolderModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08] text-text-secondary text-sm hover:bg-surface-2 transition-colors"><FolderPlus className="w-4 h-4" /><span>New Folder</span></button>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08]">
          <Search className="w-4 h-4 text-text-tertiary" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search files..." className="bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none w-48" />
        </div>
      </div>
      
      <div>
        {rootFiles.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-4">Project Root</h3>
            <div className="grid grid-cols-4 gap-4">
              {rootFiles.map(file => <FileCard key={file._id} file={file} />)}
            </div>
          </div>
        )}

        {data.folders.map(folder => (
          <FolderSection
            key={folder._id} folder={folder}
            files={filteredFiles.filter(f => f.folderId === folder._id)}
            isExpanded={expandedFolders.includes(folder._id)}
            onToggle={() => setExpandedFolders(prev => prev.includes(folder._id) ? prev.filter(id => id !== folder._id) : [...prev, folder._id])}
          />
        ))}

        {!loading && data.folders.length === 0 && data.files.length === 0 && (
          <div className="py-20 text-center border border-dashed border-white/[0.1] rounded-2xl bg-surface-1/30 mt-8">
            <Archive className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">Vault is empty</h3>
            <p className="text-sm text-text-tertiary mb-6">Upload files or create folders to organize your assets securely.</p>
          </div>
        )}
      </div>

      <CreateFolderModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} onCreate={handleCreateFolder} />
      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleUploadFile} folders={data.folders} />
      <UpgradeStorageModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
    </div>
  );
}
