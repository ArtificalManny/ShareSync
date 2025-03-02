import React from 'react';
import UploadForm from '../components/UploadForm';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const UploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) navigate('/login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 bg-white rounded shadow max-w-md">
        <h1 className="text-2xl font-bold mb-4">Upload File</h1>
        <UploadForm />
      </div>
    </div>
  );
};

export default UploadPage;