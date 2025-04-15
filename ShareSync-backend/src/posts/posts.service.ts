import axios from 'axios';

interface CreatePostData {
  content: string;
  projectId: string;
}

const getPosts = async () => {
  return axios.get(`${import.meta.env.VITE_API_URL}/posts`);
};

const createPost = async (data: CreatePostData) => {
  return axios.post(`${import.meta.env.VITE_API_URL}/posts`, data);
};

const postsService = {
  getPosts,
  createPost,
};

export default postsService;