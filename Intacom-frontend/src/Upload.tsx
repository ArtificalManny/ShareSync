import React, { useState } from 'react';
import axios from 'axios';

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post<{ url: string }>('http://localhost:3000/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadUrl(response.data.url);
      setSuccessMessage('File uploaded successfully!');
      setErrorMessage('');
      setFile(null);
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during upload');
    }
  };

  console.log('Rendering Upload page');
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Upload File</h2>
      <p style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '1.5rem' }}>
        Upload files to share with your project team.
      </p>
      <form onSubmit={handleUpload}>
        <div className="form-group">
          <label htmlFor="fileUpload">Select File</label>
          <input id="fileUpload" type="file" onChange={handleFileChange} />
        </div>
        <button type="submit">Upload</button>
      </form>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && (
        <div style={{ color: '#4caf50', textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem' }}>
          {successMessage}
        </div>
      )}
      {uploadUrl && (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>File uploaded successfully!</p>
          <a
            href={uploadUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
          >
            View File
          </a>
        </div>
      )}
    </div>
  );
};

export default Upload;