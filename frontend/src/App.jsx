import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';

function App() {
  // Logic tạm: Cứ có token trong máy là coi như đã đăng nhập
  const isAuthenticated = !!localStorage.getItem('access_token');

  return (
    <BrowserRouter>
      <Routes>
        {/* Route bảo vệ: Chưa login thì cút ra trang /login */}
        <Route
          path="/"
          element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />}
        />

        {/* Route tự do */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;