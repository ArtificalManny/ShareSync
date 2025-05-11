import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <ul>
        <li>
          <button onClick={() => navigate('/')}>Home</button>
        </li>
        <li>
          <button onClick={() => navigate('/profile')}>Profile</button>
        </li>
        <li>
          <button onClick={() => navigate('/projects')}>Projects</button>
        </li>
        <li>
          <button onClick={() => navigate('/create-project')}>Create Project</button>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;