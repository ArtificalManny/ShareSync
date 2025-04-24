import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getProjects } from '../services/project.service';
import { Link } from 'react-router-dom';

const Home = () => {
  const { loading: authLoading } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectList = await getProjects();
        setProjects(projectList);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };
    if (!authLoading) {
      fetchProjects();
    }
  }, [authLoading]);

  if (authLoading) {
    return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}><p>Loading...</p></div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Link to="/create-project">
        <button style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>
          Create Project
        </button>
      </Link>

      {/* Metrics Dashboard */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#00d1b2' }}>Project Overview</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px', backgroundColor: '#1a2b3c', flex: '1', minWidth: '150px', textAlign: 'center' }}>
            <h4 style={{ color: '#ccc', margin: 0 }}>Total Projects</h4>
            <p style={{ color: '#00d1b2', fontSize: '1.5rem', margin: 0 }}>{projects.length}</p>
          </div>
          <div style={{ padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px', backgroundColor: '#1a2b3c', flex: '1', minWidth: '150px', textAlign: 'center' }}>
            <h4 style={{ color: '#ccc', margin: 0 }}>Current Projects</h4>
            <p style={{ color: '#00d1b2', fontSize: '1.5rem', margin: 0 }}>{projects.filter(p => p.status === 'In Progress').length}</p>
          </div>
          <div style={{ padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px', backgroundColor: '#1a2b3c', flex: '1', minWidth: '150px', textAlign: 'center' }}>
            <h4 style={{ color: '#ccc', margin: 0 }}>Past Projects</h4>
            <p style={{ color: '#00d1b2', fontSize: '1.5rem', margin: 0 }}>{projects.filter(p => p.status === 'Completed').length}</p>
          </div>
          <div style={{ padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px', backgroundColor: '#1a2b3c', flex: '1', minWidth: '150px', textAlign: 'center' }}>
            <h4 style={{ color: '#ccc', margin: 0 }}>Tasks Completed</h4>
            <p style={{ color: '#00d1b2', fontSize: '1.5rem', margin: 0 }}>14</p>
          </div>
        </div>
      </div>

      <h3 style={{ color: '#00d1b2' }}>Notifications (0)</h3>
      <p>No notifications yet.</p>
      <h3 style={{ color: '#00d1b2' }}>Team Activity</h3>
      <p>No recent updates.</p>
    </div>
  );
};

export default Home;