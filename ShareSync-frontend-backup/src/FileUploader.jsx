// src/components/files/FileUploader.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logUserActivity } from '../../utils/activityLogger';

// Placeholder uploadFile function (replace with real logic)
const uploadFile = async ({ file, projectId }) => {
  return {
    _id: Math.random().toString(36).substring(2),
    name: file.name,
    projectId,
  };
};

const FileUploader = ({ projectId }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadFile({ file, projectId });

      await logUserActivity(user._id, 'assignment', 'submitted assignment', projectId, {
        assignmentId: submission.assignmentId,
        title: submission.title,
      });

      setFile(null);
      alert('File uploaded and activity logged!');
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleFileUpload} className="file-uploader">
      <h3>Upload File</h3>
      <input type="file" onChange={handleFileChange} />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
};

export default FileUploader;
