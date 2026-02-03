// src/components/views/VaultView.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// VAULT VIEW: Project files with task linking
// Organized storage, version history, quick access
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Upload, FolderPlus, Search, Grid, List, MoreHorizontal,
  File, FileText, Image, Film, Music, Archive, Code,
  Link2, Clock, Download, Trash2, Star, Eye,
  ChevronRight, ChevronDown, Folder, Plus
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// FILE TYPE ICONS
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// FILE CARD (Grid View)
// ═══════════════════════════════════════════════════════════════════════════════

function FileCard({ file, onFileClick, onDownload, onDelete }) {
  const fileType = getFileType(file.name);
  const style = FILE_ICONS[fileType];
  const Icon = style.icon;
  
  return (
    <div
      onClick={() => onFileClick?.(file)}
      className="group p-4 rounded-xl bg-surface-1 border border-white/[0.06] hover:border-white/[0.12] hover:bg-surface-2 transition-all cursor-pointer"
    >
      {/* Preview / Icon */}
      <div className={`w-full aspect-square rounded-lg ${style.bg} flex items-center justify-center mb-3 relative overflow-hidden`}>
        {file.thumbnail ? (
          <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <Icon className={`w-10 h-10 ${style.color}`} />
        )}
        
        {/* Starred indicator */}
        {file.isStarred && (
          <div className="absolute top-2 right-2">
            <Star className="w-4 h-4 fill-warning-400 text-warning-400" />
          </div>
        )}
        
        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onDownload?.(file); }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Info */}
      <div>
        <h4 className="font-medium text-text-primary text-sm truncate mb-1">{file.name}</h4>
        
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span>{file.size}</span>
          <span>•</span>
          <span>{file.uploadedAt}</span>
        </div>
        
        {/* Linked task */}
        {file.linkedTask && (
          <div className="mt-2 flex items-center gap-1 text-xs text-cyan-400">
            <Link2 className="w-3 h-3" />
            <span className="truncate">{file.linkedTask.title}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE ROW (List View)
// ═══════════════════════════════════════════════════════════════════════════════

function FileRow({ file, onFileClick, onDownload }) {
  const fileType = getFileType(file.name);
  const style = FILE_ICONS[fileType];
  const Icon = style.icon;
  
  return (
    <div
      onClick={() => onFileClick?.(file)}
      className="group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-surface-1 transition-colors cursor-pointer"
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${style.color}`} />
      </div>
      
      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-text-primary text-sm truncate">{file.name}</h4>
          {file.isStarred && <Star className="w-3.5 h-3.5 fill-warning-400 text-warning-400 flex-shrink-0" />}
        </div>
        {file.linkedTask && (
          <div className="flex items-center gap-1 text-xs text-cyan-400 mt-0.5">
            <Link2 className="w-3 h-3" />
            <span className="truncate">{file.linkedTask.title}</span>
          </div>
        )}
      </div>
      
      {/* Size */}
      <div className="w-24 text-sm text-text-tertiary text-right">
        {file.size}
      </div>
      
      {/* Date */}
      <div className="w-32 text-sm text-text-tertiary text-right">
        {file.uploadedAt}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDownload?.(file); }}
          className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOLDER SECTION
// ═══════════════════════════════════════════════════════════════════════════════

function FolderSection({ folder, files, viewMode, isExpanded, onToggle, onFileClick }) {
  const fileCount = files.length;
  
  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 px-2 py-2 w-full hover:bg-surface-1 rounded-lg transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-text-tertiary" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-tertiary" />
        )}
        <Folder className="w-5 h-5 text-warning-400" />
        <span className="font-medium text-text-primary">{folder.name}</span>
        <span className="text-sm text-text-tertiary">({fileCount} files)</span>
      </button>
      
      {isExpanded && (
        <div className={`mt-3 ml-7 ${viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-1'}`}>
          {files.map(file => (
            viewMode === 'grid' ? (
              <FileCard key={file.id} file={file} onFileClick={onFileClick} />
            ) : (
              <FileRow key={file.id} file={file} onFileClick={onFileClick} />
            )
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function VaultView({ 
  files = [],
  folders = [],
  onUpload,
  onFileClick,
  onNewFolder 
}) {
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(['designs', 'specs']);
  
  // Mock data
  const mockFiles = [
    { id: '1', name: 'API Specification v2.doc', size: '2.4 MB', uploadedAt: 'Today', linkedTask: { id: '1', title: 'API refactor' }, folderId: 'specs', isStarred: true },
    { id: '2', name: 'Login Flow v3.fig', size: '8.1 MB', uploadedAt: '2 days ago', linkedTask: { id: '2', title: 'Login fix' }, folderId: 'designs', isStarred: false },
    { id: '3', name: 'Dashboard Mockup.fig', size: '12.3 MB', uploadedAt: '1 week ago', linkedTask: null, folderId: 'designs', isStarred: false },
    { id: '4', name: 'Sprint 5 Report.xlsx', size: '156 KB', uploadedAt: 'Today', linkedTask: null, folderId: 'reports', isStarred: false },
    { id: '5', name: 'Meeting Notes 01-30.md', size: '12 KB', uploadedAt: 'Yesterday', linkedTask: { id: '5', title: 'Sprint Retro' }, folderId: 'notes', isStarred: false },
    { id: '6', name: 'Architecture Diagram.png', size: '1.8 MB', uploadedAt: '3 days ago', linkedTask: null, folderId: 'designs', isStarred: true, thumbnail: null },
  ];
  
  const mockFolders = [
    { id: 'designs', name: 'Designs' },
    { id: 'specs', name: 'Specs' },
    { id: 'reports', name: 'Reports' },
    { id: 'notes', name: 'Meeting Notes' },
  ];
  
  const displayFiles = files.length > 0 ? files : mockFiles;
  const displayFolders = folders.length > 0 ? folders : mockFolders;
  
  // Filter files
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return displayFiles;
    const query = searchQuery.toLowerCase();
    return displayFiles.filter(file => 
      file.name.toLowerCase().includes(query) ||
      file.linkedTask?.title.toLowerCase().includes(query)
    );
  }, [displayFiles, searchQuery]);
  
  // Group by folder
  const filesByFolder = useMemo(() => {
    const grouped = {};
    displayFolders.forEach(folder => {
      grouped[folder.id] = filteredFiles.filter(f => f.folderId === folder.id);
    });
    return grouped;
  }, [filteredFiles, displayFolders]);
  
  // Recent files
  const recentFiles = [...filteredFiles]
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, 4);
  
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };
  
  return (
    <div className="p-10 max-w-[1400px] mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
          
          <button
            onClick={onNewFolder}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08] text-text-secondary text-sm hover:bg-surface-2 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-1 border border-white/[0.08]">
            <Search className="w-4 h-4 text-text-tertiary" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..." 
              className="bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none w-48"
            />
          </div>
          
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-1 border border-white/[0.08]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-brand-500/10 text-brand-400' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-brand-500/10 text-brand-400' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Recent Files */}
      {!searchQuery && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Recent</h3>
            <button className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors">
              View all →
            </button>
          </div>
          
          <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-1'}>
            {recentFiles.map(file => (
              viewMode === 'grid' ? (
                <FileCard key={file.id} file={file} onFileClick={onFileClick} />
              ) : (
                <FileRow key={file.id} file={file} onFileClick={onFileClick} />
              )
            ))}
          </div>
        </div>
      )}
      
      {/* Folders */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-4">By Folder</h3>
        
        {displayFolders.map(folder => (
          <FolderSection
            key={folder.id}
            folder={folder}
            files={filesByFolder[folder.id] || []}
            viewMode={viewMode}
            isExpanded={expandedFolders.includes(folder.id)}
            onToggle={() => toggleFolder(folder.id)}
            onFileClick={onFileClick}
          />
        ))}
        
        {displayFolders.length === 0 && (
          <div className="py-16 text-center">
            <Folder className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No files yet</h3>
            <p className="text-sm text-text-tertiary mb-6">Upload your first file to get started</p>
            <button
              onClick={onUpload}
              className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
            >
              Upload File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
