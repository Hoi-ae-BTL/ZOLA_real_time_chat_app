import apiClient from './apiClient';

export const getMyProfileAPI = async () => {
    const response = await apiClient.get('/api/users/me');
    return response.data;
};

export const getConversationsAPI = async () => {
    const response = await apiClient.get('/api/conversations/');
    return response.data;
};

export const getConversationDetailsAPI = async (conversationId) => {
    const response = await apiClient.get(`/api/conversations/${conversationId}`);
    return response.data;
};

export const createConversationAPI = async (payload) => {
    const response = await apiClient.post('/api/conversations/', payload);
    return response.data;
};

export const updateConversationAPI = async (conversationId, payload) => {
    const response = await apiClient.put(`/api/conversations/${conversationId}`, payload);
    return response.data;
};

export const addConversationMembersAPI = async (conversationId, userIds) => {
    const response = await apiClient.post(`/api/conversations/${conversationId}/members`, {
        user_ids: userIds,
    });
    return response.data;
};

export const deleteConversationAPI = async (conversationId) => {
    await apiClient.delete(`/api/conversations/${conversationId}`);
};

export const markConversationAsReadAPI = async (conversationId) => {
    await apiClient.post(`/api/conversations/${conversationId}/read`);
};

export const getMessagesAPI = async (conversationId, params = {}) => {
    const response = await apiClient.get(`/api/messages/${conversationId}`, {
        params,
    });
    return response.data;
};

export const sendMessageAPI = async (conversationId, content) => {
    const response = await apiClient.post('/api/messages/', {
        conversation_id: conversationId,
        content,
    });
    return response.data;
};

export const uploadConversationFileAPI = async (conversationId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/upload/file', formData, {
        params: {
            conversation_id: conversationId,
        },
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};
