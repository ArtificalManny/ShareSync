import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <h1 className="text-white">Welcome to ShareSync</h1>
      <p className="text-gray">
        Organize your projects, collaborate with your team, and stay on top of your tasks with ShareSync.
      </p>
      <button className="btn-primary">Get Started</button>
    </div>
  );
};

export default Home;