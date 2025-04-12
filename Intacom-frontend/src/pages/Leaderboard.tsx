import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LeaderboardEntry {
  username: string;
  points: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/points/leaderboard`);
      setLeaderboard(response.data.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div>
      <h1>Leaderboard</h1>
      {leaderboard.map((entry, index) => (
        <div key={index}>
          <p>{index + 1}. {entry.username} - {entry.points} points</p>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;