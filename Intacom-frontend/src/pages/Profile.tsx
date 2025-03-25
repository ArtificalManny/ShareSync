import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email?: string;
  gender?: string;
  birthday?: { month: string; day: string; year: string };
  profilePic?: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const updatedUser = { ...user, firstName, lastName, email };
      const response = await axios.put(`http://localhost:3000/users/${user?._id}`, updatedUser);
      setUser(response.data.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      alert('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during profile update');
    }
  };

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="intacom-profile">
      <div className="intacom-card">
        <h2>Profile</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <p>{user.username}</p>
          </div>
          <div className="form-group">
            <label>Profile Picture</label>
            {user.profilePic ? (
              <img src={user.profilePic} alt="Profile" className="profile-pic-large" />
            ) : (
              <p>No profile picture set</p>
            )}
          </div>
          <button type="submit" className="intacom-button">Update Profile</button>
        </form>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>
    </div>
  );
};

export default Profile;