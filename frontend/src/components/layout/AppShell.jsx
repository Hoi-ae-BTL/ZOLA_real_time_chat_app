import {
    ContactRound,
    HelpCircle,
    MessageSquareText,
    Settings,
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Avatar } from '../chat/ChatPrimitives';
import { useZolaApp } from '../../hooks/useZolaApp';

const primaryNavItems = [
    {
        to: '/chat',
        label: 'Messages',
        icon: MessageSquareText,
        match: '/chat',
    },
    {
        to: '/contacts',
        label: 'Contacts',
        icon: ContactRound,
        match: '/contacts',
    },
];

const utilityNavItems = [
    {
        to: '/settings',
        label: 'Settings',
        icon: Settings,
        match: '/settings',
    },
];

const getPageLabel = (pathname) => {
    const match = [...primaryNavItems, ...utilityNavItems].find((item) => pathname.startsWith(item.match));
    return match?.label || 'Zola';
};

const RailNavLink = ({ item, badge = null, mobile = false }) => {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.to}
            className={({ isActive }) =>
                `group relative flex items-center rounded-2xl text-[11px] font-semibold transition ${
                    mobile ? 'justify-center gap-2 px-3 py-3' : 'flex-col gap-1 px-2 py-3'
                } ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'}`
            }
        >
            {({ isActive }) => (
                <>
                    {isActive && !mobile && (
                        <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full bg-[var(--accent)]" />
                    )}
                    <span
                        className={`inline-flex items-center justify-center rounded-2xl ${
                            mobile ? 'h-9 w-9' : 'h-11 w-11'
                        } ${isActive ? 'bg-[var(--accent-faint)]' : ''}`}
                    >
                        <Icon size={20} />
                    </span>
                    <span>{item.label}</span>
                    {badge ? (
                        <span className="absolute right-1 top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                            {badge}
                        </span>
                    ) : null}
                </>
            )}
        </NavLink>
    );
};

export default function AppShell() {
    const location = useLocation();
    const { pendingRequestCount, profile, sidebarError, socketStatus } = useZolaApp();
    const pageLabel = getPageLabel(location.pathname);

    return (
        <div className="h-[100dvh] overflow-hidden bg-[var(--app-bg)] text-[var(--text-primary)]">
            <div className="grid h-full md:grid-cols-[96px_minmax(0,1fr)]">
                <aside className="hidden flex-col justify-between bg-[var(--sidebar-bg)] py-4 md:flex">
                    <div className="flex flex-col items-center">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-extrabold text-[var(--brand-text)]">
                            Z
                        </div>

                        <nav className="mt-4 flex w-full flex-col items-center gap-2">
                            {primaryNavItems.map((item) => (
                                <div key={item.to} className="w-full px-2">
                                    <RailNavLink
                                        item={item}
                                        badge={item.to === '/contacts' && pendingRequestCount > 0 ? pendingRequestCount : null}
                                    />
                                </div>
                            ))}
                        </nav>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        {utilityNavItems.map((item) => (
                            <div key={item.to} className="w-full px-2">
                                <RailNavLink item={item} />
                            </div>
                        ))}

                        <button
                            type="button"
                            title="Help"
                            className="group relative flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold text-[var(--text-dim)] transition hover:text-[var(--text-primary)]"
                        >
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl">
                                <HelpCircle size={20} />
                            </span>
                            <span>Help</span>
                        </button>

                        <div className="relative mt-2">
                            <Avatar
                                name={profile?.display_name || 'Zola'}
                                src={profile?.avatar_url}
                                size="sm"
                                status={socketStatus === 'open'}
                            />
                        </div>
                    </div>
                </aside>

                <div className="min-h-0 min-w-0 overflow-hidden">
                    <div className="flex h-full min-h-0 flex-col">
                        <header className="bg-[var(--header-bg)] px-4 py-4 md:hidden">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-extrabold tracking-[0.14em] text-[var(--brand-text)]">
                                        ZOLA
                                    </p>
                                    <h1 className="mt-1 text-lg font-bold">{pageLabel}</h1>
                                </div>
                                <Avatar
                                    name={profile?.display_name || 'Zola'}
                                    src={profile?.avatar_url}
                                    size="sm"
                                    status={socketStatus === 'open'}
                                />
                            </div>
                        </header>

                        <div className="min-h-0 flex-1 overflow-hidden">
                            <Outlet />
                        </div>

                        <nav className="grid grid-cols-3 gap-2 bg-[var(--header-bg)] px-3 py-3 md:hidden">
                            <RailNavLink item={primaryNavItems[0]} mobile />
                            <RailNavLink
                                item={primaryNavItems[1]}
                                badge={pendingRequestCount > 0 ? pendingRequestCount : null}
                                mobile
                            />
                            <RailNavLink item={utilityNavItems[0]} mobile />
                        </nav>
                    </div>
                </div>
            </div>

            {sidebarError && (
                <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 shadow-[0_12px_32px_rgba(220,38,38,0.12)] md:bottom-4">
                    {sidebarError}
                </div>
            )}
        </div>
    );
}
