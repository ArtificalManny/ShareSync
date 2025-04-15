import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LeaderboardEntry {
  username: string;
  points: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/points/leaderboard`);
        setLeaderboard(response.data.data);
      } catch (err) {
        console.error('Leaderboard.tsx: Error fetching leaderboard:', err);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Leaderboard</h1>
      <ul style={styles.list}>
        {leaderboard.map((entry, index) => (
          <li key={index} style={styles.listItem}>
            <span style={styles.rank}>{index + 1}.</span>
            <span style={styles.username}>{entry.username}</span>
            <span style={styles.points}>{entry.points} points</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '40px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '36px',
    textShadow: '0 0 15px #A2E4FF',
    marginBottom: '40px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    width: '100%',
    maxWidth: '600px',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(162, 228, 255, 0.1)',
    padding: '15px 20px',
    marginBottom: '10px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    boxShadow: '0 0 10px rgba(162, 228, 255, 0.3)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  rank: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FF6F91',
  },
  username: {
    fontSize: '18px',
    flex: 1,
    marginLeft: '20px',
  },
  points: {
    fontSize: '18px',
    color: '#A2E4FF',
    textShadow: '0 0 5px #A2E4FF',
  },
};

// Add hover effect
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  li:hover {
    transform: scale(1.02);
    box-shadow: 0 0 15px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default Leaderboard;