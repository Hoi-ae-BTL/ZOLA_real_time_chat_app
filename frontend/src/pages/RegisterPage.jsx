import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAPI } from '../api/auth.api';
import { User, Mail, Lock, AtSign, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';

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
        <div className="min-h-[100dvh] bg-[var(--app-bg)] flex items-center justify-center p-6 font-sans antialiased text-[var(--text-primary)]">
            <div className="bg-[var(--card-bg)] p-8 md:p-10 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] w-full max-w-[540px] border border-[var(--divider)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--accent-faint)] rounded-[20px] mb-5 shadow-inner">
                        <Sparkles size={32} className="text-[var(--accent)]" />
                    </div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Gia nhập ZOLA</h2>
                    <p className="text-[var(--text-muted)] mt-2 font-medium">Bắt đầu những cuộc trò chuyện thú vị ngay</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 text-red-500 text-sm rounded-2xl border border-red-500/20 font-medium flex items-center gap-3 animate-in shake">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                        <span>{error}</span>
                    </div>
                )}
                
                {successMsg && (
                    <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-sm rounded-2xl border font-medium flex items-center gap-3 animate-in slip-in-from-top-2">
                        <CheckCircle size={18} className="shrink-0" />
                        <span>{successMsg}</span>
                    </div>
                )}

                <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] ml-1">Địa chỉ Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[var(--input-bg)] border border-transparent pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)] transition-all text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]" placeholder="name@example.com" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] ml-1">Username</label>
                        <div className="relative group">
                            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-[var(--input-bg)] border border-transparent pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)] transition-all text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]" placeholder="zola_user" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] ml-1">Tên hiển thị</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="w-full bg-[var(--input-bg)] border border-transparent pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)] transition-all text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]" placeholder="Trần Văn A" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] ml-1">Mật khẩu</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-[var(--input-bg)] border border-transparent pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)] transition-all text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]" placeholder="••••••••" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] ml-1">Xác nhận mật khẩu</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-[var(--input-bg)] border border-transparent pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)] transition-all text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]" placeholder="••••••••" />
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading} className="md:col-span-2 mt-4 bg-[var(--accent-strong)] hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-[0_8px_24px_var(--accent-soft)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? 'Đang khởi tạo...' : 'Tạo tài khoản ngay'}
                        {!isLoading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[var(--divider)]">
                    <p className="text-center text-[var(--text-muted)] font-medium text-sm">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-[var(--accent)] font-bold hover:text-[var(--accent-strong)] transition-colors inline-block ml-1">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}