import React, { FormEvent, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const AuthForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState<string | undefined>(undefined);
  const { login, register } = useAuth();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (err: any) { // Type 'any' for simplicity, or use specific error type if available
      console.error('Login error:', err.message);
      alert('Login failed: ' + err.message);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(username, password, profilePic);
    } catch (err: any) { // Type 'any' for simplicity
      console.error('Registration error:', err.message);
      alert('Registration failed: ' + err.message);
    }
  };

  return (
    <div id="login" style={{ display: 'block' }}>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit" className="button-primary">Login</button>
      </form>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <input
          type="url"
          value={profilePic || ''}
          onChange={(e) => setProfilePic(e.target.value || undefined)}
          placeholder="Profile Picture URL (optional)"
        />
        <button type="submit" className="button-primary">Register</button>
      </form>
    </div>
  );
};