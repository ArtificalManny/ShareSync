// src/components/project/Announcements.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8.2: Live Announcements & Threads (Gallery Walk Theme)
// WIRED: Connected to backend API. Moderation intercepts bad content.
// THREADS: Added comment viewing and posting capability directly on posts.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, X, ChevronDown, ChevronUp, MessageCircle, Paperclip, Send } from 'lucide-react';
import TrustBadge from '../trust/TrustBadge';
import { useIsMobile } from '../../hooks/useMobile';
import { toast } from '../ui/toast';
import { getAnnouncements, createAnnouncement, addCommentToAnnouncement } from '../../api/announcements';

const Announcements = ({ projectId, currentUserId }) => {
  const isMobile = useIsMobile();
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  
  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thread State
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!projectId) return;
      try {
        setIsLoading(true);
        const data = await getAnnouncements(projectId);
        setAnnouncements(data || []);
      } catch (err) {
        toast.error("Failed to load announcements");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncements();
  }, [projectId]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;

    try {
      setIsSubmitting(true);
      const created = await createAnnouncement(projectId, {
        title: newAnnouncement.title,
        message: newAnnouncement.content, // Maps to backend schema
      });
      
      setAnnouncements([created, ...announcements]);
      setNewAnnouncement({ title: '', content: '' });
      setShowCreateModal(false);
      toast.success("Announcement posted & team notified");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Post rejected. Check content policy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostComment = async (announcementId) => {
    if (!commentText.trim()) return;
    
    try {
      const updatedAnnouncement = await addCommentToAnnouncement(projectId, announcementId, commentText);
      
      // Update local state to show new comment
      setAnnouncements(announcements.map(ann => 
        ann._id === announcementId ? updatedAnnouncement : ann
      ));
      
      setCommentText('');
      setActiveCommentId(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Comment rejected by moderation filter.");
    }
  };

  const handleAttachFile = () => {
    toast.info("AWS S3 integration pending. File attachments coming soon!");
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl shadow-[0_4px_24px_rgba(139,92,246,0.06)] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
              <Megaphone strokeWidth={1.5} className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 leading-tight">Announcements</h3>
              <TrustBadge type="private" size="xs" inline />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isMobile && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-2 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus strokeWidth={2} className="w-4 h-4" />
                New Post
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-slate-200/50 text-slate-500 rounded-lg transition-colors active:scale-95"
            >
              {expanded ? <ChevronUp strokeWidth={1.5} className="w-5 h-5" /> : <ChevronDown strokeWidth={1.5} className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {expanded && (
        <div className="p-5 space-y-4 bg-white">
          {isLoading ? (
             <div className="text-center py-8 animate-pulse">
               <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-3" />
               <div className="h-4 w-32 bg-slate-100 rounded mx-auto" />
             </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone strokeWidth={1.5} className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No announcements yet</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann._id || ann.id}
                className={`p-5 rounded-xl border transition-all ${
                  ann.pinned
                    ? 'bg-amber-50/30 border-amber-200'
                    : 'bg-white border-slate-200/60 hover:shadow-md'
                }`}
              >
                {/* Main Post */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-500">
                       {ann.authorId?.avatarUrl ? <img src={ann.authorId.avatarUrl} alt="avatar" className="w-full h-full object-cover"/> : ann.authorId?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[15px] text-slate-900 leading-tight">{ann.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 mt-0.5">
                        <span className="text-slate-700">{ann.authorId?.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {ann.pinned && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-amber-200">
                      Pinned
                    </span>
                  )}
                </div>
                
                <p className="text-[14px] text-slate-700 leading-relaxed mb-4">{ann.message || ann.content}</p>

                {/* Attachments UI (Static for now) */}
                {ann.attachments && ann.attachments.length > 0 && (
                   <div className="flex flex-wrap gap-2 mb-4">
                     {ann.attachments.map((file, idx) => (
                       <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
                         <Paperclip className="w-3 h-3" /> {file}
                       </div>
                     ))}
                   </div>
                )}

                <div className="border-t border-slate-100 pt-3 mt-2">
                  <button 
                    onClick={() => setActiveCommentId(activeCommentId === ann._id ? null : ann._id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-600 transition-colors"
                  >
                    <MessageCircle strokeWidth={2} className="w-4 h-4" />
                    {ann.comments?.length || 0} Comments
                  </button>
                </div>

                {/* Threaded Comments Section */}
                {activeCommentId === ann._id && (
                  <div className="mt-4 pl-4 border-l-2 border-slate-100 space-y-4">
                    {ann.comments?.map((comment, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {comment.authorId?.name?.charAt(0) || '?'}
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-700">{comment.authorId?.name || 'User'}</span>
                            <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[13px] text-slate-600 leading-snug">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Comment Input */}
                    <div className="flex gap-2 items-center mt-2">
                      <input 
                        type="text" 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Reply to thread..." 
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      />
                      <button 
                        onClick={() => handlePostComment(ann._id)}
                        className="p-2 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 max-w-lg w-full shadow-[0_24px_60px_-15px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Broadcast to Team</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors active:scale-95"
              >
                <X strokeWidth={1.5} className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="What's the update?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Message</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Type your message here..."
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none transition-all"
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <button 
                  type="button"
                  onClick={handleAttachFile}
                  className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Paperclip className="w-4 h-4" /> Attach File
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl font-bold text-[14px] active:scale-[0.98] transition-all shadow-sm flex items-center gap-2"
                >
                  {isSubmitting ? 'Scanning & Posting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
