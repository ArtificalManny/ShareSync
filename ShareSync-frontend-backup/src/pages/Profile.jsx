import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get profile ID from URL
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState({
    bio: '',
    school: '',
    schoolProject: '',
    occupation: '',
    workplace: '',
  });
  const isOwner = user?.id === id || !id; // Determine if the logged-in user is the profile owner

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // Determine the endpoint based on whether we're viewing our own profile or someone else's
        const profileEndpoint = id ? `/api/users/${id}` : '/api/users/me';
        const projectsEndpoint = id ? `/api/users/${id}/projects` : '/api/projects';

        // Fetch user profile
        const profileResponse = await fetch(profileEndpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }
        const profileData = await profileResponse.json();
        setProfile(profileData);
        setEditProfile({
          bio: profileData.bio || '',
          school: profileData.school || '',
          schoolProject: profileData.schoolProject || '',
          occupation: profileData.occupation || '',
          workplace: profileData.workplace || '',
        });

        // Fetch user's projects
        const projectsResponse = await fetch(projectsEndpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (!projectsResponse.ok) {
          throw new Error('Failed to fetch projects');
        }
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      } catch (err) {
        setError(`Failed to load profile: ${err.message}. Displaying mock data.`);
        setProfile({
          username: user?.username || 'User',
          profilePicture: 'https://via.placeholder.com/150',
          bio: 'A passionate student working on collaborative projects.',
          school: 'University of California, Berkeley',
          schoolProject: 'Senior Capstone Project for UC Berkeley',
          occupation: 'Software Engineer Intern',
          workplace: 'Google',
        });
        setEditProfile({
          bio: 'A passionate student working on collaborative projects.',
          school: 'University of California, Berkeley',
          schoolProject: 'Senior Capstone Project for UC Berkeley',
          occupation: 'Software Engineer Intern',
          workplace: 'Google',
        });
        setProjects([
          { _id: '1', title: 'Capstone Project', description: 'A web app for collaboration', status: 'Active', context: 'school' },
          { _id: '2', title: 'Internship Project', description: 'Building an API', status: 'Completed', context: 'work' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, id]);

  const handleEditProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editProfile),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setUser(updatedProfile);
      localStorage.setItem('user', JSON.stringify(updatedProfile));
      setIsEditing(false);
    } catch (err) {
      setError(`Failed to update profile: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="text-white text-center mt-10 flex items-center justify-center space-x-2 animate-shimmer">
        <svg className="w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Cover Photo and Profile Picture */}
      <div className="relative">
        <img
          src="https://via.placeholder.com/1200x300"
          alt="Cover Photo"
          className="w-full h-64 object-cover"
        />
        <div className="absolute bottom-0 left-8 transform translate-y-1/2">
          <img
            src={profile?.profilePicture || 'https://via.placeholder.com/150'}
            alt="Profile Picture"
            className="w-40 h-40 rounded-full border-4 border-primary-blue shadow-lg"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
          />
        </div>
      </div>

      {/* User Info and Tabs */}
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-8">
        {error && (
          <div className="text-center mb-4 p-4 bg-gray-800 rounded-lg">
            <p className="text-accent-orange flex items-center justify-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span>{error}</span>
            </p>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-display text-primary-blue">{profile?.username || 'User'}</h1>
            <p className="text-neutral-gray">{profile?.bio || 'No bio available.'}</p>
          </div>
          {isOwner && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-primary neumorphic hover:scale-105 transition-transform flex items-center space-x-2"
            >
              <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path>
              </svg>
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-600 mb-6">
          <button
            onClick={() => setActiveTab('about')}
            className={`p-3 ${activeTab === 'about' ? 'text-primary-blue border-b-2 border-primary-blue' : 'text-neutral-gray'} hover:text-accent-orange transition-colors flex items-center space-x-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span>About</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`p-3 ${activeTab === 'projects' ? 'text-primary-blue border-b-2 border-primary-blue' : 'text-neutral-gray'} hover:text-accent-orange transition-colors flex items-center space-x-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <span>Projects</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {isEditing ? (
              <form onSubmit={handleEditProfile} className="space-y-4">
                <div>
                  <label className="block text-neutral-gray mb-2 font-medium flex items-center space-x-2">
                    <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>Bio</span>
                  </label>
                  <textarea
                    value={editProfile.bio}
                    onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-primary-blue focus:border-accent-orange focus:outline-none transition-all"
                    rows="4"
                  />
                </div>
                <div>
                  <label className="block text-neutral-gray mb-2 font-medium flex items-center space-x-2">
                    <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7h18M3 4h18M3 1h18"></path>
                    </svg>
                    <span>School Attending</span>
                  </label>
                  <input
                    type="text"
                    value={editProfile.school}
                    onChange={(e) => setEditProfile({ ...editProfile, school: e.target.value })}
                    placeholder="e.g., University of California, Berkeley"
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-primary-blue focus:border-accent-orange focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-neutral-gray mb-2 font-medium flex items-center space-x-2">
                    <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <span>School Project Context</span>
                  </label>
                  <input
                    type="text"
                    value={editProfile.schoolProject}
                    onChange={(e) => setEditProfile({ ...editProfile, schoolProject: e.target.value })}
                    placeholder="e.g., Senior Capstone Project for UC Berkeley"
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-primary-blue focus:border-accent-orange focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-neutral-gray mb-2 font-medium flex items-center space-x-2">
                    <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>Occupation</span>
                  </label>
                  <input
                    type="text"
                    value={editProfile.occupation}
                    onChange={(e) => setEditProfile({ ...editProfile, occupation: e.target.value })}
                    placeholder="e.g., Software Engineer"
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-primary-blue focus:border-accent-orange focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-neutral-gray mb-2 font-medium flex items-center space-x-2">
                    <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4"></path>
                    </svg>
                    <span>Workplace</span>
                  </label>
                  <input
                    type="text"
                    value={editProfile.workplace}
                    onChange={(e) => setEditProfile({ ...editProfile, workplace: e.target.value })}
                    placeholder="e.g., Google"
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-primary-blue focus:border-accent-orange focus:outline-none transition-all"
                  />
                </div>
                <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                  </svg>
                  <span>Save Changes</span>
                </button>
              </form>
            ) : (
              <>
                <div className="glassmorphic p-6 rounded-lg">
                  <h3 className="text-xl font-display text-primary-blue mb-4 flex items-center space-x-2">
                    <svg className="w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>About Me</span>
                  </h3>
                  <p className="text-white">{profile?.bio || 'No bio available.'}</p>
                </div>
                <div className="glassmorphic p-6 rounded-lg">
                  <h3 className="text-xl font-display text-primary-blue mb-4 flex items-center space-x-2">
                    <svg className="w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7h18M3 4h18M3 1h18"></path>
                    </svg>
                    <span>Education</span>
                  </h3>
                  <p className="text-white mb-2 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-muted-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7h18M3 4h18M3 1h18"></path>
                    </svg>
                    <span>School: {profile?.school || 'Not specified'}</span>
                  </p>
                  <p className="text-white mb-2 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-muted-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <span>School Project: {profile?.schoolProject || 'Not specified'}</span>
                  </p>
                  {/* Portfolio of School Projects */}
                  {projects.filter(p => p.context === 'school').length > 0 && (
                    <>
                      <h4 className="text-lg font-display text-primary-blue mt-4 mb-2 flex items-center space-x-2">
                        <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <span>School Projects</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects.filter(p => p.context === 'school').map(project => (
                          <Link to={`/project/${project._id}`} key={project._id} className="card glassmorphic transform hover:scale-105 transition-transform p-4">
                            <h5 className="text-primary-blue">{project.title}</h5>
                            <p className="text-neutral-gray text-sm">{project.description || 'No description'}</p>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="glassmorphic p-6 rounded-lg">
                  <h3 className="text-xl font-display text-primary-blue mb-4 flex items-center space-x-2">
                    <svg className="w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>Occupation</span>
                  </h3>
                  <p className="text-white mb-2 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-muted-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>Role: {profile?.occupation || 'Not specified'}</span>
                  </p>
                  <p className="text-white mb-2 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-muted-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4"></path>
                    </svg>
                    <span>Workplace: {profile?.workplace || 'Not specified'}</span>
                  </p>
                  {/* Portfolio of Work Projects */}
                  {projects.filter(p => p.context === 'work').length > 0 && (
                    <>
                      <h4 className="text-lg font-display text-primary-blue mt-4 mb-2 flex items-center space-x-2">
                        <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <span>Work Projects</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects.filter(p => p.context === 'work').map(project => (
                          <Link to={`/project/${project._id}`} key={project._id} className="card glassmorphic transform hover:scale-105 transition-transform p-4">
                            <h5 className="text-primary-blue">{project.title}</h5>
                            <p className="text-neutral-gray text-sm">{project.description || 'No description'}</p>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="glassmorphic p-6 rounded-lg">
              <h3 className="text-xl font-display text-primary-blue mb-4 flex items-center space-x-2">
                <svg className="w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <span>My ShareSync Projects</span>
              </h3>
              {projects.length === 0 ? (
                <p className="text-neutral-gray flex items-center space-x-2">
                  <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>No projects yet.</span>
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map(project => (
                    <Link to={`/project/${project._id}`} key={project._id} className="card glassmorphic transform hover:scale-105 transition-transform p-6">
                      <h4 className="text-lg font-display text-primary-blue flex items-center space-x-2">
                        <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <span>{project.title}</span>
                      </h4>
                      <p className="text-neutral-gray mt-2">{project.description || 'No description available.'}</p>
                      <p className="text-sm text-neutral-gray mt-2 flex items-center space-x-2">
                        <svg className="w-5 h-5 text-muted-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>Status: {project.status || 'Active'}</span>
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;