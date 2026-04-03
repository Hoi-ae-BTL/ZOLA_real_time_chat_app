import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginAPI } from '../api/auth.api';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
    const { t } = useTranslation();
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
            await loginAPI(loginIdentifier, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || "Thông tin đăng nhập không chính xác");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-[var(--app-bg)] flex items-center justify-center p-6 font-sans antialiased text-[var(--text-primary)]">
            <div className="bg-[var(--card-bg)] p-10 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] w-full max-w-[440px] border border-[var(--divider)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--accent-faint)] rounded-[20px] mb-5 shadow-inner">
                        <ShieldCheck size={32} className="text-[var(--accent)]" />
                    </div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Chào mừng trở lại</h2>
                    <p className="text-[var(--text-muted)] mt-2 font-medium">Đăng nhập ZOLA để tiếp tục trò chuyện</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-2xl flex items-center gap-3 animate-in shake">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] ml-1">Email hoặc Username</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                            <input
                                type="text"
                                value={loginIdentifier}
                                onChange={(e) => setLoginIdentifier(e.target.value)}
                                required
                                className="w-full bg-[var(--input-bg)] border border-transparent pl-12 pr-4 py-4 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)] transition-all text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]"
                                placeholder="Nhập email hoặc username"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] ml-1">Mật khẩu</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-[var(--input-bg)] border border-transparent pl-12 pr-4 py-4 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)] transition-all text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 bg-[var(--accent-strong)] hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-[0_8px_24px_var(--accent-soft)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
                        {!isLoading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[var(--divider)]">
                    <p className="text-center text-[var(--text-muted)] font-medium text-sm">
                        Thành viên mới?{' '}
                        <Link to="/register" className="text-[var(--accent)] font-bold hover:text-[var(--accent-strong)] transition-colors inline-block ml-1">
                            Tạo tài khoản ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}