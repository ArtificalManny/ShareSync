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

    const newSocket = io('http://localhost:3001', {
      auth: { token: localStorage.getItem('token') },
    });
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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`);
      setNotifications(response.data.data || []);
    } catch (err: any) {
      console.error('Notifications.tsx: Error fetching notifications:', err.message);
      setError('Failed to load notifications. Please ensure you are logged in and try again.');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/notifications/mark-as-read/${id}`, {});
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
        <h1 style={styles.heading}>🔔 Notifications - ShareSync</h1>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>🔔 Notifications - ShareSync</h1>
      {notifications.length > 0 ? (
        <ul style={styles.notificationList}>
          {notifications.map((notification) => (
            <li
              key={notification._id}
              style={{
                ...styles.notificationItem,
                background: notification.read
                  ? 'linear-gradient(145deg, #2A2A4A, #3F3F6A)'
                  : 'linear-gradient(145deg, #3F3F6A, #4F4F8A)',
              }}
            >
              <p style={styles.text}>{notification.content}</p>
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
        <p style={styles.text}>No notifications yet.</p>
      )}
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    minHeight: '100vh',
    animation: 'fadeIn 1s ease-in-out',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '32px',
    textAlign: 'center',
    marginBottom: '30px',
    textShadow: '0 0 15px #A2E4FF',
  },
  notificationList: {
    listStyleType: 'none',
    padding: 0,
  },
  notificationItem: {
    padding: '20px',
    marginBottom: '15px',
    borderRadius: '12px',
    border: '1px solid #A2E4FF',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  notificationDate: {
    fontSize: '12px',
    color: '#A2E4FF',
    marginTop: '5px',
    fontFamily: '"Orbitron", sans-serif',
  },
  markAsReadButton: {
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
    marginTop: '10px',
  },
  error: {
    color: '#FF6F91',
    fontFamily: '"Orbitron", sans-serif',
  },
  text: {
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
  },
};

// Add animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  li:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.7);
  }
`, styleSheet.cssRules.length);

export default Notifications;