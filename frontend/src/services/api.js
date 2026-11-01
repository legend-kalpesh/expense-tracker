// One shared Axios instance. It adds the JWT to every request automatically.
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says the token is invalid/expired, log the user out.
// (Login/register 401 errors are normal "wrong password" cases, so they are skipped.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// Turns any Axios error into a readable message for the user
export const getErrorMessage = (error) => {
  const data = error.response?.data;
  if (data?.errors?.length) return data.errors.join('. ');
  if (data?.message) return data.message;
  if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?';
  return error.message || 'Something went wrong';
};

export default api;
