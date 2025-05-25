import React, { useState, useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Edit2, Folder, Briefcase, GraduationCap } from 'lucide-react';
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

  const recentActivity = [
    { id: '1', action: 'Started a new project: Project Delta', timestamp: '2 days ago' },
    { id: '2', action: 'Completed a task in Project Alpha', timestamp: '5 days ago' },
  ];

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

  return (
    <div className="profile-container">
      <div className="banner relative">
        <div className="banner-overlay"></div>
        <img
          src={profileDetails.bannerPicture}
          alt="Banner"
          className="w-full h-64 object-cover opacity-80"
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
      <div className="max-w-5xl mx-auto px-6 -mt-20">
        <div className="flex items-end mb-6">
          <img
            src={profileDetails.profilePicture}
            alt="Profile"
            className="w-40 h-40 rounded-full border-4 border-accent-teal shadow-soft"
          />
          {isOwnProfile && isEditing && (
            <input
              type="text"
              name="profilePicture"
              value={profileDetails.profilePicture}
              onChange={handleInputChange}
              placeholder="New profile picture URL..."
              className="input-field ml-4 w-1/2"
            />
          )}
        </div>
        <div className="flex justify-between items-start mb-6">
          <div>
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
              <h1 className="text-3xl font-inter text-primary">{profileDetails.firstName} {profileDetails.lastName}</h1>
            )}
            <p className="text-gray-400">@{username}</p>
          </div>
          {isOwnProfile && (
            <button onClick={handleEdit} className="btn-primary flex items-center">
              <Edit2 className="w-5 h-5 mr-2" /> {isEditing ? 'Save' : 'Edit Profile'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="about-section bg-glass p-6 rounded-lg shadow-soft">
              <h2 className="text-xl font-inter text-accent-teal mb-4">About</h2>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="job"
                    value={profileDetails.job}
                    onChange={handleInputChange}
                    placeholder="Job"
                    className="input-field mb-2 w-full"
                  />
                  <input
                    type="text"
                    name="school"
                    value={profileDetails.school}
                    onChange={handleInputChange}
                    placeholder="School"
                    className="input-field w-full"
                  />
                </>
              ) : (
                <>
                  <p className="text-gray-400 flex items-center"><Briefcase className="w-5 h-5 mr-2" /> {profileDetails.job}</p>
                  <p className="text-gray-400 flex items-center"><GraduationCap className="w-5 h-5 mr-2" /> {profileDetails.school}</p>
                </>
              )}
            </div>
            <div className="stats-section bg-glass p-6 rounded-lg shadow-soft mt-6">
              <h2 className="text-xl font-inter text-accent-teal mb-4">Project Stats</h2>
              {Object.keys(projectCategories).length > 0 ? (
                <div className="chart-container">
                  <Pie data={projectStatsData} options={chartOptions} />
                </div>
              ) : (
                <p className="text-gray-400">No project stats available.</p>
              )}
            </div>
          </div>
          <div className="col-span-2">
            <div className="activity-section bg-glass p-6 rounded-lg shadow-soft mb-6">
              <h2 className="text-xl font-inter text-accent-teal mb-4">Recent Activity</h2>
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="mb-4">
                    <p className="text-primary">{activity.action}</p>
                    <p className="text-gray-400 text-sm">{activity.timestamp}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No recent activity.</p>
              )}
            </div>
            <div className="projects-section bg-glass p-6 rounded-lg shadow-soft">
              <h2 className="text-xl font-inter text-accent-teal mb-4 flex items-center"><Folder className="w-5 h-5 mr-2" /> Projects</h2>
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
                <p className="text-gray-400">No projects yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;