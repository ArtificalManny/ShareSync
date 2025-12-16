// src/components/project/chat/ChatTab.jsx - PHASE 3 ENHANCED
import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatComposer from './ChatComposer';
import useProjectChat from '../../../hooks/useProjectChat';
import useFocusStatus from '../../../hooks/useFocusStatus';
import { toast } from '../../ui/toast';

export default function ChatTab({ projectId, projectName }) {
  const { 
    messages, 
    loading, 
    sending, 
    error, 
    sendMessage,
    reactToMessage,
    resolveMessage
  } = useProjectChat(projectId);

  const { focusedMembers } = useFocusStatus(projectId);

  const currentUser = JSON.parse(localStorage.getItem('ss.user') || '{}');
  const currentUserId = currentUser.id || 'user_1';

  const handleReact = async (messageId, emoji, action) => {
    try {
      await reactToMessage(messageId, emoji, action);
    } catch (error) {
      toast({ title: 'Failed to add reaction', variant: 'error' });
    }
  };

  const handleResolve = async (messageId) => {
    try {
      await resolveMessage(messageId);
      toast({ title: 'Question marked as resolved ✅', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to resolve question', variant: 'error' });
    }
  };

  const handleSendMessage = async (content, type, options = {}) => {
    try {
      await sendMessage(content, type);
      
      if (options.respectFocus && options.focusedMembers?.length > 0) {
        if (options.scheduleForBreak) {
          toast({ 
            title: '📅 Message scheduled for break time',
            description: `Will be sent when ${options.focusedMembers.length} teammate${options.focusedMembers.length > 1 ? 's' : ''} finish focus session`,
            variant: 'success' 
          });
        } else {
          toast({ 
            title: '✅ Message sent (notifications delayed)',
            description: 'Respecting focus time 🔕',
            variant: 'success' 
          });
        }
      }
    } catch (error) {
      toast({ title: 'Failed to send message', variant: 'error' });
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader projectName={projectName} messageCount={messages.length} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        loading={loading}
        onReact={handleReact}
        onResolve={handleResolve}
      />

      <ChatComposer 
        onSendMessage={handleSendMessage}
        sending={sending}
        focusedMembers={focusedMembers}
        projectId={projectId}
      />
    </div>
  );
}
