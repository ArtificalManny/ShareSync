import axios from "axios";

const isDev = import.meta.env.DEV;

const api = axios.create({
  baseURL: isDev ? "http://localhost:3000/api" : "/api",
  withCredentials: true,
});

// ====================================================================
// REQUEST INTERCEPTOR - Attach JWT to every request
// ====================================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ss.jwt");
    
    console.log('[API Client] 🔵 Request to:', config.url);
    console.log('[API Client] 🔵 Token exists:', !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Client] ✅ Attached token to request:', config.url);
    } else {
      console.log('[API Client] ❌ No token found for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Client] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ====================================================================
// RESPONSE INTERCEPTOR - Smart 401 handling
// ====================================================================
let isLoggingOut = false;

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const config = error?.config;
    const url = config?.url || '';

    console.error('❌ API Error:', status, error.response?.data);

    if (status === 401) {
      const isLoginEndpoint = url.includes('/auth/login');
      const isRegisterEndpoint = url.includes('/auth/register');
      const isVerifyEndpoint = url.includes('/auth/verify');
      
      if (isLoginEndpoint || isRegisterEndpoint) {
        console.log('[API Client] Login/Register failed - wrong credentials');
        return Promise.reject(error);
      }

      if (isVerifyEndpoint) {
        console.log('[API Client] Token verification failed');
        return Promise.reject(error);
      }

      if (!isLoggingOut) {
        console.warn('⚠️ Unauthorized - but NOT redirecting (debug mode)');
        
        isLoggingOut = true;
        
        localStorage.removeItem("ss.jwt");
        localStorage.removeItem("ss.user");
        
        setTimeout(() => {
          isLoggingOut = false;
          window.location.href = "/login";
        }, 100);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
