import apiClient from './apiClient';

export const registerAPI = (email, username, displayName, password) => {
    return apiClient.post('/api/users/register', {
        email,
        username,
        display_name: displayName,
        password,
    });
};

export const loginAPI = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post('/api/auth/login', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    const accessToken = response.data?.access_token;
    if (!accessToken) {
        throw new Error('Không tìm thấy access token từ server.');
    }

    localStorage.setItem('access_token', accessToken);
    return response.data;
};

export const logoutAPI = async () => {
    try {
        await apiClient.post('/api/auth/logout');
    } catch (error) {
        console.error('Logout request failed:', error);
    } finally {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
    }
};
