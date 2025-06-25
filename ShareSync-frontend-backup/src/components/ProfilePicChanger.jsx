// src/components/ProfilePicChanger.jsx

import React, { useRef, useState } from 'react';
import client from '../api/client';

export default function ProfilePicChanger({
  currentPic,           // string URL of the current avatar
  onProfileUpdate       // fn(updatedUser) -> parent will set state + localStorage
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // open the native file picker
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // when the user selects a file, upload it
  const handleFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('profilePicture', file);

      // ← POST to /api/profile/upload-profile-picture
      //     client will auto-send Authorization: Bearer <token>
      const { data } = await client.post(
        '/profile/upload-profile-picture',
        fd
      );

      // bubble up the new user object
      onProfileUpdate(data.user);
    } catch (err) {
      console.error(err);
      alert(
        `Failed to upload:\n` +
        `Status: ${err.response?.status || '––'}\n` +
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
          <span className="text-xs text-gray-700">Uploading...</span>
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
