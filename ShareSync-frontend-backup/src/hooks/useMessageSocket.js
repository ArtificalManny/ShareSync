import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// message-socket-production-url-v1
// Accept the production socket variable already configured for OpenShare.
// Never point a production browser/native WebView at its own localhost.
const rawSocketBase =
  import.meta.env.VITE_WS_URL ||
  import.meta.env.VITE_SOCKET_URL ||
  String(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '') ||
  (import.meta.env.DEV
    ? 'http://localhost:5050'
    : 'https://openshare-backend.onrender.com');

const normalizedSocketBase =
  String(rawSocketBase)
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');

const isLocalhostSocketBase =
  /^(?:https?|wss?):\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
    normalizedSocketBase
  );

// message-socket-production-localhost-guard-v2
// A stale deployment env value must never send production users to localhost.
const safeSocketBase =
  import.meta.env.PROD && isLocalhostSocketBase
    ? 'https://openshare-backend.onrender.com'
    : normalizedSocketBase;

const SOCKET_URL =
  `${safeSocketBase}/messages`;

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
