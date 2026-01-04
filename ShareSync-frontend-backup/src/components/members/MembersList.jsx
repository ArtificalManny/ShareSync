// src/components/members/MembersList.jsx - Display project members
import React from 'react';
import { Crown, Star, MoreVertical } from 'lucide-react';

/**
 * MembersList - Display all project members with roles
 * Similar to Google Drive member display
 */
const MembersList = ({ members, currentUserId, onRemoveMember, compact = false }) => {
  const getRoleBadge = (role) => {
    const badges = {
      owner: { icon: <Crown className="w-3 h-3" />, label: 'Owner', color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' },
      admin: { icon: <Star className="w-3 h-3" />, label: 'Admin', color: 'bg-purple-500/20 border-purple-500/30 text-purple-400' },
      member: { icon: null, label: 'Member', color: 'bg-slate-500/20 border-slate-500/30 text-slate-400' }
    };
    return badges[role] || badges.member;
  };

  if (compact) {
    // Compact view - just avatars
    return (
      <div className="flex items-center -space-x-2">
        {members.slice(0, 5).map((member, idx) => (
          <div
            key={member.id}
            className="w-8 h-8 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-sm font-bold text-white"
            title={member.name}
          >
            {member.avatar || member.name[0]}
          </div>
        ))}
        {members.length > 5 && (
          <div className="w-8 h-8 bg-slate-700 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-300">
            +{members.length - 5}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const badge = getRoleBadge(member.role);
        const isCurrentUser = member.id === currentUserId;

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl hover:bg-slate-800/50 transition-all"
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
              {member.avatar || member.name[0]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white truncate">
                  {member.name}
                  {isCurrentUser && <span className="text-slate-500 ml-1">(you)</span>}
                </span>
              </div>
              <p className="text-sm text-slate-400 truncate">{member.email}</p>
            </div>

            {/* Role Badge */}
            <div className={`px-3 py-1 ${badge.color} border rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0`}>
              {badge.icon}
              {badge.label}
            </div>

            {/* Actions */}
            {!isCurrentUser && member.role !== 'owner' && (
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MembersList;
