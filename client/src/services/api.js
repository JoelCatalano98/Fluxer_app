import axios from 'axios';

if (!import.meta.env.VITE_API_URL) {
  console.error("VITE_API_URL no está configurada — la app no puede conectarse al backend");
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
