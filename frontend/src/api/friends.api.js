import apiClient from './apiClient';

export const searchUsersAPI = async (query, limit = 20) => {
    const response = await apiClient.get('/api/users/search', {
        params: {
            q: query,
            limit,
        },
    });
    return response.data;
};

export const getFriendsAPI = async () => {
    const response = await apiClient.get('/api/friends/');
    return response.data;
};

export const getFriendRequestsAPI = async () => {
    const response = await apiClient.get('/api/friends/requests');
    return response.data;
};

export const sendFriendRequestAPI = async (toUserId, message = '') => {
    const response = await apiClient.post('/api/friends/requests', {
        to_user_id: toUserId,
        message,
    });
    return response.data;
};

export const acceptFriendRequestAPI = async (requestId) => {
    const response = await apiClient.post(`/api/friends/requests/${requestId}/accept`);
    return response.data;
};

export const deleteFriendRequestAPI = async (requestId) => {
    await apiClient.delete(`/api/friends/requests/${requestId}`);
};
