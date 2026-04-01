import {
    Check,
    LoaderCircle,
    LogOut,
    MessageSquarePlus,
    Search,
    UsersRound,
    X,
} from 'lucide-react';
import { Avatar, ThemeSwitch } from './ChatPrimitives';

export function CreateConversationModal({
    createError,
    friends,
    forceGroupMode = false,
    groupName,
    isCreateBusy,
    isOpen,
    onClose,
    onCreateConversation,
    onGroupNameChange,
    onToggleFriend,
    onlineUserIds,
    selectedFriendIds,
}) {
    if (!isOpen) {
        return null;
    }

    const selectedCount = selectedFriendIds.length;
    const title = forceGroupMode ? 'Create group chat' : 'Create conversation';
    const subtitle = forceGroupMode
        ? 'Choose members and set a group name to get started.'
        : 'Select one friend for a direct chat or multiple friends for a group.';

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[28px] border border-[var(--card-border)] bg-[var(--modal-bg)] p-6 text-[var(--text-primary)] shadow-[var(--shell-shadow)]">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black">{title}</h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-5 rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3">
                    <input
                        type="text"
                        value={groupName}
                        onChange={onGroupNameChange}
                        placeholder="Group name"
                        className="w-full bg-transparent text-base outline-none placeholder:text-[var(--text-dim)]"
                    />
                </div>

                <div className="soft-scroll mt-5 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                    {friends.map((friend) => {
                        const isSelected = selectedFriendIds.includes(friend.id);
                        const isOnline = onlineUserIds.includes(friend.id);

                        return (
                            <button
                                key={friend.id}
                                type="button"
                                onClick={() => onToggleFriend(friend.id)}
                                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                                    isSelected
                                        ? 'border-[var(--accent)] bg-[var(--active-card)] shadow-[var(--active-shadow)]'
                                        : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--accent-soft)]'
                                }`}
                            >
                                <Avatar
                                    name={friend.display_name}
                                    src={friend.avatar_url}
                                    size="md"
                                    status={isOnline}
                                />
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-sm font-bold">{friend.display_name}</h3>
                                    <p className="mt-0.5 text-xs text-[var(--text-dim)]">@{friend.username}</p>
                                </div>
                                <span
                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                                        isSelected
                                            ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                            : 'border-[var(--divider)] text-transparent'
                                    }`}
                                >
                                    <Check size={15} />
                                </span>
                            </button>
                        );
                    })}
                </div>

                {createError ? (
                    <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                        {createError}
                    </div>
                ) : null}

                <div className="mt-5 flex items-center justify-between gap-4">
                    <p className="text-sm text-[var(--text-muted)]">{selectedCount} selected</p>
                    <button
                        type="button"
                        onClick={onCreateConversation}
                        disabled={selectedCount === 0 || isCreateBusy}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isCreateBusy ? (
                            <LoaderCircle size={16} className="animate-spin" />
                        ) : forceGroupMode ? (
                            <UsersRound size={16} />
                        ) : (
                            <MessageSquarePlus size={16} />
                        )}
                        {forceGroupMode || selectedCount > 1 ? 'Create group' : 'Open chat'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ProfileDrawer({
    conversationsCount,
    friendsCount,
    isOpen,
    onClose,
    onLogout,
    onlineCount,
    profile,
    theme,
    toggleTheme,
}) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/45 backdrop-blur-sm">
            <button type="button" className="flex-1" onClick={onClose} aria-label="Close profile" />
            <aside className="soft-scroll h-full w-full max-w-md overflow-y-auto border-l border-[var(--card-border)] bg-[var(--modal-bg)] p-6 text-[var(--text-primary)] shadow-[var(--shell-shadow)]">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--section-title)]">
                            Your Profile
                        </p>
                        <h2 className="mt-2 text-2xl font-black">{profile?.display_name || 'User'}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-6 flex flex-col items-center rounded-[28px] bg-[var(--card-bg)] px-5 py-7 shadow-[var(--card-shadow)]">
                    <Avatar name={profile?.display_name || 'Z'} src={profile?.avatar_url} size="lg" />
                    <p className="mt-4 text-xl font-black">{profile?.display_name || 'Loading...'}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {profile?.username ? `@${profile.username}` : 'username unavailable'}
                    </p>
                    <div className="mt-5 grid w-full grid-cols-3 gap-3 text-center">
                        <div className="rounded-2xl bg-[var(--stat-bg)] px-3 py-3">
                            <p className="text-xl font-black">{friendsCount}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--text-dim)]">Friends</p>
                        </div>
                        <div className="rounded-2xl bg-[var(--stat-bg)] px-3 py-3">
                            <p className="text-xl font-black">{conversationsCount}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--text-dim)]">Chats</p>
                        </div>
                        <div className="rounded-2xl bg-[var(--stat-bg)] px-3 py-3">
                            <p className="text-xl font-black">{onlineCount}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--text-dim)]">Online</p>
                        </div>
                    </div>
                </div>

                <div className="mt-5 space-y-4">
                    <div className="rounded-[24px] bg-[var(--card-bg)] px-5 py-5 shadow-[var(--card-shadow)]">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--section-title)]">Info</p>
                        <div className="mt-4 space-y-3 text-sm">
                            <div>
                                <p className="text-[var(--text-dim)]">Email</p>
                                <p className="mt-1 font-semibold">{profile?.email || 'Not set'}</p>
                            </div>
                            <div>
                                <p className="text-[var(--text-dim)]">Phone</p>
                                <p className="mt-1 font-semibold">{profile?.phone || 'Not set'}</p>
                            </div>
                            <div>
                                <p className="text-[var(--text-dim)]">Bio</p>
                                <p className="mt-1 font-semibold">{profile?.bio || 'Not set'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[24px] bg-[var(--card-bg)] px-5 py-5 shadow-[var(--card-shadow)]">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</p>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">Applied across the full frontend.</p>
                            </div>
                            <ThemeSwitch theme={theme} onToggle={toggleTheme} />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onLogout}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-300 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>
            </aside>
        </div>
    );
}

export function FriendHubModal({
    actionLoadingMap,
    incomingRequests,
    isOpen,
    onAcceptRequest,
    onClose,
    onDeclineRequest,
    onSearchChange,
    onSendRequest,
    outgoingRequests,
    searchResults,
    searchTerm,
    userSearchLoading,
}) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl rounded-[28px] border border-[var(--card-border)] bg-[var(--modal-bg)] p-6 text-[var(--text-primary)] shadow-[var(--shell-shadow)]">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black">Manage Friends</h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Search users, send invitations, and manage pending friend requests.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                    <section className="rounded-[24px] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
                        <div className="relative">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
                            />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={onSearchChange}
                                placeholder="Search by username, email, or display name"
                                className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-dim)]"
                            />
                        </div>

                        <div className="soft-scroll mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-1">
                            {!searchTerm.trim() ? (
                                <div className="rounded-2xl border border-dashed border-[var(--divider)] px-5 py-8 text-center text-sm text-[var(--text-muted)]">
                                    Enter a keyword to search for users.
                                </div>
                            ) : userSearchLoading ? (
                                <div className="flex items-center justify-center py-10 text-[var(--text-muted)]">
                                    <LoaderCircle size={22} className="animate-spin" />
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-[var(--divider)] px-5 py-8 text-center text-sm text-[var(--text-muted)]">
                                    No matching users found.
                                </div>
                            ) : (
                                searchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3"
                                    >
                                        <Avatar name={user.display_name} src={user.avatar_url} size="md" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold">{user.display_name}</p>
                                            <p className="mt-0.5 truncate text-xs text-[var(--text-dim)]">@{user.username}</p>
                                            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{user.friendshipStatusLabel}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onSendRequest(user)}
                                            disabled={!user.canSendRequest || actionLoadingMap[user.id]}
                                            className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                                        >
                                            {actionLoadingMap[user.id] ? 'Sending' : user.actionLabel}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <div className="space-y-6">
                        <section className="rounded-[24px] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black">Incoming Requests</h3>
                                <span className="text-sm text-[var(--text-muted)]">{incomingRequests.length}</span>
                            </div>
                            <div className="soft-scroll mt-4 max-h-[200px] space-y-3 overflow-y-auto pr-1">
                                {incomingRequests.length === 0 ? (
                                    <p className="rounded-2xl border border-dashed border-[var(--divider)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                                        No new requests.
                                    </p>
                                ) : (
                                    incomingRequests.map((request) => (
                                        <div key={request.id} className="rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={request.sender.display_name} src={request.sender.avatar_url} size="sm" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold">{request.sender.display_name}</p>
                                                    <p className="truncate text-xs text-[var(--text-dim)]">@{request.sender.username}</p>
                                                </div>
                                            </div>
                                            {request.message ? (
                                                <p className="mt-3 text-sm text-[var(--text-muted)]">{request.message}</p>
                                            ) : null}
                                            <div className="mt-4 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onAcceptRequest(request.id)}
                                                    disabled={actionLoadingMap[request.id]}
                                                    className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeclineRequest(request.id)}
                                                    disabled={actionLoadingMap[request.id]}
                                                    className="rounded-full border border-[var(--divider)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] disabled:opacity-50"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className="rounded-[24px] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black">Sent Requests</h3>
                                <span className="text-sm text-[var(--text-muted)]">{outgoingRequests.length}</span>
                            </div>
                            <div className="soft-scroll mt-4 max-h-[200px] space-y-3 overflow-y-auto pr-1">
                                {outgoingRequests.length === 0 ? (
                                    <p className="rounded-2xl border border-dashed border-[var(--divider)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                                        You have not sent any requests yet.
                                    </p>
                                ) : (
                                    outgoingRequests.map((request) => (
                                        <div key={request.id} className="flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3">
                                            <Avatar name={request.receiver.display_name} src={request.receiver.avatar_url} size="sm" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold">{request.receiver.display_name}</p>
                                                <p className="truncate text-xs text-[var(--text-dim)]">@{request.receiver.username}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onDeclineRequest(request.id)}
                                                disabled={actionLoadingMap[request.id]}
                                                className="rounded-full border border-[var(--divider)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
