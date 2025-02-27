import React from 'react';
import './Footer.css'; // Optional: Components-specific styles

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-links">
        <a href="/about">About Us</a> |<a href="/careers">Careers</a> |
        <a href="/contact">Contact Support</a> |
        <a href="/privacy">Privacy Policy</a> |
        <a href="/terms">Terms of Service</a>
      </div>
      <div className="social-media">
        <a href="https://facebook.com">
          <i className="fab fa-facebook-f"></i>
        </a>
        <a href="https://twitter.com">
          <i className="fab fa-twitter"></i>
        </a>
        <a href="https://linkedin.com">
          <i className="fab fa-linkedin-in"></i>
        </a>
        {/* Add more social media icons as needed */}
      </div>
    </footer>
  );
};

export default Footer;
