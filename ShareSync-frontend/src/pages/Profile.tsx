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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/${user.username}`);
      setProfile(response.data.data);
    } catch (err: any) {
      console.error('Profile.tsx: Error fetching profile:', err.message, err.response?.data);
      setError('Failed to load profile data. Please ensure you are logged in and try again.');
    }
  };

  const fetchActivities = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/activities/user/${user._id}`);
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
        <h1 style={styles.heading}>👤 Profile - ShareSync</h1>
        <p style={styles.error}>{error}</p>
        <button onClick={handleRetry} style={styles.retryButton}>Retry</button>
      </div>
    );
  }

  if (!profile) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>👤 Profile - ShareSync</h1>
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
          <h2 style={styles.profileName}>{profile.firstName} {profile.lastName}</h2>
          <p style={styles.text}>{profile.username} | {profile.email}</p>
          <p style={styles.text}>{profile.bio || 'No bio available.'}</p>
          <button onClick={() => navigate('/profile/edit')} style={styles.editButton}>Edit Profile</button>
        </div>
      </div>
      <div style={styles.sections}>
        <div style={styles.section}>
          <h3 style={styles.subHeading}>🛠️ Skills</h3>
          {profile.skills && profile.skills.length > 0 ? (
            <ul style={styles.list}>
              {profile.skills.map((skill, index) => (
                <li key={index} style={styles.listItem}>{skill}</li>
              ))}
            </ul>
          ) : (
            <p style={styles.text}>No skills listed.</p>
          )}
        </div>
        <div style={styles.section}>
          <h3 style={styles.subHeading}>💼 Experience</h3>
          {profile.experience && profile.experience.length > 0 ? (
            <ul style={styles.list}>
              {profile.experience.map((exp, index) => (
                <li key={index} style={styles.listItem}>
                  <strong>{exp.role}</strong> at {exp.company} ({exp.duration})
                </li>
              ))}
            </ul>
          ) : (
            <p style={styles.text}>No experience listed.</p>
          )}
        </div>
        <div style={styles.section}>
          <h3 style={styles.subHeading}>📈 Activity Feed</h3>
          {activities.length > 0 ? (
            <ul style={styles.activityList}>
              {activities.map((activity) => (
                <li key={activity._id} style={styles.activityItem}>
                  <p style={styles.text}>{activity.content}</p>
                  <p style={styles.activityDate}>{new Date(activity.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p style={styles.text}>No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    minHeight: '100vh',
    animation: 'fadeIn 1s ease-in-out',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '32px',
    textAlign: 'center',
    marginBottom: '30px',
    textShadow: '0 0 15px #A2E4FF',
  },
  coverPhoto: {
    height: '300px',
    background: 'linear-gradient(145deg, #2A2A4A, #3F3F6A)',
    borderRadius: '12px 12px 0 0',
    position: 'relative',
    boxShadow: '0 0 20px rgba(162, 228, 255, 0.3)',
    border: '1px solid #A2E4FF',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '12px 12px 0 0',
  },
  defaultCover: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #1E1E2F, #2A2A4A)',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    marginTop: '-80px',
    padding: '0 30px',
  },
  profilePicture: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    border: '4px solid #A2E4FF',
    overflow: 'hidden',
    backgroundColor: '#1E1E2F',
    boxShadow: '0 0 20px rgba(162, 228, 255, 0.5)',
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
    background: 'linear-gradient(145deg, #2A2A4A, #3F3F6A)',
    color: '#A2E4FF',
    fontSize: '48px',
    fontWeight: 'bold',
    fontFamily: '"Orbitron", sans-serif',
    textShadow: '0 0 10px #A2E4FF',
  },
  profileInfo: {
    marginLeft: '30px',
    marginBottom: '30px',
  },
  profileName: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '28px',
    color: '#A2E4FF',
    textShadow: '0 0 10px #A2E4FF',
    marginBottom: '10px',
  },
  editButton: {
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
  sections: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '30px',
    marginTop: '30px',
  },
  section: {
    flex: '1 1 300px',
    background: 'linear-gradient(145deg, #2A2A4A, #3F3F6A)',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.2)',
    border: '1px solid #A2E4FF',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  subHeading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '22px',
    marginBottom: '15px',
    textShadow: '0 0 10px #A2E4FF',
  },
  list: {
    listStyleType: 'none',
    padding: 0,
  },
  listItem: {
    padding: '10px 0',
    borderBottom: '1px solid #A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
  },
  activityList: {
    listStyleType: 'none',
    padding: 0,
  },
  activityItem: {
    padding: '10px 0',
    borderBottom: '1px solid #A2E4FF',
  },
  activityDate: {
    fontSize: '12px',
    color: '#A2E4FF',
    marginTop: '5px',
    fontFamily: '"Orbitron", sans-serif',
  },
  error: {
    color: '#FF6F91',
    marginBottom: '15px',
    fontFamily: '"Orbitron", sans-serif',
  },
  retryButton: {
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
  text: {
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
  },
};

// Add animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.7);
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  div[style*="flex: 1 1 300px"]:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default Profile;