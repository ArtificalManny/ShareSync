import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserDetails } from '../utils/api';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserDetails();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search query:', searchQuery);
  };

  return (
    <nav className="header">
      <div className="header-logo" onClick={() => navigate('/')}>
        ShareSync
      </div>
      <form className="header-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search ShareSync..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>
      {user && (
        <div className="header-user">
          <span>{`${user.firstName} ${user.lastName}`}</span>
          <img
            src={user.profilePicture || 'https://via.placeholder.com/40'}
            alt="Profile"
          />
          <div className="dropdown">
            <button onClick={() => navigate('/profile')}>Profile</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;