import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAPI } from '../api/auth.api';
import { User, Mail, Lock, AtSign, CheckCircle, ArrowRight } from 'lucide-react';

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
        <div className="min-h-[100dvh] bg-[var(--app-bg)] flex font-sans antialiased text-[var(--text-primary)]">
            {/* Left side: Branding Panel */}
            <div className="hidden lg:flex flex-col justify-center w-[40%] max-w-[460px] bg-gradient-to-br from-[#0068ff] to-[#0047b3] p-10 text-white relative overflow-hidden shadow-xl z-10">
                <div className="relative z-10">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                        <span className="text-3xl font-black text-white tracking-tighter drop-shadow-sm">Z</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight leading-[1.15] mb-4">
                        Kết nối.<br/>
                        Trò chuyện.<br/>
                        <span className="text-blue-200">Gần nhau hơn.</span>
                    </h1>
                    <p className="text-blue-100 text-[15px] font-medium leading-relaxed max-w-sm">
                        Tham gia ZOLA ngay hôm nay để trải nghiệm tính năng nhắn tin cực nhanh và mượt mà.
                    </p>
                </div>

                {/* Simplified Graphics without Heavy Blurs */}
                <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-white opacity-[0.02] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-blue-300 opacity-[0.05] rounded-full pointer-events-none"></div>
            </div>

            {/* Right side: Registration Form */}
            <div className="flex-1 flex flex-col justify-center overflow-y-auto p-4 sm:p-8 lg:p-10">
                <div className="m-auto w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-6">
                        <div className="inline-flex items-center justify-center mb-3 relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#0068ff] to-[#0047b3] rounded-2xl shadow-[0_8px_20px_rgba(0,104,255,0.25)] flex items-center justify-center relative">
                                <span className="text-3xl font-black text-white tracking-tighter">Z</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Tạo tài khoản</h2>
                    </div>

                    <div className="hidden lg:block mb-6">
                        <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Đăng ký thành viên</h2>
                        <p className="text-[var(--text-muted)] text-[13px] mt-1 font-medium">Nhập thông tin bên dưới để bắt đầu</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 text-red-600 text-sm rounded-xl border border-red-500/20 font-medium flex items-start gap-2 animate-in shake">
                            <span className="w-1.5 h-1.5 mt-1.5 bg-red-600 rounded-full shrink-0"></span>
                            <span className="leading-snug">{error}</span>
                        </div>
                    )}
                    
                    {successMsg && (
                        <div className="mb-6 p-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-sm rounded-xl border font-medium flex items-center gap-2 animate-in slip-in-from-top-2">
                            <CheckCircle size={18} className="shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">Địa chỉ Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[var(--input-bg)] border border-transparent pl-10 pr-4 py-3 rounded-xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-[13px] font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]" placeholder="name@example.com" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">Username</label>
                                <div className="relative group">
                                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-[var(--input-bg)] border border-transparent pl-10 pr-4 py-3 rounded-xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-[13px] font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]" placeholder="zola_user" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">Tên hiển thị</label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="w-full bg-[var(--input-bg)] border border-transparent pl-10 pr-4 py-3 rounded-xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-[13px] font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]" placeholder="Trần Văn A" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">Mật khẩu</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-[var(--input-bg)] border border-transparent pl-10 pr-4 py-3 rounded-xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-[13px] font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]" placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">Xác nhận MK</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-[var(--input-bg)] border border-transparent pl-10 pr-4 py-3 rounded-xl outline-none focus:bg-[var(--card-bg)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-[13px] font-medium text-[var(--text-primary)] placeholder-[var(--text-dim)]" placeholder="••••••••" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full mt-4 bg-[var(--accent-strong)] hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_var(--accent-soft)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Đang khởi tạo...' : 'Tạo tài khoản'}
                            {!isLoading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-[var(--divider)]">
                        <p className="text-center text-[var(--text-primary)] font-medium text-[13px]">
                            Đã có tài khoản?{' '}
                            <Link to="/login" className="text-[var(--accent)] font-bold hover:text-[var(--accent-strong)] transition-colors inline-block ml-1">
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}