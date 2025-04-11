import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';

// From "The Customer Service Revolution" and "The Apple Experience":
// - Make the registration process seamless and delightful with clear feedback.
// - Apply "Hooked" and Freud's Id/Ego/Superego: Provide a dopamine hit on successful registration.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Fallback to default if VITE_API_URL is undefined.

function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState({ month: '', day: '', year: '' });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  console.log('Register.tsx: VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('Register.tsx: API_URL:', API_URL);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      console.log('Register.tsx: Registering user with email:', email);
      const response = await axios.post(`${API_URL}/auth/register`, {
        firstName,
        lastName,
        username,
        email,
        password,
        gender,
        birthday,
      });
      console.log('Register.tsx: Register response:', response.data);
      // From "Hooked" and Freud's Id: Provide a dopamine hit on successful registration.
      alert('User registered successfully! Welcome to INTACOM!'); // Placeholder for a more engaging UI effect.
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('Register.tsx: Register error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'An error occurred during registration');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        <div className="password-container">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <span onClick={toggleConfirmPasswordVisibility} className="password-toggle">
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </span>
        </div>
        <select value={gender} onChange={(e) => setGender(e.target.value)} required>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <div className="birthday">
          <input
            type="text"
            placeholder="MM"
            value={birthday.month}
            onChange={(e) => setBirthday({ ...birthday, month: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="DD"
            value={birthday.day}
            onChange={(e) => setBirthday({ ...birthday, day: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="YYYY"
            value={birthday.year}
            onChange={(e) => setBirthday({ ...birthday, year: e.target.value })}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Register;