import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  followers: string[];
  following: string[];
}

interface ProfileProps {
  user: User | null;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [profile, setProfile] = useState<User | null>(null);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/${user.username}`);
      setProfile(response.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h1>{profile.firstName} {profile.lastName}</h1>
      <p>Username: {profile.username}</p>
      <p>Email: {profile.email}</p>
      <p>Followers: {profile.followers.length}</p>
      <p>Following: {profile.following.length}</p>
      <button onClick={() => navigate('/profile/edit')}>Edit Profile</button>
    </div>
  );
};

export default Profile;