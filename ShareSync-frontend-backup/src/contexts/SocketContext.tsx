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

interface SocketContextType {
  socket: Socket | null;
  notifications: Notification[];
}

const SocketContext = createContext<SocketContextType>({ socket: null, notifications: [] });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

      socket.on('connect_error', (error) => {
        console.error('SocketProvider: Connection error:', error);
      });

      socket.on('disconnect', () => {
        console.log('SocketProvider: Socket disconnected');
      });
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={{ socket, notifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);