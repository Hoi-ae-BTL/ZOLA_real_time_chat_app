// src/components/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
    const isAuthenticated = !!localStorage.getItem('access_token');

    // Nếu đã đăng nhập, cho phép truy cập vào các trang con (Outlet)
    // Nếu chưa, điều hướng về trang login
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
