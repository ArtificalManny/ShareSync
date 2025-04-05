import { useState, useEffect } from 'react';
import axios from 'axios';
import { theme } from '../styles/theme';
import './Notifications.css';

interface User {
  _id: string;
  username: string;
}

interface Notification {
  _id: string;
  message: string;
  createdAt: string;
}

interface NotificationsProps {
  user: User | null;
}

function Notifications({ user }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`);
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, [user]);

  return (
    <div className="notifications">
      <h1 style={{ color: theme.colors.primary }}>Notifications</h1>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        notifications.map((notification) => (
          <div key={notification._id} className="notification">
            <p>{notification.message}</p>
            <p>{new Date(notification.createdAt).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;