import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../App';

interface ProfileProps {
  setUser: (user: User | null) => void;
}

const Profile: React.FC<ProfileProps> = ({ setUser }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [bio, setBio] = useState('');
  const [school, setSchool] = useState('');
  const [occupation, setOccupation] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [newHobby, setNewHobby] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          setErrorMessage('User not found. Please log in again.');
          setUser(null);
          return;
        }

        const user = JSON.parse(savedUser);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/${user.username}`);
        const fetchedUser = response.data.data.user;
        setUserData(fetchedUser);
        setBio(fetchedUser.bio || '');
        setSchool(fetchedUser.school || '');
        setOccupation(fetchedUser.occupation || '');
        setHobbies(fetchedUser.hobbies || []);
      } catch (error: any) {
        console.error('Error fetching user data:', error.response?.data || error.message);
        setErrorMessage('Failed to load profile data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const updatedUser = {
        ...userData,
        bio,
        school,
        occupation,
        hobbies,
      };
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/users/${userData?._id}`, updatedUser);
      const newUserData = response.data.data.user;
      setUser(newUserData);
      setUserData(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
    } catch (error: any) {
      console.error('Error updating profile:', error.response?.data || error.message);
      setErrorMessage('Failed to update profile. Please try again later.');
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

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await axios.post<{ url: string }>(`${import.meta.env.VITE_API_URL}/uploads`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const updatedUser = { ...userData, coverPhoto: response.data.url };
        const responseUser = await axios.put(`${import.meta.env.VITE_API_URL}/users/${userData?._id}`, updatedUser);
        const newUserData = responseUser.data.data.user;
        setUser(newUserData);
        setUserData(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
      } catch (error: any) {
        console.error('Error uploading cover photo:', error.response?.data || error.message);
        setErrorMessage('Failed to upload cover photo. Please try again later.');
      }
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await axios.post<{ url: string }>(`${import.meta.env.VITE_API_URL}/uploads`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const updatedUser = { ...userData, profilePic: response.data.url };
        const responseUser = await axios.put(`${import.meta.env.VITE_API_URL}/users/${userData?._id}`, updatedUser);
        const newUserData = responseUser.data.data.user;
        setUser(newUserData);
        setUserData(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
      } catch (error: any) {
        console.error('Error uploading profile picture:', error.response?.data || error.message);
        setErrorMessage('Failed to upload profile picture. Please try again later.');
      }
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#f5f5f5' }}>Loading profile...</div>;
  }

  if (!userData) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#ff4d4f' }}>{errorMessage}</div>;
  }

  return (
    <div className="profile-container">
      <div className="cover-photo">
        {userData.coverPhoto ? (
          <img src={userData.coverPhoto} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #4299e1, #48bb78)' }} />
        )}
        <label className="cover-photo-label">
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverPhotoUpload}
            style={{ display: 'none' }}
          />
          <button type="button" className="neumorphic">Change Cover Photo</button>
        </label>
      </div>
      <div className="profile-info glassmorphic">
        <div className="profile-pic-container">
          {userData.profilePic ? (
            <img src={userData.profilePic} alt="Profile" className="profile-pic-large" />
          ) : (
            <div className="profile-pic-placeholder">
              {userData.firstName ? userData.firstName[0] : userData.username[0]}
            </div>
          )}
          <label className="profile-pic-label">
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePicUpload}
              style={{ display: 'none' }}
            />
            <button type="button" className="neumorphic">Change</button>
          </label>
        </div>
        <div className="profile-details">
          <h2>{userData.firstName} {userData.lastName}</h2>
          <p>Username: {userData.username}</p>
          <p>Email: {userData.email}</p>
          <p>Gender: {userData.gender || 'Not specified'}</p>
          <p>Birthday: {userData.birthday ? `${userData.birthday.month}/${userData.birthday.day}/${userData.birthday.year}` : 'Not specified'}</p>
        </div>
      </div>
      <div className="section glassmorphic">
        <h3>Edit Profile</h3>
        <form onSubmit={handleUpdateProfile}>
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
              <button type="button" className="neumorphic" onClick={handleAddHobby}>
                Add
              </button>
            </div>
            {hobbies.length > 0 && (
              <ul className="hobby-list">
                {hobbies.map((hobby) => (
                  <li key={hobby}>
                    {hobby}
                    <button
                      type="button"
                      className="neumorphic remove-hobby"
                      onClick={() => handleRemoveHobby(hobby)}
                    >
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
      </div>
    </div>
  );
};

export default Profile;