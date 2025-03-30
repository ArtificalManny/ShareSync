import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Project from './pages/Project';
import BackgroundSlideshow from './components/BackgroundSlideshow';

interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email?: string;
  gender?: string;
  birthday?: { month: string; day: string; year: string };
  profilePic?: string;
  coverPhoto?: string;
  bio?: string;
  school?: string;
  occupation?: string;
  hobbies?: string[];
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
  status?: 'current' | 'past';
}

interface Notification {
  _id: string;
  message: string;
  createdAt: string;
  type: 'welcome' | 'general';
}

interface ProjectsResponse {
  data: Project[];
}

interface NotificationsResponse {
  data: Notification[];
}

interface LoginResponse {
  data?: { user: User };
  username?: string;
}

interface RegisterResponse {
  user: User;
}

interface RecoverResponse {
  message: string;
  token: string;
}

interface ResetResponse {
  message: string;
  user: User;
}

interface ProjectResponse {
  data: { project: Project };
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState({ month: '', day: '', year: '' });
  const [profilePic, setProfilePic] = useState('');
  const [showRecover, setShowRecover] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectColor, setProjectColor] = useState('');
  const [sharedUsers, setSharedUsers] = useState<{ email: string; role: 'Admin' | 'Editor' | 'Viewer' }[]>([]);
  const navigate = useNavigate();

  const retry = async <T,>(fn: () => Promise<T>, retries: number = 5, delay: number = 2000): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay);
    }
  };

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const cachedProjects = localStorage.getItem(`projects_${user.username}`);
      const cachedProjectsTimestamp = localStorage.getItem(`projects_${user.username}_timestamp`);
      const cachedNotifications = localStorage.getItem(`notifications_${user._id}`);
      const cachedNotificationsTimestamp = localStorage.getItem(`notifications_${user._id}_timestamp`);
      const now = Date.now();

      let projectsData: Project[] = [];
      let notificationsData: Notification[] = [];

      if (cachedProjects && cachedProjectsTimestamp && (now - parseInt(cachedProjectsTimestamp)) < CACHE_DURATION) {
        projectsData = JSON.parse(cachedProjects);
        setProjects(projectsData);
        console.log('Loaded projects from cache:', projectsData);
      }

      if (cachedNotifications && cachedNotificationsTimestamp && (now - parseInt(cachedNotificationsTimestamp)) < CACHE_DURATION) {
        notificationsData = JSON.parse(cachedNotifications);
        setNotifications(notificationsData);
        console.log('Loaded notifications from cache:', notificationsData);
      }

      const fetchProjects = !cachedProjects || (now - parseInt(cachedProjectsTimestamp || '0')) >= CACHE_DURATION;
      const fetchNotifications = !cachedNotifications || (now - parseInt(cachedNotificationsTimestamp || '0')) >= CACHE_DURATION;

      if (fetchProjects || fetchNotifications) {
        const promises: Promise<any>[] = [];
        if (fetchProjects) {
          promises.push(retry(() => axios.get<ProjectsResponse>(`${import.meta.env.VITE_API_URL}/projects/${user.username}`)));
        } else {
          promises.push(Promise.resolve(null));
        }

        if (fetchNotifications) {
          promises.push(retry(() => axios.get<NotificationsResponse>(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`)));
        } else {
          promises.push(Promise.resolve(null));
        }

        const [projectsResponse, notificationsResponse] = await Promise.all(promises);

        if (projectsResponse) {
          projectsData = projectsResponse.data.data || (Array.isArray(projectsResponse.data) ? projectsResponse.data : []);
          setProjects(projectsData);
          localStorage.setItem(`projects_${user.username}`, JSON.stringify(projectsData));
          localStorage.setItem(`projects_${user.username}_timestamp`, now.toString());
          console.log('Fetched projects from API:', projectsData);
        }

        if (notificationsResponse) {
          notificationsData = notificationsResponse.data.data || [];
          const isNewUser = localStorage.getItem('isNewUser') === null;
          if (isNewUser) {
            notificationsData = [
              ...notificationsData,
              {
                _id: 'welcome',
                message: 'Welcome to Intacom! Start by creating a project.',
                createdAt: new Date().toISOString(),
                type: 'welcome',
              },
            ];
            localStorage.setItem('isNewUser', 'false');
          }
          setNotifications(notificationsData);
          localStorage.setItem(`notifications_${user._id}`, JSON.stringify(notificationsData));
          localStorage.setItem(`notifications_${user._id}_timestamp`, now.toString());
          console.log('Fetched notifications from API:', notificationsData);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error.response?.data || error.message);
      setProjects([]);
      setNotifications([]);
      setErrorMessage('Unable to load your data. Please try again later or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('App useEffect triggered. User:', user);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      fetchData();
    } else {
      localStorage.removeItem('user');
      setProjects([]);
      setNotifications([]);
    }
  }, [user]);

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        console.log('Uploading profile picture...');
        const response = await retry(() => axios.post<{ url: string }>(`${import.meta.env.VITE_API_URL}/uploads`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }));
        console.log('Upload response:', response.data);
        const profilePicUrl = response.data.url;
        const updatedUser = { ...user, profilePic: profilePicUrl };
        console.log('Updating user with new profile picture:', updatedUser);
        const responseUser = await retry(() => axios.put(`${import.meta.env.VITE_API_URL}/users/${user?._id}`, updatedUser));
        console.log('Update user response:', responseUser.data);
        const newUserData = responseUser.data.data.user;
        setUser(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
        setNotifications([...notifications, {
          _id: `${notifications.length + 1}`,
          message: 'Profile picture updated successfully!',
          createdAt: new Date().toISOString(),
          type: 'general',
        }]);
      } catch (error: any) {
        console.error('Profile picture upload error:', error.response?.data || error.message);
        setErrorMessage('Failed to upload profile picture. Please try again later.');
      }
    }
  };

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
      if (isLogin) {
        const response = await retry(() => axios.post<LoginResponse>(`${import.meta.env.VITE_API_URL}${url}`, payload));
        let userData: User;
        if (response.data && 'data' in response.data && response.data.data && response.data.data.user) {
          userData = response.data.data.user;
        } else if (response.data && 'username' in response.data) {
          userData = response.data as User;
        } else {
          console.error('Login response does not contain user data:', response.data);
          setErrorMessage('Login failed: Invalid response from server. Please try again.');
          return;
        }
        setUser(userData);
      } else {
        const response = await retry(() => axios.post<RegisterResponse>(`${import.meta.env.VITE_API_URL}${url}`, payload));
        if (response.data && response.data.user) {
          setUser(response.data.user);
          setShowCreateProject(true);
        } else {
          console.error('Register response does not contain user data:', response.data);
          setErrorMessage('Registration failed: Invalid response from server. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Form submission error:', error.response?.data || error.message);
      if (error.response) {
        if (error.response.status === 401) {
          setErrorMessage('Invalid username or password. Please try again.');
        } else if (error.response.status === 400) {
          setErrorMessage(error.response.data?.error || 'Invalid input. Please check your details and try again.');
        } else {
          setErrorMessage('Unable to connect to the server. Please try again later or contact support.');
        }
      } else if (error.request) {
        setErrorMessage('Unable to reach the server. Please check your internet connection and try again.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again later.');
      }
    }
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const response = await retry(() => axios.get<RecoverResponse>(`${import.meta.env.VITE_API_URL}/auth/recover`, { params: { email: recoveryEmail } }));
      alert(response.data.message + ' (Token: ' + response.data.token + '). Enter the token below.');
      setShowRecover(false);
      setShowReset(true);
    } catch (error: any) {
      console.error('Recover password error:', error.response?.data || error.message);
      if (error.response) {
        if (error.response.status === 404) {
          setErrorMessage('No account found with that email. Please check the email and try again.');
        } else {
          setErrorMessage('Unable to process your request. Please try again later.');
        }
      } else {
        setErrorMessage('Unable to reach the server. Please check your internet connection and try again.');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const response = await retry(() => axios.put<ResetResponse>(`${import.meta.env.VITE_API_URL}/auth/reset`, { token: recoveryToken, newPassword }));
      alert(response.data.message);
      setShowReset(false);
      setRecoveryEmail('');
      setRecoveryToken('');
      setNewPassword('');
    } catch (error: any) {
      console.error('Reset password error:', error.response?.data || error.message);
      if (error.response) {
        if (error.response.status === 404) {
          setErrorMessage('Invalid token. Please request a new password reset link.');
        } else {
          setErrorMessage('Unable to reset your password. Please try again later.');
        }
      } else {
        setErrorMessage('Unable to reach the server. Please check your internet connection and try again.');
      }
    }
  };

  const handleAddSharedUser = (email: string, role: 'Admin' | 'Editor' | 'Viewer') => {
    setSharedUsers([...sharedUsers, { email, role }]);
  };

  const handleRemoveSharedUser = (email: string) => {
    setSharedUsers(sharedUsers.filter((user) => user.email !== email));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const payload = {
        name: projectName,
        description: projectDescription,
        admin: user?.username,
        color: projectColor || '#3a3a50',
        sharedWith: sharedUsers.map((u) => ({ userId: u.email, role: u.role })),
      };
      console.log('Creating project with payload:', payload);
      const response = await retry(() => axios.post<ProjectResponse>(`${import.meta.env.VITE_API_URL}/projects`, payload));
      console.log('Create project response:', response.data);
      const newProject = response.data.data.project;
      setProjects([...projects, newProject]);
      setShowCreateProject(false);
      setProjectName('');
      setProjectDescription('');
      setProjectColor('');
      setSharedUsers([]);
      navigate(`/project/${newProject._id}`);
      setNotifications([...notifications, {
        _id: `${notifications.length + 1}`,
        message: `Project "${newProject.name}" created successfully!`,
        createdAt: new Date().toISOString(),
        type: 'general',
      }]);
    } catch (error: any) {
      console.error('Create project error:', error.response?.data || error.message);
      if (error.response) {
        if (error.response.status === 400) {
          setErrorMessage(error.response.data?.error || 'Invalid project details. Please check your input and try again.');
        } else {
          setErrorMessage('Unable to create the project. Please try again later.');
        }
      } else {
        setErrorMessage('Unable to reach the server. Please check your internet connection and try again.');
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  console.log('Rendering App component. User:', user, 'Projects:', projects, 'Notifications:', notifications);

  return (
    <div className="app-container">
      {!user && <BackgroundSlideshow />}
      <header className="header glassmorphic">
        <div className="logo">Intacom</div>
        <nav className="nav">
          {user ? (
            <>
              <button className="neumorphic" onClick={() => navigate('/home')}>
                Home
              </button>
              <button className="neumorphic" onClick={() => navigate('/profile')}>
                Profile
              </button>
              <button className="neumorphic" onClick={() => setShowCreateProject(true)}>
                Create Project
              </button>
              <button className="neumorphic" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="neumorphic" onClick={() => setIsLogin(true)}>
                Login
              </button>
              <button className="neumorphic" onClick={() => setIsLogin(false)}>
                Register
              </button>
            </>
          )}
        </nav>
        {user && (
          <div className="profile-pic">
            {user.profilePic ? (
              <img src={user.profilePic} alt="Profile" className="profile-pic-small" />
            ) : (
              <div className="profile-pic-placeholder">
                {user.firstName ? user.firstName[0] : user.username[0]}
              </div>
            )}
            <label htmlFor="profilePicUpload">
              <input
                id="profilePicUpload"
                type="file"
                accept="image/*"
                onChange={handleProfilePicUpload}
                style={{ display: 'none' }}
              />
              <button type="button" className="neumorphic">Change</button>
            </label>
          </div>
        )}
      </header>
      {user && (
        <aside className="sidebar glassmorphic">
          <h3>Projects</h3>
          {isLoading ? (
            <p style={{ color: '#00d4ff' }}>Loading projects...</p>
          ) : projects.length === 0 ? (
            <p>No projects yet. Create a project to get started!</p>
          ) : (
            <ul className="project-list">
              {projects.map((project) => (
                <li
                  key={project._id}
                  className="project-item"
                  onClick={() => navigate(`/project/${project._id}`)}
                >
                  <span
                    className="project-color"
                    style={{ backgroundColor: project.color || '#3a3a50' }}
                  ></span>
                  {project.name}
                </li>
              ))}
            </ul>
          )}
          <button className="neumorphic" onClick={() => setShowCreateProject(true)}>
            Create Project
          </button>
          <h3>Notifications ({notifications.length})</h3>
          {isLoading ? (
            <p style={{ color: '#00d4ff' }}>Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p>No notifications yet.</p>
          ) : (
            <ul className="notification-list">
              {notifications.map((notification) => (
                <li key={notification._id} className="notification-item">
                  {notification.message} - {new Date(notification.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
      <main className={`main-content ${user ? '' : 'no-sidebar'}`}>
        {user ? (
          <Routes>
            <Route path="/home" element={
              <Home
                projects={projects}
                showCreateProject={showCreateProject}
                setShowCreateProject={setShowCreateProject}
                projectName={projectName}
                setProjectName={setProjectName}
                projectDescription={projectDescription}
                setProjectDescription={setProjectDescription}
                projectColor={projectColor}
                setProjectColor={setProjectColor}
                sharedUsers={sharedUsers}
                handleAddSharedUser={handleAddSharedUser}
                handleRemoveSharedUser={handleRemoveSharedUser}
                handleCreateProject={handleCreateProject}
              />
            } />
            <Route path="/profile" element={<Profile setUser={setUser} />} />
            <Route path="/project/:id" element={<Project projects={projects} />} />
            <Route path="*" element={<Home
              projects={projects}
              showCreateProject={showCreateProject}
              setShowCreateProject={setShowCreateProject}
              projectName={projectName}
              setProjectName={setProjectName}
              projectDescription={projectDescription}
              setProjectDescription={setProjectDescription}
              projectColor={projectColor}
              setProjectColor={setProjectColor}
              sharedUsers={sharedUsers}
              handleAddSharedUser={handleAddSharedUser}
              handleRemoveSharedUser={handleRemoveSharedUser}
              handleCreateProject={handleCreateProject}
            />} />
          </Routes>
        ) : (
          <div className="auth-container glassmorphic">
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            {showRecover ? (
              <form onSubmit={handleRecoverPassword}>
                <div className="form-group">
                  <label htmlFor="recoveryEmail">Email</label>
                  <input
                    id="recoveryEmail"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <button type="submit" className="neumorphic">Recover Password</button>
                <button type="button" className="neumorphic" onClick={() => setShowRecover(false)}>
                  Cancel
                </button>
              </form>
            ) : showReset ? (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label htmlFor="recoveryToken">Recovery Token</label>
                  <input
                    id="recoveryToken"
                    type="text"
                    value={recoveryToken}
                    onChange={(e) => setRecoveryToken(e.target.value)}
                    placeholder="Enter the recovery token"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                  />
                </div>
                <button type="submit" className="neumorphic">Reset Password</button>
                <button type="button" className="neumorphic" onClick={() => setShowReset(false)}>
                  Cancel
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <>
                    <div className="form-group">
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
                    <div className="form-group">
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
                  </>
                )}
                <div className="form-group">
                  <label htmlFor="username">{isLogin ? 'Username or Email' : 'Username'}</label>
                  <input
                    id="username"
                    type="text"
                    value={isLogin ? identifier : username}
                    onChange={(e) => isLogin ? setIdentifier(e.target.value) : setUsername(e.target.value)}
                    placeholder={isLogin ? 'Username or Email' : 'Username'}
                    required
                  />
                </div>
                {!isLogin && (
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                  />
                </div>
                {!isLogin && (
                  <>
                    <div className="form-group">
                      <label htmlFor="gender">Gender</label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Birthday</label>
                      <div className="birthday-input">
                        <input
                          type="text"
                          placeholder="MM"
                          value={birthday.month}
                          onChange={(e) => setBirthday({ ...birthday, month: e.target.value })}
                          maxLength={2}
                        />
                        <input
                          type="text"
                          placeholder="DD"
                          value={birthday.day}
                          onChange={(e) => setBirthday({ ...birthday, day: e.target.value })}
                          maxLength={2}
                        />
                        <input
                          type="text"
                          placeholder="YYYY"
                          value={birthday.year}
                          onChange={(e) => setBirthday({ ...birthday, year: e.target.value })}
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </>
                )}
                <button type="submit" className="neumorphic">{isLogin ? 'Login' : 'Register'}</button>
                {isLogin && (
                  <button type="button" className="neumorphic" onClick={() => setShowRecover(true)}>
                    Forgot Password?
                  </button>
                )}
              </form>
            )}
            {errorMessage && <div className="error-message">{errorMessage}</div>}
          </div>
        )}
      </main>
      {errorMessage && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ff4d4f' }}>
          {errorMessage}
        </div>
      )}
      {!user && !errorMessage && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#f5f5f5' }}>
          Welcome to Intacom! Please log in or register to continue.
        </div>
      )}
    </div>
  );
};

export default App;