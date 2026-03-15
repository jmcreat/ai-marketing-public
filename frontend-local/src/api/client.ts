import axios from 'axios'

// VITE_API_URL이 비어있으면 프록시 사용 (Vite dev: /api → localhost:8000)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

export default api
