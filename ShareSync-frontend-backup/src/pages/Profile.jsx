import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { Edit, X, Folder, Award } from 'lucide-react';
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
  const [hasFailed, setHasFailed] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const maxRetries = 2;
  const timeoutDuration = 15000;

  useEffect(() => {
    const fetchProfile = async () => {
      if (isLoading) return;

      if (!isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }

      if (!username) {
        setError('No username provided.');
        setHasFailed(true);
        return;
      }

      if (user && user.username && user.username.toLowerCase() === username.toLowerCase()) {
        setProfile(user);
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          job: user.job || '',
          school: user.school || '',
          profilePicture: user.profilePicture || 'https://via.placeholder.com/150',
          bannerPicture: user.bannerPicture || 'https://via.placeholder.com/1200x300',
        });

        // Calculate points (mock implementation)
        const points = (user.projects?.length || 0) * 10 + (user.email.length * 2); // Example: 10 points per project, 2 per email character
        setUserPoints(points);

        // Mock leaderboard
        setLeaderboard([
          { username: user.username, points: points },
          { username: 'user2', points: 150 },
          { username: 'user3', points: 120 },
        ].sort((a, b) => b.points - a.points));
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
        if (user) {
          setProfile(user);
          setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            job: user.job || '',
            school: user.school || '',
            profilePicture: user.profilePicture || 'https://via.placeholder.com/150',
            bannerPicture: user.bannerPicture || 'https://via.placeholder.com/1200x300',
          });
          const points = (user.projects?.length || 0) * 10 + (user.email.length * 2);
          setUserPoints(points);
          setLeaderboard([
            { username: user.username, points: points },
            { username: 'user2', points: 150 },
            { username: 'user3', points: 120 },
          ].sort((a, b) => b.points - a.points));
        } else {
          setHasFailed(true);
          setError('Profile loading timed out. Please try again later.');
        }
      }, timeoutDuration);

      try {
        const response = await axios.get(`http://localhost:3000/api/auth/profile/${username}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: controller.signal,
          timeout: timeoutDuration,
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

        const points = (response.data.projects?.length || 0) * 10 + (response.data.email.length * 2);
        setUserPoints(points);
        setLeaderboard([
          { username: response.data.username, points: points },
          { username: 'user2', points: 150 },
          { username: 'user3', points: 120 },
        ].sort((a, b) => b.points - a.points));
      } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          // Handled above in the timeout callback
        } else if (retryCount < maxRetries) {
          setTimeout(() => setRetryCount(retryCount + 1), 500);
        } else {
          if (user) {
            setProfile(user);
            setFormData({
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              job: user.job || '',
              school: user.school || '',
              profilePicture: user.profilePicture || 'https://via.placeholder.com/150',
              bannerPicture: user.bannerPicture || 'https://via.placeholder.com/1200x300',
            });
            const points = (user.projects?.length || 0) * 10 + (user.email.length * 2);
            setUserPoints(points);
            setLeaderboard([
              { username: user.username, points: points },
              { username: 'user2', points: 150 },
              { username: 'user3', points: 120 },
            ].sort((a, b) => b.points - a.points));
          } else {
            setError('Failed to load profile after multiple attempts. The user may not exist or you may not have access.');
            setHasFailed(true);
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
      await updateUserProfile(formData);
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
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
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading profile"></div>
        <span className="text-neon-magenta text-xl font-orbitron ml-4">Loading...</span>
      </div>
    );
  }

  if (authError || hasFailed) {
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg font-orbitron mb-4">{authError || error}</p>
          <Link to="/" className="text-neon-magenta hover:underline text-base font-orbitron focus:outline-none focus:ring-2 focus:ring-holo-silver">Return to Home</Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading profile"></div>
        <span className="text-cyber-teal text-xl font-orbitron ml-4">Loading profile...</span>
      </div>
    );
  }

  const isOwner = user && user.username && user.username.toLowerCase() === username.toLowerCase();
  const projectsByCategory = {
    School: (profile.projects || []).filter(p => p.category === 'School') || [],
    Job: (profile.projects || []).filter(p => p.category === 'Job') || [],
    Personal: (profile.projects || []).filter(p => p.category === 'Personal') || [],
  };

  return (
    <div className="profile-container min-h-screen">
      <div className="profile-header relative">
        <img
          src={isEditing ? formData.bannerPicture : profile.bannerPicture}
          alt="Profile banner"
          className="w-full h-48 object-cover rounded-b-3xl shadow-lg"
        />
        <div className="absolute bottom-0 left-6 transform translate-y-1/2">
          <img
            src={isEditing ? formData.profilePicture : profile.profilePicture}
            alt="Profile picture"
            className="w-32 h-32 rounded-full border-4 border-holo-silver shadow-lg"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 mt-16">
        {error && <p className="text-red-500 mb-4 text-center text-lg font-orbitron">{error}</p>}
        <div className="profile-details card p-6 glassmorphic shadow-lg">
          <div className="flex justify-between items-start mb-6">
            <div>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input-field text-2xl font-orbitron font-bold text-neon-magenta mb-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="First Name"
                    aria-label="First Name"
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input-field text-2xl font-orbitron font-bold text-neon-magenta mb-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="Last Name"
                    aria-label="Last Name"
                  />
                </>
              ) : (
                <h1 className="text-2xl font-orbitron font-bold text-neon-magenta mb-2 animate-text-glow">
                  {profile.firstName} {profile.lastName}
                </h1>
              )}
              <p className="text-cyber-teal mb-2 text-base font-inter">@{profile.username}</p>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="job"
                    value={formData.job}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2 rounded-lg text-cyber-teal focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="Job"
                    aria-label="Job"
                  />
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2 rounded-lg text-cyber-teal focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="School"
                    aria-label="School"
                  />
                  <input
                    type="text"
                    name="profilePicture"
                    value={formData.profilePicture}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2 rounded-lg text-cyber-teal focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="Profile Picture URL"
                    aria-label="Profile Picture URL"
                  />
                  <input
                    type="text"
                    name="bannerPicture"
                    value={formData.bannerPicture}
                    onChange={handleInputChange}
                    className="input-field w-full mb-2 rounded-lg text-cyber-teal focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="Banner Picture URL"
                    aria-label="Banner Picture URL"
                  />
                </>
              ) : (
                <>
                  <p className="text-cyber-teal mb-1 text-base font-inter">Job: {profile.job || 'Not specified'}</p>
                  <p className="text-cyber-teal mb-1 text-base font-inter">School: {profile.school || 'Not specified'}</p>
                </>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="btn-primary rounded-full animate-glow px-4 py-2 text-base font-inter focus:outline-none focus:ring-2 focus:ring-holo-silver"
                      aria-label="Save profile changes"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn-primary rounded-full bg-cyber-teal px-4 py-2 text-base font-inter focus:outline-none focus:ring-2 focus:ring-holo-silver"
                      aria-label="Cancel editing"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="btn-primary rounded-full animate-glow flex items-center px-4 py-2 text-base font-inter focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    aria-label="Edit profile"
                  >
                    <Edit className="w-5 h-5 mr-2" aria-hidden="true" /> Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Gamified Progress Section */}
          <div className="progress-section mb-8">
            <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-holo-silver animate-pulse" aria-hidden="true" /> Your Progress
            </h2>
            <div className="card p-4 glassmorphic">
              <p className="text-light-text text-lg font-inter mb-2">Total Points: <span className="text-neon-magenta font-bold">{userPoints}</span></p>
              <p className="text-cyber-teal text-sm font-inter">Earn points by engaging with projects, posting updates, and completing tasks!</p>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="leaderboard-section mb-8">
            <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4">Leaderboard</h2>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div key={index} className="leaderboard-item card p-3 glassmorphic flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-orbitron ${index === 0 ? 'text-holo-silver' : index === 1 ? 'text-cyber-teal' : 'text-neon-magenta'}`}>
                      #{index + 1}
                    </span>
                    <span className="text-light-text font-inter">{entry.username}</span>
                  </div>
                  <span className="text-light-text font-inter">{entry.points} points</span>
                </div>
              ))}
            </div>
          </div>

          <div className="projects-section">
            <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4 flex items-center">
              <Folder className="w-5 h-5 mr-2 text-holo-silver animate-pulse" aria-hidden="true" /> Projects
            </h2>
            {(profile.projects || []).length === 0 ? (
              <p className="text-cyber-teal text-base font-inter">No projects yet.</p>
            ) : (
              <div className="space-y-6">
                {['School', 'Job', 'Personal'].map(category => (
                  projectsByCategory[category].length > 0 && (
                    <div key={category}>
                      <h3 className="text-xl font-orbitron font-medium text-neon-magenta mb-2">{category} Projects</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectsByCategory[category].map(project => (
                          <Link
                            key={project.id}
                            to={`/projects/${project.id}`}
                            className="project-card card p-4 glassmorphic holographic-effect shadow-md focus:outline-none focus:ring-2 focus:ring-holo-silver"
                            aria-label={`View project ${project.title}`}
                          >
                            <h4 className="text-lg font-orbitron font-semibold text-neon-magenta">{project.title || 'Untitled Project'}</h4>
                            <p className="text-cyber-teal text-sm mb-1 font-inter">{project.description || 'No description'}</p>
                            <p className="text-cyber-teal text-sm font-inter">Status: {project.status || 'Not Started'}</p>
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