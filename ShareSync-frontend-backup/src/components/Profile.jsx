import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        const userData = await response.json();
        console.log('Profile - Fetched userData:', userData);
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
      } catch (error) {
        console.error('Profile - Error fetching user:', error);
      }
    };

    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Profile - Error fetching projects:', error);
      }
    };

    fetchProfile();
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      const updatedUser = await response.json();
      setUser(updatedUser);
      setEditing(false);
    } catch (error) {
      console.error('Profile - Error updating profile:', error);
    }
  };

  if (!user) return <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ 
      padding: '20px', 
      color: 'white', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
      minHeight: '100vh'
    }}>
      <div style={{ 
        backgroundColor: '#16213e', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 0 20px rgba(0,0,0,0.5)', 
        marginBottom: '20px',
        transition: 'transform 0.3s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {editing ? (
          <form onSubmit={handleSubmit}>
            <h2 style={{ color: '#e94560', textAlign: 'center', marginBottom: '20px' }}>Edit Profile</h2>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: 'none', 
                  backgroundColor: '#0f3460', 
                  color: 'white',
                  transition: 'background-color 0.3s'
                }}
                onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
                onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: 'none', 
                  backgroundColor: '#0f3460', 
                  color: 'white',
                  transition: 'background-color 0.3s'
                }}
                onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
                onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: 'none', 
                  backgroundColor: '#0f3460', 
                  color: 'white',
                  transition: 'background-color 0.3s'
                }}
                onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
                onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: 'none', 
                  backgroundColor: '#0f3460', 
                  color: 'white',
                  transition: 'background-color 0.3s'
                }}
                onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
                onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                name="job"
                value={formData.job}
                onChange={handleChange}
                placeholder="Job"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: 'none', 
                  backgroundColor: '#0f3460', 
                  color: 'white',
                  transition: 'background-color 0.3s'
                }}
                onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
                onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="School"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: 'none', 
                  backgroundColor: '#0f3460', 
                  color: 'white',
                  transition: 'background-color 0.3s'
                }}
                onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
                onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                name="profilePicture"
                value={formData.profilePicture}
                onChange={handleChange}
                placeholder="Profile Picture URL"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: 'none', 
                  backgroundColor: '#0f3460', 
                  color: 'white',
                  transition: 'background-color 0.3s'
                }}
                onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
                onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                name="bannerPicture"
                value={formData.bannerPicture}
                onChange={handleChange}
                placeholder="Banner Picture URL"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '5px', 
                  border: 'none', 
                  backgroundColor: '#0f3460', 
                  color: 'white',
                  transition: 'background-color 0.3s'
                }}
                onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
                onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
              />
            </div>
            <button 
              type="submit" 
              style={{ 
                width: '100%', 
                padding: '10px', 
                backgroundColor: '#0f3460', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                marginBottom: '10px',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1a4b84'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#0f3460'}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                backgroundColor: '#e94560', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#ff6b81'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e94560'}
            >
              Cancel
            </button>
          </form>
        ) : (
          <div>
            <h2 style={{ color: '#e94560', textAlign: 'center', marginBottom: '20px' }}>Profile</h2>
            {user.bannerPicture && (
              <img 
                src={user.bannerPicture} 
                alt="Banner" 
                style={{ 
                  width: '100%', 
                  height: '150px', 
                  objectFit: 'cover', 
                  borderRadius: '10px', 
                  marginBottom: '20px' 
                }} 
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              {user.profilePicture && (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%', 
                    marginRight: '20px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.3)'
                  }} 
                />
              )}
              <div>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>First Name:</strong> {user.firstName || 'N/A'}</p>
                <p><strong>Last Name:</strong> {user.lastName || 'N/A'}</p>
                <p><strong>Job:</strong> {user.job || 'N/A'}</p>
                <p><strong>School:</strong> {user.school || 'N/A'}</p>
              </div>
            </div>
            <button 
              onClick={() => setEditing(true)} 
              style={{ 
                width: '100%', 
                padding: '10px', 
                backgroundColor: '#0f3460', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1a4b84'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#0f3460'}
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
      <div style={{ 
        marginTop: '20px',
        backgroundColor: '#16213e', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        transition: 'transform 0.3s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <h3 style={{ color: '#e94560', marginBottom: '20px' }}>Your Projects</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {projects.map(project => (
            <div 
              key={project._id} 
              style={{ 
                backgroundColor: '#0f3460', 
                padding: '10px', 
                margin: '10px', 
                borderRadius: '5px', 
                width: '200px',
                transition: 'transform 0.3s, background-color 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <h4 style={{ color: '#e94560', marginBottom: '10px' }}>{project.title}</h4>
              <p style={{ marginBottom: '10px' }}>{project.description}</p>
              <Link 
                to={`/project/${project._id}`} 
                style={{ 
                  color: '#e94560', 
                  textDecoration: 'none',
                  display: 'block',
                  textAlign: 'center'
                }}
              >
                View Project
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;