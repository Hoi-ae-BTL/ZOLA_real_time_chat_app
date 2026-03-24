// src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response, // Luôn trả về response đầy đủ
    (error) => {
        if (error.response?.status === 401) {
            console.error("Token không hợp lệ hoặc đã hết hạn. Đang đăng xuất...");
            localStorage.removeItem('access_token');
            // Dùng window.location để đảm bảo trang được tải lại hoàn toàn
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
