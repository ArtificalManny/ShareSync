import React from 'react';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (data: { username: string; password: string }) => {
    await login(data.username, data.password);
    navigate('/projects');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <AuthForm onSubmit={handleLogin} isLogin={true} />
    </div>
  );
};

export default LoginPage;