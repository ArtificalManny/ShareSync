import axios from 'axios';

const getLeaderboard = async () => {
  return axios.get(`${process.env.REACT_APP_API_URL}/points/leaderboard`);
};

const usersService = {
  getLeaderboard,
};

export default usersService;