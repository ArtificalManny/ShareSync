import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>ShareSync</div>
      <div style={styles.navLinks}>
        <button onClick={() => handleNavigation('/')} style={styles.navButton}>
          <span style={styles.icon}>🏠</span> Home
        </button>
        <button onClick={() => handleNavigation('/profile')} style={styles.navButton}>
          <span style={styles.icon}>👤</span> Profile
        </button>
        <button onClick={() => handleNavigation('/projects')} style={styles.navButton}>
          <span style={styles.icon}>📂</span> Projects
        </button>
        <button onClick={() => handleNavigation('/notifications')} style={styles.navButton}>
          <span style={styles.icon}>🔔</span> Notifications
        </button>
        <button onClick={() => handleNavigation('/leaderboard')} style={styles.navButton}>
          <span style={styles.icon}>🏆</span> Leaderboard
        </button>
        <button onClick={() => handleNavigation('/logout')} style={styles.navButton}>
          <span style={styles.icon}>🚪</span> Logout
        </button>
      </div>
    </nav>
  );
};

// Inline styles
const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(90deg, #1A3C34, #00C4B4)',
    padding: '10px 20px',
    color: '#FFFFFF',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  navLinks: {
    display: 'flex',
    gap: '15px',
  },
  navButton: {
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  icon: {
    fontSize: '18px',
  },
};

export default Header;