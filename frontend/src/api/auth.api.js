import apiClient from './apiClient';

/**
 * Hàm gọi API Đăng nhập
 * LƯU Ý: FastAPI OAuth2 yêu cầu gửi dạng URLSearchParams (Form Data), không phải JSON!
 */
export const loginAPI = async (email, password) => {
    // Ép dữ liệu thành dạng Form Data
    const formData = new URLSearchParams();
    formData.append('username', email); // FastAPI bắt buộc key này tên là 'username'
    formData.append('password', password);

    // Gửi request
    const response = await apiClient.post('/api/auth/login', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response;
};

/**
 * Hàm gọi API Đăng ký
 * Cái này thì gửi JSON bình thường theo đúng Schema UserCreate của Hưng
 */
export const registerAPI = async (email, username, display_name, password) => {
    const payload = {
        email: email,
        username: username,
        display_name: display_name,
        password: password
    };
    const response = await apiClient.post('/api/users/register', payload);
    return response;
};

/**
 * Hàm gọi API lấy thông tin Profile của chính mình (dựa vào Token)
 */
export const getMyProfileAPI = async () => {
    const response = await apiClient.get('/api/users/me');
    return response;
};