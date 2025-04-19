import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const RecoverContainer = styled.div`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
  padding: 30px;
  border-radius: 15px;
  box-shadow: ${({ theme }) => theme.shadow};
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme.border};
  width: 100%;
  max-width: 400px;
  text-align: center;
  margin: 0 auto;
  margin-top: 50px;
`;

const Message = styled.p`
  color: ${({ theme }: { theme: any }) => theme.accent};
  font-size: 16px;
`;

const Recover = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [message] = useState('Recovery instructions have been sent to your email.');

  return (
    <RecoverContainer theme={currentTheme}>
      <Message theme={currentTheme}>{message}</Message>
      <button onClick={() => navigate('/login')}>Back to Login</button>
    </RecoverContainer>
  );
};

export default Recover;