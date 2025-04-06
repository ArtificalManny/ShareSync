import { useState, useEffect } from 'react';
import axios from 'axios';
import './Leaderboard.css';

interface User {
  username: string;
  points: number;
}

function Leaderboard() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/points/leaderboard`);
        setUsers(response.data);
      } catch (error: any) {
        console.error('Error fetching leaderboard:', error.response?.data || error.message);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="leaderboard">
      <h1>Leaderboard</h1>
      {users.length === 0 ? (
        <p>No users on the leaderboard yet.</p>
      ) : (
        <ul>
          {users.map((user, index) => (
            <li key={user.username} className={index < 3 ? `top-${index + 1}` : ''}>
              <span>{index + 1}. {user.username}</span>
              <span>{user.points} points</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Leaderboard;