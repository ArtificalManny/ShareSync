import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../services/user.service';
import { getProjects } from '../services/project.service';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(false);
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

        const projectData = await getProjects();
        console.log('Profile - Fetched projects:', projectData);
        setProjects(projectData);
      } catch (error) {
        console.error('Profile - Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  if (!user) return <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2 style={{
        color: '#00d1b2',
        marginBottom: '20px',
        fontWeight: 'bold',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      }}>{user.firstName} {user.lastName}'s Profile</h2>
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <img
          src={user.bannerPicture || 'https://via.placeholder.com/800x200'}
          alt="Banner"
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '5px',
            boxShadow: '0 4px 8px rgba(0, 209, 178, 0.1)',
            border: '1px solid #00d1b2',
            transition: 'transform 0.3s',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        />
        <img
          src={user.profilePicture || 'https://via.placeholder.com/150'}
          alt="Profile"
          style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            position: 'absolute',
            bottom: '-75px',
            left: '20px',
            border: '3px solid #00d1b2',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.3s',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        />
      </div>
      <div style={{ marginTop: '80px' }}>
        {editing ? (
          <form onSubmit={handleSubmit} style={{
            backgroundColor: '#1a2b3c',
            padding: '20px',
            borderRadius: '5px',
            marginBottom: '20px',
            boxShadow: '0 4px 8px rgba(0, 209, 178, 0.1)',
            border: '1px solid #00d1b2',
          }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px' }}>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px' }}>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px' }}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px' }}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px' }}>Job</label>
              <input
                type="text"
                name="job"
                value={formData.job}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px' }}>School</label>
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px' }}>Profile Picture URL</label>
              <input
                type="text"
                name="profilePicture"
                value={formData.profilePicture}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#00d1b2', display: 'block', marginBottom: '5px' }}>Banner Picture URL</label>
              <input
                type="text"
                name="bannerPicture"
                value={formData.bannerPicture}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
              />
            </div>
            <button type="submit" style={{
              padding: '10px 20px',
              background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px',
              transition: 'transform 0.1s, box-shadow 0.3s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.4)'}
            onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(45deg, #ff3860, #ff6347)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'transform 0.1s, box-shadow 0.3s',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(255, 56, 96, 0.4)'}
              onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'}
            >
              Cancel
            </button>
          </form>
        ) : (
          <div style={{
            backgroundColor: '#1a2b3c',
            padding: '20px',
            borderRadius: '5px',
            marginBottom: '20px',
            boxShadow: '0 4px 8px rgba(0, 209, 178, 0.1)',
            border: '1px solid #00d1b2',
            transition: 'transform 0.3s, box-shadow 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.1)';
          }}
          >
            <p><strong style={{ color: '#00d1b2' }}>First Name:</strong> {user.firstName}</p>
            <p><strong style={{ color: '#00d1b2' }}>Last Name:</strong> {user.lastName}</p>
            <p><strong style={{ color: '#00d1b2' }}>Username:</strong> {user.username}</p>
            <p><strong style={{ color: '#00d1b2' }}>Email:</strong> {user.email}</p>
            <p><strong style={{ color: '#00d1b2' }}>Job:</strong> {user.job || 'Not specified'}</p>
            <p><strong style={{ color: '#00d1b2' }}>School:</strong> {user.school || 'Not specified'}</p>
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '10px',
                transition: 'transform 0.1s, box-shadow 0.3s',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.4)'}
              onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'}
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
      <h3 style={{
        color: '#00d1b2',
        marginBottom: '10px',
        fontWeight: 'bold',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      }}>Projects</h3>
      {['School', 'Job', 'Personal'].map(category => (
        <div key={category} style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{category} Projects</h4>
          {categorizedProjects[category].length > 0 ? (
            categorizedProjects[category].map(project => (
              <div key={project._id} style={{
                backgroundColor: '#1a2b3c',
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '10px',
                boxShadow: '0 4px 8px rgba(0, 209, 178, 0.1)',
                border: '1px solid #00d1b2',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.1)';
              }}
              >
                <p><strong style={{ color: '#00d1b2' }}>Title:</strong> {project.title}</p>
                <p><strong style={{ color: '#00d1b2' }}>Description:</strong> {project.description}</p>
                <p><strong style={{ color: '#00d1b2' }}>Status:</strong> {project.status}</p>
              </div>
            ))
          ) : (
            <p>No {category.toLowerCase()} projects found.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default Profile;