import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Import the custom instance.
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

// From "The Customer Service Revolution" and "The Apple Experience":
// - Make the login process seamless and delightful with clear feedback.
// - Apply "Hooked" and Freud's Id/Ego/Superego: Provide a dopamine hit on successful login.
function Login({ setUser }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Login.tsx: Logging in with:', { identifier, password });
      const response = await axiosInstance.post('/login', {
        identifier,
        password,
      });
      console.log('Login.tsx: Login response:', response.data);
      setUser(response.data.data);
      localStorage.setItem('user', JSON.stringify(response.data.data));
      // From "Hooked" and Freud's Id: Provide a dopamine hit on successful login.
      alert('Login successful! Welcome back!'); // Placeholder for a more engaging UI effect.
      navigate('/'); // Redirect to home page.
    } catch (err: any) {
      console.error('Login.tsx: Login error:', err.message, err.response?.data);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message.includes('Network Error')) {
        setError('Unable to connect to the server. Please check your network connection or try again later.');
      } else if (err.message.includes('CORS')) {
        setError('A CORS error occurred. Please contact support or try again later.');
      } else {
        setError('An unexpected error occurred during login. Please try again.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleNavigation = (path: string) => {
    console.log(`Login.tsx: Navigating to ${path}`);
    navigate(path);
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email or Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span onClick={togglePasswordVisibility} className="password-toggle">
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </span>
        </div>
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        <Link to="/recover" onClick={() => handleNavigation('/recover')}>
          Forgot Password?
        </Link>
      </p>
      <p>
        Don't have an account?{' '}
        <Link to="/register" onClick={() => handleNavigation('/register')}>
          Register
        </Link>
      </p>
    </div>
  );
}

export default Login;