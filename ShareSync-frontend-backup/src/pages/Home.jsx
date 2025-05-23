import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-content">
        <h1 className="welcome-title">Welcome to ShareSync</h1>
        <p className="text-secondary">
          Collaborate on projects, share ideas, and stay organized with maximum transparency.
        </p>
        <Link to="/projects">
          <button className="btn-primary">Get Started</button>
        </Link>
      </div>
    </div>
  );
};

export default Home;