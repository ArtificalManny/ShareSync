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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/points/leaderboard`, {
        withCredentials: true,
      });
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
        <h1>🏆 Leaderboard - ShareSync</h1>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>🏆 Leaderboard - ShareSync</h1>
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
        <p>No leaderboard data available.</p>
      )}
    </div>
  );
};

// Inline styles with the new color palette
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#2B3A67', // Deep Blue
    color: '#FFFFFF', // White text
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#3F51B5', // Indigo
    padding: '10px',
    textAlign: 'left',
    borderBottom: '2px solid #E3F2FD', // Soft Blue
  },
  tableRow: {
    borderBottom: '1px solid #E3F2FD', // Soft Blue
  },
  tableCell: {
    padding: '10px',
    textAlign: 'left',
  },
  error: {
    color: '#FF6F61', // Coral
  },
};

export default Leaderboard;