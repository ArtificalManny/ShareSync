import React, { useState, useEffect } from 'react';
import { Megaphone, AlertCircle, Trophy, DollarSign, Plus, X, Trash2, Pin, PinOff } from 'lucide-react';
import { getAnnouncements, createAnnouncement, markAnnouncementAsRead, deleteAnnouncement } from '../../api/announcements';
import { toast } from '../ui/toast';
import { useIsMobile } from '../../hooks/useMobile';
import MobileAnnouncementCreate from '../mobile/MobileAnnouncementCreate';

const Announcements = ({ projectId, currentUserId }) => {
  const isMobile = useIsMobile();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMobileCreate, setShowMobileCreate] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [projectId]);

  const fetchAnnouncements = async () => {
    try {
      const data = await getAnnouncements(projectId);
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (isMobile) {
      setShowMobileCreate(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const getTypeIcon = (type) => {
    const iconMap = {
      'general': <Megaphone className="w-4 h-4" />,
      'important': <AlertCircle className="w-4 h-4" />,
      'milestone': <Trophy className="w-4 h-4" />,
      'payment': <DollarSign className="w-4 h-4" />
    };
    return iconMap[type] || iconMap['general'];
  };

  const getTypeColor = (type) => {
    const colorMap = {
      'general': 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      'important': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      'milestone': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      'payment': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    };
    return colorMap[type] || colorMap['general'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className={`bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 ${isMobile ? 'rounded-none border-x-0' : 'rounded-2xl'} p-4 sm:p-6 shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-400" />
            Announcements
          </h3>
          <button
            onClick={handleCreate}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2 tap-target active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {!isMobile && 'New'}
          </button>
        </div>

        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-8 sm:p-12 text-center">
              <Megaphone className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No announcements yet</p>
              <p className="text-slate-500 text-xs mt-1">Share updates with your team</p>
            </div>
          ) : (
            announcements.map((announcement) => {
              const isUnread = !announcement.readBy?.some(r => r.userId === currentUserId);
              return (
                <div
                  key={announcement._id}
                  className={`bg-slate-900/50 border rounded-xl p-3 sm:p-4 transition-all ${
                    isUnread ? 'border-purple-500/50' : 'border-slate-700/50'
                  } ${isMobile ? 'active:scale-98' : 'hover:border-purple-500/50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${getTypeColor(announcement.type)} flex-shrink-0`}>
                      {getTypeIcon(announcement.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-white text-sm sm:text-base">{announcement.title}</h4>
                        {isUnread && (
                          <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full flex-shrink-0">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-2">
                        {announcement.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{announcement.authorId?.name || 'Someone'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile Create Sheet */}
      {isMobile && (
        <MobileAnnouncementCreate
          projectId={projectId}
          isOpen={showMobileCreate}
          onClose={() => setShowMobileCreate(false)}
          onCreated={() => {
            fetchAnnouncements();
            setShowMobileCreate(false);
          }}
        />
      )}

      {/* Desktop Create Modal (existing code would go here) */}
    </>
  );
};

export default Announcements;
