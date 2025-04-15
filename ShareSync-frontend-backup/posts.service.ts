import axios from 'axios';

interface CreatePostData {
  content: string;
  projectId: string;
}

const getPosts = async () => {
  return axios.get(`${process.env.REACT_APP_API_URL}/posts`);
};

const createPost = async (data: CreatePostData) => {
  return axios.post(`${process.env.REACT_APP_API_URL}/posts`, data);
};

const postsService = {
  getPosts,
  createPost,
};

export default postsService;