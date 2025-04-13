import { useState, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

const API_URL = '/auth';

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

  console.log('Register.tsx: API_URL:', API_URL);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate birthday on submission
    const monthNum = parseInt(birthday.month, 10);
    const dayNum = parseInt(birthday.day, 10);
    const yearNum = parseInt(birthday.year, 10);
    const currentYear = new Date().getFullYear();

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      setError('Month must be between 1 and 12.');
      return;
    }
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (isNaN(dayNum) || dayNum < 1 || dayNum > daysInMonth) {
      setError(`Day must be between 1 and ${daysInMonth} for the selected month.`);
      return;
    }
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      setError(`Year must be between 1900 and ${currentYear}.`);
      return;
    }

    try {
      console.log('Register.tsx: Registering user with email:', email);
      const response = await axios.post(`${API_URL}/register`, {
        firstName,
        lastName,
        username,
        email,
        password,
        gender,
        birthday,
      });
      console.log('Register.tsx: Register response:', response.data);
      alert('User registered successfully! Welcome to ShareSync!');
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('Register.tsx: Register error:', err.response?.data || err.message);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message.includes('Network Error')) {
        setError('Unable to connect to the server. Please check your network connection.');
      } else {
        setError('An unexpected error occurred during registration. Please try again.');
      }
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
      <h2>Register for ShareSync</h2>
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
            maxLength={2}
            pattern="\d*"
          />
          <input
            type="text"
            placeholder="DD"
            value={birthday.day}
            onChange={(e) => setBirthday({ ...birthday, day: e.target.value })}
            required
            maxLength={2}
            pattern="\d*"
          />
          <input
            type="text"
            placeholder="YYYY"
            value={birthday.year}
            onChange={(e) => setBirthday({ ...birthday, year: e.target.value })}
            required
            maxLength={4}
            pattern="\d*"
          />
        </div>
        <button type="submit">Register</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;