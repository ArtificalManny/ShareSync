import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

const App: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState({ month: '', day: '', year: '' });
  const [profilePic, setProfilePic] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [showRecover, setShowRecover] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [projects, setProjects] = useState([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectColor, setProjectColor] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const fetchProjects = async () => {
        try {
          const response = await axios.get(`http://localhost:3000/projects/${user.username}`);
          setProjects(response.data);
        } catch (error) {
          console.error('Failed to fetch projects:', error);
        }
      };
      fetchProjects();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const url = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { identifier, password }
        : {
            firstName,
            lastName,
            username,
            password,
            email,
            gender,
            birthday,
            profilePic,
          };
      console.log('Submitting payload:', payload);
      const response = await axios.post(`http://localhost:3000${url}`, payload);
      setUser(response.data.user);
      alert(isLogin ? 'Login successful' : 'Registration successful. Check your email for confirmation.');
      if (!isLogin) {
        setShowCreateProject(true);
      }
    } catch (error: any) {
      console.error('Form submission error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIdentifier('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setUsername('');
    setEmail('');
    setGender('');
    setBirthday({ month: '', day: '', year: '' });
    setProfilePic('');
    navigate('/');
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const response = await axios.get(`http://localhost:3000/auth/recover`, { params: { email: recoveryEmail } });
      alert(response.data.message + ' (Token: ' + response.data.token + '). Enter the token below.');
      setShowRecover(false);
      setShowReset(true);
    } catch (error: any) {
      console.error('Recover password error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const response = await axios.put(`http://localhost:3000/auth/reset`, { token: recoveryToken, newPassword });
      alert(response.data.message);
      setShowReset(false);
      setRecoveryEmail('');
      setRecoveryToken('');
      setNewPassword('');
    } catch (error: any) {
      console.error('Reset password error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const response = await axios.post(`http://localhost:3000/projects`, {
        name: projectName,
        description: projectDescription,
        admin: user.username,
        color: projectColor,
      });
      setProjects([...projects, response.data.project]);
      setShowCreateProject(false);
      setProjectName('');
      setProjectDescription('');
      setProjectColor('');
      alert('Project created successfully');
    } catch (error: any) {
      console.error('Create project error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'An error occurred');
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <>
      <header>
        <Link to="/">
          <img src="https://via.placeholder.com/40?text=Intacom" alt="Intacom Logo" />
        </Link>
        {user && (
          <div className="top-right">
            <FontAwesomeIcon icon={faBell} className="bell" />
            {user.profilePic && <img src={user.profilePic} alt="Profile" />}
          </div>
        )}
      </header>
      {user && (
        <sidebar>
          <div className="profile-section">
            {user.profilePic && <img src={user.profilePic} alt="Profile" />}
            <h3>{user.firstName || user.username}</h3>
          </div>
          <ul>
            <li><a href="#" onClick={() => setShowCreateProject(true)}>Create Project</a></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/projects">Projects</Link></li>
            <li><Link to="/upload">Upload</Link></li>
            <li><Link to="/settings">Settings</Link></li>
            <li><a href="#" onClick={handleLogout}>Logout</a></li>
          </ul>
          {projects.map((project) => (
            <div key={project._id} style={{ background: project.color || '#3a3a50', padding: '0.5rem', margin: '0.5rem 0', borderRadius: '5px' }}>
              <Link to={`/project/${project._id}`}>{project.name}</Link>
            </div>
          ))}
        </sidebar>
      )}
      <main className={user ? '' : 'full-screen'}>
        {!user ? (
          <form onSubmit={handleSubmit} style={{ maxWidth: '500px', width: '100%' }}>
            <h2 style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontWeight: 'bold', fontSize: '2.5rem', color: '#6A5ACD', textAlign: 'center', marginBottom: '0.5rem' }}>Intacom</h2>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {isLogin ? (
              <>
                <label htmlFor="identifier">Email or Username</label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email or Username"
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
                <button type="submit">Login</button>
                <button type="button" onClick={() => setShowRecover(true)}>
                  Forgot Password?
                </button>
                <button type="button" onClick={() => setIsLogin(!isLogin)}>
                  Switch to Register
                </button>
              </>
            ) : (
              <>
                <div className="subtitle">Create an account</div>
                <div className="name-container">
                  <div>
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      required
                    />
                  </div>
                </div>
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
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                />
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <label>Birthday</label>
                <div className="birthday-container">
                  <select
                    value={birthday.month}
                    onChange={(e) => setBirthday({ ...birthday, month: e.target.value })}
                    required
                  >
                    <option value="">Month</option>
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={birthday.day}
                    onChange={(e) => setBirthday({ ...birthday, day: e.target.value })}
                    required
                  >
                    <option value="">Day</option>
                    {days.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select
                    value={birthday.year}
                    onChange={(e) => setBirthday({ ...birthday, year: e.target.value })}
                    required
                  >
                    <option value="">Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <label htmlFor="profilePic">Profile Picture URL (optional)</label>
                <input
                  id="profilePic"
                  type="text"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  placeholder="Profile Picture URL (optional)"
                />
                <button type="submit">Register</button>
                <button type="button" onClick={() => setShowRecover(true)}>
                  Forgot Password?
                </button>
                <button type="button" onClick={() => setIsLogin(!isLogin)}>
                  Switch to Login
                </button>
              </>
            )}
          </form>
        ) : (
          <Outlet />
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
        {showCreateProject && (
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#2a2a3e', padding: '2rem', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)', zIndex: 1000 }}>
            <h3>Create Project</h3>
            <form onSubmit={handleCreateProject}>
              <label htmlFor="projectName">Project Name</label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project Name"
                required
              />
              <label htmlFor="projectDescription">Description</label>
              <input
                id="projectDescription"
                type="text"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Description"
                required
              />
              <label htmlFor="projectColor">Color</label>
              <input
                id="projectColor"
                type="color"
                value={projectColor}
                onChange={(e) => setProjectColor(e.target.value)}
                required
              />
              <button type="submit">Create Project</button>
              <button type="button" onClick={() => setShowCreateProject(false)}>Cancel</button>
            </form>
          </div>
        )}
      </main>
      <footer>
        <p style={{ color: '#b0b0ff' }}>© 2025 Intacom. All rights reserved.</p>
      </footer>
    </>
  );
};

export default App;