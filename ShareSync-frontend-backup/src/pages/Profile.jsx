import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { Edit, X, Folder } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, updateUserProfile } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    job: '',
    school: '',
    profilePicture: '',
    bannerPicture: '',
  });
  const [retryCount, setRetryCount] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const maxRetries = 3;
  const timeoutDuration = 5000; // 5 seconds

  useEffect(() => {
    const fetchProfile = async () => {
      if (isLoading) {
        console.log('Profile - Waiting for AuthContext to finish loading');
        return;
      }

      if (!isAuthenticated) {
        console.log('Profile - User not authenticated, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }

      const timeout = setTimeout(() => {
        if (!profile) {
          console.log('Profile - Fetch timed out after', timeoutDuration, 'ms');
          setHasTimedOut(true);
          setError('Profile loading timed out. Using available data.');
        }
      }, timeoutDuration);

      try {
        console.log('Profile - Fetching profile for username:', username);
        const response = await axios.get(`http://localhost:3000/api/auth/profile/${username}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        clearTimeout(timeout);
        setProfile(response.data);
        setFormData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          job: response.data.job || '',
          school: response.data.school || '',
          profilePicture: response.data.profilePicture || 'https://via.placeholder.com/150',
          bannerPicture: response.data.bannerPicture || 'https://via.placeholder.com/1200x300',
        });
        console.log('Profile - Profile fetched:', response.data.email);
      } catch (err) {
        console.error('Profile - Failed to fetch profile:', err.message);
        clearTimeout(timeout);
        if (retryCount < maxRetries) {
          console.log('Profile - Retrying fetch, attempt:', retryCount + 1);
          setTimeout(() => setRetryCount(retryCount + 1), 1000);
        } else {
          console.log('Profile - Max retries reached. Using fallback data.');
          if (user && user.username.toLowerCase() === username.toLowerCase()) {
            console.log('Profile - Using authenticated user data as fallback');
            setProfile(user);
            setFormData({
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              job: user.job || '',
              school: user.school || '',
              profilePicture: user.profilePicture || 'https://via.placeholder.com/150',
              bannerPicture: user.bannerPicture || 'https://via.placeholder.com/1200x300',
            });
          } else {
            setError('Failed to load profile after multiple attempts. Please try again later.');
            setHasTimedOut(true);
          }
        }
      }
    };

    fetchProfile();
  }, [username, isAuthenticated, isLoading, navigate, user, retryCount]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      console.log('Profile - Saving profile updates:', formData);
      await updateUserProfile(formData);
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Profile - Failed to update profile:', err.message);
      setError('Failed to update profile: ' + (err.message || 'Please try again.'));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      job: profile.job || '',
      school: profile.school || '',
      profilePicture: profile.profilePicture || 'https://via.placeholder.com/150',
      bannerPicture: profile.bannerPicture || 'https://via.placeholder.com/1200x300',
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isLoading) {
    return <div className="profile-container"><p className="text-holo-gray">Loading...</p></div>;
  }

  if (authError || (error && hasTimedOut)) {
    return (
      <div className="profile-container">
        <p className="text-red-500">{authError || error}</p>
        <Link to="/" className="text-holo-blue hover:underline">Return to Home</Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <p className="text-holo-gray">Loading profile...</p>
      </div>
    );
  }

  const isOwner = user && user.username.toLowerCase() === username.toLowerCase();
  const projectsByCategory = {
    School: profile.projects?.filter(p => p.category === 'School') || [],
    Job: profile.projects?.filter(p => p.category === 'Job') || [],
    Personal: profile.projects?.filter(p => p.category === 'Personal') || [],
  };

  return (
    <div className="profile-container">
      <div className="profile-header relative">
        <img
          src={isEditing ? formData.bannerPicture : profile.bannerPicture}
          alt="Banner"
          className="w-full h-48 object-cover rounded-b-3xl"
        />
        <div className="absolute bottom-0 left-6 transform translate-y-1/2">
          <img
            src={isEditing ? formData.profilePicture : profile.profilePicture}
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-holo-pink shadow-lg"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 mt-16">
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <div className="profile-details card p-6 glassmorphic">
          <div className="flex justify-between items-start mb-6">
            <div>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input-field text-2xl font-inter font-bold text-holo-blue mb-2"
                    placeholder="First Name"
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input-field text-2xl font-inter font-bold text-holo-blue mb-2"
                    placeholder="Last Name"
                  />
                </>
              ) : (
                <h1 className="text-2xl font-inter font-bold text-holo-blue mb-2 animate-text-glow">
                  {profile.firstName} {profile.lastName}
                </h1>
              )}
              <p className="text-holo-gray mb-2">@{profile.username}</p>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="job"
                    value={formData.job}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2"
                    placeholder="Job"
                  />
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2"
                    placeholder="School"
                  />
                  <input
                    type="text"
                    name="profilePicture"
                    value={formData.profilePicture}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2"
                    placeholder="Profile Picture URL"
                  />
                  <input
                    type="text"
                    name="bannerPicture"
                    value={formData.bannerPicture}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2"
                    placeholder="Banner Picture URL"
                  />
                </>
              ) : (
                <>
                  <p className="text-holo-gray mb-1">Job: {profile.job || 'Not specified'}</p>
                  <p className="text-holo-gray mb-1">School: {profile.school || 'Not specified'}</p>
                </>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="btn-primary rounded-full animate-glow"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn-primary rounded-full bg-holo-bg-light"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="btn-primary rounded-full animate-glow flex items-center"
                  >
                    <Edit className="w-5 h-5 mr-2" /> Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="projects-section">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <Folder className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Projects
            </h2>
            {profile.projects.length === 0 ? (
              <p className="text-holo-gray">No projects yet.</p>
            ) : (
              <div className="space-y-6">
                {['School', 'Job', 'Personal'].map(category => (
                  projectsByCategory[category].length > 0 && (
                    <div key={category}>
                      <h3 className="text-xl font-inter text-holo-blue mb-2">{category} Projects</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectsByCategory[category].map(project => (
                          <Link
                            key={project.id}
                            to={`/projects/${project.id}`}
                            className="project-card card p-4 glassmorphic holographic-effect"
                          >
                            <h4 className="text-lg font-inter text-holo-blue">{project.title}</h4>
                            <p className="text-holo-gray text-sm mb-1">{project.description}</p>
                            <p className="text-holo-gray text-sm">Status: {project.status}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;