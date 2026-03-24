import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAPI } from '../api/auth.api';
import { User, Mail, Lock, AtSign, CheckCircle, Sparkles } from 'lucide-react';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp!");
            return;
        }

        setIsLoading(true);
        try {
            await registerAPI(email, username, displayName, password);
            setSuccessMsg("Tuyệt vời! Tài khoản của bạn đã sẵn sàng.");
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || "Vui lòng kiểm tra lại các trường thông tin");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans antialiased">
            <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 w-full max-w-[480px] border border-slate-100">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-4 text-emerald-600">
                        <Sparkles size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gia nhập ZOLA</h2>
                    <p className="text-slate-400 mt-2 font-medium">Bắt đầu những cuộc trò chuyện thú vị</p>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 font-medium flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>{error}</div>}
                {successMsg && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-sm rounded-2xl border border-emerald-100 font-medium flex items-center gap-2"><CheckCircle size={18}/>{successMsg}</div>}

                <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm" placeholder="email@zola.com" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Username</label>
                        <div className="relative group">
                            <AtSign className="absolute left-4 top-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm" placeholder="the_dev" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Tên hiển thị</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm" placeholder="Thế Nguyễn" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Mật khẩu</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm" placeholder="••••••••" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Xác nhận mật khẩu</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm" placeholder="••••••••" />
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading} className="md:col-span-2 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] disabled:bg-emerald-300">
                        {isLoading ? 'Đang khởi tạo...' : 'Tạo tài khoản ngay'}
                    </button>
                </form>

                <p className="text-center mt-8 text-slate-500 font-medium">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="text-emerald-600 font-bold hover:underline">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}