import React from 'react';
import './Home.css';

const Home = () => {
  console.log('Home - Starting render');

  return (
    <div className="home-container">
      <h1 className="holographic-text">Welcome to ShareSync</h1>
      <p className="text-secondary">Collaborate and manage your projects with ease in a futuristic way.</p>
    </div>
  );
};

export default Home;