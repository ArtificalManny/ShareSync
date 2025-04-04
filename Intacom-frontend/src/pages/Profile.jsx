import { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/ArtificalManny`);
        setUser(response.data.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load profile data. Please try again later or log in again.');
      }
    };
    fetchUser();
  }, []);

  if (error) {
    return (
      <div className="profile">
        <h1>Profile</h1>
        <p className="error">{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!user) {
    return <div className="profile">Loading...</div>;
  }

  return (
    <div className="profile">
      <h1>Profile</h1>
      <div className="profile-details">
        <img
          src={user.profilePic || 'https://via.placeholder.com/150'}
          alt="Profile"
          style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <h2>{user.username}</h2>
        <p>Email: {user.email}</p>
        <p>Name: {user.firstName} {user.lastName}</p>
        <p>Gender: {user.gender}</p>
        <p>Birthday: {user.birthday.month}/{user.birthday.day}/{user.birthday.year}</p>
        <p>Points: {user.points || 0}</p>
      </div>
    </div>
  );
}

export default Profile;