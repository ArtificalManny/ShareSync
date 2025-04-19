import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface Notification {
  _id: string;
  message: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setNotifications(response.data);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div>
      <h2>Notifications</h2>
      {notifications.map((notification) => (
        <div key={notification._id}>{notification.message}</div>
      ))}
    </div>
  );
};

export default Notifications;