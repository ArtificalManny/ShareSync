import React from 'react';
import Login from '../components/Login';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { setUser } = useAuth();

  return <Login setUser={setUser} />;
};

export default LoginPage;