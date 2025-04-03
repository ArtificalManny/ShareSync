import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import axios from 'axios';

const Container = styled.div`
  padding: ${theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
`;

const Title = styled.h1`
  font-size: ${theme.typography.h1.fontSize};
  font-weight: ${theme.typography.h1.fontWeight};
  color: ${theme.colors.primary};
`;

const Button = styled.button`
  background: ${theme.colors.secondary};
`;

const Section = styled.div`
  background: ${theme.colors.white};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.small};
  margin-bottom: ${theme.spacing.md};
`;

const Bio = styled.p`
  font-size: ${theme.typography.body.fontSize};
  margin-bottom: ${theme.spacing.sm};
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
`;

const ListItem = styled.li`
  font-size: ${theme.typography.body.fontSize};
  margin-bottom: ${theme.spacing.sm};
`;

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [username]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/${username}`);
      setUser(response.data.data);
      const currentUser = JSON.parse(localStorage.getItem('user'));
      setIsFollowing(response.data.data.followers.includes(currentUser._id));
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      await axios.post(`${import.meta.env.VITE_API_URL}/users/follow`, {
        userId: currentUser._id,
        followId: user._id,
      });
      setIsFollowing(true);
      fetchUser();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      await axios.post(`${import.meta.env.VITE_API_URL}/users/unfollow`, {
        userId: currentUser._id,
        unfollowId: user._id,
      });
      setIsFollowing(false);
      fetchUser();
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  return (
    <Container>
      <Header>
        <Title>{user?.username}'s Profile</Title>
        {user && user._id === JSON.parse(localStorage.getItem('user'))._id ? (
          <Button onClick={() => navigate(`/profile/${username}/edit`)}>Edit Profile</Button>
        ) : (
          <Button onClick={isFollowing ? handleUnfollow : handleFollow}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Button>
        )}
      </Header>
      <Section>
        <h2>Bio</h2>
        <Bio>{user?.bio || 'No bio available'}</Bio>
      </Section>
      <Section>
        <h2>Hobbies</h2>
        <List>
          {user?.hobbies?.map((hobby: string, index: number) => (
            <ListItem key={index}>{hobby}</ListItem>
          ))}
        </List>
      </Section>
      <Section>
        <h2>Skills</h2>
        <List>
          {user?.skills?.map((skill: string, index: number) => (
            <ListItem key={index}>{skill}</ListItem>
          ))}
        </List>
      </Section>
      <Section>
        <h2>Experience</h2>
        <List>
          {user?.experience?.map((exp: string, index: number) => (
            <ListItem key={index}>{exp}</ListItem>
          ))}
        </List>
      </Section>
      <Section>
        <h2>Endorsements</h2>
        <List>
          {user?.endorsements?.map((endorsement: string, index: number) => (
            <ListItem key={index}>{endorsement}</ListItem>
          ))}
        </List>
      </Section>
      <Section>
        <h2>Stats</h2>
        <p><strong>Points:</strong> {user?.points}</p>
        <p><strong>Followers:</strong> {user?.followers?.length}</p>
        <p><strong>Following:</strong> {user?.following?.length}</p>
      </Section>
    </Container>
  );
};

export default Profile;