import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/', // Usando o proxy configurado no next.config.js
});

// Interceptor para adicionar o token de autenticação
api.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api; 