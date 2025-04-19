import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

const Login = () => {
  console.log('Login: Starting render');
  const navigate = useNavigate();
  console.log('Login: Navigate function retrieved');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      console.log('Login: Submitting form with email:', email);
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user, access_token } = response.data;
      localStorage.setItem('token', access_token);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/projects'), 1000);
    } catch (err: any) {
      console.error('Login: Error during login:', err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  console.log('Login: Rendering form with email:', email, 'password:', password);
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={{ margin: '10px', padding: '10px', width: '200px' }}
        />
        <br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          style={{ margin: '10px', padding: '10px', width: '200px' }}
        />
        <br />
        <button type="submit" style={{ padding: '10px 20px' }}>Login</button>
      </form>
      <p onClick={() => navigate('/forgot-password')} style={{ color: 'blue', cursor: 'pointer' }}>
        Forgot Password?
      </p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default Login;