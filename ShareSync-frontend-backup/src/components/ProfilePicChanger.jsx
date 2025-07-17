// src/components/ProfilePicChanger.jsx
import React, { useRef, useState, useContext } from 'react';
import { getAccessToken } from '../utils/tokenUtils';
import { AuthContext } from '../AuthContext';

export default function ProfilePicChanger() {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { user, updateProfile } = useContext(AuthContext);

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = async e => {
    const token = getAccessToken();
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      const response = await fetch('http://localhost:3000/api/profile/upload-profile-picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

      const data = await response.json();

      const updatedUser = {
        ...data.user,
        profilePicture: `http://localhost:3000/${data.user.profilePicture}`,
      };

      updateProfile(updatedUser);
    } catch (err) {
      console.error(err);
      alert(`Upload failed:\n${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const imageSrc = user?.profilePicture || '/default-user-icon.png';

  return (
    <div className="relative inline-block">
      <img
        src={imageSrc}
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