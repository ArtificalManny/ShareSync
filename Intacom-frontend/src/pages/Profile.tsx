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
        } catch (error) {
          console.error('Failed to fetch projects:', error);
          setProjects([]);
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
      setErrorMessage(error.response?.data?.error || 'An error occurred during profile update');
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
        setErrorMessage(error.response?.data?.error || 'An error occurred during cover photo upload');
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
        setErrorMessage(error.response?.data?.error || 'An error occurred during profile picture upload');
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
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Cover Photo Section */}
      <div
        style={{
          position: 'relative',
          height: '300px',
          background: user.coverPhoto ? `url(${user.coverPhoto})` : 'var(--secondary-color)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '12px 12px 0 0',
          marginBottom: '4rem',
        }}
      >
        <label htmlFor="coverPhotoUpload" style={{ position: 'absolute', bottom: '1rem', right: '1rem', cursor: 'pointer' }}>
          <button type="button">Change Cover Photo</button>
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
      <div style={{ display: 'flex', gap: '2rem', marginTop: '-3rem', marginBottom: '2rem' }}>
        <div style={{ flex: '0 0 200px', textAlign: 'center' }}>
          {user.profilePic ? (
            <img
              src={user.profilePic}
              alt="Profile"
              style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)' }}
            />
          ) : (
            <div
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'var(--secondary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                color: 'var(--text-color)',
                border: '3px solid var(--primary-color)',
                margin: '0 auto',
              }}
            >
              {user.firstName ? user.firstName[0] : user.username[0]}
            </div>
          )}
          <label htmlFor="profilePicUpload" style={{ display: 'block', marginTop: '0.5rem', cursor: 'pointer' }}>
            <button type="button">Change Profile Picture</button>
            <input
              id="profilePicUpload"
              type="file"
              accept="image/*"
              onChange={handleProfilePicUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {user.firstName} {user.lastName}
          </h2>
          <p style={{ margin: '0 0 0.5rem 0', opacity: '0.8' }}>@{user.username}</p>
          <p style={{ margin: '0 0 0.5rem 0', opacity: '0.8' }}>{user.email}</p>
          <p style={{ margin: '0', opacity: '0.8' }}>{user.bio || 'No bio available'}</p>
        </div>
      </div>

      {/* Tabs for Profile Sections */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button style={{ padding: '0.5rem 1rem', background: 'var(--card-background)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          About
        </button>
        <button style={{ padding: '0.5rem 1rem', background: 'var(--card-background)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Projects
        </button>
        <button style={{ padding: '0.5rem 1rem', background: 'var(--card-background)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Activity
        </button>
      </div>

      {/* About Section */}
      <div
        style={{
          background: 'var(--card-background)',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          marginBottom: '2rem',
        }}
      >
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>About</h3>
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
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                placeholder="Add a hobby"
              />
              <button type="button" onClick={handleAddHobby}>Add</button>
            </div>
            {hobbies.length > 0 && (
              <ul style={{ listStyle: 'none', padding: '0' }}>
                {hobbies.map((hobby) => (
                  <li key={hobby} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    {hobby}
                    <button type="button" onClick={() => handleRemoveHobby(hobby)} style={{ background: '#ff5555' }}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit">Update Profile</button>
        </form>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && (
          <div style={{ color: '#4caf50', textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem' }}>
            {successMessage}
          </div>
        )}
      </div>

      {/* Projects Section */}
      <div
        style={{
          background: 'var(--card-background)',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          marginBottom: '2rem',
        }}
      >
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Projects</h3>
        {projects.length === 0 ? (
          <p style={{ fontSize: '1rem', opacity: '0.8' }}>No projects yet.</p>
        ) : (
          <>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Current Projects</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
              {projects.filter((project) => project.status === 'current').map((project) => (
                <div
                  key={project._id}
                  className="project-card"
                  style={{
                    borderLeft: `4px solid ${project.color || '#3a3a50'}`,
                  }}
                >
                  <h4>{project.name}</h4>
                  <p>{project.description || 'No description'}</p>
                </div>
              ))}
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Past Projects</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {projects.filter((project) => project.status === 'past').map((project) => (
                <div
                  key={project._id}
                  className="project-card"
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
      <div
        style={{
          background: 'var(--card-background)',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Activity</h3>
        {activities.length === 0 ? (
          <p style={{ fontSize: '1rem', opacity: '0.8' }}>No recent activity.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: '0' }}>
            {activities.map((activity) => (
              <li
                key={activity._id}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.9rem',
                }}
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