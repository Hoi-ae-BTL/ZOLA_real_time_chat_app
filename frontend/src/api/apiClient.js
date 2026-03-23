import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000', // Trỏ thẳng vào server FastAPI của Hưng
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Kẻ đánh chặn: Tự động nhét Token vào Header trước khi gửi đi
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

// Kẻ đánh chặn: Xử lý lỗi tập trung khi Server trả về
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            console.error("Hết hạn đăng nhập!");
            localStorage.removeItem('access_token');
            // Sau này Thế có thể redirect về /login ở đây
        }
        return Promise.reject(error);
    }
);

export default apiClient;