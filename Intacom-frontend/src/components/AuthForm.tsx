import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { login, register } from '../services/api';

interface AuthFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLogin: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSubmit, isLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await onSubmit({ username, password });
      } else {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        if (profilePic) formData.append('profilePic', profilePic);
        await onSubmit(formData);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">{isLogin ? 'Login' : 'Register'}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="w-full p-2 mb-4 border rounded"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 mb-4 border rounded"
        required
      />
      {!isLogin && (
        <input
          type="file"
          onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
          className="w-full p-2 mb-4 border rounded"
        />
      )}
      <button type="submit" className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        {isLogin ? 'Login' : 'Register'}
      </button>
    </form>
  );
};

export default AuthForm;