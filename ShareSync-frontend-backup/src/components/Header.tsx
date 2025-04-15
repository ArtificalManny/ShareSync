import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface HeaderProps {
  user: { _id: string; username: string; email: string };
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`);
        const unread = response.data.data.filter((notif: any) => !notif.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Header.tsx: Error fetching unread notifications:', err);
      }
    };

    fetchUnreadCount();
  }, [user._id]);

  return (
    <header style={styles.container}>
      <h1 style={styles.title}>ShareSync</h1>
      <nav style={styles.nav}>
        <a href="/" style={styles.link}>Home</a>
        <a href="/profile" style={styles.link}>Profile</a>
        <a href="/projects" style={styles.link}>Projects</a>
        <div style={styles.notificationWrapper}>
          <a href="/notifications" style={styles.link}>
            Notifications
            {unreadCount > 0 && (
              <span style={styles.notificationBadge}>
                {unreadCount}
              </span>
            )}
          </a>
        </div>
        <a href="/leaderboard" style={styles.link}>Leaderboard</a>
        <a href="/logout" style={styles.link}>Logout</a>
      </nav>
    </header>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: 'rgba(30, 30, 47, 0.9)',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 0 20px rgba(162, 228, 255, 0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  title: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '24px',
    color: '#A2E4FF',
    textShadow: '0 0 10px #A2E4FF',
  },
  nav: {
    display: 'flex',
    gap: '20px',
  },
  link: {
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
    textDecoration: 'none',
    fontSize: '16px',
    transition: 'color 0.3s ease, text-shadow 0.3s ease',
  },
  notificationWrapper: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-10px',
    backgroundColor: '#FF6F91',
    color: '#1E1E2F',
    borderRadius: '50%',
    padding: '2px 6px',
    fontSize: '12px',
    boxShadow: '0 0 10px #FF6F91',
    animation: 'pulse 1.5s infinite',
  },
};

// Add keyframes for animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 10px #FF6F91; }
    50% { transform: scale(1.1); box-shadow: 0 0 15px #FF6F91; }
    100% { transform: scale(1); box-shadow: 0 0 10px #FF6F91; }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  a:hover {
    color: #FF6F91;
    text-shadow: 0 0 10px #FF6F91;
  }
`, styleSheet.cssRules.length);

export default Header;