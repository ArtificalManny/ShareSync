import { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

function Profile({ user }) {
  const [profileUser, setProfileUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        setError('Please log in to view your profile.');
        return;
      }
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/${user.username}`);
        setProfileUser(response.data.data);
        setError(null);
        // Provide a dopamine hit with a success notification
        alert('Profile loaded successfully!');
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load profile data. Please try again later or log in again.');
      }
    };
    fetchUser();
  }, [user]);

  if (error) {
    return (
      <div className="profile">
        <h1>Profile</h1>
        <p className="error">{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!profileUser) {
    return <div className="profile">Loading...</div>;
  }

  return (
    <div className="profile">
      <h1>Profile</h1>
      <div className="profile-details">
        <img
          src={profileUser.profilePic || 'https://via.placeholder.com/150'}
          alt="Profile"
          style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <h2>{profileUser.username}</h2>
        <p>Email: {profileUser.email}</p>
        <p>Name: {profileUser.firstName} {profileUser.lastName}</p>
        <p>Gender: {profileUser.gender}</p>
        <p>Birthday: {profileUser.birthday.month}/{profileUser.birthday.day}/{profileUser.birthday.year}</p>
        <p>Points: {profileUser.points || 0}</p>
      </div>
    </div>
  );
}

export default Profile;