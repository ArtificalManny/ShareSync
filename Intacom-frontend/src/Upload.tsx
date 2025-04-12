import React from 'react';
import UploadForm from '../components/UploadForm';

interface Project {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  username: string;
}

interface UploadProps {
  user: User | null;
  projects: Project[] | undefined;
}

const Upload: React.FC<UploadProps> = ({ user, projects }) => {
  const handleUpload = (url: string) => {
    console.log('File uploaded:', url);
    // Handle the uploaded file URL (e.g., associate it with a project)
  };

  if (!user) {
    return <div>Please log in to upload files.</div>;
  }

  return (
    <div>
      <h1>Upload File</h1>
      <UploadForm onUpload={handleUpload} />
      {projects && projects.length > 0 && (
        <div>
          <h2>Your Projects</h2>
          <ul>
            {projects.map((project) => (
              <li key={project._id}>{project.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Upload;