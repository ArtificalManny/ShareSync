import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { AuthForm } from './components/AuthForm';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProjectProvider>
        <div className="container">
          <AuthForm />
          {/* Add other components or routes here */}
        </div>
      </ProjectProvider>
    </AuthProvider>
  );
};

export default App;