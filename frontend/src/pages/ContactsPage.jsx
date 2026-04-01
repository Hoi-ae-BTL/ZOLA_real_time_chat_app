import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, UserPlus, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchUsersAPI } from '../api/friends.api';
import { CreateConversationModal } from '../components/chat/ChatOverlays';
import { Avatar } from '../components/chat/ChatPrimitives';
import { useZolaApp } from '../hooks/useZolaApp';

const ContactNavButton = ({ active = false, icon: Icon, label, meta, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${
            active
                ? 'bg-[var(--card-bg)] text-[var(--accent)] shadow-[0_12px_32px_rgba(0,82,204,0.06)]'
                : 'text-[var(--text-muted)] hover:bg-white/70 hover:text-[var(--text-primary)]'
        }`}
    >
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${active ? 'bg-[var(--accent-faint)]' : 'bg-white/60'}`}>
            <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{label}</p>
        </div>
        {meta ? (
            <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                {meta}
            </span>
        ) : null}
    </button>
);

const MiniActionButton = ({ children, onClick, variant = 'primary', disabled = false }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            variant === 'primary'
                ? 'bg-[var(--accent-strong)] text-white shadow-[0_10px_24px_rgba(0,104,255,0.16)] hover:brightness-105'
                : 'bg-[var(--input-bg)] text-[var(--text-primary)] hover:bg-[var(--profile-bg-hover)]'
        }`}
    >
        {children}
    </button>
);

export default function ContactsPage() {
    const navigate = useNavigate();
    const {
        acceptFriendRequest,
        createConversation,
        declineFriendRequest,
        directConversationMap,
        friendActionLoadingMap,
        friends,
        incomingRequests,
        isCreateBusy,
        onlineUserIds,
        outgoingRequests,
        pendingRequestCount,
        profile,
        sendFriendRequest,
        startDirectChat,
    } = useZolaApp();

    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [discoverTerm, setDiscoverTerm] = useState('');
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedFriendIds, setSelectedFriendIds] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [createError, setCreateError] = useState('');
    const deferredDiscoverTerm = useDeferredValue(discoverTerm);

    const filteredFriends = useMemo(() => {
        const value = contactSearchTerm.trim().toLowerCase();
        if (!value) {
            return friends;
        }

        return friends.filter(
            (friend) =>
                friend.display_name.toLowerCase().includes(value) ||
                friend.username.toLowerCase().includes(value),
        );
    }, [contactSearchTerm, friends]);

    useEffect(() => {
        const query = deferredDiscoverTerm.trim();
        if (!query) {
            setUserSearchResults([]);
            setUserSearchLoading(false);
            return undefined;
        }

        let isCancelled = false;
        setUserSearchLoading(true);

        const runSearch = async () => {
            try {
                const results = await searchUsersAPI(query);
                if (!isCancelled) {
                    setUserSearchResults(results);
                }
            } catch (error) {
                console.error('Unable to search users:', error);
                if (!isCancelled) {
                    setUserSearchResults([]);
                }
            } finally {
                if (!isCancelled) {
                    setUserSearchLoading(false);
                }
            }
        };

        runSearch();

        return () => {
            isCancelled = true;
        };
    }, [deferredDiscoverTerm]);

    const decoratedSearchResults = userSearchResults.map((user) => {
        const isAlreadyFriend = friends.some((friend) => friend.id === user.id);
        const hasIncomingRequest = incomingRequests.some((request) => request.from_user_id === user.id);
        const hasOutgoingRequest = outgoingRequests.some((request) => request.to_user_id === user.id);
        const existingConversation = directConversationMap[user.id];

        if (isAlreadyFriend) {
            return {
                ...user,
                actionLabel: existingConversation ? 'Open chat' : 'Message',
                canSendRequest: false,
                isChatAction: true,
                statusLabel: 'Already in your contacts',
            };
        }

        if (hasIncomingRequest) {
            return {
                ...user,
                actionLabel: 'Pending',
                canSendRequest: false,
                isChatAction: false,
                statusLabel: 'This person already sent you a request',
            };
        }

        if (hasOutgoingRequest) {
            return {
                ...user,
                actionLabel: 'Sent',
                canSendRequest: false,
                isChatAction: false,
                statusLabel: 'Invitation already sent',
            };
        }

        return {
            ...user,
            actionLabel: 'Add',
            canSendRequest: true,
            isChatAction: false,
            statusLabel: 'Tap to send a friend request',
        };
    });

    const spotlightContact = incomingRequests[0]?.sender || friends[0] || profile;
    const birthdayContacts = friends.slice(0, 2);

    const handleOpenDirectChat = async (friendId) => {
        await startDirectChat(friendId);
        navigate('/chat');
    };

    const handlePrimarySearchAction = async (user) => {
        if (user.isChatAction) {
            await handleOpenDirectChat(user.id);
            return;
        }

        if (!user.canSendRequest) {
            return;
        }

        await sendFriendRequest(user);
    };

    const handleCreateGroup = async () => {
        if (!selectedFriendIds.length || isCreateBusy) {
            return;
        }

        if (!groupName.trim()) {
            setCreateError('Please enter a group name before creating the conversation.');
            return;
        }

        try {
            const conversation = await createConversation({
                friendIds: selectedFriendIds,
                forceGroupMode: true,
                groupName,
            });
            setIsCreateDialogOpen(false);
            setSelectedFriendIds([]);
            setGroupName('');
            setCreateError('');
            if (conversation) {
                navigate('/chat');
            }
        } catch (error) {
            console.error('Unable to create group conversation:', error);
            setCreateError(error.response?.data?.detail || 'Unable to create a new group chat.');
        }
    };

    return (
        <div className="soft-scroll h-full overflow-y-auto bg-[var(--app-bg)] px-4 py-4 md:px-5 md:py-5">
            <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_260px]">
                <aside className="rounded-[28px] bg-[var(--sidebar-bg)] p-4">
                    <div className="relative">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
                        />
                        <input
                            type="text"
                            value={contactSearchTerm}
                            onChange={(event) => setContactSearchTerm(event.target.value)}
                            placeholder="Search contacts"
                            className="w-full rounded-full bg-[var(--input-bg)] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none shadow-[inset_0_0_0_1px_var(--input-border)] focus:bg-[var(--card-bg)] focus:shadow-[inset_0_0_0_1px_var(--accent-soft)]"
                        />
                    </div>

                    <div className="mt-5">
                        <ContactNavButton
                            active
                            icon={UserPlus}
                            label="Friend Requests"
                            meta={pendingRequestCount}
                        />
                        <div className="mt-5">
                            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--section-title)]">
                                Categories
                            </p>
                            <div className="mt-2 space-y-1">
                                <ContactNavButton icon={UsersRound} label="Joined Groups" />
                                <ContactNavButton icon={ArrowRight} label="OA Contacts" />
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between px-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--section-title)]">
                                    All Friends
                                </p>
                                <span className="text-[11px] font-semibold text-[var(--text-dim)]">
                                    {filteredFriends.length}
                                </span>
                            </div>

                            <div className="mt-3 space-y-1">
                                {filteredFriends.length === 0 ? (
                                    <div className="rounded-2xl bg-white/70 px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                                        No contacts match your search.
                                    </div>
                                ) : (
                                    filteredFriends.map((friend) => (
                                        <button
                                            key={friend.id}
                                            type="button"
                                            onClick={() => handleOpenDirectChat(friend.id)}
                                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/70"
                                        >
                                            <Avatar
                                                name={friend.display_name}
                                                src={friend.avatar_url}
                                                size="md"
                                                status={onlineUserIds.includes(friend.id)}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                                    {friend.display_name}
                                                </p>
                                                <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                                                    {onlineUserIds.includes(friend.id) ? 'Active now' : `@${friend.username}`}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-faint)] text-[var(--accent)]">
                                <UserPlus size={20} />
                            </span>
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-[var(--text-primary)]">
                                    Friend Requests
                                </h1>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">
                                    Pending invitations ({incomingRequests.length})
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="text-sm font-semibold text-[var(--accent)]"
                        >
                            View Sent
                        </button>
                    </div>

                    <div className="mt-6">
                        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                            {incomingRequests.length === 0 ? (
                                <div className="col-span-full rounded-[28px] bg-[var(--card-bg)] px-6 py-10 text-center shadow-[0_12px_32px_rgba(0,82,204,0.04)]">
                                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                                        No pending invitations
                                    </p>
                                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                                        New friend requests from the backend will appear here.
                                    </p>
                                </div>
                            ) : (
                                incomingRequests.map((request) => (
                                    <article
                                        key={request.id}
                                        className="rounded-[28px] bg-[var(--card-bg)] p-5 shadow-[0_12px_32px_rgba(0,82,204,0.04)]"
                                    >
                                        <Avatar
                                            name={request.sender.display_name}
                                            src={request.sender.avatar_url}
                                            size="lg"
                                        />
                                        <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">
                                            {request.sender.display_name}
                                        </h2>
                                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                                            @{request.sender.username}
                                        </p>
                                        <p className="mt-3 min-h-10 text-sm leading-6 text-[var(--text-muted)]">
                                            {request.message || 'Sent you a new friend invitation on Zola.'}
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            <MiniActionButton
                                                variant="secondary"
                                                disabled={friendActionLoadingMap[request.id]}
                                                onClick={() => declineFriendRequest(request.id)}
                                            >
                                                Decline
                                            </MiniActionButton>
                                            <MiniActionButton
                                                disabled={friendActionLoadingMap[request.id]}
                                                onClick={() => acceptFriendRequest(request.id)}
                                            >
                                                Accept
                                            </MiniActionButton>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-9">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                    People You May Know
                                </h2>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">
                                    Search the backend user list and invite new contacts.
                                </p>
                            </div>

                            <div className="relative w-full max-w-[320px]">
                                <Search
                                    size={16}
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
                                />
                                <input
                                    type="text"
                                    value={discoverTerm}
                                    onChange={(event) => setDiscoverTerm(event.target.value)}
                                    placeholder="Search people"
                                    className="w-full rounded-full bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none shadow-[inset_0_0_0_1px_var(--input-border)] focus:bg-[var(--card-bg)] focus:shadow-[inset_0_0_0_1px_var(--accent-soft)]"
                                />
                            </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            {!discoverTerm.trim() ? (
                                <div className="col-span-full rounded-[28px] bg-[var(--card-bg)] px-6 py-10 text-center shadow-[0_12px_32px_rgba(0,82,204,0.04)]">
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Type a name, username, or email to load user suggestions from the backend.
                                    </p>
                                </div>
                            ) : userSearchLoading ? (
                                <div className="col-span-full rounded-[28px] bg-[var(--card-bg)] px-6 py-10 text-center text-sm text-[var(--text-muted)] shadow-[0_12px_32px_rgba(0,82,204,0.04)]">
                                    Searching users...
                                </div>
                            ) : decoratedSearchResults.length === 0 ? (
                                <div className="col-span-full rounded-[28px] bg-[var(--card-bg)] px-6 py-10 text-center text-sm text-[var(--text-muted)] shadow-[0_12px_32px_rgba(0,82,204,0.04)]">
                                    No matching users found.
                                </div>
                            ) : (
                                decoratedSearchResults.slice(0, 4).map((user) => (
                                    <article
                                        key={user.id}
                                        className="flex items-center gap-3 rounded-[24px] bg-[var(--card-bg)] px-4 py-4 shadow-[0_12px_32px_rgba(0,82,204,0.04)]"
                                    >
                                        <Avatar name={user.display_name} src={user.avatar_url} size="md" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                                {user.display_name}
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                                                {user.statusLabel}
                                            </p>
                                        </div>
                                        <MiniActionButton
                                            disabled={
                                                (!user.canSendRequest && !user.isChatAction) ||
                                                friendActionLoadingMap[user.id]
                                            }
                                            onClick={() => handlePrimarySearchAction(user)}
                                        >
                                            {friendActionLoadingMap[user.id] ? 'Working' : user.actionLabel}
                                        </MiniActionButton>
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <aside className="space-y-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--section-title)]">
                            Contact Activity
                        </p>
                    </div>

                    <div className="rounded-[28px] bg-[var(--card-bg)] p-5 shadow-[0_12px_32px_rgba(0,82,204,0.04)]">
                        <div className="flex items-center gap-3">
                            <Avatar
                                name={spotlightContact?.display_name || profile?.display_name || 'Zola'}
                                src={spotlightContact?.avatar_url || profile?.avatar_url}
                                size="md"
                            />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                    {spotlightContact?.display_name || 'Your contact'}
                                </p>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Changed profile picture recently
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-center rounded-[24px] bg-[var(--input-bg)] p-6">
                            <Avatar
                                name={spotlightContact?.display_name || 'Zola'}
                                src={spotlightContact?.avatar_url}
                                size="lg"
                            />
                        </div>
                    </div>

                    <div className="rounded-[28px] bg-[var(--card-bg)] p-5 shadow-[0_12px_32px_rgba(0,82,204,0.04)]">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-[var(--text-primary)]">Sent Invitations</p>
                            <span className="text-xs font-semibold text-[var(--text-dim)]">
                                {outgoingRequests.length}
                            </span>
                        </div>

                        <div className="mt-4 space-y-3">
                            {outgoingRequests.length === 0 ? (
                                <p className="rounded-2xl bg-[var(--input-bg)] px-4 py-5 text-sm text-[var(--text-muted)]">
                                    You have not sent any invitations yet.
                                </p>
                            ) : (
                                outgoingRequests.slice(0, 3).map((request) => (
                                    <div
                                        key={request.id}
                                        className="flex items-center gap-3 rounded-2xl bg-[var(--input-bg)] px-4 py-3"
                                    >
                                        <Avatar
                                            name={request.receiver.display_name}
                                            src={request.receiver.avatar_url}
                                            size="sm"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                                {request.receiver.display_name}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                Waiting for response
                                            </p>
                                        </div>
                                        <MiniActionButton
                                            variant="secondary"
                                            disabled={friendActionLoadingMap[request.id]}
                                            onClick={() => declineFriendRequest(request.id)}
                                        >
                                            Cancel
                                        </MiniActionButton>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-[28px] bg-[var(--card-bg)] p-5 shadow-[0_12px_32px_rgba(0,82,204,0.04)]">
                        <p className="text-sm font-bold text-[var(--text-primary)]">Upcoming Birthdays</p>
                        <div className="mt-4 space-y-3">
                            {birthdayContacts.length === 0 ? (
                                <p className="rounded-2xl bg-[var(--input-bg)] px-4 py-5 text-sm text-[var(--text-muted)]">
                                    Add friends to populate this widget later.
                                </p>
                            ) : (
                                birthdayContacts.map((friend, index) => (
                                    <div key={friend.id} className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                                {friend.display_name}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                @{friend.username}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium text-[var(--text-dim)]">
                                            {index === 0 ? 'Today' : 'Tomorrow'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-[28px] bg-[var(--bubble-me)] p-5 text-white shadow-[0_18px_40px_rgba(0,82,204,0.18)]">
                        <p className="text-base font-bold">Create a Group</p>
                        <p className="mt-2 text-sm leading-6 text-white/80">
                            Communicate easily with friends and family in a shared space.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setCreateError('');
                                setSelectedFriendIds([]);
                                setGroupName('');
                                setIsCreateDialogOpen(true);
                            }}
                            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-white/16 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm"
                        >
                            Start Now
                        </button>
                    </div>
                </aside>
            </div>

            <button
                type="button"
                onClick={() => {
                    setCreateError('');
                    setSelectedFriendIds([]);
                    setGroupName('');
                    setIsCreateDialogOpen(true);
                }}
                className="fixed bottom-6 right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-strong)] text-white shadow-[0_18px_36px_rgba(0,104,255,0.22)]"
            >
                <UsersRound size={22} />
            </button>

            <CreateConversationModal
                createError={createError}
                friends={friends}
                forceGroupMode
                groupName={groupName}
                isCreateBusy={isCreateBusy}
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onCreateConversation={handleCreateGroup}
                onGroupNameChange={(event) => setGroupName(event.target.value)}
                onToggleFriend={(friendId) =>
                    setSelectedFriendIds((previous) =>
                        previous.includes(friendId)
                            ? previous.filter((value) => value !== friendId)
                            : [...previous, friendId],
                    )
                }
                onlineUserIds={onlineUserIds}
                selectedFriendIds={selectedFriendIds}
            />
        </div>
    );
}
