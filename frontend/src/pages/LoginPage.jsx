import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginAPI } from '../api/auth.api';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        // Chỉ cần gọi và chờ, không cần gán vào biến nào cả
        await loginAPI(loginIdentifier, password);
        // Nếu dòng trên không ném lỗi, nghĩa là đã thành công -> chuyển trang
        navigate('/');
    } catch (err) {
        // loginAPI đã tự xóa token, ở đây chỉ cần hiển thị lỗi
        setError(err.response?.data?.detail || "Thông tin đăng nhập không chính xác");
    } finally {
        setIsLoading(false);
    }
};

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans antialiased">
            <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 w-full max-w-[440px] border border-slate-100">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4">
                        <ShieldCheck size={32} className="text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Chào mừng trở lại</h2>
                    <p className="text-slate-400 mt-2 font-medium">Đăng nhập để kết nối với bạn bè</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Email hoặc Username</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="text"
                                value={loginIdentifier}
                                onChange={(e) => setLoginIdentifier(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-slate-700"
                                placeholder="Nhập email hoặc username"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Mật khẩu</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-slate-700"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:bg-blue-300"
                    >
                        {isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
                        {!isLoading && <ArrowRight size={20} />}
                    </button>
                </form>

                <p className="text-center mt-10 text-slate-500 font-medium">
                    Thành viên mới?{' '}
                    <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                        Tạo tài khoản
                    </Link>
                </p>
            </div>
        </div>
    );
}