import React from 'react';
import './BackgroundSlideshow.css';

const BackgroundSlideshow: React.FC = () => {
  const features = [
    {
      image: 'https://images.unsplash.com/photo-1516321318423-4b31e0b0f38f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      text: 'Collaborate on Projects',
    },
    {
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      text: 'Build Professional Networks',
    },
    {
      image: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      text: 'Engage Socially',
    },
  ];

  return (
    <div className="background-slideshow">
      <div className="slides-container">
        {features.map((feature, index) => (
          <div
            key={index}
            className="slide"
            style={{ backgroundImage: `url(${feature.image})` }}
          >
            <div className="slide-text">{feature.text}</div>
          </div>
        ))}
        {/* Duplicate the features for seamless scrolling */}
        {features.map((feature, index) => (
          <div
            key={`duplicate-${index}`}
            className="slide"
            style={{ backgroundImage: `url(${feature.image})` }}
          >
            <div className="slide-text">{feature.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackgroundSlideshow;