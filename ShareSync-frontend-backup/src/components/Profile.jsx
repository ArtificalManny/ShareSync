import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(user);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setProfile(user);
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });
    setIsEditing(false);
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <img src={profile.bannerPicture || 'https://via.placeholder.com/1200x300'} alt="Banner" className="w-full h-48 object-cover rounded" />
        <img src={profile.profilePicture || 'https://via.placeholder.com/150'} alt="Profile" className="w-32 h-32 rounded-full -mt-16 ml-4 border-4 border-white" />
      </div>
      <h1 className="text-3xl font-bold mb-4">{profile.firstName} {profile.lastName}</h1>
      {isEditing ? (
        <form onSubmit={handleUpdate}>
          <input
            type="text"
            value={profile.firstName}
            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
            className="p-2 border rounded mb-2 w-full"
            placeholder="First Name"
          />
          <input
            type="text"
            value={profile.lastName}
            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
            className="p-2 border rounded mb-2 w-full"
            placeholder="Last Name"
          />
          <input
            type="text"
            value={profile.profilePicture}
            onChange={(e) => setProfile({ ...profile, profilePicture: e.target.value })}
            className="p-2 border rounded mb-2 w-full"
            placeholder="Profile Picture URL"
          />
          <input
            type="text"
            value={profile.bannerPicture}
            onChange={(e) => setProfile({ ...profile, bannerPicture: e.target.value })}
            className="p-2 border rounded mb-2 w-full"
            placeholder="Banner Picture URL"
          />
          <input
            type="text"
            value={profile.job}
            onChange={(e) => setProfile({ ...profile, job: e.target.value })}
            className="p-2 border rounded mb-2 w-full"
            placeholder="Job"
          />
          <input
            type="text"
            value={profile.school}
            onChange={(e) => setProfile({ ...profile, school: e.target.value })}
            className="p-2 border rounded mb-2 w-full"
            placeholder="School"
          />
          <button type="submit" className="p-2 bg-blue-500 text-white rounded">
            Save
          </button>
          <button onClick={() => setIsEditing(false)} className="ml-2 p-2 bg-gray-500 text-white rounded">
            Cancel
          </button>
        </form>
      ) : (
        <div>
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Job:</strong> {profile.job || 'Not specified'}</p>
          <p><strong>School:</strong> {profile.school || 'Not specified'}</p>
          <button onClick={() => setIsEditing(true)} className="mt-4 p-2 bg-blue-500 text-white rounded">
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;