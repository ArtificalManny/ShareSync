// src/pages/profile/PublicProfile.jsx - Week 9 Day 3-4
import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicProfileView from '../../components/profile/PublicProfileView';

/**
 * PublicProfile - Public profile page at /profile/:username
 * Fetches user data and displays public stats
 */
const PublicProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        
        // TODO: Replace with real API call
        // const response = await fetch(`/api/users/public/${username}`);
        // const data = await response.json();
        
        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockProfile = {
          username: username,
          name: username === 'manny' ? 'Manny Rivas' : 'Demo User',
          avatar: username === 'manny' ? '🚀' : '👤',
          bio: 'Building in public. Shipping every day.',
          streak: 127,
          totalXP: 15840,
          totalShips: 342,
          achievements: [
            { id: 1, icon: '🔥', title: '100-Day Streak', description: 'Shipped for 100 days straight', earnedAt: '2024-01-15' },
            { id: 2, icon: '⚡', title: '10K XP', description: 'Earned 10,000 XP total', earnedAt: '2024-01-10' },
            { id: 3, icon: '🏆', title: 'Early Adopter', description: 'Joined OpenShare beta', earnedAt: '2023-12-01' },
            { id: 4, icon: '🚀', title: 'Consistent Shipper', description: 'Shipped 50 tasks', earnedAt: '2024-01-05' },
            { id: 5, icon: '👑', title: 'Team Leader', description: 'Led 3 successful projects', earnedAt: '2023-12-20' }
          ]
        };
        
        setProfile(mockProfile);
      } catch (err) {
        console.error('Failed to fetch public profile:', err);
        setError('Profile not found');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchPublicProfile();
    }
  }, [username]);

  // If viewing own profile, redirect to /profile
  if (currentUser && currentUser.username === username) {
    return <Navigate to="/profile" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
        <p className="text-slate-400">The user @{username} doesn't exist.</p>
      </div>
    );
  }

  return <PublicProfileView profile={profile} />;
};

export default PublicProfile;
