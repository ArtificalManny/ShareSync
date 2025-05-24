import React, { useState, useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Edit2, FolderKanban } from 'lucide-react';
import './Profile.css';

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

  const schoolProjects = user?.projects?.filter((proj) => proj.category === 'School') || [];
  const jobProjects = user?.projects?.filter((proj) => proj.category === 'Job') || [];
  const personalProjects = user?.projects?.filter((proj) => proj.category === 'Personal') || [];

  return (
    <div className="profile-container">
      <div className="banner relative">
        <img
          src={profileDetails.bannerPicture}
          alt="Banner"
          className="w-full h-64 object-cover opacity-70"
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
      <div className="profile-header relative -mt-16 px-8">
        <img
          src={profileDetails.profilePicture}
          alt="Profile"
          className="w-32 h-32 rounded-full border-4 border-neon-cyan shadow-glow-cyan"
        />
        {isOwnProfile && isEditing && (
          <input
            type="text"
            name="profilePicture"
            value={profileDetails.profilePicture}
            onChange={handleInputChange}
            placeholder="New profile picture URL..."
            className="input-field mt-2 w-1/2"
          />
        )}
        <div className="flex justify-between items-center mt-4">
          <div>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="firstName"
                  value={profileDetails.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  className="input-field mr-2"
                />
                <input
                  type="text"
                  name="lastName"
                  value={profileDetails.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  className="input-field"
                />
              </>
            ) : (
              <h1 className="text-4xl font-orbitron text-neon-white">{profileDetails.firstName} {profileDetails.lastName}</h1>
            )}
            <p className="text-neon-cyan">@{username}</p>
          </div>
          {isOwnProfile && (
            <button onClick={handleEdit} className="btn-primary">
              <Edit2 className="icon" /> {isEditing ? 'Save' : 'Edit Profile'}
            </button>
          )}
        </div>
        <div className="mt-4">
          {isEditing ? (
            <>
              <input
                type="text"
                name="job"
                value={profileDetails.job}
                onChange={handleInputChange}
                placeholder="Job"
                className="input-field mr-2"
              />
              <input
                type="text"
                name="school"
                value={profileDetails.school}
                onChange={handleInputChange}
                placeholder="School"
                className="input-field"
              />
            </>
          ) : (
            <>
              <p className="text-secondary">Job: {profileDetails.job}</p>
              <p className="text-secondary">School: {profileDetails.school}</p>
            </>
          )}
        </div>
      </div>
      <div className="projects-section px-8 mt-8">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Projects</h2>
        <div className="category-section mb-8">
          <h3 className="text-xl font-orbitron text-neon-magenta mb-4">School Projects</h3>
          {schoolProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schoolProjects.map((project) => (
                <div key={project.id} className="project-card holographic">
                  <Link to={`/projects/${project.id}`} className="project-card-link">
                    <h4 className="text-neon-white font-bold">{project.title}</h4>
                    <p className="text-neon-cyan">Category: {project.category}</p>
                    <p className="text-neon-magenta">Status: {project.status}</p>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary">No school projects yet.</p>
          )}
        </div>
        <div className="category-section mb-8">
          <h3 className="text-xl font-orbitron text-neon-magenta mb-4">Job Projects</h3>
          {jobProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobProjects.map((project) => (
                <div key={project.id} className="project-card holographic">
                  <Link to={`/projects/${project.id}`} className="project-card-link">
                    <h4 className="text-neon-white font-bold">{project.title}</h4>
                    <p className="text-neon-cyan">Category: {project.category}</p>
                    <p className="text-neon-magenta">Status: {project.status}</p>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary">No job projects yet.</p>
          )}
        </div>
        <div className="category-section">
          <h3 className="text-xl font-orbitron text-neon-magenta mb-4">Personal Projects</h3>
          {personalProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalProjects.map((project) => (
                <div key={project.id} className="project-card holographic">
                  <Link to={`/projects/${project.id}`} className="project-card-link">
                    <h4 className="text-neon-white font-bold">{project.title}</h4>
                    <p className="text-neon-cyan">Category: {project.category}</p>
                    <p className="text-neon-magenta">Status: {project.status}</p>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary">No personal projects yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;