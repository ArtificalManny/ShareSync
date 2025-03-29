import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email?: string;
  gender?: string;
  birthday?: { month: string; day: string; year: string };
  profilePic?: string;
  coverPhoto?: string;
  bio?: string;
  school?: string;
  occupation?: string;
  hobbies?: string[];
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
  status?: 'current' | 'past';
}

interface Activity {
  _id: string;
  type: 'post' | 'comment' | 'like' | 'task' | 'subtask' | 'file' | 'project_create' | 'profile_update';
  content: string;
  createdAt: string;
}

interface Connection {
  _id: string;
  username: string;
  profilePic?: string;
}

interface ProfileProps {
  setUser: (user: User | null) => void;
}

const Profile: React.FC<ProfileProps> = ({ setUser }) => {
  const [user, setLocalUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [school, setSchool] = useState(user?.school || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [hobbies, setHobbies] = useState<string[]>(user?.hobbies || []);
  const [newHobby, setNewHobby] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const retry = async <T,>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay);
    }
  };

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const cachedProjects = localStorage.getItem(`projects_${user.username}`);
      const cachedProjectsTimestamp = localStorage.getItem(`projects_${user.username}_timestamp`);
      const cachedActivities = localStorage.getItem(`activities_${user._id}`);
      const cachedActivitiesTimestamp = localStorage.getItem(`activities_${user._id}_timestamp`);
      const now = Date.now();

      let projectsData: Project[] = [];
      let activitiesData: Activity[] = [];

      if (cachedProjects && cachedProjectsTimestamp && (now - parseInt(cachedProjectsTimestamp)) < CACHE_DURATION) {
        projectsData = JSON.parse(cachedProjects);
        setProjects(projectsData.map((project: Project, index: number) => ({
          ...project,
          status: index % 2 === 0 ? 'current' : 'past',
        })));
      }

      if (cachedActivities && cachedActivitiesTimestamp && (now - parseInt(cachedActivitiesTimestamp)) < CACHE_DURATION) {
        activitiesData = JSON.parse(cachedActivities);
        setActivities(activitiesData);
      }

      const fetchProjects = !cachedProjects || (now - parseInt(cachedProjectsTimestamp || '0')) >= CACHE_DURATION;
      const fetchActivities = !cachedActivities || (now - parseInt(cachedActivitiesTimestamp || '0')) >= CACHE_DURATION;

      if (fetchProjects || fetchActivities) {
        const promises: Promise<any>[] = [];
        if (fetchProjects) {
          promises.push(retry(() => axios.get(`${import.meta.env.VITE_API_URL}/projects/${user.username}`)));
        } else {
          promises.push(Promise.resolve(null));
        }

        if (fetchActivities) {
          promises.push(retry(() => axios.get(`${import.meta.env.VITE_API_URL}/activities/user/${user?._id}`)));
        } else {
          promises.push(Promise.resolve(null));
        }

        const [projectsResponse, activitiesResponse] = await Promise.all(promises);

        if (projectsResponse) {
          projectsData = projectsResponse.data.data || (Array.isArray(projectsResponse.data) ? projectsResponse.data : []);
          const updatedProjects = projectsData.map((project: Project, index: number) => ({
            ...project,
            status: index % 2 === 0 ? 'current' : 'past',
          }));
          setProjects(updatedProjects);
          localStorage.setItem(`projects_${user.username}`, JSON.stringify(projectsData));
          localStorage.setItem(`projects_${user.username}_timestamp`, now.toString());
        }

        if (activitiesResponse) {
          activitiesData = activitiesResponse.data || [];
          setActivities(activitiesData);
          localStorage.setItem(`activities_${user._id}`, JSON.stringify(activitiesData));
          localStorage.setItem(`activities_${user._id}_timestamp`, now.toString());
        }
      }

      const mockConnections: Connection[] = [
        { _id: '1', username: 'JohnDoe', profilePic: 'https://via.placeholder.com/40' },
        { _id: '2', username: 'SarahSmith', profilePic: 'https://via.placeholder.com/40' },
        { _id: '3', username: 'MikeJohnson', profilePic: 'https://via.placeholder.com/40' },
      ];
      setConnections(mockConnections);
    } catch (error: any) {
      console.error('Failed to fetch data:', error.response?.data || error.message);
      setProjects([]);
      setActivities([]);
      setConnections([]);
      setErrorMessage(error.response?.data?.error || 'Failed to fetch data. Please ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setSchool(user.school || '');
      setOccupation(user.occupation || '');
      setHobbies(user.hobbies || []);

      fetchData();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updatedUser = { ...user, firstName, lastName, email, bio, school, occupation, hobbies };
      console.log('Updating profile with payload:', updatedUser);
      const response = await retry(() => axios.put(`${import.meta.env.VITE_API_URL}/users/${user?._id}`, updatedUser));
      console.log('Update profile response:', response.data);
      const newUserData = response.data.data.user;
      setLocalUser(newUserData);
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
      setSuccessMessage('Profile updated successfully');
      setActivities([
        ...activities,
        {
          _id: `${activities.length + 1}`,
          type: 'profile_update',
          content: 'Updated profile information',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error: any) {
      console.error('Profile update error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during profile update. Please ensure the backend server is running.');
    }
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        console.log('Uploading cover photo...');
        const response = await retry(() => axios.post<{ url: string }>(`${import.meta.env.VITE_API_URL}/uploads`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }));
        console.log('Upload cover photo response:', response.data);
        const coverPhotoUrl = response.data.url;
        const updatedUser = { ...user, coverPhoto: coverPhotoUrl };
        console.log('Updating user with new cover photo:', updatedUser);
        const responseUser = await retry(() => axios.put(`${import.meta.env.VITE_API_URL}/users/${user?._id}`, updatedUser));
        console.log('Update user response:', responseUser.data);
        const newUserData = responseUser.data.data.user;
        setLocalUser(newUserData);
        setUser(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
        setSuccessMessage('Cover photo updated successfully');
        setActivities([
          ...activities,
          {
            _id: `${activities.length + 1}`,
            type: 'profile_update',
            content: 'Updated cover photo',
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (error: any) {
        console.error('Cover photo upload error:', error.response?.data || error.message);
        setErrorMessage(error.response?.data?.error || 'An error occurred during cover photo upload. Please ensure the backend server is running.');
      }
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        console.log('Uploading profile picture...');
        const response = await retry(() => axios.post<{ url: string }>(`${import.meta.env.VITE_API_URL}/uploads`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }));
        console.log('Upload profile picture response:', response.data);
        const profilePicUrl = response.data.url;
        const updatedUser = { ...user, profilePic: profilePicUrl };
        console.log('Updating user with new profile picture:', updatedUser);
        const responseUser = await retry(() => axios.put(`${import.meta.env.VITE_API_URL}/users/${user?._id}`, updatedUser));
        console.log('Update user response:', responseUser.data);
        const newUserData = responseUser.data.data.user;
        setLocalUser(newUserData);
        setUser(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
        setSuccessMessage('Profile picture updated successfully');
        setActivities([
          ...activities,
          {
            _id: `${activities.length + 1}`,
            type: 'profile_update',
            content: 'Updated profile picture',
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (error: any) {
        console.error('Profile picture upload error:', error.response?.data || error.message);
        setErrorMessage(error.response?.data?.error || 'An error occurred during profile picture upload. Please ensure the backend server is running.');
      }
    }
  };

  const handleAddHobby = () => {
    if (newHobby.trim()) {
      setHobbies([...hobbies, newHobby.trim()]);
      setNewHobby('');
    }
  };

  const handleRemoveHobby = (hobby: string) => {
    setHobbies(hobbies.filter((h) => h !== hobby));
  };

  if (!user) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Please log in to view your profile.</div>;
  }

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#00d4ff' }}>Loading...</div>;
  }

  console.log('Rendering Profile page');
  return (
    <div className="profile-container">
      {/* Cover Photo Section */}
      <div
        className="cover-photo glassmorphic"
        style={{
          background: user.coverPhoto ? `url(${user.coverPhoto})` : 'linear-gradient(135deg, #36B37E, #0052CC)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <label htmlFor="coverPhotoUpload" className="cover-photo-label">
          <button type="button" className="neumorphic">Change Cover Photo</button>
          <input
            id="coverPhotoUpload"
            type="file"
            accept="image/*"
            onChange={handleCoverPhotoUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Profile Info Section */}
      <div className="profile-info">
        <div className="profile-pic-container">
          {user.profilePic ? (
            <img
              src={user.profilePic}
              alt="Profile"
              className="profile-pic-large"
            />
          ) : (
            <div
              className="profile-pic-placeholder"
            >
              {user.firstName ? user.firstName[0] : user.username[0]}
            </div>
          )}
          <label htmlFor="profilePicUploadProfile" className="profile-pic-label">
            <button type="button" className="neumorphic">Change Profile Picture</button>
            <input
              id="profilePicUploadProfile"
              type="file"
              accept="image/*"
              onChange={handleProfilePicUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <div className="profile-details">
          <h2>
            {user.firstName} {user.lastName}
          </h2>
          <p>@{user.username}</p>
          <p>{user.email}</p>
          <p>{user.bio || 'No bio available'}</p>
        </div>
      </div>

      {/* Tabs for Profile Sections */}
      <div className="profile-tabs">
        <button className="tab-button glassmorphic">About</button>
        <button className="tab-button glassmorphic">Projects</button>
        <button className="tab-button glassmorphic">Activity</button>
        <button className="tab-button glassmorphic">Connections</button>
      </div>

      {/* About Section */}
      <div className="section glassmorphic">
        <h3>About</h3>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </div>
          <div className="form-group">
            <label htmlFor="school">School</label>
            <input
              id="school"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Enter your school"
            />
          </div>
          <div className="form-group">
            <label htmlFor="occupation">Occupation</label>
            <input
              id="occupation"
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Enter your occupation"
            />
          </div>
          <div className="form-group">
            <label>Hobbies</label>
            <div className="hobby-input">
              <input
                type="text"
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                placeholder="Add a hobby"
              />
              <button type="button" className="neumorphic" onClick={handleAddHobby}>Add</button>
            </div>
            {hobbies.length > 0 && (
              <ul className="hobby-list">
                {hobbies.map((hobby) => (
                  <li key={hobby}>
                    {hobby}
                    <button type="button" className="neumorphic remove-hobby" onClick={() => handleRemoveHobby(hobby)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" className="neumorphic">Update Profile</button>
        </form>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
      </div>

      {/* Projects Section */}
      <div className="section glassmorphic">
        <h3>Projects</h3>
        {projects.length === 0 ? (
          <p>No projects yet.</p>
        ) : (
          <>
            <h4>Current Projects</h4>
            <div className="project-grid">
              {projects.filter((project) => project.status === 'current').map((project) => (
                <div
                  key={project._id}
                  className="project-card glassmorphic"
                  style={{
                    borderLeft: `4px solid ${project.color || '#3a3a50'}`,
                  }}
                >
                  <h4>{project.name}</h4>
                  <p>{project.description || 'No description'}</p>
                </div>
              ))}
            </div>
            <h4>Past Projects</h4>
            <div className="project-grid">
              {projects.filter((project) => project.status === 'past').map((project) => (
                <div
                  key={project._id}
                  className="project-card glassmorphic"
                  style={{
                    borderLeft: `4px solid ${project.color || '#3a3a50'}`,
                  }}
                >
                  <h4>{project.name}</h4>
                  <p>{project.description || 'No description'}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="section glassmorphic">
        <h3>Recent Activity</h3>
        {activities.length === 0 ? (
          <p>No recent activity.</p>
        ) : (
          <ul className="activity-list">
            {activities.map((activity) => (
              <li key={activity._id}>
                {activity.content} - {new Date(activity.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Connections Section */}
      <div className="section glassmorphic">
        <h3>Connections ({connections.length})</h3>
        {connections.length === 0 ? (
          <p>No connections yet. Start connecting with others!</p>
        ) : (
          <div className="connections-grid">
            {connections.map((connection) => (
              <div key={connection._id} className="connection-card glassmorphic">
                {connection.profilePic ? (
                  <img src={connection.profilePic} alt="Profile" className="connection-pic" />
                ) : (
                  <div className="connection-pic-placeholder">
                    {connection.username[0]}
                  </div>
                )}
                <p>{connection.username}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;