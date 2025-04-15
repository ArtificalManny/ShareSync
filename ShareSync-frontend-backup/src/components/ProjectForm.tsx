import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface ProjectFormProps {
  user: { _id: string; username: string; email: string };
}

const ProjectForm: React.FC<ProjectFormProps> = ({ user }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sharedWith, setSharedWith] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects`, {
        name,
        description,
        sharedWith: sharedWith.split(',').map(email => email.trim()),
        creatorEmail: user.email,
      });
      navigate(`/project/${response.data.data._id}`);
    } catch (err) {
      console.error('ProjectForm.tsx: Error creating project:', err);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Create a New Project</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.textarea}
          required
        />
        <input
          type="text"
          placeholder="Share with (comma-separated emails)"
          value={sharedWith}
          onChange={(e) => setSharedWith(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.submitButton}>Create Project</button>
      </form>
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    background: 'rgba(162, 228, 255, 0.1)',
    borderRadius: '15px',
    boxShadow: '0 0 20px rgba(162, 228, 255, 0.3)',
    border: '1px solid #A2E4FF',
    animation: 'fadeIn 1s ease-in-out',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '24px',
    textAlign: 'center',
    marginBottom: '20px',
    color: '#A2E4FF',
    textShadow: '0 0 10px #A2E4FF',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    fontSize: '16px',
    backgroundColor: '#1E1E2F',
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    transition: 'box-shadow 0.3s ease',
  },
  textarea: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    fontSize: '16px',
    backgroundColor: '#1E1E2F',
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    resize: 'vertical',
    minHeight: '100px',
    transition: 'box-shadow 0.3s ease',
  },
  submitButton: {
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
};

// Add keyframes for animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.7);
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  input:focus, textarea:focus {
    box-shadow: 0 0 10px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default ProjectForm;