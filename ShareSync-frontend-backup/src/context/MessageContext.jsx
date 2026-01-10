import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserContext } from './UserContext';
import useMessageSocket from '../hooks/useMessageSocket';
import * as messageAPI from '../api/messages';

export const MessageContext = createContext();

export function MessageProvider({ children }) {
  const { user } = useContext(UserContext);
  const userId = user?._id || user?.id;

  // WebSocket connection
  const socket = useMessageSocket(userId);

  // State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    if (userId) {
      loadConversations();
      loadUnreadCount();
    }
  }, [userId]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (socket.newMessage) {
      // Add to messages if it's for active conversation
      if (socket.newMessage.conversationId === activeConversation) {
        setMessages((prev) => [...prev, socket.newMessage]);
      }

      // Update conversations list
      loadConversations();
      loadUnreadCount();
    }
  }, [socket.newMessage]);

  // Load all conversations
  const loadConversations = async () => {
    try {
      const data = await messageAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId) => {
    setLoading(true);
    try {
      const data = await messageAPI.getMessages(conversationId);
      setMessages(data.reverse()); // Reverse to show oldest first
      setActiveConversation(conversationId);

      // Join WebSocket room
      socket.joinConversation(conversationId);

      // Mark as read
      await messageAPI.markConversationAsRead(conversationId);
      loadUnreadCount();
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message (via WebSocket for real-time, fallback to REST)
  const sendMessage = async (data) => {
    try {
      if (socket.isConnected) {
        await socket.sendMessage({
          ...data,
          senderId: userId,
        });
      } else {
        // Fallback to REST API
        const message = await messageAPI.sendMessage({
          ...data,
          senderId: userId,
        });
        setMessages((prev) => [...prev, message]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const count = await messageAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  // Start new conversation
  const startConversation = async (recipientId) => {
    const conversationId = await messageAPI.createConversation(recipientId);
    setActiveConversation(conversationId);
    setMessages([]);
    socket.joinConversation(conversationId);
    return conversationId;
  };

  const value = {
    conversations,
    activeConversation,
    messages,
    unreadCount,
    loading,
    socket,
    loadConversations,
    loadMessages,
    sendMessage,
    startConversation,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}
