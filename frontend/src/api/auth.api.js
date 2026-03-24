// src/api/auth.api.js
import apiClient from './apiClient';

export const registerAPI = (email, username, displayName, password) => {
    const data = {
        email,
        username,
        display_name: displayName,
        password
    };
    return apiClient.post('/api/users/register', data);
};

export const loginAPI = async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await apiClient.post('/api/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data && response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
    } else {
        throw new Error("Dữ liệu trả về không hợp lệ (không tìm thấy access_token).");
    }
};

export const logoutAPI = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
};
