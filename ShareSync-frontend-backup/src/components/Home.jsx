import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, current: 0, past: 0, tasksCompleted: 0 });

  useEffect(() => {
    if (user) {
      fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId: user._id }),
      })
        .then(res => res.json())
        .then(data => {
          setProjects(data);
          const total = data.length;
          const current = data.filter(p => p.status !== 'Completed').length;
          const past = total - current;
          const tasksCompleted = data.reduce((sum, p) => sum + (p.tasksCompleted || 0), 0);
          setMetrics({ total, current, past, tasksCompleted });
        });
    }
  }, [user]);

  const handleCreateProject = () => {
    navigate('/create-project');
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Welcome, {user?.firstName} {user?.lastName}</h1>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-100 rounded">
          <h2>Total Projects</h2>
          <p>{metrics.total}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded">
          <h2>Current Projects</h2>
          <p>{metrics.current}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded">
          <h2>Past Projects</h2>
          <p>{metrics.past}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded">
          <h2>Tasks Completed</h2>
          <p>{metrics.tasksCompleted}</p>
        </div>
      </div>
      <button onClick={handleCreateProject} className="mb-4 p-2 bg-blue-500 text-white rounded">
        Create New Project
      </button>
      <h2 className="text-2xl font-semibold mb-2">Your Projects</h2>
      <div className="grid grid-cols-3 gap-4">
        {['School', 'Job', 'Personal'].map(category => (
          <div key={category}>
            <h3 className="text-xl font-medium">{category}</h3>
            {projects
              .filter(p => p.category === category)
              .map(project => (
                <div key={project._id} className="p-4 bg-white shadow rounded mb-2">
                  <h4 className="font-bold">{project.title}</h4>
                  <p>{project.description}</p>
                  <p>Status: {project.status}</p>
                  <button
                    onClick={() => navigate(`/project/${project._id}`)}
                    className="mt-2 p-1 bg-green-500 text-white rounded"
                  >
                    View Details
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-2">Notifications</h2>
        <p>No notifications yet</p>
      </div>
      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-2">Team Activity</h2>
        <p>No recent updates</p>
      </div>
    </div>
  );
};

export default Home;