import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

let refreshPromise = null;

const clearSessionAndRedirect = () => {
    localStorage.removeItem('access_token');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isUnauthorized = error.response?.status === 401;
        const isAuthRoute =
            originalRequest?.url?.includes('/api/auth/login') ||
            originalRequest?.url?.includes('/api/auth/refresh-token');

        if (!isUnauthorized || !originalRequest || originalRequest._retry || isAuthRoute) {
            if (isUnauthorized) {
                clearSessionAndRedirect();
            }
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            refreshPromise =
                refreshPromise ||
                axios.post(
                    `${API_BASE_URL}/api/auth/refresh-token`,
                    {},
                    {
                        withCredentials: true,
                    },
                );

            const refreshResponse = await refreshPromise;
            const nextToken = refreshResponse.data?.access_token;
            if (!nextToken) {
                throw new Error('Missing refreshed access token.');
            }

            localStorage.setItem('access_token', nextToken);
            originalRequest.headers.Authorization = `Bearer ${nextToken}`;
            return apiClient(originalRequest);
        } catch (refreshError) {
            clearSessionAndRedirect();
            return Promise.reject(refreshError);
        } finally {
            refreshPromise = null;
        }
    },
);

export const getApiBaseUrl = () => API_BASE_URL;

export default apiClient;
