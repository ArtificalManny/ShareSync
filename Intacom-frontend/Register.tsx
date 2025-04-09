import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        firstName,
        lastName,
        username,
        email,
        password,
        gender,
        birthday,
      });
      console.log('Register response:', response.data);
      alert('User registered successfully. Please verify your email.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('Register error:', err.response?.data || err.message);
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
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ paddingRight: '30px' }}
          />
          <span
            onClick={togglePasswordVisibility}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ paddingRight: '30px' }}
          />
          <span
            onClick={toggleConfirmPasswordVisibility}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
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
      {error && <p className="error" style={{ color: '#FF4444' }}>{error}</p>}
    </div>
  );
}

export default Register;