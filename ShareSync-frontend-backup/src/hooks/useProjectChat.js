// src/hooks/useProjectChat.js - WITH SOCKET.IO REAL-TIME
import { useState, useEffect, useCallback } from 'react';
import * as messagesAPI from '../api/messages';
import socketService from '../services/socket';

export default function useProjectChat(projectId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('ss.user') || '{}');
  const currentUserId = currentUser.id || 'user_1';

  // Initialize socket connection
  useEffect(() => {
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Join/leave project room
  useEffect(() => {
    if (projectId && socketService.connected) {
      socketService.joinProject(projectId, currentUserId);

      return () => {
        socketService.leaveProject(projectId, currentUserId);
      };
    }
  }, [projectId, currentUserId]);

  // Load initial messages
  useEffect(() => {
    if (projectId) {
      loadMessages();
    }
  }, [projectId]);

  // Set up socket listeners
  useEffect(() => {
    if (!projectId) return;

    // Listen for new messages
    socketService.onNewMessage((message) => {
      console.log('[Socket] Received new message:', message);
      
      const transformed = transformMessage(message);
      setMessages(prev => [transformed, ...prev]);
    });

    // Listen for message updates
    socketService.onMessageUpdated((message) => {
      console.log('[Socket] Message updated:', message);
      
      setMessages(prev => prev.map(msg => 
        msg.id === message._id ? transformMessage(message) : msg
      ));
    });

    // Listen for message deletions
    socketService.onMessageDeleted(({ messageId }) => {
      console.log('[Socket] Message deleted:', messageId);
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    });

    // Listen for reactions
    socketService.onReactionAdded(({ messageId, reaction }) => {
      console.log('[Socket] Reaction added:', messageId, reaction);
      
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;
        
        return {
          ...msg,
          reactions: [...msg.reactions, reaction]
        };
      }));
    });

    socketService.onReactionRemoved(({ messageId, emoji, userId }) => {
      console.log('[Socket] Reaction removed:', messageId, emoji);
      
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;
        
        return {
          ...msg,
          reactions: msg.reactions.filter(r => 
            !(r.emoji === emoji && r.userId === userId)
          )
        };
      }));
    });

    // Listen for resolved status
    socketService.onMessageResolved(({ messageId, resolvedBy, resolvedAt }) => {
      console.log('[Socket] Message resolved:', messageId);
      
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;
        
        return {
          ...msg,
          resolved: true,
          resolvedBy: `${resolvedBy.firstName} ${resolvedBy.lastName}`,
          resolvedAt
        };
      }));
    });

    // Listen for typing indicators
    socketService.onTypingStart(({ userId, userName }) => {
      if (userId === currentUserId) return; // Don't show own typing
      
      setTypingUsers(prev => {
        if (prev.find(u => u.userId === userId)) return prev;
        return [...prev, { userId, userName }];
      });
    });

    socketService.onTypingStop(({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    });

    // Cleanup listeners on unmount
    return () => {
      socketService.removeAllListeners();
    };
  }, [projectId, currentUserId]);

  // Transform backend message to frontend format
  const transformMessage = useCallback((msg) => ({
    id: msg._id,
    authorId: msg.author._id,
    authorName: `${msg.author.firstName} ${msg.author.lastName}`,
    authorAvatar: msg.author.profilePicture,
    type: msg.type,
    content: msg.content,
    timestamp: msg.createdAt,
    reactions: msg.reactions?.map(r => ({
      emoji: r.emoji,
      userId: r.user._id || r.user
    })) || [],
    resolved: msg.resolved,
    resolvedBy: msg.resolvedBy ? `${msg.resolvedBy.firstName} ${msg.resolvedBy.lastName}` : null,
    replyCount: msg.replyCount || 0
  }), []);

  async function loadMessages() {
    try {
      setLoading(true);
      setError(null);

      const data = await messagesAPI.getMessages(projectId);
      
      const transformedMessages = data.messages.map(transformMessage);
      setMessages(transformedMessages);
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

      // Stop typing indicator
      socketService.emitTypingStop(projectId, currentUserId);

      const newMessage = await messagesAPI.sendMessage(projectId, { content, type });
      
      // Transform and add to messages (backend will broadcast to others)
      const transformed = transformMessage(newMessage);
      setMessages(prev => [transformed, ...prev]);

      return transformed;
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
      let updatedMessage;
      
      if (action === 'add') {
        updatedMessage = await messagesAPI.addReaction(projectId, messageId, emoji);
      } else {
        updatedMessage = await messagesAPI.removeReaction(projectId, messageId, emoji);
      }

      // Update local state (socket will update others)
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;

        return {
          ...msg,
          reactions: updatedMessage.reactions.map(r => ({
            emoji: r.emoji,
            userId: r.user._id
          }))
        };
      }));

      return true;
    } catch (err) {
      console.error('[useProjectChat] React error:', err);
      throw err;
    }
  }

  async function resolveMessage(messageId) {
    try {
      const updatedMessage = await messagesAPI.resolveMessage(projectId, messageId);

      // Update local state (socket will update others)
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;

        return {
          ...msg,
          resolved: true,
          resolvedBy: updatedMessage.resolvedBy 
            ? `${updatedMessage.resolvedBy.firstName} ${updatedMessage.resolvedBy.lastName}` 
            : 'Someone'
        };
      }));

      return true;
    } catch (err) {
      console.error('[useProjectChat] Resolve error:', err);
      throw err;
    }
  }

  // Typing indicator handlers
  function startTyping() {
    socketService.emitTypingStart(projectId, currentUserId, `${currentUser.firstName} ${currentUser.lastName}`);
  }

  function stopTyping() {
    socketService.emitTypingStop(projectId, currentUserId);
  }

  return {
    messages,
    loading,
    sending,
    error,
    typingUsers,
    sendMessage,
    reactToMessage,
    resolveMessage,
    startTyping,
    stopTyping,
    refresh: loadMessages
  };
}