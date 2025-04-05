import { useState, useEffect } from 'react';
import axios from 'axios';
import { theme } from '../styles/theme';
import './Profile.css';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthday: { month: string; day: string; year: string };
  points: number;
  profilePic?: string;
  followers?: string[];
  following?: string[];
}

interface ProfileProps {
  user: User | null;
}

function Profile({ user }: ProfileProps) {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        setError('Please log in to view your profile.');
        return;
      }
      try {
        console.log('Fetching profile for username:', user.username);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/${user.username}`);
        console.log('Profile fetch response:', response.data);
        setProfileUser(response.data.data);
        setError(null);
        alert('Profile loaded successfully!');
      } catch (error: any) {
        console.error('Error fetching user:', error.response?.data || error.message);
        if (error.response?.status === 404) {
          setError('User not found. Please check your account or log in again.');
        } else if (error.response?.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Failed to load profile data. Please try again later or log in again.');
        }
      }
    };
    fetchUser();
  }, [user]);

  if (error) {
    return (
      <div className="profile">
        <h1 style={{ color: theme.colors.primary }}>Profile</h1>
        <p className="error" style={{ color: theme.colors.error }}>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!profileUser) {
    return <div className="profile">Loading...</div>;
  }

  return (
    <div className="profile">
      <h1 style={{ color: theme.colors.primary }}>Profile</h1>
      <div className="profile-details">
        <img
          src={profileUser.profilePic || 'https://via.placeholder.com/150'}
          alt="Profile"
          style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <h2 style={{ color: theme.colors.secondary }}>{profileUser.username}</h2>
        <p><strong>Email:</strong> {profileUser.email}</p>
        <p><strong>Name:</strong> {profileUser.firstName} {profileUser.lastName}</p>
        <p><strong>Gender:</strong> {profileUser.gender}</p>
        <p><strong>Birthday:</strong> {profileUser.birthday.month}/{profileUser.birthday.day}/{profileUser.birthday.year}</p>
        <p><strong>Points:</strong> {profileUser.points || 0}</p>
        <p><strong>Followers:</strong> {profileUser.followers?.length || 0}</p>
        <p><strong>Following:</strong> {profileUser.following?.length || 0}</p>
      </div>
    </div>
  );
}

export default Profile;