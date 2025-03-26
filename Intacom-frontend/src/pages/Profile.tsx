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
  type: 'post' | 'comment' | 'like' | 'task';
  content: string;
  createdAt: string;
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
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setSchool(user.school || '');
      setOccupation(user.occupation || '');
      setHobbies(user.hobbies || []);

      // Fetch projects
      const fetchProjects = async () => {
        try {
          const response = await axios.get(`http://localhost:3000/projects/${user.username}`);
          const projectsData = response.data.data || (Array.isArray(response.data) ? response.data : []);
          // Mock project status for now; in a real app, this would come from the backend
          const updatedProjects = projectsData.map((project: Project, index: number) => ({
            ...project,
            status: index % 2 === 0 ? 'current' : 'past',
          }));
          setProjects(updatedProjects);
        } catch (error: any) {
          console.error('Failed to fetch projects:', error.response?.data || error.message);
          setProjects([]);
          setErrorMessage(error.response?.data?.error || 'Failed to fetch projects. Please ensure the backend server is running.');
        }
      };

      // Fetch recent activity (mocked for now; in a real app, you'd have a backend endpoint)
      const fetchActivities = async () => {
        setActivities([
          { _id: '1', type: 'post', content: 'Posted an update in Rivas Miranda Estate', createdAt: new Date().toISOString() },
          { _id: '2', type: 'task', content: 'Completed task "Design UI"', createdAt: new Date().toISOString() },
        ]);
      };

      fetchProjects();
      fetchActivities();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updatedUser = { ...user, firstName, lastName, email, bio, school, occupation, hobbies };
      const response = await axios.put(`http://localhost:3000/users/${user?._id}`, updatedUser);
      const newUserData = response.data.data.user;
      setLocalUser(newUserData);
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
      setSuccessMessage('Profile updated successfully');
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
        const response = await axios.post<{ url: string }>('http://localhost:3000/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const coverPhotoUrl = response.data.url;
        const updatedUser = { ...user, coverPhoto: coverPhotoUrl };
        const responseUser = await axios.put(`http://localhost:3000/users/${user?._id}`, updatedUser);
        const newUserData = responseUser.data.data.user;
        setLocalUser(newUserData);
        setUser(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
        setSuccessMessage('Cover photo updated successfully');
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
        const response = await axios.post<{ url: string }>('http://localhost:3000/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const profilePicUrl = response.data.url;
        const updatedUser = { ...user, profilePic: profilePicUrl };
        const responseUser = await axios.put(`http://localhost:3000/users/${user?._id}`, updatedUser);
        const newUserData = responseUser.data.data.user;
        setLocalUser(newUserData);
        setUser(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
        setSuccessMessage('Profile picture updated successfully');
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
              <li
                key={activity._id}
              >
                {activity.content} - {new Date(activity.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Profile;