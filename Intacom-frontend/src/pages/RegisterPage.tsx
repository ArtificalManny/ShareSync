import React from 'react';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (data: FormData) => {
    const username = data.get('username') as string;
    const password = data.get('password') as string;
    const profilePic = data.get('profilePic') as File | null;
    await register(username, password, profilePic ? profilePic.name : undefined);
    navigate('/projects');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <AuthForm onSubmit={handleRegister} isLogin={false} />
    </div>
  );
};

export default RegisterPage;