import axios from 'axios';

const getLeaderboard = async () => {
  return axios.get(`${import.meta.env.VITE_API_URL}/points/leaderboard`);
};

const usersService = {
  getLeaderboard,
};

export default usersService;