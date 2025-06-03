import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { AlertCircle, X } from 'lucide-react';
import './NotificationToast.css';

const NotificationToast = () => {
  const { notifications, removeNotification, clearNotifications } = useContext(AuthContext);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (notifications.length > 0) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  if (!visible || notifications.length === 0) return null;

  return (
    <div className="notification-toast fixed top-4 right-4 z-50">
      <div className="card p-4 glassmorphic shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-orbitron font-semibold text-primary-blue">Notifications</h3>
          <button
            onClick={() => {
              clearNotifications();
              setVisible(false);
            }}
            className="text-neutral-gray hover:text-primary-blue focus:outline-none focus:ring-2 focus:ring-neutral-gray"
            aria-label="Clear all notifications"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notifications.map((notification, index) => (
            <div key={index} className="notification-item p-2 bg-accent-teal bg-opacity-20 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-neutral-gray" aria-hidden="true" />
                <p className="text-secondary-gray font-inter">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(index)}
                className="text-neutral-gray hover:text-primary-blue focus:outline-none focus:ring-2 focus:ring-neutral-gray"
                aria-label={`Remove notification ${index}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;