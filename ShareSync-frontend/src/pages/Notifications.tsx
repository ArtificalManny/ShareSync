import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface Notification {
  _id: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
}

interface NotificationsProps {
  user: User | null;
}

const Notifications: React.FC<NotificationsProps> = ({ user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:3001', { withCredentials: true });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Notifications.tsx: WebSocket connected');
      newSocket.emit('joinUser', { userId: user._id });
    });

    newSocket.on('notificationCreated', (notification: Notification) => {
      console.log('Notifications.tsx: Received notificationCreated event:', notification);
      setNotifications((prev) => [...prev, notification]);
    });

    return () => {
      newSocket.disconnect();
      console.log('Notifications.tsx: WebSocket disconnected');
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) {
      setError('Please log in to view notifications.');
      return;
    }
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`, {
        withCredentials: true,
      });
      setNotifications(response.data.data || []);
    } catch (err: any) {
      console.error('Notifications.tsx: Error fetching notifications:', err.message);
      setError('Failed to load notifications. Please try again later.');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/notifications/mark-as-read/${id}`, {}, {
        withCredentials: true,
      });
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === id ? { ...notif, read: true } : notif))
      );
    } catch (err: any) {
      console.error('Notifications.tsx: Error marking notification as read:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Notifications</h1>
      {notifications.length > 0 ? (
        <ul style={styles.notificationList}>
          {notifications.map((notification) => (
            <li
              key={notification._id}
              style={{
                ...styles.notificationItem,
                backgroundColor: notification.read ? '#1A3C34' : '#263238',
              }}
            >
              <p>{notification.content}</p>
              <p style={styles.notificationDate}>
                {new Date(notification.createdAt).toLocaleString()}
              </p>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification._id)}
                  style={styles.markAsReadButton}
                >
                  Mark as Read
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No notifications yet.</p>
      )}
    </div>
  );
};

// Inline styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#0A192F',
    color: '#FFFFFF',
  },
  notificationList: {
    listStyleType: 'none',
    padding: 0,
  },
  notificationItem: {
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #B0BEC5',
  },
  notificationDate: {
    fontSize: '12px',
    color: '#B0BEC5',
    marginTop: '5px',
  },
  markAsReadButton: {
    backgroundColor: '#00C4B4',
    color: '#FFFFFF',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px',
  },
  error: {
    color: '#EF5350',
  },
};

export default Notifications;