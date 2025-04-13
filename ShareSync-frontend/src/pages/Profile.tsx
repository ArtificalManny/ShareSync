import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Activity {
  _id: string;
  type: 'post' | 'comment' | 'like' | 'task' | 'project';
  content: string;
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  skills?: string[];
  experience?: { company: string; role: string; duration: string }[];
  profilePicture?: string;
  coverPhoto?: string;
}

interface ProfileProps {
  user: User | null;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    if (!user) {
      setError('Please log in to view your profile.');
      return;
    }
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/${user.username}`, {
        withCredentials: true,
      });
      setProfile(response.data.data);
    } catch (err: any) {
      console.error('Profile.tsx: Error fetching profile:', err.message, err.response?.data);
      setError('Failed to load profile data. Please ensure the backend is running and try again.');
    }
  };

  const fetchActivities = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/activities/user/${user._id}`, {
        withCredentials: true,
      });
      setActivities(response.data.data || []);
    } catch (err: any) {
      console.error('Profile.tsx: Error fetching activities:', err.message);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchActivities();
  }, [user]);

  const handleRetry = () => {
    setError(null);
    fetchProfile();
    fetchActivities();
  };

  if (error) {
    return (
      <div style={styles.container}>
        <h1>👤 Profile - ShareSync</h1>
        <p style={styles.error}>{error}</p>
        <button onClick={handleRetry} style={styles.retryButton}>Retry</button>
      </div>
    );
  }

  if (!profile) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1>👤 Profile - ShareSync</h1>
      <div style={styles.coverPhoto}>
        {profile.coverPhoto ? (
          <img src={profile.coverPhoto} alt="Cover" style={styles.coverImage} />
        ) : (
          <div style={styles.defaultCover}></div>
        )}
      </div>
      <div style={styles.profileHeader}>
        <div style={styles.profilePicture}>
          {profile.profilePicture ? (
            <img src={profile.profilePicture} alt="Profile" style={styles.profileImage} />
          ) : (
            <div style={styles.defaultProfilePicture}>
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
          )}
        </div>
        <div style={styles.profileInfo}>
          <h2>{profile.firstName} {profile.lastName}</h2>
          <p>{profile.username} | {profile.email}</p>
          <p>{profile.bio || 'No bio available.'}</p>
          <button onClick={() => navigate('/profile/edit')} style={styles.editButton}>Edit Profile</button>
        </div>
      </div>
      <div style={styles.sections}>
        <div style={styles.section}>
          <h3>🛠️ Skills</h3>
          {profile.skills && profile.skills.length > 0 ? (
            <ul style={styles.list}>
              {profile.skills.map((skill, index) => (
                <li key={index} style={styles.listItem}>{skill}</li>
              ))}
            </ul>
          ) : (
            <p>No skills listed.</p>
          )}
        </div>
        <div style={styles.section}>
          <h3>💼 Experience</h3>
          {profile.experience && profile.experience.length > 0 ? (
            <ul style={styles.list}>
              {profile.experience.map((exp, index) => (
                <li key={index} style={styles.listItem}>
                  <strong>{exp.role}</strong> at {exp.company} ({exp.duration})
                </li>
              ))}
            </ul>
          ) : (
            <p>No experience listed.</p>
          )}
        </div>
        <div style={styles.section}>
          <h3>📈 Activity Feed</h3>
          {activities.length > 0 ? (
            <ul style={styles.activityList}>
              {activities.map((activity) => (
                <li key={activity._id} style={styles.activityItem}>
                  <p>{activity.content}</p>
                  <p style={styles.activityDate}>{new Date(activity.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline styles with updated color palette
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#2B3A67', // Deep Blue
    color: '#FFFFFF', // White text
  },
  coverPhoto: {
    height: '300px',
    backgroundColor: '#3F51B5', // Indigo
    borderRadius: '8px 8px 0 0',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px 8px 0 0',
  },
  defaultCover: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #2B3A67, #3F51B5)', // Deep Blue to Indigo
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    marginTop: '-80px',
    padding: '0 20px',
  },
  profilePicture: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    border: '4px solid #2B3A67', // Deep Blue
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // White
  },
  profileImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  defaultProfilePicture: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3F51B5', // Indigo
    color: '#FFFFFF', // White text
    fontSize: '48px',
    fontWeight: 'bold',
  },
  profileInfo: {
    marginLeft: '20px',
    marginBottom: '20px',
  },
  editButton: {
    backgroundColor: '#E3F2FD', // Soft Blue
    color: '#2B3A67', // Deep Blue
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  sections: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    marginTop: '20px',
  },
  section: {
    flex: '1 1 300px',
    backgroundColor: '#3F51B5', // Indigo
    padding: '20px',
    borderRadius: '8px',
  },
  list: {
    listStyleType: 'none',
    padding: 0,
  },
  listItem: {
    padding: '8px 0',
    borderBottom: '1px solid #2B3A67', // Deep Blue
  },
  activityList: {
    listStyleType: 'none',
    padding: 0,
  },
  activityItem: {
    padding: '10px 0',
    borderBottom: '1px solid #2B3A67', // Deep Blue
  },
  activityDate: {
    fontSize: '12px',
    color: '#E3F2FD', // Soft Blue
  },
  error: {
    color: '#FF6F61', // Coral
    marginBottom: '10px',
  },
  retryButton: {
    backgroundColor: '#E3F2FD', // Soft Blue
    color: '#2B3A67', // Deep Blue
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default Profile;