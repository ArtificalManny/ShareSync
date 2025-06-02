import React, { useContext } from 'react';
import { NotificationContext } from '../NotificationContext';
import { X, Trash2 } from 'lucide-react';
import './NotificationToast.css';

const NotificationToast = () => {
  const { notifications, removeNotification, clearNotifications } = useContext(NotificationContext);

  return (
    <div className="notification-toast-container">
      {notifications.length > 0 && (
        <div className="notification-header flex justify-between items-center mb-2">
          <span className="text-neon-magenta font-orbitron font-semibold">Notifications</span>
          <button
            onClick={clearNotifications}
            className="text-holo-silver hover:text-neon-magenta transition-colors focus:outline-none focus:ring-2 focus:ring-holo-silver"
            aria-label="Clear all notifications"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
      {notifications.map((notif, index) => (
        <div key={index} className="notification-toast card glassmorphic animate-slide-in">
          <div className="flex justify-between items-center">
            <span className="text-light-text font-inter">{notif.message}</span>
            <button
              onClick={() => removeNotification(index)}
              className="text-holo-silver focus:outline-none focus:ring-2 focus:ring-holo-silver"
              aria-label="Close notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-cyber-teal text-sm font-inter">{new Date(notif.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;