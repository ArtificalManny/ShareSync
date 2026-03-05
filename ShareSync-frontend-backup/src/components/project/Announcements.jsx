import React, { useState, useEffect, useRef } from 'react';
import { Megaphone, Plus, X, ChevronDown, ChevronUp, MessageCircle, Paperclip, FileText, Loader2 } from 'lucide-react';
import TrustBadge from '../trust/TrustBadge';
import { useIsMobile } from '../../hooks/useMobile';
import { getAnnouncements, createAnnouncement } from '../../api/announcements';

const Announcements = ({ projectId, currentUserId }) => {
  const isMobile = useIsMobile();
  
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const loadAnnouncements = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await getAnnouncements(projectId);

      // 🛡️ SAFE ARRAY EXTRACTION:
      // No matter what weird shape the backend or Axios interceptor returns,
      // we guarantee `announcements` is an array so .map() never crashes.
      let safeArray = [];
      if (Array.isArray(data)) {
        safeArray = data;
      } else if (data && Array.isArray(data.data)) {
        safeArray = data.data;
      } else if (data && Array.isArray(data.announcements)) {
        safeArray = data.announcements;
      }

      setAnnouncements(safeArray);
      setError(null);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError('Failed to load announcements');
      setAnnouncements([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [projectId]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', newAnnouncement.title);
      formData.append('message', newAnnouncement.content); // Backend expects 'message'
      formData.append('pinned', 'false');
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await createAnnouncement(projectId, formData);

      // Reset Modal
      setNewAnnouncement({ title: '', content: '' });
      setSelectedFile(null);
      setShowCreateModal(false);
      
      // Refresh Feed
      await loadAnnouncements();
    } catch (err) {
      console.error('Failed to create announcement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(now - date) / 36e5;
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Announcements</h3>
              <TrustBadge type="private" size="xs" inline />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isMobile && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 text-white"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {expanded && (
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={loadAnnouncements} className="mt-2 text-xs text-purple-400 hover:underline">Try Again</button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No announcements yet</p>
            </div>
          ) : (
            announcements.map((announcement) => {
              const id = announcement._id || announcement.id;
              const title = announcement.title;
              const content = announcement.message || announcement.content;
              const authorName = announcement.authorId?.firstName || announcement.authorId?.username || announcement.author || 'Team Member';
              const timestamp = formatDate(announcement.createdAt || announcement.timestamp);
              const isPinned = announcement.pinned;
              const attachments = announcement.attachments || [];

              return (
                <div
                  key={id}
                  className={`p-4 rounded-xl border transition-all ${
                    isPinned
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-slate-900/50 border-slate-700/50 hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-1">{title}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{authorName}</span>
                        <span>•</span>
                        <span>{timestamp}</span>
                      </div>
                    </div>
                    {isPinned && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs font-semibold rounded-full">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{content}</p>

                  {attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attachments.map((url, i) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 hover:border-purple-500/30 transition-all text-xs text-purple-300"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">New Announcement</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedFile(null);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="What's the announcement?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Details</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Add more details..."
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-sm font-medium text-slate-300 transition-colors w-full justify-center"
                >
                  <Paperclip className="w-4 h-4" />
                  {selectedFile ? selectedFile.name : 'Attach File (Optional)'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-bold text-lg text-white hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSubmitting ? 'Posting...' : 'Post Announcement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
