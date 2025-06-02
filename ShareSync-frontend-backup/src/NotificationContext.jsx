import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socket.on('notification', (data) => {
      setNotifications(prev => [...prev, data]);
    });

    return () => {
      socket.off('notification');
    };
  }, []);

  const removeNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications, removeNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};