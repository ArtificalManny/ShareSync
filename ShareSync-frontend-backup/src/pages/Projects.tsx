import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  creator: { _id: string; username: string };
  sharedWith: string[];
}

const Projects: React.FC<{ user: User }> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/projects/${user.username}`);
        setProjects(response.data.data);
      } catch (err) {
        console.error('Projects.tsx: Error fetching projects:', err);
      }
    };

    fetchProjects();
  }, [user.username]);

  const handleEdit = (project: Project) => {
    setEditingProject(project._id);
    setEditName(project.name);
    setEditDescription(project.description);
  };

  const updateProject = async (id: string) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/projects/${id}`, {
        name: editName,
        description: editDescription,
      });
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === id ? { ...project, name: editName, description: editDescription } : project
        )
      );
      setEditingProject(null);
    } catch (err) {
      console.error('Projects.tsx: Error updating project:', err);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/projects/${id}`);
      setProjects((prevProjects) => prevProjects.filter((project) => project._id !== id));
    } catch (err) {
      console.error('Projects.tsx: Error deleting project:', err);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Your Projects</h1>
      {projects.length > 0 ? (
        <ul style={styles.list}>
          {projects.map((project) => (
            <li key={project._id} style={styles.listItem}>
              {editingProject === project._id ? (
                <div style={styles.editContainer}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={styles.input}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={styles.textarea}
                  />
                  <button onClick={() => updateProject(project._id)} style={styles.saveButton}>
                    Save
                  </button>
                  <button onClick={() => setEditingProject(null)} style={styles.cancelButton}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div style={styles.projectInfo}>
                    <span
                      style={styles.projectName}
                      onClick={() => navigate(`/project/${project._id}`)}
                    >
                      {project.name}
                    </span>
                    <span style={styles.description}>{project.description}</span>
                  </div>
                  <div style={styles.actions}>
                    <button onClick={() => handleEdit(project)} style={styles.editButton}>
                      Edit
                    </button>
                    <button onClick={() => deleteProject(project._id)} style={styles.deleteButton}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.noContent}>You haven't created any projects yet.</p>
      )}
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '40px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    minHeight: '100vh',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '36px',
    textShadow: '0 0 15px #A2E4FF',
    marginBottom: '40px',
    textAlign: 'center',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: {
    background: 'rgba(162, 228, 255, 0.1)',
    padding: '15px 20px',
    marginBottom: '10px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    boxShadow: '0 0 10px rgba(162, 228, 255, 0.3)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
  },
  description: {
    fontSize: '16px',
    color: '#FF6F91',
    marginLeft: '20px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  editButton: {
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 10px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
  deleteButton: {
    background: 'linear-gradient(90deg, #FF6F91, #A2E4FF)',
    color: '#1E1E2F',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 10px rgba(255, 111, 145, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
  editContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
  },
  input: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    backgroundColor: '#1E1E2F',
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '16px',
    transition: 'box-shadow 0.3s ease',
  },
  textarea: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    backgroundColor: '#1E1E2F',
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '16px',
    resize: 'vertical',
    minHeight: '100px',
    transition: 'box-shadow 0.3s ease',
  },
  saveButton: {
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 10px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
  cancelButton: {
    background: 'linear-gradient(90deg, #FF6F91, #A2E4FF)',
    color: '#1E1E2F',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 10px rgba(255, 111, 145, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
  noContent: {
    fontSize: '16px',
    color: '#FF6F91',
    textAlign: 'center',
    fontStyle: 'italic',
  },
};

// Add hover effects
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  .projectName:hover {
    color: #FF6F91;
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(162, 228, 255, 0.7);
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  input:focus, textarea:focus {
    box-shadow: 0 0 10px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default Projects;