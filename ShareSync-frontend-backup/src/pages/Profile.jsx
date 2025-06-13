import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { fetchLeaderboard } from '../services/project.js';
import { fetchUser } from '../services/auth.js';
import { Edit, X, Folder, Award, Star } from 'lucide-react';
import "../index.css";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, updateUserProfile, socket } = useContext(AuthContext);
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

      try {
        const response = await fetchUser();
        setProfile(response);
        setFormData({
          firstName: response.firstName || '',
          lastName: response.lastName || '',
          job: response.job || '',
          school: response.school || '',
          profilePicture: response.profilePicture || 'https://via.placeholder.com/150',
          bannerPicture: response.bannerPicture || 'https://via.placeholder.com/1200x300',
        });

        setUserPoints(response.points || 0);

        const projectLeaderboards = await Promise.all(
          response.projects.map(async (project) => {
            const response = await fetchLeaderboard(project._id);
            return response;
          })
        );

        const aggregated = {};
        projectLeaderboards.forEach(leaderboard => {
          leaderboard.forEach(entry => {
            if (aggregated[entry.email]) {
              aggregated[entry.email].points += entry.points;
            } else {
              aggregated[entry.email] = { ...entry };
            }
          });
        });

        const leaderboardArray = Object.values(aggregated).sort((a, b) => b.points - a.points).slice(0, 3);
        setLeaderboard(leaderboardArray);
      } catch (err) {
        setError('Failed to load profile: ' + (err.message || 'Please try again.'));
        setHasFailed(true);
      }
    };

    fetchProfile();

    if (socket) {
      socket.on('profile-updated', (data) => {
        if (data.user.username === username) {
          fetchProfile();
        }
      });

      socket.on('project-updated', (data) => {
        fetchProfile();
      });

      return () => {
        socket.off('profile-updated');
        socket.off('project-updated');
      };
    }
  }, [username, isAuthenticated, isLoading, navigate, socket]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
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

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/profile/upload-profile-picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload');
      window.location.reload();
    } catch (err) {
      alert('Failed to upload profile picture');
    }
  };

  if (isLoading) {
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading profile"></div>
        <span className="text-saffron-yellow text-xl font-orbitron ml-4">Loading...</span>
      </div>
    );
  }

  if (authError || hasFailed) {
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-crimson-red text-lg font-orbitron mb-4">{authError || error}</p>
          <Link to="/" className="text-emerald-green hover:underline text-base font-orbitron focus:outline-none focus:ring-2 focus:ring-charcoal-gray">Return to Home</Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading profile"></div>
        <span className="text-saffron-yellow text-xl font-orbitron ml-4">Loading profile...</span>
      </div>
    );
  }

  const isOwner = user && user.username && user.username.toLowerCase() === username.toLowerCase();
  const projectsByCategory = {
    School: (profile.projects || []).filter(p => p.category === 'School') || [],
    Job: (profile.projects || []).filter(p => p.category === 'Job') || [],
    Personal: (profile.projects || []).filter(p => p.category === 'Personal') || [],
  };
  const publicProjects = (profile.projects || []).filter(p => p.status !== 'Completed').slice(0, 3);

  return (
    <div className="profile-container min-h-screen">
      <div className="profile-header relative glassmorphic">
        <img
          src={isEditing ? formData.bannerPicture : profile.bannerPicture}
          alt="Profile banner"
          className="w-full h-48 object-cover rounded-b-3xl shadow-lg animate-fade-in"
        />
        <div className="absolute bottom-0 left-6 transform translate-y-1/2">
          <div className="relative">
            <img
              src={isEditing ? formData.profilePicture : profile.profilePicture}
              alt="Profile picture"
              className="w-32 h-32 rounded-full border-4 border-charcoal-gray shadow-lg profile-pic animate-glow"
            />
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-emerald-green rounded-full border-4 border-charcoal-gray animate-pulse flex items-center justify-center">
              <Star className="w-6 h-6 text-charcoal-gray animate-orbit" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 mt-16">
        {error && <p className="text-crimson-red mb-4 text-center text-lg font-orbitron flex items-center gap-2 justify-center">
          <AlertCircle className="w-5 h-5 animate-bounce" aria-hidden="true" /> {error}
        </p>}
        <div className="profile-details card p-6 glassmorphic shadow-lg card-3d animate-slide-down">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input-field text-2xl font-orbitron font-bold text-emerald-green mb-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                    placeholder="First Name"
                    aria-label="First Name"
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input-field text-2xl font-orbitron font-bold text-emerald-green mb-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                    placeholder="Last Name"
                    aria-label="Last Name"
                  />
                </>
              ) : (
                <h1 className="text-2xl font-orbitron font-bold text-emerald-green mb-2 animate-pulse">
                  {profile.firstName} {profile.lastName}
                </h1>
              )}
              <div className="relative">
                <img
                  src={profile.profilePicture}
                  alt={`${profile.username}'s profile`}
                  className="w-8 h-8 rounded-full profile-pic border-2 border-indigo-vivid shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-green rounded-full border-2 border-charcoal-gray animate-pulse"></div>
              </div>
            </div>
            {isOwner && (
              <div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect animate-bounce"
                      aria-label="Save profile changes"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn-primary rounded-full flex items-center bg-crimson-red focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect animate-bounce"
                      aria-label="Cancel editing"
                    >
                      <X className="w-5 h-5 animate-orbit" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect animate-bounce"
                    aria-label="Edit profile"
                  >
                    <Edit className="w-5 h-5 mr-2 animate-orbit" aria-hidden="true" /> Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-saffron-yellow text-lg font-inter mb-2 animate-slide-down">@{profile.username}</p>
          <p className="text-lavender-gray font-inter mb-1 animate-slide-down">Job: {profile.job || 'Not specified'}</p>
          <p className="text-lavender-gray font-inter mb-1 animate-slide-down">School: {profile.school || 'Not specified'}</p>

          {isOwner && isEditing && (
            <>
              <div className="mb-2">
                <label htmlFor="job" className="block text-saffron-yellow font-inter">Job</label>
                <input
                  type="text"
                  name="job"
                  id="job"
                  value={formData.job}
                  onChange={handleInputChange}
                  className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                  placeholder="Enter your job"
                  aria-label="Job"
                />
              </div>
              <div className="mb-2">
                <label htmlFor="school" className="block text-saffron-yellow font-inter">School</label>
                <input
                  type="text"
                  name="school"
                  id="school"
                  value={formData.school}
                  onChange={handleInputChange}
                  className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                  placeholder="Enter your school"
                  aria-label="School"
                />
              </div>
              <div className="mb-2">
                <label htmlFor="profilePicture" className="block text-saffron-yellow font-inter">Profile Picture URL</label>
                <input
                  type="text"
                  name="profilePicture"
                  id="profilePicture"
                  value={formData.profilePicture}
                  onChange={handleInputChange}
                  className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                  placeholder="Enter profile picture URL"
                  aria-label="Profile Picture URL"
                />
              </div>
              <div className="mb-2">
                <label htmlFor="bannerPicture" className="block text-saffron-yellow font-inter">Banner Picture URL</label>
                <input
                  type="text"
                  name="bannerPicture"
                  id="bannerPicture"
                  value={formData.bannerPicture}
                  onChange={handleInputChange}
                  className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                  placeholder="Enter banner picture URL"
                  aria-label="Banner Picture URL"
                />
              </div>
            </>
          )}

          {/* Owner View: Gamified Progress */}
          {isOwner && (
            <div className="gamified-progress mb-8 card p-6 glassmorphic holographic-effect card-3d animate-slide-down">
              <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-charcoal-gray animate-pulse" aria-hidden="true" /> Your Progress
              </h2>
              <div className="flex items-center gap-4">
                <div className="progress-bar relative w-full h-6 bg-saffron-yellow bg-opacity-20 rounded-full overflow-hidden holographic-effect">
                  <div
                    className="absolute top-0 left-0 h-full bg-indigo-vivid animate-pulse"
                    style={{ width: `${Math.min((userPoints / 1000) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-lavender-gray font-inter text-lg">{userPoints} Points</span>
              </div>
              <p className="text-saffron-yellow text-sm font-inter mt-2">
                {userPoints < 1000
                  ? `Earn $${1000 - userPoints} more points to reach the next level!`
                  : "You've reached the highest level!"}
              </p>
            </div>
          )}

          {/* Leaderboard Section (Visible to All) */}
          <div className="leaderboard-section mb-8 card p-6 glassmorphic holographic-effect card-3d animate-slide-down">
            <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-charcoal-gray animate-pulse" aria-hidden="true" /> Top Collaborators
            </h2>
            {leaderboard.length === 0 ? (
              <p className="text-saffron-yellow font-inter flex items-center gap-2">
                <Star className="w-5 h-5 text-charcoal-gray animate-pulse" aria-hidden="true" /> No leaderboard data available.
              </p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div key={index} className="leaderboard-item card p-3 glassmorphic flex justify-between items-center animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <img
                          src={entry.profilePicture || 'https://via.placeholder.com/40'}
                          alt={`${entry.username}'s profile`}
                          className="w-8 h-8 rounded-full profile-pic border-2 border-indigo-vivid shadow-lg"
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-green rounded-full border-2 border-charcoal-gray animate-pulse"></div>
                      </div>
                      <span className={`text-xl font-orbitron ${index === 0 ? 'text-crimson-red' : index === 1 ? 'text-saffron-yellow' : 'text-indigo-vivid'}`}>
                        #{index + 1}
                      </span>
                      <span className="text-lavender-gray font-inter">{entry.username}</span>
                    </div>
                    <span className="text-lavender-gray font-inter">{entry.points} points</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="projects-section">
            <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 flex items-center">
              <Folder className="w-5 h-5 mr-2 text-charcoal-gray animate-orbit" aria-hidden="true" /> Projects
            </h2>
            {isOwner ? (
              Object.keys(projectsByCategory).map(category => (
                projectsByCategory[category].length > 0 && (
                  <div key={category} className="mb-6">
                    <h3 className="text-xl font-orbitron font-semibold text-emerald-green mb-2">{category} Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projectsByCategory[category].map(project => (
                        <Link
                          key={project._id}
                          to={`/projects/${project._id}`}
                          className="project-card card p-4 glassmorphic holographic-effect shadow-md focus:outline-none focus:ring-2 focus:ring-charcoal-gray animate-fade-in card-3d"
                          aria-label={`View project ${project.title}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Folder className="w-5 h-5 text-indigo-vivid animate-pulse" aria-hidden="true" />
                            <h4 className="text-lg font-orbitron font-bold text-indigo-vivid">{project.title || 'Untitled Project'}</h4>
                          </div>
                          <p className="text-saffron-yellow text-sm mb-1 font-inter">{project.description || 'No description'}</p>
                          <p className="text-saffron-yellow text-sm font-inter">Status: {project.status || 'Not Started'}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              ))
            ) : (
              <div className="public-projects">
                {publicProjects.length === 0 ? (
                  <p className="text-saffron-yellow font-inter flex items-center gap-2">
                    <Folder className="w-5 h-5 text-charcoal-gray animate-pulse" aria-hidden="true" /> No public projects available.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicProjects.map(project => (
                      <Link
                        key={project._id}
                        to={`/projects/${project._id}`}
                        className="project-card card p-4 glassmorphic holographic-effect shadow-md focus:outline-none focus:ring-2 focus:ring-charcoal-gray animate-fade-in card-3d"
                        aria-label={`View project ${project.title}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Folder className="w-5 h-5 text-indigo-vivid animate-pulse" aria-hidden="true" />
                          <h4 className="text-lg font-orbitron font-bold text-indigo-vivid">{project.title || 'Untitled Project'}</h4>
                        </div>
                        <p className="text-saffron-yellow text-sm mb-1 font-inter">Category: {project.category || 'Unknown'}</p>
                        <p className="text-saffron-yellow text-sm font-inter">Status: {project.status || 'Not Started'}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isOwner && Object.values(projectsByCategory).every(projects => projects.length === 0) && (
              <p className="text-saffron-yellow font-inter flex items-center gap-2">
                <Folder className="w-5 h-5 text-charcoal-gray animate-pulse" aria-hidden="true" /> No projects yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;