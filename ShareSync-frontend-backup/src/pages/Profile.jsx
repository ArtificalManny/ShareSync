import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Edit2, Folder, Briefcase, GraduationCap, Camera, Users, Calendar, ThumbsUp, MessageSquare, Share2, Users as TeamIcon } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './Profile.css';

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#F5F6FA',
        font: {
          family: 'Inter, sans-serif',
          size: 14,
        },
      },
    },
  },
};

const Profile = () => {
  const { username } = useParams();
  const { user, isAuthenticated, updateUserProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [profileDetails, setProfileDetails] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    job: user?.job || '',
    school: user?.school || '',
    profilePicture: user?.profilePicture || 'https://via.placeholder.com/150',
    bannerPicture: user?.bannerPicture || 'https://via.placeholder.com/1200x300',
    bio: user?.bio || '',
    location: user?.location || '',
  });
  const [activityPosts, setActivityPosts] = useState([]);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    if (user) {
      setProfileDetails({
        firstName: user.firstName,
        lastName: user.lastName,
        job: user.job,
        school: user.school,
        profilePicture: user.profilePicture,
        bannerPicture: user.bannerPicture,
        bio: user.bio,
        location: user.location,
      });
      // Mock activity posts for the user
      setActivityPosts([
        {
          id: '1',
          user: user.email,
          profilePicture: user.profilePicture,
          content: 'Just started a new project on ShareSync!',
          timestamp: new Date().toISOString(),
          likes: 3,
          comments: [],
        },
      ]);
    }
  }, [user]);

  const isOwnProfile = isAuthenticated && user?.username === username;

  const handleEdit = () => {
    if (isEditing) {
      updateUserProfile(profileDetails);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    setProfileDetails({ ...profileDetails, [e.target.name]: e.target.value });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUrl = reader.result;
        setProfileDetails((prev) => ({ ...prev, profilePicture: imageDataUrl }));
        updateUserProfile({ ...profileDetails, profilePicture: imageDataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (!newPost) return;
    const post = {
      id: `post-${activityPosts.length + 1}`,
      user: user.email,
      profilePicture: user.profilePicture,
      content: newPost,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
    };
    setActivityPosts((prev) => [post, ...prev]);
    setNewPost('');
  };

  const handleLike = (postId) => {
    setActivityPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
      )
    );
  };

  const projectCategories = (user?.projects || []).reduce((acc, proj) => {
    acc[proj.category] = (acc[proj.category] || 0) + 1;
    return acc;
  }, {});

  const projectStatsData = {
    labels: Object.keys(projectCategories),
    datasets: [
      {
        label: 'Projects by Category',
        data: Object.values(projectCategories),
        backgroundColor: ['#26C6DA', '#FF6F61', '#8A9A5B'],
        borderColor: ['#0A1A2F', '#0A1A2F', '#0A1A2F'],
        borderWidth: 1,
      },
    ],
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-container">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-3xl font-playfair text-accent-gold mb-4">Welcome to ShareSync!</h2>
          <p className="text-gray-400 mb-6">Please log in to view your profile.</p>
          <Link to="/login">
            <button className="btn-primary">Log In</button>
          </Link>
        </div>
      </div>
    );
  }

  const mockTeams = [
    { id: 't1', name: 'Design Team', role: 'Member', description: 'Working on UI/UX for Project Alpha' },
    { id: 't2', name: 'Dev Team', role: 'Lead', description: 'Backend development for Project Beta' },
  ];

  return (
    <div className="profile-container">
      {/* Banner Section */}
      <div className="banner relative">
        <div className="banner-overlay"></div>
        <img
          src={profileDetails.bannerPicture}
          alt="Banner"
          className="w-full h-48 sm:h-64 object-cover opacity-80"
        />
        {isOwnProfile && isEditing && (
          <input
            type="text"
            name="bannerPicture"
            value={profileDetails.bannerPicture}
            onChange={handleInputChange}
            placeholder="New banner picture URL..."
            className="absolute top-4 left-4 input-field w-1/2 rounded-full"
          />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end mb-6 relative">
          <div className="relative">
            <img
              src={profileDetails.profilePicture}
              alt="Profile"
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-accent-gold shadow-soft object-cover"
            />
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 bg-accent-teal p-2 rounded-full cursor-pointer">
                <Camera className="w-5 h-5 text-primary" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  name="firstName"
                  value={profileDetails.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  className="input-field rounded-full"
                />
                <input
                  type="text"
                  name="lastName"
                  value={profileDetails.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  className="input-field rounded-full"
                />
              </div>
            ) : (
              <h1 className="text-3xl font-playfair text-accent-gold">{profileDetails.firstName} {profileDetails.lastName}</h1>
            )}
            <p className="text-gray-400 mt-1">@{username}</p>
            <p className="text-gray-400 mt-1 flex items-center justify-center sm:justify-start">
              <Briefcase className="w-4 h-4 mr-2 text-accent-teal" /> {profileDetails.job || 'Not specified'}
            </p>
            <p className="text-gray-400 mt-1 flex items-center justify-center sm:justify-start">
              <Users className="w-4 h-4 mr-2 text-accent-teal" /> 150 connections
            </p>
            <p className="text-gray-400 mt-1 flex items-center justify-center sm:justify-start">
              <Folder className="w-4 h-4 mr-2 text-accent-teal" /> {user?.projects?.length || 0} projects
            </p>
          </div>
          {isOwnProfile && (
            <button onClick={handleEdit} className="btn-primary flex items-center mt-2 sm:mt-0 rounded-full">
              <Edit2 className="w-5 h-5 mr-2" /> {isEditing ? 'Save' : 'Edit Profile'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="profile-tabs flex border-b border-gray-700 mb-6">
          <button
            className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button
            className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button
            className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button
            className={`tab-button ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            Teams
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'about' && (
            <div className="about-section card p-6">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4">About</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    name="bio"
                    value={profileDetails.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    className="input-field w-full h-24"
                  />
                  <input
                    type="text"
                    name="job"
                    value={profileDetails.job}
                    onChange={handleInputChange}
                    placeholder="Job"
                    className="input-field w-full rounded-full"
                  />
                  <input
                    type="text"
                    name="school"
                    value={profileDetails.school}
                    onChange={handleInputChange}
                    placeholder="School"
                    className="input-field w-full rounded-full"
                  />
                  <input
                    type="text"
                    name="location"
                    value={profileDetails.location}
                    onChange={handleInputChange}
                    placeholder="Location"
                    className="input-field w-full rounded-full"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-400">{profileDetails.bio || 'No bio available.'}</p>
                  <p className="text-gray-400 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-accent-teal" /> {profileDetails.job || 'Not specified'}
                  </p>
                  <p className="text-gray-400 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-accent-teal" /> {profileDetails.school || 'Not specified'}
                  </p>
                  <p className="text-gray-400 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-accent-teal" /> {profileDetails.location || 'Not specified'}
                  </p>
                  <div className="stats-section mt-4">
                    <h3 className="text-xl font-playfair text-accent-teal mb-4">Project Stats</h3>
                    {Object.keys(projectCategories).length > 0 ? (
                      <div className="chart-container mx-auto">
                        <Pie data={projectStatsData} options={chartOptions} />
                      </div>
                    ) : (
                      <p className="text-gray-400">No project stats available. Join a project to see your stats!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-section card p-6">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" /> Activity Feed
              </h2>
              {isOwnProfile && (
                <div className="post-input card p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-8 h-8 rounded-full mr-2 object-cover"
                    />
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Share an update..."
                      className="input-field w-full h-16"
                    />
                  </div>
                  <button onClick={handlePost} className="btn-primary rounded-full">Post</button>
                </div>
              )}
              {activityPosts.length > 0 ? (
                activityPosts.map((post) => (
                  <div key={post.id} className="post-item card p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <img
                        src={post.profilePicture}
                        alt="User"
                        className="w-8 h-8 rounded-full mr-2 object-cover"
                      />
                      <div>
                        <span className="text-primary font-semibold">{post.user}</span>
                        <span className="text-gray-400 text-sm ml-2">{new Date(post.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-primary">{post.content}</p>
                    <div className="flex items-center mt-3 gap-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center text-accent-teal hover:text-accent-coral transition-all"
                      >
                        <ThumbsUp className="w-5 h-5 mr-1" /> {post.likes || 0}
                      </button>
                      <button className="flex items-center text-accent-teal hover:text-accent-coral transition-all">
                        <MessageSquare className="w-5 h-5 mr-1" /> {post.comments?.length || 0}
                      </button>
                      <button className="flex items-center text-accent-teal hover:text-accent-coral transition-all">
                        <Share2 className="w-5 h-5 mr-1" /> Share
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No recent activity. Share an update to get started!</p>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="projects-section card p-6">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4 flex items-center">
                <Folder className="w-5 h-5 mr-2" /> Projects
              </h2>
              {user?.projects?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.projects.map((project) => (
                    <div key={project.id} className="project-item card p-4">
                      <Link to={`/projects/${project.id}`} className="text-primary hover:underline">
                        <h3 className="text-lg font-playfair text-accent-gold">{project.title}</h3>
                      </Link>
                      <p className="text-gray-400">Category: {project.category}</p>
                      <p className="text-accent-teal">Status: {project.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No projects yet. Join a project from the Home page to get started!</p>
              )}
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="teams-section card p-6">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4 flex items-center">
                <TeamIcon className="w-5 h-5 mr-2" /> Teams
              </h2>
              {mockTeams.length > 0 ? (
                <div className="space-y-4">
                  {mockTeams.map((team) => (
                    <div key={team.id} className="team-item card p-4 flex items-center gap-4">
                      <TeamIcon className="w-6 h-6 text-accent-teal" />
                      <div>
                        <p className="text-primary font-semibold">{team.name}</p>
                        <p className="text-gray-400 text-sm">Role: {team.role}</p>
                        <p className="text-gray-400 text-sm">{team.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Not a member of any teams yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;