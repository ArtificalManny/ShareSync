import axios from 'axios';

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ForgotPasswordData {
  email: string;
}

interface VerifyEmailData {
  token: string;
}

interface ResetPasswordData {
  token: string;
  password: string;
}

const register = async (data: RegisterData) => {
  return axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, data);
};

const login = async (data: LoginData) => {
  return axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, data);
};

const forgotPassword = async (data: ForgotPasswordData) => {
  return axios.post(`${process.env.REACT_APP_API_URL}/auth/forgot-password`, data);
};

const verifyEmail = async (data: VerifyEmailData) => {
  return axios.post(`${process.env.REACT_APP_API_URL}/auth/verify-email`, data);
};

const resetPassword = async (data: ResetPasswordData) => {
  return axios.post(`${process.env.REACT_APP_API_URL}/auth/reset-password`, data);
};

const authService = {
  register,
  login,
  forgotPassword,
  verifyEmail,
  resetPassword,
};

export default authService;