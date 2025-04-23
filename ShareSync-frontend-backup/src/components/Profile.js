import React, { useState, useEffect } from 'react';
import { getProfile } from '../services/user.service';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        setUser(profile);
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      }
    };
    fetchProfile();
  }, []);

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Profile</h2>
      <p>Name: {user.firstName} {user.lastName}</p>
      <p>Email: {user.email}</p>
      <p>Username: {user.username}</p>
      <p>Gender: {user.gender}</p>
      <p>Birthday: {user.birthday.month}/{user.birthday.day}/{user.birthday.year}</p>
      {user.profilePicture && (
        <img src={user.profilePicture} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
      )}
    </div>
  );
};

export default Profile;