import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/app/login'
    }
    return Promise.reject(error)
  }
)

export const loginApi = {
  login: (data) => api.post('/auth/login', data),
}

export const linksApi = {
  list: (params) => api.get('/links', { params }),
  create: (data) => api.post('/links', data),
  update: (id, data) => api.put(`/links/${id}`, data),
  delete: (id) => api.delete(`/links/${id}`),
  toggle: (id) => api.put(`/links/${id}/toggle`),
  get: (id) => api.get(`/links/${id}`),
}

export const statsApi = {
  dashboard: () => api.get('/stats/dashboard'),
  linkClicks: (id, params) => api.get(`/stats/links/${id}/clicks`, { params }),
}

export default api
