import React, { useState } from 'react';
import axios from 'axios';

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

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
      setErrorMessage('');
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during upload');
    }
  };

  console.log('Rendering Upload component');
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Upload File</h2>
      <form onSubmit={handleUpload}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {uploadUrl && (
        <div>
          <p>File uploaded successfully!</p>
          <a href={uploadUrl} target="_blank" rel="noopener noreferrer">View File</a>
        </div>
      )}
    </div>
  );
};

export default Upload;