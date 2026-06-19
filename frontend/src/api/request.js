import axios from 'axios';
import { message } from 'antd';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const request = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      message.error(error.response.data?.error || '请求失败');
    } else {
      message.error('网络错误，请检查后端服务是否启动');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => request.post('/api/auth/login', data),
  me: () => request.get('/api/auth/me')
};

export const linksApi = {
  list: (params) => request.get('/api/links', { params }),
  get: (id) => request.get(`/api/links/${id}`),
  create: (data) => request.post('/api/links', data),
  update: (id, data) => request.put(`/api/links/${id}`, data),
  toggle: (id) => request.patch(`/api/links/${id}/toggle`),
  delete: (id) => request.delete(`/api/links/${id}`)
};

export const statsApi = {
  dashboard: () => request.get('/api/stats/dashboard')
};

export default request;
