import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import axios from 'axios';
const Container = styled.div `
  padding: ${theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
`;
const Title = styled.h1 `
  font-size: ${theme.typography.h1.fontSize};
  font-weight: ${theme.typography.h1.fontWeight};
  color: ${theme.colors.primary};
  margin-bottom: ${theme.spacing.lg};
`;
const NotificationList = styled.ul `
  list-style: none;
  padding: 0;
`;
const NotificationItem = styled(motion.li) `
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => (props.isRead ? theme.colors.background : theme.colors.white)};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.small};
  margin-bottom: ${theme.spacing.sm};
  cursor: pointer;
`;
const NotificationMessage = styled.span `
  font-size: ${theme.typography.body.fontSize};
`;
const MarkAsReadButton = styled.button `
  background: ${theme.colors.secondary};
  font-size: ${theme.typography.caption.fontSize};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
`;
const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    useEffect(() => {
        fetchNotifications();
    }, []);
    const fetchNotifications = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`);
            setNotifications(response.data);
        }
        catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };
    const handleMarkAsRead = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/notifications/mark-as-read/${id}`);
            fetchNotifications();
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };
    return (_jsxs(Container, { children: [_jsx(Title, { children: "Notifications" }), _jsx(NotificationList, { children: notifications.map((notification, index) => (_jsxs(NotificationItem, { isRead: notification.isRead, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: index * 0.1 }, children: [_jsx(NotificationMessage, { children: notification.message }), !notification.isRead && (_jsx(MarkAsReadButton, { onClick: () => handleMarkAsRead(notification._id), children: "Mark as Read" }))] }, notification._id))) })] }));
};
export default Notifications;
