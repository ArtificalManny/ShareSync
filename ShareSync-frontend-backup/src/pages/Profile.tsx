import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { FaTrophy, FaUserPlus, FaUserMinus, FaEdit } from 'react-icons/fa';
import styled from 'styled-components';

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  border-radius: 15px;
  box-shadow: ${({ theme }) => theme.shadow};
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme.border};
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  margin-top: 20px;
`;

const Section = styled.div`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  padding: 20px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.border};
`;

const SectionTitle = styled.h2`
  color: ${({ theme }: { theme: any }) => theme.text};
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
`;

const ListItem = styled.li`
  color: ${({ theme }: { theme: any }) => theme.text};
  padding: 5px 0;
`;

const Button = styled.button`
  background: linear-gradient(45deg, ${({ theme }: { theme: any }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  margin: 5px;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.05);
  }
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }: { theme: any }) => theme.accent};
  cursor: pointer;
  margin-left: 10px;
  &:hover {
    color: ${({ theme }) => theme.highlight};
  }
`;

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

const Profile = () => {
  const { currentTheme } = useTheme();
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('Software Developer | Tech Enthusiast');
  const [skills, setSkills] = useState(['React', 'TypeScript', 'Node.js']);
  const [newSkill, setNewSkill] = useState('');
  const [badges] = useState(['Top Contributor', 'Team Leader']);
  const [followers] = useState(120);
  const [following] = useState(85);
  const [points] = useState(450);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value);
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleFollow = () => {
    // Implement follow functionality
  };

  const handleUnfollow = () => {
    // Implement unfollow functionality
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <ProfileContainer theme={currentTheme}>
      <Section theme={currentTheme}>
        <SectionTitle theme={currentTheme}>
          Profile
          <EditButton theme={currentTheme} onClick={handleEditToggle}>
            <FaEdit />
          </EditButton>
        </SectionTitle>
        <List>
          <ListItem theme={currentTheme}>Username: {user.firstName} {user.lastName}</ListItem>
          <ListItem theme={currentTheme}>
            Bio: {isEditing ? (
              <textarea value={bio} onChange={handleBioChange} />
            ) : (
              bio
            )}
          </ListItem>
          <ListItem theme={currentTheme}>Email: {user.email}</ListItem>
          <ListItem theme={currentTheme}>Followers: {followers}</ListItem>
          <ListItem theme={currentTheme}>Following: {following}</ListItem>
          <ListItem theme={currentTheme}>Points: {points}</ListItem>
        </List>
        <Button theme={currentTheme} onClick={handleFollow}>
          <FaUserPlus /> Follow
        </Button>
        <Button theme={currentTheme} onClick={handleUnfollow}>
          <FaUserMinus /> Unfollow
        </Button>
      </Section>

      <Section theme={currentTheme}>
        <SectionTitle theme={currentTheme}>Skills</SectionTitle>
        {isEditing ? (
          <div>
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a new skill"
            />
            <Button theme={currentTheme} onClick={handleAddSkill}>Add Skill</Button>
          </div>
        ) : null}
        <List>
          {skills.map((skill, index) => (
            <ListItem key={index} theme={currentTheme}>{skill}</ListItem>
          ))}
        </List>
      </Section>

      <Section theme={currentTheme}>
        <SectionTitle theme={currentTheme}>
          <FaTrophy /> Badges
        </SectionTitle>
        <List>
          {badges.map((badge, index) => (
            <ListItem key={index} theme={currentTheme}>{badge}</ListItem>
          ))}
        </List>
      </Section>
    </ProfileContainer>
  );
};

export default Profile;