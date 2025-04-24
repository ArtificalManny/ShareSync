import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/user.service';
import { getProjects } from '../services/project.service';

const Profile = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
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
        const profileData = await getProfile();
        setProfile(profileData);
        setFormData({
          profilePicture: profileData.profilePicture || '',
          bannerPicture: profileData.bannerPicture || '',
          school: profileData.school || '',
          job: profileData.job || '',
        });
        const projectList = await getProjects();
        setProjects(projectList);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = await updateProfile(formData);
      setProfile(updatedProfile);
      localStorage.setItem('user', JSON.stringify(updatedProfile));
      setEditMode(false);
      setError(null);
    } catch (err) {
      setError(err.message);
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

  if (authLoading) {
    return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}><p>Loading...</p></div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}><p>Loading...</p></div>;
  }

  const projectCategories = categorizeProjects();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#00d1b2' }}>Profile</h2>
      {/* Banner */}
      <div style={{ position: 'relative', height: '200px', backgroundColor: '#1a2b3c', borderRadius: '10px', marginBottom: '20px' }}>
        {profile.bannerPicture && (
          <img src={profile.bannerPicture} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
        )}
      </div>

      {/* Profile Picture and Basic Info */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ position: 'relative', marginRight: '20px' }}>
          <img
            src={profile.profilePicture || 'https://via.placeholder.com/150'}
            alt="Profile"
            style={{ width: '150px', height: '150px', borderRadius: '50%', border: '3px solid #00d1b2' }}
          />
        </div>
        <div>
          <h3 style={{ margin: 0, color: '#00d1b2' }}>{profile.firstName} {profile.lastName}</h3>
          <p style={{ color: '#ccc' }}>@{profile.username}</p>
          <p>{profile.job || 'No job specified'}</p>
          <p>{profile.school || 'No school specified'}</p>
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