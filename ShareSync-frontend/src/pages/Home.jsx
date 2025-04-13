import { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';

// From "Escaping Build Trap": Focus on user outcomes by providing actionable insights.
// From "Articulating Design Decisions": Use a grid layout for clarity and structure.
// From "Hooked" and Freud's Id/Ego/Superego: Provide dopamine hits through interactive elements.
function Home({ user }) {
  const [projects, setProjects] = useState({ total: 0, current: 0, past: 0 });
  const [tasks, setTasks] = useState(0);
  const [activity, setActivity] = useState([]);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#00C4B4',
    sharedWith: [],
  });
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    // Fetch project overview, tasks, and team activity.
    const fetchData = async () => {
      try {
        // Placeholder data for now; replace with actual API calls.
        setProjects({ total: 0, current: 0, past: 0 });
        setTasks(14); // Placeholder.
        setActivity([]); // Placeholder.
      } catch (err) {
        console.error('Home.jsx: Error fetching data:', err);
        setError('Failed to load data.');
      }
    };
    fetchData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to create a project.');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/projects`, {
        ...newProject,
        admin: user._id,
      });
      console.log('Home.jsx: Project creation response:', response.data);
      // From "Hooked" and Freud's Id: Provide a dopamine hit on successful project creation.
      alert('Project created successfully! Great work!'); // Placeholder for a more engaging UI effect.
      setNewProject({ name: '', description: '', color: '#00C4B4', sharedWith: [] });
      // Refresh project overview.
      setProjects({ ...projects, total: projects.total + 1, current: projects.current + 1 });
    } catch (err) {
      console.error('Home.jsx: Error creating project:', err.response?.data || err.message);
      setError('Failed to create project.');
    }
  };

  return (
    <div className="home-container">
      <div className="sidebar">
        <button className="create-project-button" onClick={handleCreateProject}>
          Create Project
        </button>
        <h3>Notifications ({activity.length})</h3>
        <p>{activity.length === 0 ? 'No notifications yet.' : 'Recent activity...'}</p>
      </div>
      <div className="main-content">
        <div className="create-project-section">
          <h2>Create a New Project</h2>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleCreateProject} className="project-form">
            <input
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <input
              type="color"
              value={newProject.color}
              onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
            />
            <input
              type="text"
              placeholder="Share with (email)"
              onChange={(e) => {
                const email = e.target.value;
                setNewProject({
                  ...newProject,
                  sharedWith: email ? [{ userId: email, role: 'viewer' }] : [],
                });
              }}
            />
            <button type="submit">Create Project</button>
          </form>
        </div>
        <div className="overview-section">
          <h2>Project Overview</h2>
          <div className="overview-stats">
            <div className="stat-card">
              <h3>Total Projects</h3>
              <p>{projects.total}</p>
            </div>
            <div className="stat-card">
              <h3>Current Projects</h3>
              <p>{projects.current}</p>
            </div>
            <div className="stat-card">
              <h3>Past Projects</h3>
              <p>{projects.past}</p>
            </div>
          </div>
        </div>
        <div className="tasks-section">
          <h2>Tasks Completed</h2>
          <p>{tasks}</p>
        </div>
        <div className="activity-section">
          <h2>Team Activity</h2>
          <p>{activity.length === 0 ? 'No recent updates.' : 'Recent updates...'}</p>
          {activity.length > 0 && (
            <ul className="activity-feed">
              {activity.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;