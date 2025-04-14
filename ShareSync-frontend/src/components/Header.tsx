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

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(90deg, #1E1E2F, #2A2A4A)',
    padding: '15px 30px',
    color: '#A2E4FF',
    boxShadow: '0 0 20px rgba(162, 228, 255, 0.3)',
    borderBottom: '1px solid #A2E4FF',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  logo: {
    fontSize: '28px',
    fontWeight: 'bold',
    fontFamily: '"Orbitron", sans-serif',
    textShadow: '0 0 10px #A2E4FF',
  },
  navLinks: {
    display: 'flex',
    gap: '20px',
  },
  navButton: {
    background: 'none',
    border: 'none',
    color: '#A2E4FF',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: '"Orbitron", sans-serif',
    transition: 'color 0.3s ease, text-shadow 0.3s ease',
  },
  icon: {
    fontSize: '20px',
    color: '#FF6F91',
    textShadow: '0 0 5px #FF6F91',
  },
};

// Add hover effects via CSS
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  nav button:hover {
    color: #FF6F91;
    text-shadow: 0 0 10px #FF6F91;
  }
`, styleSheet.cssRules.length);

export default Header;