import React from 'react';
import { useAuth } from '../hooks/useAuth';

const UploadPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Upload</h1>
      {user ? (
        <form id="upload-form" onSubmit={(e) => { e.preventDefault(); handleFileUpload(e); }}>
          <input type="file" id="media-upload" accept="image/*,video/*,audio/*,application/pdf" />
          <button type="submit" className="button-primary">Upload</button>
        </form>
      ) : (
        <p>Please log in to upload files.</p>
      )}
    </div>
  );
};

export default UploadPage;