import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { fetchLeaderboard } from '../services/project.js';
import { fetchUser } from '../services/auth.js';
import { Edit, X, Folder, Award, Star, AlertCircle } from 'lucide-react';
import "../index.css";
import axios from 'axios';

const getTierFromXP = (xp) => {
  if (xp >= 2000) return "Legend";
  if (xp >= 1000) return "Elite";
  if (xp >= 500) return "Rising Star";
  return "Novice";
};

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, updateUserProfile, socket, setUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    job: '',
    school: '',
    profilePicture: '',
    bannerPicture: '',
  });
  const [retryCount, setRetryCount] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (isLoading) return;

      if (!isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }

      if (!username) {
        setError('No username provided.');
        setHasFailed(true);
        return;
      }

      try {
        const response = await fetchUser();
        setProfile(response);
        setFormData({
          firstName: response.firstName || '',
          lastName: response.lastName || '',
          job: response.job || '',
          school: response.school || '',
          profilePicture: response.profilePicture || 'https://via.placeholder.com/150',
          bannerPicture: response.bannerPicture || 'https://via.placeholder.com/1200x300',
        });

        setUserPoints(response.points || 0);

        const projectLeaderboards = await Promise.all(
          response.projects.map(async (project) => {
            const response = await fetchLeaderboard(project._id);
            return response;
          })
        );

        const aggregated = {};
        projectLeaderboards.forEach(leaderboard => {
          leaderboard.forEach(entry => {
            if (aggregated[entry.email]) {
              aggregated[entry.email].points += entry.points;
            } else {
              aggregated[entry.email] = { ...entry };
            }
          });
        });

        const leaderboardArray = Object.values(aggregated).sort((a, b) => b.points - a.points).slice(0, 3);
        setLeaderboard(leaderboardArray);
      } catch (err) {
        setError('Failed to load profile: ' + (err.message || 'Please try again.'));
        setHasFailed(true);
      }
    };

    fetchProfile();

    if (socket) {
      socket.on('profile-updated', (data) => {
        if (data.user.username === username) {
          fetchProfile();
        }
      });

      socket.on('project-updated', (data) => {
        fetchProfile();
      });

      return () => {
        socket.off('profile-updated');
        socket.off('project-updated');
      };
    }
  }, [username, isAuthenticated, isLoading, navigate, socket]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(formData);
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile: ' + (err.message || 'Please try again.'));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      job: profile.job || '',
      school: profile.school || '',
      profilePicture: profile.profilePicture || 'https://via.placeholder.com/150',
      bannerPicture: profile.bannerPicture || 'https://via.placeholder.com/1200x300',
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/profile/upload-profile-picture', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status !== 201 && res.status !== 200) throw new Error('Failed to upload');
      const updatedUser = { ...user, profilePic: res.data.profilePic };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (err) {
      alert('Failed to upload profile picture');
    }
  };

  if (isLoading) {
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading profile"></div>
        <span className="text-saffron-yellow text-xl font-orbitron ml-4">Loading...</span>
      </div>
    );
  }

  if (authError || hasFailed) {
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-crimson-red text-lg font-orbitron mb-4">{authError || error}</p>
          <Link to="/" className="text-emerald-green hover:underline text-base font-orbitron focus:outline-none focus:ring-2 focus:ring-charcoal-gray">Return to Home</Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading profile"></div>
        <span className="text-saffron-yellow text-xl font-orbitron ml-4">Loading profile...</span>
      </div>
    );
  }

  const isOwner = user && user.username && user.username.toLowerCase() === username.toLowerCase();
  const projectsByCategory = {
    School: (profile.projects || []).filter(p => p.category === 'School') || [],
    Job: (profile.projects || []).filter(p => p.category === 'Job') || [],
    Personal: (profile.projects || []).filter(p => p.category === 'Personal') || [],
  };
  const publicProjects = (profile.projects || []).filter(p => p.status !== 'Completed').slice(0, 3);

  return (
    <div className="profile-container min-h-screen">
      <div className="profile-header relative glassmorphic">
        {/* Remaining JSX... */}

        {/* Add XP + Streak badges below username block */}
        <div className="flex items-center gap-3 mb-4 mt-4">
          <span className="text-indigo-vivid font-orbitron text-lg px-3 py-1 rounded-full bg-indigo-vivid/10 shadow">
            🎖️ Tier: {getTierFromXP(userPoints)}
          </span>
          <span className="text-saffron-yellow font-orbitron text-lg px-3 py-1 rounded-full bg-saffron-yellow/10 shadow">
            🔥 Streak: {profile.streakDays || 0} days
          </span>
        </div>

        {/* Optional: Most Productive Day placeholder */}
        {profile.activityLog && profile.activityLog.length > 0 && (
          <div className="text-lavender-gray font-inter text-md mt-2">
            📈 Most Productive Day: {/* Placeholder until getMostProductiveDay utility is hooked up */}
            {/* {getMostProductiveDay(profile.activityLog)} */} Thursday
          </div>
        )}

        {/* Remaining JSX continues... */}
      </div>
    </div>
  );
};

export default Profile;