import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('eamonrivas@gmail.com');
  const [password, setPassword] = useState('S7mR0!%uMZ<$[w%@');
  const [error, setError] = useState(null);
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login - Submitting form with email:', email);
    const result = await loginUser(email, password);
    if (result.success) {
      console.log('Login - Login successful, navigating to /home');
      navigate('/home');
    } else {
      console.log('Login - Login failed:', result.message);
      setError(result.message);
    }
  };

  console.log('Login - Rendering component, error:', error);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ backgroundColor: '#1a2b3c', padding: '20px', borderRadius: '10px', width: '300px', textAlign: 'center' }}>
        <h2 style={{ color: '#00d1b2', marginBottom: '20px' }}>Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2', backgroundColor: '#0d1a26', color: 'white' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2', backgroundColor: '#0d1a26', color: 'white' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Login
          </button>
        </form>
        <p style={{ marginTop: '10px' }}>
          <Link to="/forgot-password" style={{ color: '#00d1b2' }}>Forgot Password?</Link>
        </p>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;