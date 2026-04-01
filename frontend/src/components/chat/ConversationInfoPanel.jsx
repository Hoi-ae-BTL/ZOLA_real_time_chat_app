import { useEffect, useState } from 'react';
import { Check, Info, LoaderCircle, Trash2, X } from 'lucide-react';
import { Avatar, StackedAvatars } from './ChatPrimitives';
import {
    formatClock,
    getConversationName,
    getConversationParticipantCount,
    getDirectConversationUser,
    resolveAssetUrl,
} from './chatUtils';

export default function ConversationInfoPanel({
    conversation,
    currentUserId,
    friends = [],
    isBusy = false,
    isOpen,
    messages = [],
    onAddMembers,
    onClose,
    onDeleteConversation,
    onUpdateConversation,
    onlineUserIds,
}) {
    const [draftName, setDraftName] = useState(conversation?.group_name || '');
    const [selectedIds, setSelectedIds] = useState([]);
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        setDraftName(conversation?.group_name || '');
        setSelectedIds([]);
        setActionError('');
    }, [conversation?.id, conversation?.group_name, isOpen]);

    const currentConversation = conversation || { participants: [], seen_by: [] };
    const directUser = currentConversation.type === 'direct'
        ? getDirectConversationUser(currentConversation, currentUserId)
        : null;
    const participantCount = getConversationParticipantCount(currentConversation);
    const title = currentConversation.type === 'group'
        ? getConversationName(currentConversation, currentUserId)
        : directUser?.display_name || 'Contact info';
    const subtitle = currentConversation.type === 'group'
        ? `${participantCount} members`
        : directUser?.username ? `@${directUser.username}` : '';
    const currentParticipantIds = new Set((currentConversation.participants || []).map((participant) => participant.id));
    const hasValidCreator = currentConversation.group_created_by
        && currentParticipantIds.has(currentConversation.group_created_by);
    const canManageGroup = currentConversation.type === 'group'
        && (!hasValidCreator || currentConversation.group_created_by === currentUserId);
    const availableFriends = friends.filter((friend) => !currentParticipantIds.has(friend.id));
    const attachmentMessages = messages.filter((message) => message.img_url || message.file_url);

    if (!isOpen || !conversation) {
        return null;
    }

    const toggleSelectedUser = (userId) => {
        setSelectedIds((previous) => (
            previous.includes(userId)
                ? previous.filter((item) => item !== userId)
                : [...previous, userId]
        ));
    };

    const handleSaveGroupName = async () => {
        if (!canManageGroup || !onUpdateConversation || isBusy) {
            return;
        }

        const nextName = draftName.trim();
        if (!nextName || nextName === (conversation.group_name || '').trim()) {
            return;
        }

        try {
            setActionError('');
            await onUpdateConversation({
                conversationId: conversation.id,
                groupName: nextName,
            });
            setDraftName(nextName);
        } catch (error) {
            setActionError(error.response?.data?.detail || 'Unable to update group information.');
        }
    };

    const handleAddSelectedMembers = async () => {
        if (!canManageGroup || !onAddMembers || !selectedIds.length || isBusy) {
            return;
        }

        try {
            setActionError('');
            await onAddMembers({
                conversationId: conversation.id,
                userIds: selectedIds,
            });
            setSelectedIds([]);
        } catch (error) {
            setActionError(error.response?.data?.detail || 'Unable to add members to this group.');
        }
    };

    const handleDeleteConversation = async () => {
        if (!canManageGroup || !onDeleteConversation || isBusy) {
            return;
        }

        const confirmed = window.confirm('Delete this group permanently? This action cannot be undone.');
        if (!confirmed) {
            return;
        }

        try {
            setActionError('');
            await onDeleteConversation({ conversationId: conversation.id });
            onClose();
        } catch (error) {
            setActionError(error.response?.data?.detail || 'Unable to delete this group.');
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/45 backdrop-blur-sm">
            <button type="button" className="flex-1" onClick={onClose} aria-label="Close conversation details" />
            <aside className="soft-scroll h-full w-full max-w-md overflow-y-auto border-l border-[var(--card-border)] bg-[var(--modal-bg)] p-6 text-[var(--text-primary)] shadow-[var(--shell-shadow)]">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--section-title)]">
                            Conversation Details
                        </p>
                        <h2 className="mt-2 text-2xl font-black">{title}</h2>
                        {subtitle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-6 rounded-[28px] bg-[var(--card-bg)] px-5 py-6 shadow-[var(--card-shadow)]">
                    <div className="flex items-center gap-4">
                        {conversation.type === 'group' ? (
                            <StackedAvatars participants={conversation.participants} />
                        ) : (
                            <Avatar
                                name={directUser?.display_name || title}
                                src={directUser?.avatar_url}
                                size="lg"
                                status={onlineUserIds.includes(directUser?.id)}
                            />
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-lg font-black">{title}</p>
                            <p className="mt-1 truncate text-sm text-[var(--text-muted)]">
                                {subtitle || 'Private conversation'}
                            </p>
                        </div>
                    </div>
                </div>

                {conversation.type === 'group' ? (
                    <div className="mt-5 rounded-[24px] bg-[var(--card-bg)] px-5 py-5 shadow-[var(--card-shadow)]">
                        <div className="flex items-center gap-2">
                            <Info size={16} className="text-[var(--accent-strong)]" />
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--section-title)]">
                                Group Settings
                            </p>
                        </div>

                        <div className="mt-4 space-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
                                    Group Name
                                </p>
                                {canManageGroup ? (
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={draftName}
                                            onChange={(event) => setDraftName(event.target.value)}
                                            placeholder="Enter a group name"
                                            className="min-w-0 flex-1 rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveGroupName}
                                            disabled={isBusy || !draftName.trim() || draftName.trim() === (conversation.group_name || '').trim()}
                                            className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isBusy ? <LoaderCircle size={16} className="animate-spin" /> : 'Save'}
                                        </button>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm font-semibold">{conversation.group_name || 'Untitled group'}</p>
                                )}
                            </div>

                            {canManageGroup ? (
                                <div>
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-dim)]">
                                            Add Members
                                        </p>
                                        <span className="text-xs text-[var(--text-muted)]">{selectedIds.length} selected</span>
                                    </div>

                                    {availableFriends.length === 0 ? (
                                        <div className="mt-3 space-y-3">
                                            <p className="text-sm text-[var(--text-muted)]">
                                                No remaining friends are available to add to this group.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleDeleteConversation}
                                                disabled={isBusy}
                                                className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                Delete Group
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mt-3 space-y-2">
                                                {availableFriends.map((friend) => {
                                                    const selected = selectedIds.includes(friend.id);
                                                    return (
                                                        <button
                                                            key={friend.id}
                                                            type="button"
                                                            onClick={() => toggleSelectedUser(friend.id)}
                                                            className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                                                                selected
                                                                    ? 'border-[var(--accent)] bg-[var(--active-card)]'
                                                                    : 'border-[var(--divider)] bg-[var(--input-bg)]'
                                                            }`}
                                                        >
                                                            <Avatar
                                                                name={friend.display_name}
                                                                src={friend.avatar_url}
                                                                size="sm"
                                                                status={onlineUserIds.includes(friend.id)}
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-bold">{friend.display_name}</p>
                                                                <p className="truncate text-xs text-[var(--text-dim)]">@{friend.username}</p>
                                                            </div>
                                                            <span
                                                                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                                                                    selected
                                                                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                                                        : 'border-[var(--divider)] text-transparent'
                                                                }`}
                                                            >
                                                                <Check size={14} />
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAddSelectedMembers}
                                                    disabled={isBusy || selectedIds.length === 0}
                                                    className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
                                                    Add to Group
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteConversation}
                                                    disabled={isBusy}
                                                    className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                    Delete Group
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <div className="mt-5 rounded-[24px] bg-[var(--card-bg)] px-5 py-5 shadow-[var(--card-shadow)]">
                    <div className="flex items-center gap-2">
                        <Info size={16} className="text-[var(--accent-strong)]" />
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--section-title)]">Members</p>
                    </div>
                    <div className="mt-4 space-y-3">
                        {(conversation.participants || []).map((participant) => (
                            <div
                                key={participant.id}
                                className="flex items-center gap-3 rounded-2xl border border-[var(--divider)] bg-[var(--input-bg)] px-4 py-3"
                            >
                                <Avatar
                                    name={participant.display_name}
                                    src={participant.avatar_url}
                                    size="sm"
                                    status={onlineUserIds.includes(participant.id)}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold">
                                        {participant.display_name}
                                        {participant.id === currentUserId ? ' (You)' : ''}
                                    </p>
                                    <p className="mt-0.5 truncate text-xs text-[var(--text-dim)]">@{participant.username}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-5 rounded-[24px] bg-[var(--card-bg)] px-5 py-5 shadow-[var(--card-shadow)]">
                    <div className="flex items-center gap-2">
                        <Info size={16} className="text-[var(--accent-strong)]" />
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--section-title)]">
                            Shared Files
                        </p>
                    </div>
                    {attachmentMessages.length === 0 ? (
                        <p className="mt-4 text-sm text-[var(--text-muted)]">
                            No files or images have been shared in this conversation yet.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {attachmentMessages.map((message) => {
                                const sender = conversation.participants?.find(
                                    (participant) => participant.id === message.sender_id,
                                );

                                return (
                                    <div key={message.id} className="rounded-2xl border border-[var(--divider)] bg-[var(--input-bg)] p-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                name={sender?.display_name || 'User'}
                                                src={sender?.avatar_url}
                                                size="sm"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold">{sender?.display_name || 'User'}</p>
                                                <p className="text-xs text-[var(--text-dim)]">{formatClock(message.created_at)}</p>
                                            </div>
                                        </div>

                                        {message.img_url ? (
                                            <a
                                                href={resolveAssetUrl(message.img_url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 block overflow-hidden rounded-2xl border border-[var(--bubble-other-border)]"
                                            >
                                                <img
                                                    src={resolveAssetUrl(message.img_url)}
                                                    alt={message.file_name || 'image'}
                                                    className="h-40 w-full object-cover"
                                                />
                                            </a>
                                        ) : null}

                                        {message.file_url ? (
                                            <a
                                                href={resolveAssetUrl(message.file_url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[var(--bubble-other-border)] px-4 py-3 text-sm transition hover:border-[var(--accent-soft)]"
                                            >
                                                <span className="truncate">{message.file_name || 'Attachment'}</span>
                                                <span className="shrink-0 text-[var(--accent-strong)]">Open</span>
                                            </a>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {actionError ? (
                    <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                        {actionError}
                    </div>
                ) : null}

                {conversation.seen_by?.length > 0 ? (
                    <div className="mt-5 rounded-[24px] bg-[var(--card-bg)] px-5 py-5 shadow-[var(--card-shadow)]">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--section-title)]">Recently Seen</p>
                        <div className="mt-4 space-y-3">
                            {conversation.seen_by.map((entry) => {
                                const seenUser = conversation.participants?.find(
                                    (participant) => participant.id === entry.user_id,
                                );
                                if (!seenUser) {
                                    return null;
                                }
                                return (
                                    <div
                                        key={`${entry.user_id}-${entry.seen_at || 'seen'}`}
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--divider)] bg-[var(--input-bg)] px-4 py-3"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Avatar
                                                name={seenUser.display_name}
                                                src={seenUser.avatar_url}
                                                size="sm"
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold">{seenUser.display_name}</p>
                                                <p className="truncate text-xs text-[var(--text-dim)]">@{seenUser.username}</p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-xs text-[var(--text-dim)]">
                                            {entry.seen_at ? formatClock(entry.seen_at) : 'Seen'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </aside>
        </div>
    );
}
