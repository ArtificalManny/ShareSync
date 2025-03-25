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
  const [successMessage, setSuccessMessage] = useState('');

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
    setSuccessMessage('');
    try {
      const updatedUser = { ...user, firstName, lastName, email };
      const response = await axios.put(`http://localhost:3000/users/${user?._id}`, updatedUser);
      setUser(response.data.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      setSuccessMessage('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during profile update');
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post<{ url: string }>('http://localhost:3000/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const profilePicUrl = response.data.url;
        const updatedUser = { ...user, profilePic: profilePicUrl };
        await axios.put(`http://localhost:3000/users/${user?._id}`, updatedUser);
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setSuccessMessage('Profile picture updated successfully');
      } catch (error: any) {
        console.error('Profile picture upload error:', error.response?.data || error.message);
        setErrorMessage(error.response?.data?.error || 'An error occurred during profile picture upload');
      }
    }
  };

  if (!user) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Please log in to view your profile.</div>;
  }

  console.log('Rendering Profile page');
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '1rem' }}>Profile</h2>
      <div
        style={{
          background: 'var(--card-background)',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          marginBottom: '2rem',
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
        }}
      >
        <label htmlFor="profilePicUpload" className="profile-pic-label">
          {user.profilePic ? (
            <img
              src={user.profilePic}
              alt="Profile"
              style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)' }}
            />
          ) : (
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'var(--secondary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'var(--text-color)',
                border: '3px solid var(--primary-color)',
              }}
            >
              {user.firstName ? user.firstName[0] : user.username[0]}
            </div>
          )}
          <input
            id="profilePicUpload"
            type="file"
            accept="image/*"
            onChange={handleProfilePicUpload}
            style={{ display: 'none' }}
          />
        </label>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
            {user.firstName} {user.lastName}
          </h3>
          <p style={{ margin: '0 0 0.5rem 0', opacity: 0.8 }}>@{user.username}</p>
          <p style={{ margin: '0', opacity: 0.8 }}>{user.email}</p>
        </div>
      </div>
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
        <button type="submit">Update Profile</button>
      </form>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && (
        <div style={{ color: '#4caf50', textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem' }}>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default Profile;