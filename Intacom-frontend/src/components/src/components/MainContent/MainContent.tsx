import React, { ReactNode } from 'react';
import './MainContent.css'; // Ensure this CSS file exists in the same folder

// Define the props for the MainContent component
interface MainContentProps {
  children?: ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main className="main-content">
      {/* Static content that you want to always display */}
      <h1>Welcome to Intacom</h1>
      <p>Your platform for seamless project management and collaboration.</p>
      
      {/* Render any additional children passed to the component */}
      {children}
    </main>
  );
};

export default MainContent;
