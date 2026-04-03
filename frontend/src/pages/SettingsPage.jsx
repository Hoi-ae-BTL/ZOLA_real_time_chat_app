import { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Bell,
    Globe,
    Lock,
    Palette,
    QrCode,
    Search,
    ShieldCheck,
    UserRound,
    Camera,
    LoaderCircle
} from 'lucide-react';
import { logoutAPI, uploadAvatarAPI } from '../api/auth.api';
import { Avatar } from '../components/chat/ChatPrimitives';
import { useZolaApp } from '../hooks/useZolaApp';

const ThemePreview = ({ title, active, preview, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-[24px] p-3 text-left transition ${
            active
                ? 'bg-[var(--card-bg)] shadow-[0_12px_32px_rgba(0,82,204,0.08)] ring-2 ring-[var(--accent-soft)]'
                : 'bg-[var(--input-bg)] hover:bg-[var(--profile-bg-hover)]'
        }`}
    >
        <div className={`rounded-[18px] p-3 ${preview}`}>
            <div className="space-y-2">
                <div className="h-2 w-18 rounded-full bg-white/80" />
                <div className="h-2 w-12 rounded-full bg-white/60" />
            </div>
            <div className="mt-5 grid grid-cols-[1fr_72px] gap-3">
                <div className="rounded-[14px] bg-white/80 p-3">
                    <div className="h-2 w-full rounded-full bg-slate-100" />
                    <div className="mt-3 ml-auto h-2 w-10 rounded-full bg-slate-200" />
                </div>
                <div className="rounded-[14px] bg-white/70 p-3">
                    <div className="h-full rounded-[10px] bg-white/70" />
                </div>
            </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
            <span className={`inline-flex h-4 w-4 rounded-full ${active ? 'bg-[var(--accent-strong)]' : 'shadow-[inset_0_0_0_1px_var(--ghost-border)]'}`} />
        </div>
    </button>
);

export default function SettingsPage() {
    const { t, i18n } = useTranslation();
    const [activeMenu, setActiveMenu] = useState('security');
    const avatarInputRef = useRef(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    
    const {
        conversations,
        friends,
        onlineUserIds,
        profile,
        setProfile,
        setTheme,
        socketStatus,
        theme,
    } = useZolaApp();

    const handleAvatarSelected = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        try {
            setIsUploadingAvatar(true);
            const updatedUser = await uploadAvatarAPI(file);
            if (setProfile) {
                setProfile(updatedUser);
            }
        } catch (error) {
            console.error('Lỗi upload avatar:', error);
            alert('Không thể cập nhật ảnh đại diện');
        } finally {
            setIsUploadingAvatar(false);
            if (avatarInputRef.current) {
                avatarInputRef.current.value = '';
            }
        }
    };

    const menuItems = [
        { id: 'security', label: t('security'), icon: UserRound },
        { id: 'privacy', label: t('privacy'), icon: Lock },
        { id: 'notifications', label: t('notifications'), icon: Bell },
        { id: 'theme', label: t('theme'), icon: Palette },
        { id: 'language', label: t('language'), icon: Globe },
    ];

    const securityCards = [
        {
            icon: Search,
            title: t('lastSeen'),
            value: t('lastSeenValue'),
            tone: 'bg-sky-50 text-sky-600',
        },
        {
            icon: ShieldCheck,
            title: t('e2e'),
            value: t('e2eValue'),
            tone: 'bg-indigo-50 text-indigo-600',
        },
        {
            icon: QrCode,
            title: t('twoFactor'),
            value: t('twoFactorValue'),
            tone: 'bg-amber-50 text-amber-600',
        },
        {
            icon: Lock,
            title: t('blockList'),
            value: t('blockListValue'),
            tone: 'bg-rose-50 text-rose-600',
        },
    ];

    const storageMetrics = useMemo(() => {
        const photos = Math.max(0.8, Number((friends.length * 0.08).toFixed(1)));
        const videos = Math.max(0.5, Number((conversations.length * 0.06).toFixed(1)));
        const docs = Math.max(0.3, Number(((friends.length + conversations.length) * 0.02).toFixed(1)));
        const others = 0.5;
        const total = Number((photos + videos + docs + others).toFixed(1));

        return { docs, others, photos, total, videos };
    }, [conversations.length, friends.length]);

    const segments = useMemo(() => {
        const total = storageMetrics.total || 1;
        return [
            { label: `${t('photos')} (${storageMetrics.photos} GB)`, width: `${(storageMetrics.photos / total) * 100}%`, color: 'bg-[var(--accent-strong)]' },
            { label: `${t('videos')} (${storageMetrics.videos} GB)`, width: `${(storageMetrics.videos / total) * 100}%`, color: 'bg-blue-400' },
            { label: `${t('documents')} (${storageMetrics.docs} GB)`, width: `${(storageMetrics.docs / total) * 100}%`, color: 'bg-amber-500' },
            { label: `${t('otherApps')} (${storageMetrics.others} GB)`, width: `${(storageMetrics.others / total) * 100}%`, color: 'bg-slate-300' },
        ];
    }, [storageMetrics, t]);

    return (
        <div className="soft-scroll h-full overflow-y-auto bg-[var(--app-bg)] px-4 py-4 md:px-5 md:py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <p className="text-2xl font-extrabold tracking-[-0.03em] text-[var(--brand-text)]">
                        Zola Chat
                    </p>
                    <div className="relative hidden w-[220px] md:block">
                        <Search
                            size={16}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
                        />
                        <input
                            type="text"
                            placeholder={t('search')}
                            className="w-full rounded-full bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none shadow-[inset_0_0_0_1px_var(--input-border)] focus:bg-[var(--card-bg)] focus:shadow-[inset_0_0_0_1px_var(--accent-soft)]"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[var(--text-dim)]">
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--input-bg)]">
                        <UserRound size={18} />
                    </button>
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--input-bg)]">
                        <Bell size={18} />
                    </button>
                </div>
            </div>

            <div className="mt-8 flex items-end justify-between">
                <h1 className="text-[2.1rem] font-extrabold tracking-[-0.04em] text-[var(--text-primary)]">
                    {t('settings')}
                </h1>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-5">
                    <section className="rounded-[28px] bg-[var(--card-bg)] p-5 shadow-[0_12px_32px_rgba(0,82,204,0.04)]">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-faint)] text-[var(--accent)]"
                            >
                                <Palette size={16} />
                            </button>
                        </div>

                        <div className="mt-1 flex flex-col items-center text-center">
                            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                <Avatar
                                    name={profile?.display_name || 'Zola'}
                                    src={profile?.avatar_url}
                                    size="lg"
                                />
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isUploadingAvatar ? <LoaderCircle size={24} className="text-white animate-spin" /> : <Camera size={24} className="text-white" />}
                                </div>
                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarSelected}
                                />
                            </div>
                            <h2 className="mt-4 text-[1.8rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                                {profile?.display_name || 'User Name'}
                            </h2>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">
                                {profile?.email || profile?.username || 'user@email.com'}
                            </p>
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button
                                type="button"
                                className="flex-1 rounded-2xl bg-[var(--input-bg)] py-3 text-sm font-semibold text-[var(--text-primary)]"
                            >
                                {t('qrCode')}
                            </button>
                            <button
                                type="button"
                                className="flex-1 rounded-2xl bg-[var(--accent-strong)] px-3 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,104,255,0.16)] text-center leading-tight"
                            >
                                {t('manageAccount')}
                            </button>
                        </div>
                    </section>

                    <section className="rounded-[28px] bg-[var(--card-bg)] p-3 shadow-[0_12px_32px_rgba(0,82,204,0.04)]">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = activeMenu === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveMenu(item.id)}
                                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                                        active
                                            ? 'bg-[var(--accent-faint)] text-[var(--accent)]'
                                            : 'text-[var(--text-muted)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span className="text-sm font-semibold">{item.label}</span>
                                </button>
                            );
                        })}
                    </section>

                    <button
                        type="button"
                        onClick={() => logoutAPI()}
                        className="w-full rounded-[24px] bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
                    >
                        {t('signOut')}
                    </button>
                </div>

                <div className="space-y-5">
                    
                    {/* LANGUAGE COMPONENT */}
                    {activeMenu === 'language' && (
                        <section className="rounded-[28px] bg-[var(--card-bg)] p-6 shadow-[0_12px_32px_rgba(0,82,204,0.04)] animate-in fade-in slide-in-from-bottom-2">
                            <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[var(--text-primary)] mb-6">
                                {t('language')}
                            </h2>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => i18n.changeLanguage('vi')}
                                    className={`flex items-center justify-between rounded-2xl p-4 transition ${i18n.language === 'vi' ? 'bg-[var(--accent-faint)] text-[var(--accent)] ring-1 ring-[var(--accent)]' : 'bg-[var(--input-bg)] text-[var(--text-primary)] hover:bg-[var(--profile-bg-hover)]'}`}
                                >
                                    <span className="font-semibold">{t('vietnamese')}</span>
                                    {i18n.language === 'vi' && <span>✓</span>}
                                </button>
                                <button 
                                    onClick={() => i18n.changeLanguage('en')}
                                    className={`flex items-center justify-between rounded-2xl p-4 transition ${i18n.language === 'en' ? 'bg-[var(--accent-faint)] text-[var(--accent)] ring-1 ring-[var(--accent)]' : 'bg-[var(--input-bg)] text-[var(--text-primary)] hover:bg-[var(--profile-bg-hover)]'}`}
                                >
                                    <span className="font-semibold">{t('english')}</span>
                                    {i18n.language === 'en' && <span>✓</span>}
                                </button>
                            </div>
                        </section>
                    )}

                    {/* THEME COMPONENT */}
                    {activeMenu === 'theme' && (
                    <section className="rounded-[28px] bg-[var(--card-bg)] p-6 shadow-[0_12px_32px_rgba(0,82,204,0.04)] animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                                    {t('appearance')}
                                </h2>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">
                                    {t('appearanceDesc')}
                                </p>
                            </div>
                            <div className="rounded-full bg-[var(--input-bg)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)]">
                                {socketStatus === 'open' ? t('connected') : t('syncing')}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-3">
                            <ThemePreview
                                title={t('light')}
                                active={theme === 'light'}
                                onClick={() => setTheme('light')}
                                preview="bg-[linear-gradient(180deg,#f9fbff_0%,#edf4ff_100%)]"
                            />
                            <ThemePreview
                                title={t('dark')}
                                active={theme === 'dark'}
                                onClick={() => setTheme('dark')}
                                preview="bg-[linear-gradient(180deg,#1a2230_0%,#111827_100%)] text-white"
                            />
                            <ThemePreview
                                title={t('system')}
                                active={false}
                                onClick={() => {}}
                                preview="bg-[linear-gradient(90deg,#f9fbff_0%,#f9fbff_50%,#111827_50%,#111827_100%)]"
                            />
                        </div>
                    </section>
                    )}

                    {/* SECURITY & PRIVACY */}
                    {(activeMenu === 'security' || activeMenu === 'privacy') && (
                    <section className="rounded-[28px] bg-[var(--card-bg)] p-6 shadow-[0_12px_32px_rgba(0,82,204,0.04)] animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                                {t('privacyAndSecurity')}
                            </h2>
                            <button type="button" className="text-sm font-semibold text-[var(--accent)]">
                                {t('viewFullPolicy')}
                            </button>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {securityCards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <button
                                        key={card.title}
                                        type="button"
                                        className="flex items-center justify-between gap-4 rounded-[24px] bg-[var(--input-bg)] px-4 py-4 text-left transition hover:bg-[var(--profile-bg-hover)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${card.tone}`}>
                                                <Icon size={18} />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                    {card.title}
                                                </p>
                                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                    {card.value}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[var(--text-dim)]">›</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                    )}

                    {/* STORAGE & DATA */}
                    {(activeMenu === 'security' || activeMenu === 'privacy' || activeMenu === 'notifications') && (
                    <section className="rounded-[28px] bg-[var(--card-bg)] p-6 shadow-[0_12px_32px_rgba(0,82,204,0.04)] animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                                    {t('storageAndData')}
                                </h2>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">
                                    {t('storageDesc')}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-extrabold tracking-[-0.04em] text-[var(--accent)]">
                                    {storageMetrics.total} GB
                                </p>
                                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-dim)]">
                                    {t('used')}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-[var(--input-bg)]">
                            {segments.map((segment) => (
                                <div
                                    key={segment.label}
                                    className={segment.color}
                                    style={{ width: segment.width }}
                                />
                            ))}
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {segments.map((segment) => (
                                <div key={segment.label} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                    <span className={`h-2.5 w-2.5 rounded-full ${segment.color}`} />
                                    <span>{segment.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            <div className="rounded-[24px] bg-[var(--input-bg)] px-4 py-4">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{t('friendsSynced')}</p>
                                <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{friends.length}</p>
                            </div>
                            <div className="rounded-[24px] bg-[var(--input-bg)] px-4 py-4">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{t('chatsStored')}</p>
                                <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{conversations.length}</p>
                            </div>
                            <div className="rounded-[24px] bg-[var(--input-bg)] px-4 py-4">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{t('onlineContacts')}</p>
                                <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{onlineUserIds.length}</p>
                            </div>
                        </div>
                    </section>
                    )}

                </div>
            </div>
        </div>
    );
}
