import { useState, useEffect } from 'react';
import axios from 'axios';
import { theme } from '../styles/theme';
import './Leaderboard.css';

interface Leader {
  _id: string;
  username: string;
  points: number;
}

function Leaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/points/leaderboard`);
        setLeaders(response.data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };
    fetchLeaders();
  }, []);

  return (
    <div className="leaderboard">
      <h1 style={{ color: theme.colors.primary }}>Leaderboard</h1>
      {leaders.length === 0 ? (
        <p>No leaders yet.</p>
      ) : (
        leaders.map((leader, index) => (
          <div key={leader._id} className="leader">
            <p><strong>#{index + 1}</strong> {leader.username} - {leader.points} points</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Leaderboard;