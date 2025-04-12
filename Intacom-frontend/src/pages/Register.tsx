import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Import the custom instance.
import { useNavigate } from 'react-router-dom';
import './Register.css';

// From "The Customer Service Revolution" and "The Apple Experience":
// - Make the registration process seamless and delightful with clear feedback.
// - Apply "Hooked" and Freud's Id/Ego/Superego: Provide a dopamine hit on successful registration.
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

  // Function to calculate the number of days in a given month and year.
  const getDaysInMonth = (month: string, year: string): number => {
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (isNaN(monthNum) || isNaN(yearNum)) return 31; // Default to 31 if inputs are invalid.
    return new Date(yearNum, monthNum, 0).getDate();
  };

  const handleDayChange = (day: string) => {
    const monthNum = parseInt(birthday.month, 10);
    const yearNum = parseInt(birthday.year, 10);
    const dayNum = parseInt(day, 10);

    if (day === '') {
      setBirthday({ ...birthday, day });
      setError(null);
      return;
    }

    if (isNaN(dayNum)) {
      setError('Day must be a number.');
      return;
    }

    const daysInMonth = getDaysInMonth(birthday.month, birthday.year);
    if (dayNum < 1 || dayNum > daysInMonth) {
      setError(`Day must be between 1 and ${daysInMonth} for the selected month.`);
    } else {
      setError(null);
      setBirthday({ ...birthday, day });
    }
  };

  const handleMonthChange = (month: string) => {
    const monthNum = parseInt(month, 10);

    if (month === '') {
      setBirthday({ ...birthday, month, day: '' });
      setError(null);
      return;
    }

    if (isNaN(monthNum)) {
      setError('Month must be a number.');
      return;
    }

    if (monthNum < 1 || monthNum > 12) {
      setError('Month must be between 1 and 12.');
    } else {
      setError(null);
      setBirthday({ ...birthday, month, day: '' }); // Reset day when month changes.
    }
  };

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year, 10);
    const currentYear = new Date().getFullYear();

    if (year === '') {
      setBirthday({ ...birthday, year, day: '' });
      setError(null);
      return;
    }

    if (isNaN(yearNum)) {
      setError('Year must be a number.');
      return;
    }

    if (yearNum < 1900 || yearNum > currentYear) {
      setError(`Year must be between 1900 and ${currentYear}.`);
    } else {
      setError(null);
      setBirthday({ ...birthday, year, day: '' }); // Reset day when year changes.
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (error) {
      return; // Prevent submission if there are birthday validation errors.
    }
    try {
      console.log('Register.tsx: Registering user with email:', email);
      const response = await axiosInstance.post('/register', {
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
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 0) {
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
            onChange={(e) => handleMonthChange(e.target.value)}
            required
            maxLength={2}
            pattern="\d*"
          />
          <input
            type="text"
            placeholder="DD"
            value={birthday.day}
            onChange={(e) => handleDayChange(e.target.value)}
            required
            maxLength={2}
            pattern="\d*"
            disabled={!birthday.month || !birthday.year || !!error} // Disable if month or year is empty or there's an error.
          />
          <input
            type="text"
            placeholder="YYYY"
            value={birthday.year}
            onChange={(e) => handleYearChange(e.target.value)}
            required
            maxLength={4}
            pattern="\d*"
          />
        </div>
        <button type="submit">Register</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Register;