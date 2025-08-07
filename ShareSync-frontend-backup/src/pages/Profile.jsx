// /src/pages/Profile.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { fetchLeaderboard } from '../services/project';
import { fetchUser } from '../services/auth';
import axios from 'axios';
import { Award } from 'lucide-react';
import "../index.css";

// Utility
const getTierFromXP = (xp) => {
  if (xp >= 2000) return "Legend";
  if (xp >= 1000) return "Elite";
  if (xp >= 500) return "Rising Star";
  return "Novice";
};

const XPProgressRing = ({ xp }) => {
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(xp / 2000, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} className="mx-auto block">
      <circle stroke="#ccc" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
      <circle stroke="#FFD700" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius}
        strokeDasharray={circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        className="text-xs font-bold text-gray-800">{xp} XP</text>
    </svg>
  );
};

const Profile = () => {
  const { username } = useParams();
  const { user, socket } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [hasFailed, setHasFailed] = useState(false);

  const isOwner = user?.username?.toLowerCase() === username?.toLowerCase();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let response;

        if (isOwner) {
          response = await fetchUser(); // own profile
        } else {
          const res = await axios.get(`/api/users/public/${username}`);
          response = res.data;
        }

        setProfile(response);
        setUserPoints(response.points || 0);

        if (response.projects?.length > 0) {
          const boards = await Promise.all(response.projects.map(p => fetchLeaderboard(p._id)));
          const flat = boards.flat();
          const aggregated = {};

          flat.forEach(entry => {
            if (aggregated[entry.email]) {
              aggregated[entry.email].points += entry.points;
            } else {
              aggregated[entry.email] = { ...entry };
            }
          });

          const top = Object.values(aggregated).sort((a, b) => b.points - a.points).slice(0, 3);
          setLeaderboard(top);
        }

      } catch (err) {
        setError('Profile failed to load: ' + (err.response?.data?.message || err.message));
        setHasFailed(true);
      }
    };

    fetchProfile();

    if (socket) {
      socket.on('profile-updated', (data) => {
        if (data.user.username === username) fetchProfile();
      });
      socket.on('project-updated', fetchProfile);
      return () => {
        socket.off('profile-updated');
        socket.off('project-updated');
      };
    }
  }, [username, user, socket]);

  if (hasFailed) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg font-orbitron mb-4">{error}</p>
          <Link to="/" className="text-indigo-500 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!profile) return null; // blank until loaded

  if (!isOwner && !profile.publicProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 text-lg font-orbitron mb-4">This profile is private.</p>
          <Link to="/" className="text-indigo-500 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="relative glassmorphic text-center py-8 px-4">
        <img src={profile.profilePicture || 'https://via.placeholder.com/150'} alt="Profile"
          className="w-24 h-24 rounded-full border-4 mx-auto shadow-md" />
        <XPProgressRing xp={userPoints} />
        <div className="mt-2 font-orbitron text-lg text-indigo-600">🎖️ Tier: {getTierFromXP(userPoints)}</div>
        <div className="text-yellow-500 font-orbitron">🔥 Streak: {profile.streakDays || 0} days</div>
      </div>

      <div className="mt-6">
        <h3 className="font-orbitron text-xl text-center text-gray-700 dark:text-gray-300 mb-4">Top Projects</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-4">
          {leaderboard.map((entry, index) => (
            <div key={index} className="p-4 rounded-lg glassmorphic border border-gray-200 shadow-md">
              <div className="flex items-center gap-3">
                <Award className="text-indigo-500" />
                <div>
                  <p className="font-bold text-gray-800 dark:text-white">{entry.firstName || entry.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">{entry.points} XP</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
