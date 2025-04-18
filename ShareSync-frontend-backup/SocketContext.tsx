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
    const newSocket = io('http://localhost:3001', { withCredentials: true });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && user) {
      socket.emit('join', user._id);
      socket.on('notification', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
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