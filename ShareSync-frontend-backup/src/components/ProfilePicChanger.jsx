// src/components/ProfilePicChanger.jsx
import React, { useRef, useState } from 'react';
import client from '../api/client';

export default function ProfilePicChanger({ currentPic, onProfileUpdate }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('profilePicture', file);

      const token = localStorage.getItem('access_token');

      const { data } = await client.post(
        'http://localhost:3000/api/profile/upload-profile-picture',
        fd,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          }
        }
      ); 

      // data.user.profilePicture === "/uploads/XXX.jpg"
      // we need the full URL so React can fetch it:
      const updatedUser = {
        ...data.user,
        profilePicture: `http://localhost:3000${data.user.profilePicture}`
      };

      onProfileUpdate(updatedUser);
    } catch (err) {
      console.error(err);
      alert(
        `Failed to upload:\n` +
        `Status: ${err.response?.status}\n` +
        `${JSON.stringify(err.response?.data || err.message)}`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <img
        src={currentPic}
        alt="Your profile"
        className="w-24 h-24 rounded-full ring-4 ring-indigo-500 object-cover cursor-pointer transition-all duration-300"
        onClick={handleClick}
      />
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-full">
          <span className="text-xs text-gray-700">Uploading…</span>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}