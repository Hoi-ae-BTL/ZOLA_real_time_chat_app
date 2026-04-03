import {
    ChevronsLeft,
    ChevronsRight,
    LoaderCircle,
    MessageSquarePlus,
    Search,
    UserPlus,
    UsersRound,
} from 'lucide-react';
import { Avatar, StackedAvatars, ThemeSwitch } from './ChatPrimitives';
import {
    formatSidebarTime,
    getConversationName,
    getConversationSubtitle,
} from './chatUtils';
import { useTranslation } from 'react-i18next';

const ToolbarButton = ({ badge, children, collapsed, compact = false, label, onClick, title }) => (
    <button
        type="button"
        onClick={onClick}
        title={title || label}
        className={`relative inline-flex rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-dim)] transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-strong)] ${
            collapsed || compact
                ? 'h-11 w-11 items-center justify-center'
                : 'h-11 flex-1 items-center gap-2 px-3'
        }`}
    >
        {children}
        {!collapsed && !compact && <span className="truncate text-sm font-semibold">{label}</span>}
        {badge > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {badge}
            </span>
        )}
    </button>
);

const ConversationRow = ({
    active,
    collapsed,
    label,
    meta,
    preview,
    leading,
    onClick,
    title,
}) => {
    if (collapsed) {
        return (
            <button
                type="button"
                onClick={onClick}
                title={title}
                className={`flex w-full justify-center rounded-2xl border p-2.5 transition ${
                    active
                        ? 'border-[var(--accent)] bg-[var(--active-card)] shadow-[var(--active-shadow)]'
                        : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--accent-soft)]'
                }`}
            >
                {leading}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                active
                    ? 'border-[var(--accent)] bg-[var(--active-card)] shadow-[var(--active-shadow)]'
                    : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--accent-soft)]'
            }`}
        >
            <div className="flex items-start gap-3">
                {leading}
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-[var(--text-primary)]">{label}</h3>
                            {meta && <p className="mt-0.5 text-xs text-[var(--text-dim)]">{meta}</p>}
                        </div>
                        <span className="shrink-0 text-[11px] font-medium text-[var(--text-dim)]">{preview.time}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-[var(--text-muted)]">{preview.text}</p>
                </div>
            </div>
        </button>
    );
};

export default function ChatSidebar({
    activeConversationId,
    bootstrapLoading,
    currentUserId,
    friends,
    getDirectConversationForFriend,
    groupConversations,
    isMobileSidebarOpen,
    onCreateChat,
    onCreateGroup,
    onOpenFriendHub,
    onOpenProfile,
    onSearchChange,
    onSelectConversation,
    onStartDirectChat,
    onToggleCollapse,
    onlineUserIds,
    pendingRequestCount,
    profile,
    searchTerm,
    sidebarCollapsed,
    socketStatus,
    theme,
    toggleTheme,
}) {
    const { t } = useTranslation();
    const hasGroups = groupConversations.length > 0;
    const hasFriends = friends.length > 0;

    return (
        <aside
            className={`soft-scroll border-r border-[var(--divider)] bg-[var(--sidebar-bg)] ${
                isMobileSidebarOpen ? 'flex flex-col' : 'hidden'
            } xl:flex`}
        >
            <div className={`${sidebarCollapsed ? 'px-3 py-4' : 'px-4 py-4'} border-b border-[var(--divider)]`}>
                <div className={`flex ${sidebarCollapsed ? 'flex-col items-center gap-3' : 'items-start justify-between gap-4'}`}>
                    <div className={`${sidebarCollapsed ? 'text-center' : 'min-w-0 flex-1'}`}>
                        <p className={`${sidebarCollapsed ? 'text-[1.45rem]' : 'text-[1.7rem]'} font-black tracking-[0.02em] text-[var(--brand-text)]`}>
                            ZoLa
                        </p>
                        {!sidebarCollapsed && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-dim)]">
                                <span className={`h-2 w-2 rounded-full ${socketStatus === 'open' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                <span>{socketStatus === 'open' ? t('connected') : t('syncing')}</span>
                            </div>
                        )}
                    </div>

                    <div className={`flex ${sidebarCollapsed ? 'flex-col' : 'items-center'} gap-2`}>
                        {!sidebarCollapsed && <ThemeSwitch theme={theme} onToggle={toggleTheme} />}
                        <ToolbarButton
                            compact
                            collapsed={sidebarCollapsed}
                            label={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                            onClick={onToggleCollapse}
                        >
                            {sidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
                        </ToolbarButton>
                    </div>
                </div>

                <div className={`mt-4 ${sidebarCollapsed ? 'flex flex-col items-center gap-2' : 'grid grid-cols-3 gap-2'}`}>
                    {sidebarCollapsed && <ThemeSwitch theme={theme} onToggle={toggleTheme} compact />}
                    <ToolbarButton
                        badge={0}
                        collapsed={sidebarCollapsed}
                        label={t('newGroup')}
                        onClick={onCreateChat}
                        title={t('newMessage')}
                    >
                        <MessageSquarePlus size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        badge={0}
                        collapsed={sidebarCollapsed}
                        label="Nhóm"
                        onClick={onCreateGroup}
                        title={t('newGroup')}
                    >
                        <UsersRound size={18} />
                    </ToolbarButton>
                    <ToolbarButton
                        badge={pendingRequestCount}
                        collapsed={sidebarCollapsed}
                        label={t('contacts')}
                        onClick={onOpenFriendHub}
                        title={t('contacts')}
                    >
                        <UserPlus size={18} />
                    </ToolbarButton>
                </div>

                {!sidebarCollapsed && (
                    <div className="relative mt-4">
                        <Search
                            size={17}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
                        />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={onSearchChange}
                            placeholder={t('search')}
                            className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-dim)] focus:border-[var(--accent-soft)] focus:ring-4 focus:ring-[var(--ring)]"
                        />
                    </div>
                )}
            </div>

            <div className={`soft-scroll flex-1 overflow-y-auto ${sidebarCollapsed ? 'px-3' : 'px-4'} py-4`}>
                <section>
                    {!sidebarCollapsed && (
                        <div className="mb-3 flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--section-title)]">
                                {t('all')}
                            </h2>
                            <span className="text-xs font-medium text-[var(--text-dim)]">{groupConversations.length}</span>
                        </div>
                    )}

                    <div className="space-y-2.5">
                        {bootstrapLoading ? (
                            <div className="flex items-center justify-center py-10 text-[var(--text-muted)]">
                                <LoaderCircle size={22} className="animate-spin" />
                            </div>
                        ) : !hasGroups ? (
                            !sidebarCollapsed && (
                                <div className="rounded-2xl border border-dashed border-[var(--divider)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                                    Chưa có nhóm chat nào.
                                </div>
                            )
                        ) : (
                            groupConversations.map((conversation) => (
                                <ConversationRow
                                    key={conversation.id}
                                    active={activeConversationId === conversation.id}
                                    collapsed={sidebarCollapsed}
                                    label={getConversationName(conversation, currentUserId)}
                                    meta={`${conversation.participants?.length || 0} thành viên`}
                                    preview={{
                                        text: getConversationSubtitle(conversation),
                                        time: formatSidebarTime(
                                            conversation.last_message_created_at || conversation.updated_at,
                                        ),
                                    }}
                                    leading={<StackedAvatars participants={conversation.participants} size="sm" />}
                                    onClick={() => onSelectConversation(conversation.id)}
                                    title={getConversationName(conversation, currentUserId)}
                                />
                            ))
                        )}
                    </div>
                </section>

                <section className={sidebarCollapsed ? 'mt-4' : 'mt-7'}>
                    {!sidebarCollapsed && (
                        <div className="mb-3 flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--section-title)]">
                                {t('contacts')}
                            </h2>
                            <span className="text-xs font-medium text-[var(--text-dim)]">{friends.length}</span>
                        </div>
                    )}

                    <div className="space-y-2.5">
                        {!hasFriends ? (
                            !sidebarCollapsed && (
                                <div className="rounded-2xl border border-dashed border-[var(--divider)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                                    Chưa có bạn bè nào.
                                </div>
                            )
                        ) : (
                            friends.map((friend) => {
                                const directConversation = getDirectConversationForFriend(friend.id);
                                const isOnline = onlineUserIds.includes(friend.id);

                                return (
                                    <ConversationRow
                                        key={friend.id}
                                        active={directConversation?.id === activeConversationId}
                                        collapsed={sidebarCollapsed}
                                        label={friend.display_name}
                                        meta={`@${friend.username}`}
                                        preview={{
                                            text: directConversation
                                                ? getConversationSubtitle(directConversation)
                                                : isOnline
                                                  ? t('online')
                                                  : t('offline'),
                                            time: formatSidebarTime(
                                                directConversation?.last_message_created_at,
                                            ),
                                        }}
                                        leading={
                                            <Avatar
                                                name={friend.display_name}
                                                src={friend.avatar_url}
                                                size="sm"
                                                status={isOnline}
                                            />
                                        }
                                        onClick={() =>
                                            directConversation
                                                ? onSelectConversation(directConversation.id)
                                                : onStartDirectChat(friend.id)
                                        }
                                        title={friend.display_name}
                                    />
                                );
                            })
                        )}
                    </div>
                </section>
            </div>

            <div className={`${sidebarCollapsed ? 'px-3 pb-4' : 'px-4 pb-4'} border-t border-[var(--divider)] pt-3`}>
                <button
                    type="button"
                    onClick={onOpenProfile}
                    title={profile?.display_name || 'Hồ sơ'}
                    className={`w-full rounded-2xl bg-[var(--profile-bg)] transition hover:bg-[var(--profile-bg-hover)] ${
                        sidebarCollapsed
                            ? 'flex justify-center px-2 py-3'
                            : 'flex items-center gap-3 px-3 py-3 text-left'
                    }`}
                >
                    <Avatar
                        name={profile?.display_name || 'ZoLa'}
                        src={profile?.avatar_url}
                        size="sm"
                    />
                    {!sidebarCollapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                                {profile?.display_name || 'Đang tải hồ sơ'}
                            </p>
                            <p className="truncate text-xs text-[var(--text-dim)]">
                                {profile?.username ? `@${profile.username}` : 'Đồng bộ hồ sơ...'}
                            </p>
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
}
