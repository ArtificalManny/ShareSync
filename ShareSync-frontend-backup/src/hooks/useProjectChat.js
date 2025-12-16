// src/hooks/useProjectChat.js - PHASE 2 ENHANCED
import { useState, useEffect } from 'react';

export default function useProjectChat(projectId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMessages();
  }, [projectId]);

  async function loadMessages() {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      const mockMessages = getMockMessages();
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessages(mockMessages);
    } catch (err) {
      console.error('[useProjectChat] Load error:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(content, type = 'update') {
    try {
      setSending(true);
      setError(null);

      const currentUser = JSON.parse(localStorage.getItem('ss.user') || '{}');
      const newMessage = {
        id: `msg_${Date.now()}`,
        authorId: currentUser.id || 'user_1',
        authorName: currentUser.firstName || 'You',
        authorAvatar: currentUser.profilePicture || '/default-avatar.png',
        type,
        content,
        timestamp: new Date().toISOString(),
        reactions: [],
        resolved: false,
        replyCount: 0
      };

      setMessages(prev => [...prev, newMessage]);
      await new Promise(resolve => setTimeout(resolve, 300));

      return newMessage;
    } catch (err) {
      console.error('[useProjectChat] Send error:', err);
      setError('Failed to send message');
      throw err;
    } finally {
      setSending(false);
    }
  }

  async function reactToMessage(messageId, emoji, action = 'add') {
    try {
      // TODO: Replace with actual API call
      
      // Optimistic update
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;

        const reactions = [...(msg.reactions || [])];
        const currentUser = JSON.parse(localStorage.getItem('ss.user') || '{}');
        const userId = currentUser.id || 'user_1';

        if (action === 'add') {
          reactions.push({ emoji, userId });
        } else {
          const index = reactions.findIndex(r => r.emoji === emoji && r.userId === userId);
          if (index > -1) reactions.splice(index, 1);
        }

        return { ...msg, reactions };
      }));

      return true;
    } catch (err) {
      console.error('[useProjectChat] React error:', err);
      throw err;
    }
  }

  async function resolveMessage(messageId) {
    try {
      // TODO: Replace with actual API call
      
      const currentUser = JSON.parse(localStorage.getItem('ss.user') || '{}');
      
      // Optimistic update
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;
        return {
          ...msg,
          resolved: true,
          resolvedBy: currentUser.firstName || 'You'
        };
      }));

      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    } catch (err) {
      console.error('[useProjectChat] Resolve error:', err);
      throw err;
    }
  }

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    reactToMessage,
    resolveMessage,
    refresh: loadMessages
  };
}

function getMockMessages() {
  const now = Date.now();
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  const fourHoursAgo = now - 4 * 60 * 60 * 1000;
  const yesterday = now - 24 * 60 * 60 * 1000;

  return [
    {
      id: 'msg_1',
      authorId: 'user_2',
      authorName: 'Sarah',
      authorAvatar: '/avatars/sarah.jpg',
      type: 'update',
      content: 'Beta testing complete. Found 2 bugs, both fixed. Ready to deploy! 🚀',
      timestamp: new Date(twoHoursAgo).toISOString(),
      reactions: [
        { emoji: '👍', userId: 'user_1' },
        { emoji: '👍', userId: 'user_3' },
        { emoji: '🎉', userId: 'user_1' }
      ],
      resolved: false,
      replyCount: 0
    },
    {
      id: 'msg_2',
      authorId: 'user_3',
      authorName: 'Jordan',
      authorAvatar: '/avatars/jordan.jpg',
      type: 'question',
      content: 'Should we deploy before or after the client demo on Friday?',
      timestamp: new Date(fourHoursAgo).toISOString(),
      reactions: [
        { emoji: '👀', userId: 'user_1' }
      ],
      resolved: false,
      replyCount: 3
    },
    {
      id: 'msg_3',
      authorId: 'user_1',
      authorName: 'Manny',
      authorAvatar: '/avatars/manny.jpg',
      type: 'decision',
      content: "Let's use Tailwind instead of custom CSS for consistency across components.",
      timestamp: new Date(yesterday).toISOString(),
      reactions: [
        { emoji: '👍', userId: 'user_2' },
        { emoji: '👍', userId: 'user_3' },
        { emoji: '🚀', userId: 'user_2' }
      ],
      resolved: true,
      resolvedBy: 'Sarah',
      replyCount: 0
    }
  ];
}
