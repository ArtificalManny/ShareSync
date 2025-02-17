// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import MainContent from './components/MainContent/MainContent';
import RightSidebar from './components/RightSidebar/RightSidebar';
import Footer from './components/Footer/Footer';
import Profile from './components/Profile/Profile';

const App: React.FC = () => {
  return (
    <Router>
      <Header toggleDarkMode={() => {}} />
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/profile" element={<Profile />} />
          {/* Add other routes as needed */}
        </Routes>
        <RightSidebar />
      </Box>
      <Footer />
    </Router>
  );
};

export default App;
