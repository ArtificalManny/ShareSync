// src/hooks/useProjectChat.js - WITH REAL API
import { useState, useEffect } from 'react';
import * as messagesAPI from '../api/messages';

export default function useProjectChat(projectId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadMessages();
    }
  }, [projectId]);

  async function loadMessages() {
    try {
      setLoading(true);
      setError(null);

      const data = await messagesAPI.getMessages(projectId);
      
      // Transform backend data to match frontend format
      const transformedMessages = data.messages.map(msg => ({
        id: msg._id,
        authorId: msg.author._id,
        authorName: `${msg.author.firstName} ${msg.author.lastName}`,
        authorAvatar: msg.author.profilePicture,
        type: msg.type,
        content: msg.content,
        timestamp: msg.createdAt,
        reactions: msg.reactions.map(r => ({
          emoji: r.emoji,
          userId: r.user._id
        })),
        resolved: msg.resolved,
        resolvedBy: msg.resolvedBy ? `${msg.resolvedBy.firstName} ${msg.resolvedBy.lastName}` : null,
        replyCount: msg.replyCount || 0
      }));

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

      const newMessage = await messagesAPI.sendMessage(projectId, { content, type });
      
      // Transform and add to messages
      const transformed = {
        id: newMessage._id,
        authorId: newMessage.author._id,
        authorName: `${newMessage.author.firstName} ${newMessage.author.lastName}`,
        authorAvatar: newMessage.author.profilePicture,
        type: newMessage.type,
        content: newMessage.content,
        timestamp: newMessage.createdAt,
        reactions: [],
        resolved: false,
        replyCount: 0
      };

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

      // Update local state
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

      // Update local state
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
