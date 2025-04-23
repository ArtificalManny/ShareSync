import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../services/user.service';
import { getProjects } from '../services/project.service';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    profilePicture: '',
    bannerPicture: '',
    school: '',
    job: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        setUser(profile);
        setFormData({
          profilePicture: profile.profilePicture || '',
          bannerPicture: profile.bannerPicture || '',
          school: profile.school || '',
          job: profile.job || '',
        });
        const projectList = await getProjects();
        setProjects(projectList);
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await updateProfile(formData);
      setUser(updatedUser);
      setEditMode(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const categorizeProjects = () => {
    const categories = { School: [], Job: [], Personal: [] };
    projects.forEach(project => {
      const category = project.category || 'Personal';
      categories[category].push(project);
    });
    return categories;
  };

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!user) {
    return <p>Loading...</p>;
  }

  const projectCategories = categorizeProjects();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Banner */}
      <div style={{ position: 'relative', height: '200px', backgroundColor: '#1a2b3c', borderRadius: '10px', marginBottom: '20px' }}>
        {user.bannerPicture && (
          <img src={user.bannerPicture} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
        )}
      </div>

      {/* Profile Picture and Basic Info */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ position: 'relative', marginRight: '20px' }}>
          <img
            src={user.profilePicture || 'https://via.placeholder.com/150'}
            alt="Profile"
            style={{ width: '150px', height: '150px', borderRadius: '50%', border: '3px solid #00d1b2' }}
          />
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#00d1b2' }}>{user.firstName} {user.lastName}</h2>
          <p style={{ color: '#ccc' }}>@{user.username}</p>
          <p>{user.job || 'No job specified'}</p>
          <p>{user.school || 'No school specified'}</p>
        </div>
      </div>

      {/* Edit Profile Button */}
      <button
        onClick={() => setEditMode(!editMode)}
        style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}
      >
        {editMode ? 'Cancel' : 'Edit Profile'}
      </button>

      {/* Edit Profile Form */}
      {editMode && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #00d1b2', borderRadius: '10px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Profile Picture URL</label>
            <input
              type="text"
              name="profilePicture"
              value={formData.profilePicture}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Banner Picture URL</label>
            <input
              type="text"
              name="bannerPicture"
              value={formData.bannerPicture}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>School</label>
            <input
              type="text"
              name="school"
              value={formData.school}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Job</label>
            <input
              type="text"
              name="job"
              value={formData.job}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Save Changes
          </button>
        </form>
      )}

      {/* Projects Section */}
      <h3 style={{ color: '#00d1b2' }}>Projects ({projects.length})</h3>
      {Object.keys(projectCategories).map(category => (
        projectCategories[category].length > 0 && (
          <div key={category} style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ccc' }}>{category}</h4>
            {projectCategories[category].map(project => (
              <div key={project._id} style={{ padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px', marginBottom: '10px' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{project.title} - {project.status}</p>
                <p style={{ margin: 0, color: '#ccc' }}>{project.description || 'No description'}</p>
              </div>
            ))}
          </div>
        )
      ))}
    </div>
  );
};

export default Profile;