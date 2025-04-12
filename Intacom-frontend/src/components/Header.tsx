import React from 'react';
import { styled } from '@mui/material/styles';
import { theme } from '../styles/theme';

const HeaderContainer = styled('header')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing.medium,
  backgroundColor: theme.colors.secondary,
  color: theme.colors.text,
}));

const Logo = styled('h1')({
  margin: 0,
});

const Nav = styled('nav')({
  display: 'flex',
  gap: '20px',
});

const NavLink = styled('a')({
  color: 'inherit',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
});

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <Logo>INTACOM</Logo>
      <Nav>
        <NavLink href="/">Home</NavLink>
        <NavLink href="/profile">Profile</NavLink>
        <NavLink href="/projects">Projects</NavLink>
        <NavLink href="/notifications">Notifications</NavLink>
        <NavLink href="/leaderboard">Leaderboard</NavLink>
        <NavLink href="/logout">Logout</NavLink>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;