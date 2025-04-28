import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, updateNotificationPreferences } from '../services/user.service';
import { getProjects } from '../services/project.service';
import { toast } from 'react-toastify';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editingNotifications, setEditingNotifications] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    job: '',
    school: '',
    profilePicture: '',
    bannerPicture: '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    smsNotifications: true,
    projectUpdates: true,
    taskAssignments: true,
    comments: true,
    fileUploads: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userData = await getUserProfile();
        console.log('Profile - Fetched profile:', userData);
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          username: userData.username || '',
          email: userData.email || '',
          job: userData.job || '',
          school: userData.school || '',
          profilePicture: userData.profilePicture || '',
          bannerPicture: userData.bannerPicture || '',
        });
        setNotificationPrefs(userData.notificationPreferences || notificationPrefs);

        const projectData = await getProjects();
        console.log('Profile - Fetched projects:', projectData);
        setProjects(projectData);
      } catch (error) {
        console.error('Profile - Error fetching profile:', error);
        toast.error('Failed to load profile data', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationPrefs({ ...notificationPrefs, [name]: checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await updateUserProfile(formData);
      console.log('Profile - Updated profile:', updatedUser);
      setUser(updatedUser);
      setEditing(false);
    } catch (error) {
      console.error('Profile - Error updating profile:', error);
      toast.error('Failed to update profile', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await updateNotificationPreferences(notificationPrefs);
      console.log('Profile - Updated notification preferences:', updatedUser);
      setUser(updatedUser);
      setEditingNotifications(false);
    } catch (error) {
      console.error('Profile - Error updating notification preferences:', error);
      toast.error('Failed to update notification preferences', { position: 'top-right', autoClose: 3000 });
    }
  };

  const categorizeProjects = () => {
    const categories = { School: [], Job: [], Personal: [] };
    projects.forEach(project => {
      if (categories[project.category]) {
        categories[project.category].push(project);
      }
    });
    return categories;
  };

  const categorizedProjects = categorizeProjects();

  if (!user) return <div style={{ color: 'white', textAlign: 'center', padding: '20px', background: '#0d1a26', minHeight: '100vh' }}>Loading...</div>;

  return (
    <div style={{ padding: '30px', color: 'white', animation: 'fadeIn 1s ease-in-out' }}>
      <h2 style={{
        color: '#00d1b2',
        marginBottom: '30px',
        fontWeight: 'bold',
        fontSize: '2.5em',
        textShadow: '0 2px 4px rgba(0, 209, 178, 0.5)',
      }}>{user.firstName} {user.lastName}'s Profile</h2>
      <div style={{ marginBottom: '30px', position: 'relative' }}>
        <img
          src={user.bannerPicture || 'https://via.placeholder.com/1200x300?text=Banner+Image'}
          alt="Banner"
          style={{
            width: '100%',
            height: '300px',
            objectFit: 'cover',
            borderRadius: '15px',
            boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
            border: '2px solid #00d1b2',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        />
        <img
          src={user.profilePicture || 'https://via.placeholder.com/150?text=Profile+Image'}
          alt="Profile"
          style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            position: 'absolute',
            bottom: '-75px',
            left: '30px',
            border: '3px solid #00d1b2',
            boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        />
      </div>
      <div style={{ marginTop: '80px' }}>
        {editing ? (
          <form onSubmit={handleSubmit} style={{
            backgroundColor: '#1a2b3c',
            padding: '30px',
            borderRadius: '15px',
            marginBottom: '30px',
            boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
            border: '2px solid #00d1b2',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Job</label>
              <input
                type="text"
                name="job"
                value={formData.job}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>School</label>
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Profile Picture URL</label>
              <input
                type="text"
                name="profilePicture"
                value={formData.profilePicture}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Banner Picture URL</label>
              <input
                type="text"
                name="bannerPicture"
                value={formData.bannerPicture}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
            </div>
            <button type="submit" style={{
              padding: '12px 24px',
              background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1em',
              fontWeight: 'bold',
              marginRight: '10px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
              e.target.style.transform = 'scale(1)';
            }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #ff3860, #ff6347)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(255, 56, 96, 0.3)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 12px rgba(255, 56, 96, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 8px rgba(255, 56, 96, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <div style={{
            backgroundColor: '#1a2b3c',
            padding: '30px',
            borderRadius: '15px',
            marginBottom: '30px',
            boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
            border: '2px solid #00d1b2',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
          }}
          >
            <p style={{ marginBottom: '10px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>First Name:</strong> {user.firstName}</p>
            <p style={{ marginBottom: '10px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Last Name:</strong> {user.lastName}</p>
            <p style={{ marginBottom: '10px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Username:</strong> {user.username}</p>
            <p style={{ marginBottom: '10px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Email:</strong> {user.email}</p>
            <p style={{ marginBottom: '10px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Job:</strong> {user.job || 'Not specified'}</p>
            <p style={{ marginBottom: '20px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>School:</strong> {user.school || 'Not specified'}</p>
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 'bold',
                marginRight: '10px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Edit Profile
            </button>
            <button
              onClick={() => setEditingNotifications(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #6c63ff, #00d1b2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Notification Settings
            </button>
          </div>
        )}
        {editingNotifications && (
          <form onSubmit={handleNotificationSubmit} style={{
            backgroundColor: '#1a2b3c',
            padding: '30px',
            borderRadius: '15px',
            marginBottom: '30px',
            boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
            border: '2px solid #00d1b2',
            backdropFilter: 'blur(10px)',
          }}>
            <h3 style={{
              color: '#00d1b2',
              marginBottom: '20px',
              fontWeight: 'bold',
              fontSize: '1.5em',
              textShadow: '0 2px 4px rgba(0, 209, 178, 0.5)',
            }}>Notification Preferences</h3>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="emailNotifications"
                checked={notificationPrefs.emailNotifications}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Email Notifications</label>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="smsNotifications"
                checked={notificationPrefs.smsNotifications}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>SMS Notifications</label>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="projectUpdates"
                checked={notificationPrefs.projectUpdates}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Project Updates</label>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="taskAssignments"
                checked={notificationPrefs.taskAssignments}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Task Assignments</label>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="comments"
                checked={notificationPrefs.comments}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Comments</label>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="fileUploads"
                checked={notificationPrefs.fileUploads}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>File Uploads</label>
            </div>
            <button type="submit" style={{
              padding: '12px 24px',
              background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1em',
              fontWeight: 'bold',
              marginRight: '10px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
              e.target.style.transform = 'scale(1)';
            }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingNotifications(false)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #ff3860, #ff6347)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(255, 56, 96, 0.3)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 12px rgba(255, 56, 96, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 8px rgba(255, 56, 96, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
      <h3 style={{
        color: '#00d1b2',
        marginBottom: '20px',
        fontWeight: 'bold',
        fontSize: '1.8em',
        textShadow: '0 2px 4px rgba(0, 209, 178, 0.5)',
      }}>Projects</h3>
      {['School', 'Job', 'Personal'].map(category => (
        <div key={category} style={{ marginBottom: '30px' }}>
          <h4 style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.5em', marginBottom: '15px' }}>{category} Projects</h4>
          {categorizedProjects[category].length > 0 ? (
            categorizedProjects[category].map(project => (
              <div key={project._id} style={{
                backgroundColor: '#1a2b3c',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '15px',
                boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
                border: '1px solid #00d1b2',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
              }}
              >
                <p style={{ marginBottom: '5px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Title:</strong> {project.title}</p>
                <p style={{ marginBottom: '5px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Description:</strong> {project.description}</p>
                <p style={{ marginBottom: '5px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Status:</strong> {project.status}</p>
                <Link to={`/project/${project._id}`} style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.9em',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  marginTop: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
                }}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                  e.target.style.transform = 'scale(1)';
                }}
                >
                  View Details
                </Link>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '0.9em', color: '#a0a0a0' }}>No {category.toLowerCase()} projects found.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default Profile;