import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id?: string;
  email?: string;
}

const Settings: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      // Fetch user settings if needed
    }
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // First, verify the current password by logging in
      await axios.post('http://localhost:3000/auth/login', {
        identifier: user?.email,
        password: currentPassword,
      });

      // If login succeeds, proceed with password reset
      const response = await axios.put('http://localhost:3000/auth/reset', {
        token: 'manual-reset', // In a real app, this would be a proper token
        newPassword,
      });
      setSuccessMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      console.error('Change password error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred while changing the password. Please ensure the backend server is running.');
    }
  };

  console.log('Rendering Settings page');
  return (
    <div className="settings-container">
      <h2>Settings</h2>
      <p>Manage your account settings here.</p>
      <div className="section glassmorphic">
        <h3>Change Password</h3>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </div>
          <button type="submit" className="neumorphic">Change Password</button>
        </form>
      </div>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default Settings;