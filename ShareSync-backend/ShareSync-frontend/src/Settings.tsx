import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id?: string;
  settings?: {
    emailNotifications: boolean;
    postNotifications: boolean;
    commentNotifications: boolean;
    likeNotifications: boolean;
    taskNotifications: boolean;
    memberRequestNotifications: boolean;
    theme: string;
    privacy: string;
  };
}

const Settings: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [postNotifications, setPostNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(true);
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [memberRequestNotifications, setMemberRequestNotifications] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [privacy, setPrivacy] = useState('public');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user && user.settings) {
      setEmailNotifications(user.settings.emailNotifications);
      setPostNotifications(user.settings.postNotifications);
      setCommentNotifications(user.settings.commentNotifications);
      setLikeNotifications(user.settings.likeNotifications);
      setTaskNotifications(user.settings.taskNotifications);
      setMemberRequestNotifications(user.settings.memberRequestNotifications);
      setTheme(user.settings.theme);
      setPrivacy(user.settings.privacy);
    }
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updatedUser = {
        ...user,
        settings: {
          emailNotifications,
          postNotifications,
          commentNotifications,
          likeNotifications,
          taskNotifications,
          memberRequestNotifications,
          theme,
          privacy,
        },
      };
      const response = await axios.put(`http://localhost:3000/users/${user?._id}`, updatedUser);
      const newUserData = response.data.data.user;
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
      setSuccessMessage('Settings updated successfully');
    } catch (error: any) {
      console.error('Settings update error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred while updating settings.');
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      <form onSubmit={handleSaveSettings}>
        <div className="section glassmorphic">
          <h3>Notification Preferences</h3>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
              Receive Email Notifications
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={postNotifications}
                onChange={(e) => setPostNotifications(e.target.checked)}
              />
              Notify on New Posts
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={commentNotifications}
                onChange={(e) => setCommentNotifications(e.target.checked)}
              />
              Notify on New Comments
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={likeNotifications}
                onChange={(e) => setLikeNotifications(e.target.checked)}
              />
              Notify on Likes
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={taskNotifications}
                onChange={(e) => setTaskNotifications(e.target.checked)}
              />
              Notify on Task Updates
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={memberRequestNotifications}
                onChange={(e) => setMemberRequestNotifications(e.target.checked)}
              />
              Notify on Member Requests
            </label>
          </div>
        </div>
        <div className="section glassmorphic">
          <h3>Appearance</h3>
          <div className="form-group">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
        <div className="section glassmorphic">
          <h3>Privacy</h3>
          <div className="form-group">
            <label htmlFor="privacy">Profile Visibility</label>
            <select
              id="privacy"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="connections">Connections Only</option>
            </select>
          </div>
        </div>
        <button type="submit" className="neumorphic">Save Settings</button>
      </form>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
    </div>
  );
};

export default Settings;