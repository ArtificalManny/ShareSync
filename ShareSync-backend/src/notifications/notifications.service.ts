import axios from 'axios';

const getNotifications = async (userId: string) => {
  return axios.get(`${process.env.REACT_APP_API_URL}/notifications/${userId}`);
};

const markAsRead = async (notificationId: string) => {
  return axios.put(`${process.env.REACT_APP_API_URL}/notifications/mark-as-read/${notificationId}`);
};

const notificationsService = {
  getNotifications,
  markAsRead,
};

export default notificationsService;