import React from 'react';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();

  return (
    <div>
      <h1>Register</h1>
      <AuthForm />
    </div>
  );
};

export default RegisterPage;