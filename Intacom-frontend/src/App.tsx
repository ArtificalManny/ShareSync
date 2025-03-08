import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

const App: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [showRecover, setShowRecover] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`http://localhost:3000${url}`, {
        username,
        password,
        email: isLogin ? undefined : email,
        name: isLogin ? undefined : name,
        age: isLogin ? undefined : parseInt(age),
        profilePic: isLogin ? undefined : profilePic,
      });
      setUser(response.data.user);
      alert(isLogin ? 'Login successful' : 'Registration successful');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'An error occurred');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    setEmail('');
    setName('');
    setAge('');
    setProfilePic('');
    navigate('/');
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.get(`http://localhost:3000/auth/recover`, { params: { email: recoveryEmail } });
      alert(response.data.message + ' (Token: ' + response.data.token + '). Enter the token below.');
      setShowRecover(false);
      setShowReset(true);
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'An error occurred');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:3000/auth/reset`, { token: recoveryToken, newPassword });
      alert(response.data.message);
      setShowReset(false);
      setRecoveryEmail('');
      setRecoveryToken('');
      setNewPassword('');
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <>
      <header>
        <Link to="/">
          <img src="https://via.placeholder.com/40?text=Intacom" alt="Intacom Logo" />
        </Link>
        <div className="top-right">
          <FontAwesomeIcon icon={faBell} className="bell" />
          {user && user.profilePic && <img src={user.profilePic} alt="Profile" />}
        </div>
      </header>
      <div style={{ gridArea: 'sidebar' }}>
        <h3>Sidebar</h3>
        <p>Notifications or quick links could go here.</p>
      </div>
      <main>
        {!user ? (
          <form onSubmit={handleSubmit} style={{ maxWidth: '500px', width: '100%' }}>
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            {!isLogin && (
              <>
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                />
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                />
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  required
                />
                <label htmlFor="profilePic">Profile Picture URL (optional)</label>
                <input
                  id="profilePic"
                  type="text"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  placeholder="Profile Picture URL (optional)"
                />
              </>
            )}
            <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
            <button type="button" onClick={() => setIsLogin(!isLogin)}>
              Switch to {isLogin ? 'Register' : 'Login'}
            </button>
            {isLogin && (
              <button type="button" onClick={() => setShowRecover(true)}>
                Forgot Password?
              </button>
            )}
          </form>
        ) : (
          <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <h2>Welcome, {user.name || user.username}!</h2>
            <p>Email: {user.email} | Age: {user.age}</p>
            {user.profilePic && <img src={user.profilePic} alt="Profile" style={{ maxWidth: '100px' }} />}
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
        {showRecover && (
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#2a2a3e', padding: '2rem', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)', zIndex: 1000 }}>
            <h3>Forgot Password</h3>
            <form onSubmit={handleRecoverPassword}>
              <label htmlFor="recoveryEmail">Email Address</label>
              <input
                id="recoveryEmail"
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <button type="submit">Recover Password</button>
              <button type="button" onClick={() => setShowRecover(false)}>Cancel</button>
            </form>
          </div>
        )}
        {showReset && (
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#2a2a3e', padding: '2rem', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)', zIndex: 1000 }}>
            <h3>Reset Password</h3>
            <form onSubmit={handleResetPassword}>
              <label htmlFor="recoveryToken">Recovery Token</label>
              <input
                id="recoveryToken"
                type="text"
                value={recoveryToken}
                onChange={(e) => setRecoveryToken(e.target.value)}
                placeholder="Enter recovery token"
                required
              />
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <button type="submit">Reset Password</button>
              <button type="button" onClick={() => setShowReset(false)}>Cancel</button>
            </form>
          </div>
        )}
      </main>
      <footer>
        <p>© 2025 Intacom. All rights reserved.</p>
      </footer>
    </>
  );
};

export default App;