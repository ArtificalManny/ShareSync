import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import axios from 'axios';

const Container = styled.div`
  padding: ${theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: ${theme.typography.h1.fontSize};
  font-weight: ${theme.typography.h1.fontWeight};
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.lg};
`;

const LeaderboardList = styled.ul`
  list-style: none;
  padding: 0;
`;

const LeaderboardItem = styled(motion.li)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${theme.colors.white};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.small};
  margin-bottom: ${theme.spacing.sm};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const Username = styled.span`
  font-size: ${theme.typography.body.fontSize};
  font-weight: ${theme.typography.body.fontWeight};
`;

const Points = styled.span`
  font-size: ${theme.typography.body.fontSize};
  color: ${theme.colors.secondary};
`;

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/points/leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  return (
    <Container>
      <Title>Leaderboard</Title>
      <LeaderboardList>
        {leaderboard.map((user: any, index: number) => (
          <LeaderboardItem
            key={user._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <UserInfo>
              <span>{index + 1}.</span>
              <Username>{user.username}</Username>
            </UserInfo>
            <Points>{user.points} points</Points>
          </LeaderboardItem>
        ))}
      </LeaderboardList>
    </Container>
  );
};

export default Leaderboard;