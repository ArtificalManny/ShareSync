import React from 'react';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div>
      <h1>Login</h1>
      <AuthForm />
    </div>
  );
};

export default LoginPage;