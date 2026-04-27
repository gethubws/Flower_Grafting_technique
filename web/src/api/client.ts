import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 注入 JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 统一错误处理
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message;
    console.error('API Error:', msg);
    return Promise.reject(err);
  },
);

export default client;
