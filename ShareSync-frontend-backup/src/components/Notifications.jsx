import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Notifications - Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const handleClearNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/clear`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications([]);
    } catch (error) {
      console.error('Notifications - Error clearing notifications:', error);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      color: 'white', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#e94560', marginBottom: '20px', textAlign: 'center' }}>Notifications</h1>
      <button
        onClick={handleClearNotifications}
        style={{
          backgroundColor: '#e94560',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          display: 'block',
          margin: '0 auto 20px',
          transition: 'background-color 0.3s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#ff6b81'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#e94560'}
      >
        Clear Notifications
      </button>
      <div>
        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No notifications available.</p>
        ) : (
          notifications.map((notification, index) => (
            <div 
              key={index} 
              style={{ 
                backgroundColor: '#16213e', 
                padding: '10px', 
                margin: '10px 0', 
                borderRadius: '5px',
                boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                transition: 'transform 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <p style={{ margin: 0 }}>{notification.message}</p>
              <small style={{ color: '#a0a0a0' }}>{new Date(notification.createdAt).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;