import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import axios from 'axios';
const Container = styled.div `
  padding: ${theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
`;
const Header = styled.header `
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
`;
const Title = styled.h1 `
  font-size: ${theme.typography.h1.fontSize};
  font-weight: ${theme.typography.h1.fontWeight};
  color: ${theme.colors.primary};
`;
const Button = styled.button `
  background: ${theme.colors.secondary};
`;
const Section = styled.div `
  background: ${theme.colors.white};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.small};
  margin-bottom: ${theme.spacing.md};
`;
const Bio = styled.p `
  font-size: ${theme.typography.body.fontSize};
  margin-bottom: ${theme.spacing.sm};
`;
const List = styled.ul `
  list-style: none;
  padding: 0;
`;
const ListItem = styled.li `
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('Error unfollowing user:', error);
        }
    };
    return (_jsxs(Container, { children: [_jsxs(Header, { children: [_jsxs(Title, { children: [user?.username, "'s Profile"] }), user && user._id === JSON.parse(localStorage.getItem('user'))._id ? (_jsx(Button, { onClick: () => navigate(`/profile/${username}/edit`), children: "Edit Profile" })) : (_jsx(Button, { onClick: isFollowing ? handleUnfollow : handleFollow, children: isFollowing ? 'Unfollow' : 'Follow' }))] }), _jsxs(Section, { children: [_jsx("h2", { children: "Bio" }), _jsx(Bio, { children: user?.bio || 'No bio available' })] }), _jsxs(Section, { children: [_jsx("h2", { children: "Hobbies" }), _jsx(List, { children: user?.hobbies?.map((hobby, index) => (_jsx(ListItem, { children: hobby }, index))) })] }), _jsxs(Section, { children: [_jsx("h2", { children: "Skills" }), _jsx(List, { children: user?.skills?.map((skill, index) => (_jsx(ListItem, { children: skill }, index))) })] }), _jsxs(Section, { children: [_jsx("h2", { children: "Experience" }), _jsx(List, { children: user?.experience?.map((exp, index) => (_jsx(ListItem, { children: exp }, index))) })] }), _jsxs(Section, { children: [_jsx("h2", { children: "Endorsements" }), _jsx(List, { children: user?.endorsements?.map((endorsement, index) => (_jsx(ListItem, { children: endorsement }, index))) })] }), _jsxs(Section, { children: [_jsx("h2", { children: "Stats" }), _jsxs("p", { children: [_jsx("strong", { children: "Points:" }), " ", user?.points] }), _jsxs("p", { children: [_jsx("strong", { children: "Followers:" }), " ", user?.followers?.length] }), _jsxs("p", { children: [_jsx("strong", { children: "Following:" }), " ", user?.following?.length] })] })] }));
};
export default Profile;
