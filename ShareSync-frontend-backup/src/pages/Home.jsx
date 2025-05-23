import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Rocket, User, FolderKanban, TrendingUp, Users } from 'lucide-react';
import './Home.css';

const Home = () => {
  const [recentProjects, setRecentProjects] = useState([]);
  const [userStats, setUserStats] = useState({ projects: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          throw new Error('No access token found');
        }
        const projectsResponse = await axios.get('http://localhost:3000/api/projects', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Home - Fetched recent projects:', projectsResponse.data);
        setRecentProjects(projectsResponse.data.slice(0, 3) || []);

        const statsResponse = await axios.get('http://localhost:3000/api/user-stats', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Home - Fetched user stats:', statsResponse.data);
        setUserStats(statsResponse.data || { projects: 0, tasks: 0 });
      } catch (err) {
        console.error('Home - Failed to fetch data:', err.message);
        // Mock data if API fails
        setRecentProjects([
          { id: 1, title: 'Project A', description: 'A sample project' },
          { id: 2, title: 'Project B', description: 'Another project' },
        ]);
        setUserStats({ projects: 3, tasks: 10 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="welcome-title">Welcome to ShareSync</h1>
          <p className="text-secondary">
            Collaborate on projects, share ideas, and stay organized with maximum transparency.
          </p>
          <div className="social-proof gradient-bg">
            <p><Users className="icon" /> Join 10,000+ users collaborating on ShareSync!</p>
          </div>
          <div className="action-buttons">
            <Link to="/projects">
              <button className="btn-primary">
                <Rocket className="icon" /> Get Started
              </button>
            </Link>
            <Link to="/profile">
              <button className="btn-secondary">
                <User className="icon" /> View Profile
              </button>
            </Link>
            <Link to="/projects/create">
              <button className="btn-secondary">
                <FolderKanban className="icon" /> Create Project
              </button>
            </Link>
          </div>
        </div>
      </div>
      <div className="user-stats-section">
        <h2><TrendingUp className="icon" /> Your Stats</h2>
        <div className="stats-infographic">
          <div className="stat-card gradient-bg">
            <span>Projects</span>
            <p>{userStats.projects}</p>
          </div>
          <div className="stat-card gradient-bg">
            <span>Tasks Completed</span>
            <p>{userStats.tasks}</p>
          </div>
        </div>
      </div>
      <div className="recent-projects-section">
        <h2><FolderKanban className="icon" /> Recent Projects</h2>
        {loading ? (
          <p className="text-secondary">Loading recent projects...</p>
        ) : recentProjects.length === 0 ? (
          <p className="text-secondary">No recent projects to display.</p>
        ) : (
          <div className="projects-carousel">
            {recentProjects.map(project => (
              project.id ? (
                <Link to={`/projects/${project.id}`} key={project.id} className="project-card-link">
                  <div className="project-card card">
                    <h3>{project.title || 'Untitled'}</h3>
                    <p className="text-secondary">{project.description || 'No description'}</p>
                  </div>
                </Link>
              ) : null
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;