import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('saas-demo-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export { API_BASE }
export default api
