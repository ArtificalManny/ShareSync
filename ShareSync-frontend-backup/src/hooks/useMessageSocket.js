import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// Merged: Using environment variable with a fallback to your current 5050/messages path
const SOCKET_URL = import.meta.env.VITE_WS_URL 
  ? `${import.meta.env.VITE_WS_URL}/messages` 
  : 'http://localhost:5050/messages';

export default function useMessageSocket(userId) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessage, setNewMessage] = useState(null);
  const [messageRead, setMessageRead] = useState(null);
  const [userTyping, setUserTyping] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // Create socket connection
    // Merged: Added withCredentials to ensure auth headers are passed correctly
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      withCredentials: true, 
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[WebSocket] Connected to:', SOCKET_URL);
      setIsConnected(true);
      
      // Identify user to backend
      socket.emit('identify', { userId });
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    });

    // Message events
    socket.on('new_message', (message) => {
      console.log('[WebSocket] New message:', message);
      setNewMessage(message);
    });

    socket.on('message_notification', (notification) => {
      console.log('[WebSocket] Message notification:', notification);
    });

    socket.on('message_read', (data) => {
      console.log('[WebSocket] Message read:', data);
      setMessageRead(data);
    });

    socket.on('user_typing', (data) => {
      console.log('[WebSocket] User typing:', data);
      setUserTyping(data);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // Helper functions - ALL LOGIC PRESERVED EXACTLY
  const joinConversation = (conversationId) => {
    socketRef.current?.emit('join_conversation', { conversationId });
  };

  const leaveConversation = (conversationId) => {
    socketRef.current?.emit('leave_conversation', { conversationId });
  };

  const sendMessage = (data) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('send_message', data, (response) => {
        if (response.success) {
          resolve(response.message);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const sendTyping = (conversationId, isTyping) => {
    socketRef.current?.emit('typing', { conversationId, userId, isTyping });
  };

  const markAsRead = (messageId) => {
    socketRef.current?.emit('mark_read', { messageId, userId });
  };

  return {
    isConnected,
    newMessage,
    messageRead,
    userTyping,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    markAsRead,
  };
}
