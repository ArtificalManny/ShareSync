import { useState, useEffect } from 'react';
import axios from 'axios';
import './Notifications.css';

interface User {
  _id: string;
}

interface Notification {
  _id: string;
  message: string;
  createdAt: string;
  read: boolean;
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
        console.log('Fetching notifications for user ID:', user._id);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`);
        console.log('Notifications fetch response:', response.data);
        setNotifications(response.data);
      } catch (error: any) {
        console.error('Error fetching notifications:', error.response?.data || error.message);
      }
    };
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/notifications/mark-as-read/${id}`);
      setNotifications(notifications.map((notification) =>
        notification._id === id ? { ...notification, read: true } : notification
      ));
    } catch (error: any) {
      console.error('Error marking notification as read:', error.response?.data || error.message);
    }
  };

  return (
    <div className="notifications">
      <h1>Notifications</h1>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification._id}
            className={`notification ${notification.read ? 'read' : 'unread'}`}
            onClick={() => !notification.read && markAsRead(notification._id)}
          >
            <p>{notification.message}</p>
            <span>{new Date(notification.createdAt).toLocaleString()}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;