// src/api/chat.api.js
import apiClient from './apiClient';

/**
 * Lấy thông tin cá nhân của người dùng hiện tại.
 * @returns {Promise<Object>} Profile của người dùng.
 */
export const getMyProfileAPI = async () => {
    const response = await apiClient.get('/api/users/me');
    return response.data;
};

/**
 * Lấy tất cả các cuộc trò chuyện của người dùng hiện tại.
 * @returns {Promise<Array>} Danh sách các cuộc trò chuyện.
 */
export const getConversationsAPI = async () => {
    const response = await apiClient.get('/api/conversations/');
    return response.data; 
};

/**
 * Lấy thông tin chi tiết của một cuộc trò chuyện, bao gồm cả người tham gia.
 * @param {string} conversationId - ID của cuộc trò chuyện.
 * @returns {Promise<Object>} Chi tiết cuộc trò chuyện.
 */
export const getConversationDetailsAPI = async (conversationId) => {
    const response = await apiClient.get(`/api/conversations/${conversationId}`);
    return response.data;
};

/**
 * Lấy lịch sử tin nhắn của một cuộc trò chuyện.
 * @param {string} conversationId - ID của cuộc trò chuyện.
 * @returns {Promise<Array>} Danh sách các tin nhắn.
 */
export const getMessagesAPI = async (conversationId) => {
    const response = await apiClient.get(`/api/messages/${conversationId}`);
    return response.data;
};

/**
 * Gửi một tin nhắn mới.
 * @param {string} conversationId - ID của cuộc trò chuyện.
 * @param {string} content - Nội dung tin nhắn.
 * @returns {Promise<Object>} Tin nhắn vừa được tạo.
 */
export const sendMessageAPI = async (conversationId, content) => {
    const payload = {
        conversation_id: conversationId,
        content: content,
    };
    const response = await apiClient.post('/api/messages/', payload);
    return response.data;
};
