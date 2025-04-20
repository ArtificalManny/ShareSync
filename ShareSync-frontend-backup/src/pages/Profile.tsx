import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import styled from 'styled-components';

const ProfileContainer = styled.div`
  padding: 20px;
  background: ${({ theme }: { theme: any }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

const Section = styled.div`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: ${({ theme }) => theme.glow};
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid ${({ theme }: { theme: any }) => theme?.border || '#334155'};
  border-radius: 5px;
  background: ${({ theme }) => theme?.cardBackground || 'rgba(255, 255, 255, 0.05)'};
  color: ${({ theme }) => theme?.text || '#e0e7ff'};
`;

const Button = styled.button`
  background: ${({ theme }: { theme: any }) =>
    `linear-gradient(45deg, ${theme?.primary || '#818cf8'}, ${theme?.secondary || '#f9a8d4'})`};
  color: ${({ theme }) => theme?.buttonText || '#0f172a'};
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  margin: 10px 0;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.05);
  }
`;

const ErrorMessage = styled.p`
  color: ${({ theme }: { theme: any }) => theme?.warning || '#e11d48'};
  font-size: 14px;
`;

const SuccessMessage = styled.p`
  color: ${({ theme }: { theme: any }) => theme?.accent || '#10b981'};
  font-size: 14px;
`;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Profile = () => {
  const { currentTheme } = useTheme();
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await axios.put(
        `${API_URL}/users/update`,
        { firstName, lastName, email },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setUser(response.data);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <ProfileContainer theme={currentTheme}>
      <Section theme={currentTheme}>
        <h2>Profile</h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            theme={currentTheme}
            required
          />
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            theme={currentTheme}
            required
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            theme={currentTheme}
            required
          />
          <Button type="submit" theme={currentTheme}>
            Update Profile
          </Button>
        </form>
        {error && <ErrorMessage theme={currentTheme}>{error}</ErrorMessage>}
        {success && <SuccessMessage theme={currentTheme}>{success}</SuccessMessage>}
      </Section>
    </ProfileContainer>
  );
};

export default Profile;