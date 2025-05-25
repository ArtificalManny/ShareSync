import React, { useState, useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Edit2, Folder, Briefcase, GraduationCap, Camera, Users, Calendar } from 'lucide-react';
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

  const recentActivity = [];

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
        backgroundColor: ['#26C6DA', '#FFD700', '#A0A0A0'],
        borderColor: ['#0A1A2F', '#0A1A2F', '#0A1A2F'],
        borderWidth: 1,
      },
    ],
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-container">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-2xl font-inter text-primary mb-4">Welcome to ShareSync!</h2>
          <p className="text-gray-400 mb-6">Please log in to view your profile.</p>
          <Link to="/login">
            <button className="btn-primary">Log In</button>
          </Link>
        </div>
      </div>
    );
  }

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
            className="absolute top-4 left-4 input-field w-1/2"
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
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-accent-teal shadow-soft object-cover"
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
                  className="input-field"
                />
                <input
                  type="text"
                  name="lastName"
                  value={profileDetails.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  className="input-field"
                />
              </div>
            ) : (
              <h1 className="text-2xl sm:text-3xl font-inter text-primary">{profileDetails.firstName} {profileDetails.lastName}</h1>
            )}
            <p className="text-gray-400 mt-1">@{username}</p>
            <p className="text-gray-400 mt-1 flex items-center justify-center sm:justify-start">
              <Briefcase className="w-4 h-4 mr-2" /> {profileDetails.job || 'Not specified'}
            </p>
            <p className="text-gray-400 mt-1 flex items-center justify-center sm:justify-start">
              <Users className="w-4 h-4 mr-2" /> 150 connections
            </p>
          </div>
          {isOwnProfile && (
            <button onClick={handleEdit} className="btn-primary flex items-center mt-2 sm:mt-0">
              <Edit2 className="w-5 h-5 mr-2" /> {isEditing ? 'Save' : 'Edit Profile'}
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (About, Stats) */}
          <div className="col-span-1 space-y-6">
            <div className="about-section bg-glass p-6 rounded-lg shadow-soft">
              <h2 className="text-xl font-inter text-accent-teal mb-4">About</h2>
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
                    className="input-field w-full"
                  />
                  <input
                    type="text"
                    name="school"
                    value={profileDetails.school}
                    onChange={handleInputChange}
                    placeholder="School"
                    className="input-field w-full"
                  />
                  <input
                    type="text"
                    name="location"
                    value={profileDetails.location}
                    onChange={handleInputChange}
                    placeholder="Location"
                    className="input-field w-full"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-400">{profileDetails.bio || 'No bio available.'}</p>
                  <p className="text-gray-400 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" /> {profileDetails.job || 'Not specified'}
                  </p>
                  <p className="text-gray-400 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" /> {profileDetails.school || 'Not specified'}
                  </p>
                  <p className="text-gray-400 flex items-center">
                    <Users className="w-5 h-5 mr-2" /> {profileDetails.location || 'Not specified'}
                  </p>
                </div>
              )}
            </div>
            <div className="stats-section bg-glass p-6 rounded-lg shadow-soft">
              <h2 className="text-xl font-inter text-accent-teal mb-4">Project Stats</h2>
              {Object.keys(projectCategories).length > 0 ? (
                <div className="chart-container">
                  <Pie data={projectStatsData} options={chartOptions} />
                </div>
              ) : (
                <p className="text-gray-400">No project stats available. Join a project to see your stats!</p>
              )}
            </div>
          </div>

          {/* Right Column (Activity, Projects) */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Activity Section */}
            <div className="activity-section bg-glass p-6 rounded-lg shadow-soft">
              <h2 className="text-xl font-inter text-accent-teal mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" /> Recent Activity
              </h2>
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="mb-4">
                    <p className="text-primary">{activity.action}</p>
                    <p className="text-gray-400 text-sm">{activity.timestamp}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No recent activity. Start collaborating on projects to see updates!</p>
              )}
            </div>

            {/* Projects Section */}
            <div className="projects-section bg-glass p-6 rounded-lg shadow-soft">
              <h2 className="text-xl font-inter text-accent-teal mb-4 flex items-center">
                <Folder className="w-5 h-5 mr-2" /> Projects
              </h2>
              {user?.projects?.length > 0 ? (
                user.projects.map((project) => (
                  <div key={project.id} className="project-item bg-glass p-4 rounded-lg mb-4 shadow-soft transition-all hover:shadow-lg">
                    <Link to={`/projects/${project.id}`} className="text-primary hover:underline">
                      <h3 className="text-lg font-semibold">{project.title}</h3>
                    </Link>
                    <p className="text-gray-400">Category: {project.category}</p>
                    <p className="text-accent-gold">Status: {project.status}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No projects yet. Join a project from the Home page to get started!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;