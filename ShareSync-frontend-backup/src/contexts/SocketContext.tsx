import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './UserContext';

interface Notification {
  message: string;
  timestamp: Date;
  read: boolean;
  type: string;
  relatedId?: string;
}

interface ChatMessage {
  projectId: string;
  senderId: string;
  message: string;
  timestamp: Date;
}

interface SocketContextType {
  socket: Socket | null;
  notifications: Notification[];
  chatMessages: { [projectId: string]: ChatMessage[] };
  sendChatMessage: (projectId: string, message: string) => void;
}

const SocketContext = createContext<SocketContextType>({ socket: null, notifications: [], chatMessages: {}, sendChatMessage: () => {} });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatMessages, setChatMessages] = useState<{ [projectId: string]: ChatMessage[] }>({});
  const { user } = useUser();

  useEffect(() => {
    console.log('SocketProvider: Initializing socket connection');
    let newSocket: Socket;
    try {
      newSocket = io('http://localhost:3001', { withCredentials: true });
      setSocket(newSocket);
    } catch (error) {
      console.error('SocketProvider: Failed to initialize socket:', error);
      setSocket(null);
    }

    return () => {
      if (newSocket) {
        console.log('SocketProvider: Disconnecting socket');
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (socket && user) {
      console.log('SocketProvider: Joining room for user:', user._id);
      socket.emit('join', user._id);
      socket.on('notification', (notification: Notification) => {
        console.log('SocketProvider: Received notification:', notification);
        setNotifications((prev) => [notification, ...prev]);
      });
      socket.on('chatMessage', (message: ChatMessage) => {
        console.log('SocketProvider: Received chat message:', message);
        setChatMessages((prev) => ({
          ...prev,
          [message.projectId]: [...(prev[message.projectId] || []), message],
        }));
      });

      socket.on('connect_error', (error) => {
        console.error('SocketProvider: Connection error:', error);
      });

      socket.on('disconnect', () => {
        console.log('SocketProvider: Socket disconnected');
      });
    }
  }, [socket, user]);

  const sendChatMessage = (projectId: string, message: string) => {
    if (socket && user) {
      const chatMessage = {
        projectId,
        senderId: user._id,
        message,
        timestamp: new Date(),
      };
      console.log('SocketProvider: Sending chat message:', chatMessage);
      socket.emit('chatMessage', chatMessage);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, chatMessages, sendChatMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);