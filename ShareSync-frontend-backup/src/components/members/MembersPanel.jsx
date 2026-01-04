// src/components/members/MembersPanel.jsx - Manage project members
import React, { useState } from 'react';
import { Users, UserPlus, Settings } from 'lucide-react';
import MembersList from './MembersList';
import InviteMember from './InviteMember';

/**
 * MembersPanel - Display and manage project members
 * Google Drive-style member management
 */
const MembersPanel = ({ projectId, projectName, currentUserId, compact = false }) => {
  const [showInvite, setShowInvite] = useState(false);

  // Mock members data
  const [members] = useState([
    { id: '1', name: 'Manny Rivas', email: 'manny@sharesync.app', avatar: '🚀', role: 'owner' },
    { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', avatar: '👩', role: 'admin' },
    { id: '3', name: 'Mike Rodriguez', email: 'mike@example.com', avatar: '👨', role: 'member' },
    { id: '4', name: 'Alex Kim', email: 'alex@example.com', avatar: '🧑', role: 'member' },
    { id: '5', name: 'Emma Wilson', email: 'emma@example.com', avatar: '👩', role: 'member' }
  ]);

  const handleInvite = async (inviteData) => {
    console.log('Inviting:', inviteData);
    // TODO: API call to send invitation
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <MembersList members={members} currentUserId={currentUserId} compact />
        <button
          onClick={() => setShowInvite(true)}
          className="w-8 h-8 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-full flex items-center justify-center transition-all"
          title="Invite members"
        >
          <UserPlus className="w-4 h-4 text-white" />
        </button>
        
        {showInvite && (
          <InviteMember
            projectId={projectId}
            projectName={projectName}
            onInvite={handleInvite}
            onClose={() => setShowInvite(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Team Members</h2>
            <p className="text-sm text-slate-400">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
          </div>
        </div>

        <button
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl font-bold transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite
        </button>
      </div>

      {/* Members List */}
      <MembersList 
        members={members} 
        currentUserId={currentUserId}
      />

      {/* Invite Modal */}
      {showInvite && (
        <InviteMember
          projectId={projectId}
          projectName={projectName}
          onInvite={handleInvite}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
};

export default MembersPanel;
