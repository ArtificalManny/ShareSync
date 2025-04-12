import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Notification {
  _id: string;
  message: string;
  read: boolean;
}

interface User {
  _id: string;
}

interface NotificationsProps {
  user: User | null;
}

const Notifications: React.FC<NotificationsProps> = ({ user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`);
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/notifications/mark-as-read/${id}`);
      setNotifications(notifications.map((notif) =>
        notif._id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  return (
    <div>
      <h1>Notifications</h1>
      {notifications.map((notification) => (
        <div key={notification._id}>
          <p>{notification.message}</p>
          <p>{notification.read ? 'Read' : 'Unread'}</p>
          {!notification.read && (
            <button onClick={() => markAsRead(notification._id)}>Mark as Read</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Notifications;