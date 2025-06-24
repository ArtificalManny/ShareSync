// src/components/ProfilePicChanger.jsx
import React, { useRef, useState } from 'react'
import client from '../api/client'

export default function ProfilePicChanger({
  currentPic,     // string URL of current avatar
  onProfileUpdate // fn(updatedUser) → parent saves to state + localStorage
}) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async e => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('profilePicture', file)

      // ← this goes to /api/profile/upload-profile-picture via your Vite proxy
      const { data } = await client.post(
        '/profile/upload-profile-picture',
        fd
      )

      onProfileUpdate(data.user)
    } catch (err) {
      console.error('[Upload Error]', err)
      alert(
        `Failed to upload:\n${
          err.response?.status || '––'
        }\n${err.response?.data?.message || err.message}`
      )
    } finally {
      setUploading(false)
    }
  }

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
  )
}
