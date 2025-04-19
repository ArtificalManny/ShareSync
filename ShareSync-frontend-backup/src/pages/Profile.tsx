import { useState, useEffect } from 'react';
import axios from '../axios';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import styled, { keyframes } from 'styled-components';
import { FaUserPlus, FaTrophy, FaStar } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const glowPulse = keyframes`
  0% { box-shadow: 0 0 10px ${({ theme }) => theme.glow}; }
  50% { box-shadow: 0 0 20px ${({ theme }) => theme.glow}; }
  100% { box-shadow: 0 0 10px ${({ theme }) => theme.glow}; }
`;

const ProfileContainer = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  backdrop-filter: blur(10px);
  color: ${({ theme }) => theme.text};
  padding: 40px;
  max-width: 800px;
  margin: 50px auto;
  border-radius: 15px;
  box-shadow: ${({ theme }) => theme.shadow};
  animation: ${fadeIn} 1s ease forwards;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, ${({ theme }) => theme.glow}, transparent);
    opacity: 0.3;
    z-index: -1;
    animation: ${glowPulse} 5s ease infinite;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${({ theme }) => theme.accent};
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const Name = styled.h2`
  font-size: 28px;
  color: ${({ theme }) => theme.accent};
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Bio = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  margin-top: 10px;
`;

const Stats = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 10px;
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${({ theme }) => theme.highlight};
`;

const Section = styled.div`
  margin-top: 30px;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  color: ${({ theme }) => theme.accent};
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
`;

const ListItem = styled.li`
  padding: 10px;
  background: ${({ theme }) => theme.cardBackground};
  border-radius: 8px;
  margin-bottom: 5px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px;
  font-size: 14px;
  background: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
  outline: none;
`;

const Textarea = styled.textarea`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px;
  font-size: 14px;
  background: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
  outline: none;
  resize: none;
  height: 100px;
`;

const Button = styled.button`
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 10px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
`;

const Profile = () => {
  const { user, setUser } = useUser();
  const { currentTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/users/update-profile', {
        username,
        firstName,
        lastName,
        bio,
        skills: skills.split(',').map(skill => skill.trim()),
      }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUser(response.data);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <ProfileContainer theme={currentTheme}>
      <ProfileHeader>
        <Avatar src="https://via.placeholder.com/100" alt="User avatar" />
        <ProfileInfo>
          <Name>{user.firstName} {user.lastName}</Name>
          <Bio>{user.bio || 'No bio available'}</Bio>
          <Stats>
            <Stat><FaUserPlus /> Followers: {user.followers?.length || 0}</Stat>
            <Stat><FaUserPlus /> Following: {user.following?.length || 0}</Stat>
            <Stat><FaTrophy /> Points: {user.points || 0}</Stat>
          </Stats>
        </ProfileInfo>
      </ProfileHeader>

      {editing ? (
        <Form onSubmit={handleUpdateProfile}>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            theme={currentTheme}
          />
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            theme={currentTheme}
          />
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            theme={currentTheme}
          />
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio"
            theme={currentTheme}
          />
          <Input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Skills (comma-separated)"
            theme={currentTheme}
          />
          <Button type="submit" theme={currentTheme}>Save</Button>
          <Button type="button" onClick={() => setEditing(false)} theme={currentTheme}>Cancel</Button>
        </Form>
      ) : (
        <Button onClick={() => setEditing(true)} theme={currentTheme}>Edit Profile</Button>
      )}

      <Section>
        <SectionTitle theme={currentTheme}><FaStar /> Skills</SectionTitle>
        <List>
          {user.skills?.map((skill, index) => (
            <ListItem key={index} theme={currentTheme}>{skill}</ListItem>
          ))}
        </List>
      </Section>

      <Section>
        <SectionTitle theme={currentTheme}><FaTrophy /> Badges</SectionTitle>
        <List>
          {user.badges?.map((badge, index) => (
            <ListItem key={index} theme={currentTheme}>{badge}</ListItem>
          ))}
        </List>
      </Section>
    </ProfileContainer>
  );
};

export default Profile;