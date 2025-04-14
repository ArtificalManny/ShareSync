import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LeaderboardEntry {
  username: string;
  points: number;
  rank: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/points/leaderboard`);
      setLeaderboard(response.data.data || []);
    } catch (err: any) {
      console.error('Leaderboard.tsx: Error fetching leaderboard:', err.message);
      setError('Failed to load leaderboard. Please ensure you are logged in and try again.');
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>🏆 Leaderboard - ShareSync</h1>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>🏆 Leaderboard - ShareSync</h1>
      {leaderboard.length > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Rank</th>
              <th style={styles.tableHeader}>Username</th>
              <th style={styles.tableHeader}>Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.username} style={styles.tableRow}>
                <td style={styles.tableCell}>{entry.rank}</td>
                <td style={styles.tableCell}>{entry.username}</td>
                <td style={styles.tableCell}>{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={styles.text}>No leaderboard data available.</p>
      )}
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    minHeight: '100vh',
    animation: 'fadeIn 1s ease-in-out',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '32px',
    textAlign: 'center',
    marginBottom: '30px',
    textShadow: '0 0 15px #A2E4FF',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'linear-gradient(145deg, #2A2A4A, #3F3F6A)',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(162, 228, 255, 0.3)',
    border: '1px solid #A2E4FF',
  },
  tableHeader: {
    background: 'linear-gradient(145deg, #3F3F6A, #4F4F8A)',
    padding: '15px',
    textAlign: 'left',
    borderBottom: '2px solid #A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
    textShadow: '0 0 5px #A2E4FF',
  },
  tableRow: {
    borderBottom: '1px solid #A2E4FF',
    transition: 'background 0.3s ease',
  },
  tableCell: {
    padding: '15px',
    textAlign: 'left',
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
  },
  error: {
    color: '#FF6F91',
    fontFamily: '"Orbitron", sans-serif',
  },
  text: {
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
  },
};

// Add animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  tr:hover {
    background: linear-gradient(145deg, #3F3F6A, #4F4F8A);
  }
`, styleSheet.cssRules.length);

export default Leaderboard;