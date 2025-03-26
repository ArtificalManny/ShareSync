import React, { useState } from 'react';
import axios from 'axios';

interface Project {
  _id: string;
  name: string;
}

interface UploadProps {
  projects: Project[] | undefined;
}

const Upload: React.FC<UploadProps> = ({ projects }) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [user] = useState<{ username: string } | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!file) {
      setErrorMessage('Please select a file to upload');
      return;
    }
    if (!selectedProject) {
      setErrorMessage('Please select a project');
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
      setFile(null);
      setSelectedProject('');

      // Log the upload activity (mocked for now; in a real app, you'd send this to the backend)
      console.log(`User ${user?.username} uploaded file ${file.name} to project ${selectedProject}`);
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred during upload. Please ensure the backend server is running.');
    }
  };

  console.log('Rendering Upload page');
  return (
    <div className="upload-container">
      <h2>Upload File</h2>
      <p>Upload files to share with your project team.</p>
      <form onSubmit={handleUpload} className="glassmorphic">
        <div className="form-group">
          <label htmlFor="projectSelect">Select Project</label>
          <select
            id="projectSelect"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            required
          >
            <option value="">Select a project</option>
            {projects && projects.map((project) => (
              <option key={project._id} value={project._id}>{project.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="fileUpload">Select File</label>
          <input id="fileUpload" type="file" onChange={handleFileChange} />
        </div>
        <button type="submit" className="neumorphic">Upload</button>
      </form>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      {uploadUrl && (
        <div className="upload-result">
          <p>File uploaded successfully!</p>
          <a
            href={uploadUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View File
          </a>
        </div>
      )}
    </div>
  );
};

export default Upload;