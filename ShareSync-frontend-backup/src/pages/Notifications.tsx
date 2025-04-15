import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface Notification {
  _id: string;
  recipient: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const Notifications: React.FC<{ user: User }> = ({ user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
      auth: { token: localStorage.getItem('token') },
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Notifications.tsx: Connected to WebSocket server');
      newSocket.emit('joinUser', user._id);
    });

    newSocket.on('newNotification', (notification: Notification) => {
      console.log('Notifications.tsx: New notification received:', notification);
      setNotifications((prevNotifications) => [notification, ...prevNotifications]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user._id]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/notifications/${user._id}`);
        setNotifications(response.data.data);
      } catch (err) {
        console.error('Notifications.tsx: Error fetching notifications:', err);
      }
    };

    fetchNotifications();
  }, [user._id]);

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/notifications/mark-as-read/${id}`);
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Notifications.tsx: Error marking notification as read:', err);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Notifications</h1>
      <ul style={styles.list}>
        {notifications.map((notification) => (
          <li
            key={notification._id}
            style={{
              ...styles.listItem,
              background: notification.read ? 'rgba(162, 228, 255, 0.05)' : 'rgba(162, 228, 255, 0.2)',
            }}
            onClick={() => !notification.read && markAsRead(notification._id)}
          >
            <span style={styles.message}>{notification.message}</span>
            <span style={styles.date}>
              {new Date(notification.createdAt).toLocaleString()}
            </span>
            {!notification.read && <span style={styles.unreadDot}></span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '40px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '36px',
    textShadow: '0 0 15px #A2E4FF',
    marginBottom: '40px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    width: '100%',
    maxWidth: '600px',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    marginBottom: '10px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    boxShadow: '0 0 10px rgba(162, 228, 255, 0.3)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
  },
  message: {
    fontSize: '16px',
    flex: 1,
  },
  date: {
    fontSize: '14px',
    color: '#FF6F91',
    marginLeft: '20px',
  },
  unreadDot: {
    width: '10px',
    height: '10px',
    backgroundColor: '#FF6F91',
    borderRadius: '50%',
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    boxShadow: '0 0 5px #FF6F91',
  },
};

// Add hover effect
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  li:hover {
    transform: scale(1.02);
    box-shadow: 0 0 15px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default Notifications;