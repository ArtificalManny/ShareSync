import React, { useEffect, useState } from 'react';
import './BackgroundSlideshow.css';

const BackgroundSlideshow: React.FC = () => {
  const slides = [
    'https://images.unsplash.com/photo-1516321318423-4b31e0b0f38f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80', // Collaboration (Atlassian/Asana)
    'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80', // Professional networking (LinkedIn)
    'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80', // Social interaction (Facebook)
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="background-slideshow">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`slide ${index === currentSlide ? 'active' : ''}`}
          style={{ backgroundImage: `url(${slide})` }}
        />
      ))}
    </div>
  );
};

export default BackgroundSlideshow;