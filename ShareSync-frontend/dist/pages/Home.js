import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
const Container = styled.div `
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3');
  background-size: cover;
  background-position: center;
  position: relative;
`;
const Overlay = styled.div `
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
`;
const Content = styled(motion.div) `
  text-align: center;
  color: ${theme.colors.white};
  z-index: 1;
`;
const Title = styled.h1 `
  font-size: ${theme.typography.h1.fontSize};
  font-weight: ${theme.typography.h1.fontWeight};
  margin-bottom: ${theme.spacing.md};
`;
const Subtitle = styled.p `
  font-size: ${theme.typography.body.fontSize};
  margin-bottom: ${theme.spacing.lg};
`;
const Button = styled.button `
  background: ${theme.colors.primary};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  font-size: ${theme.typography.body.fontSize};
  &:hover {
    background: ${theme.colors.secondary};
  }
`;
const Home = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            setIsLoggedIn(true);
        }
    }, []);
    return (_jsxs(Container, { children: [_jsx(Overlay, {}), _jsxs(Content, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsx(Title, { children: "INTACOM" }), _jsx(Subtitle, { children: "Collaborate on Projects, Build Professional Networks, Engage Socially" }), _jsx(Button, { onClick: () => navigate(isLoggedIn ? '/dashboard' : '/login'), children: isLoggedIn ? 'Go to Dashboard' : 'Get Started' })] })] }));
};
export default Home;
