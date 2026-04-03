import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
    Image as ImageIcon,
    Info,
    LoaderCircle,
    MessageSquarePlus,
    PanelLeft,
    Paperclip,
    Phone,
    Search,
    SendHorizontal,
    SmilePlus,
    SquarePlus,
    Video,
} from 'lucide-react';
import { useZolaApp } from '../hooks/useZolaApp';
import { CreateConversationModal } from '../components/chat/ChatOverlays';
import { IncomingCallOverlay, ActiveCallOverlay } from '../components/chat/VideoCallOverlays';
import ConversationInfoPanel from '../components/chat/ConversationInfoPanel';
import { Avatar, StackedAvatars } from '../components/chat/ChatPrimitives';
import {
    formatClock,
    getConversationParticipantCount,
    formatSidebarTime,
    getConversationName,
    getConversationSubtitle,
    getDirectConversationUser,
    isSameDay,
    resolveAssetUrl,
} from '../components/chat/chatUtils';
import Picker from 'emoji-picker-react';

const IconButton = ({ children, onClick, title, disabled = false }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        disabled={disabled}
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--input-bg)] text-[var(--text-muted)] transition hover:bg-[var(--profile-bg-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
    >
        {children}
    </button>
);

// File: src/pages/ChatPage.jsx

const Attachment = ({ message }) => {
    return (
        <div className="space-y-3">
            {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}

            {/* Sửa lại phần hiển thị ảnh để an toàn hơn */}
            {message.img_url && (
                <div className="grid gap-2">
                    {/* Nếu img_url là chuỗi đơn thì hiện 1 ảnh, nếu là mảng thì loop qua */}
                    {Array.isArray(message.img_url) ? (
                        message.img_url.map((url, i) => (
                            <img key={i} src={resolveAssetUrl(url)} alt="attachment" className="max-h-[320px] w-full rounded-[18px] object-cover" />
                        ))
                    ) : (
                        <img src={resolveAssetUrl(message.img_url)} alt="attachment" className="max-h-[320px] w-full rounded-[18px] object-cover" />
                    )}
                </div>
            )}

            {message.file_url && (
                <a href={resolveAssetUrl(message.file_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded-2xl bg-[var(--input-bg)] px-4 py-3 text-sm text-inherit">
                    <Paperclip size={16} />
                    <span>{message.file_name || 'Attachment'}</span>
                </a>
            )}
        </div>
    );
};

const formatDayDivider = (value) => {
    if (!value) {
        return '';
    }

    const target = new Date(value);
    const now = new Date();
    if (
        target.getFullYear() === now.getFullYear() &&
        target.getMonth() === now.getMonth() &&
        target.getDate() === now.getDate()
    ) {
        return 'TODAY';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }).format(target).toUpperCase();
};

function ConversationRow({
    conversation,
    currentUserId,
    isActive,
    onClick,
    onlineUserIds,
}) {
    const isGroup = conversation.type === 'group';
    const directUser = !isGroup ? conversation.participants?.find((item) => item.id !== currentUserId) : null;
    const title = getConversationName(conversation, currentUserId);
    const isUnread = Boolean(
        conversation.last_message_sender &&
        conversation.last_message_sender !== currentUserId &&
        !conversation.seen_by?.some((entry) => entry.user_id === currentUserId),
    );

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-left transition ${
                isActive
                    ? 'bg-[var(--card-bg)] shadow-[0_12px_32px_rgba(0,82,204,0.06)]'
                    : 'hover:bg-white/70'
            }`}
        >
            <div className="shrink-0">
                {isGroup ? (
                    <StackedAvatars participants={conversation.participants} size="sm" />
                ) : (
                    <Avatar
                        name={title}
                        src={directUser?.avatar_url}
                        size="md"
                        status={onlineUserIds.includes(directUser?.id)}
                    />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {title}
                    </p>
                    <span className="shrink-0 text-[11px] font-medium text-[var(--text-dim)]">
                        {formatSidebarTime(conversation.last_message_created_at || conversation.updated_at)}
                    </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-[var(--text-muted)]">
                        {getConversationSubtitle(conversation)}
                    </p>
                    {isUnread ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                            1
                        </span>
                    ) : null}
                </div>
            </div>
        </button>
    );
}

export default function ChatPage() {
    const fileInputRef = useRef(null);
    const messagesScrollRef = useRef(null);
    const preserveScrollRef = useRef(null);
    const shouldStickToBottomRef = useRef(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isConversationInfoOpen, setIsConversationInfoOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [forceGroupCreation, setForceGroupCreation] = useState(false);
    const [selectedFriendIds, setSelectedFriendIds] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [createError, setCreateError] = useState('');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const searchValue = useDeferredValue(searchTerm).trim().toLowerCase();

    const {
        activeConversation,
        addConversationMembers,
        bootstrapLoading,
        conversations,
        createConversation,
        currentUserId,
        deleteConversation,
        friends,
        hasOlderMessages,
        handleComposerChange,
        handleFileSelected,
        handleSendMessage,
        handleSendOnEnter,
        isCreateBusy,
        isConversationActionBusy,
        isLoadingOlderMessages,
        isSendingMessage,
        isUploading,
        loadOlderMessages,
        messageInput,
        messages,
        messagesError,
        messagesLoading,
        onlineUserIds,
        selectConversation,
        typingLabel,
        updateConversation,
        videoCallState,
        profile,
        setMessageInput,
        theme,
    } = useZolaApp();

    const filteredConversations = useMemo(
        () => (
            !searchValue
                ? conversations
                : conversations.filter((item) => JSON.stringify(item).toLowerCase().includes(searchValue))
        ),
        [conversations, searchValue],
    );

    const activeDirectUser = activeConversation ? getDirectConversationUser(activeConversation, currentUserId) : null;

    const scrollMessagesToBottom = () => {
        const container = messagesScrollRef.current;
        if (!container) {
            return;
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const nextContainer = messagesScrollRef.current;
                if (!nextContainer) {
                    return;
                }

                nextContainer.scrollTop = nextContainer.scrollHeight;
            });
        });
    };

    useEffect(() => {
        shouldStickToBottomRef.current = true;
        preserveScrollRef.current = null;
    }, [activeConversation?.id]);

    useEffect(() => {
        const container = messagesScrollRef.current;
        if (!container) {
            return;
        }

        if (preserveScrollRef.current) {
            const { previousScrollHeight, previousScrollTop } = preserveScrollRef.current;
            container.scrollTop = container.scrollHeight - previousScrollHeight + previousScrollTop;
            preserveScrollRef.current = null;
            return;
        }

        if (shouldStickToBottomRef.current) {
            scrollMessagesToBottom();
        }
    }, [messages, activeConversation?.id, messagesLoading]);

    const handleAttachmentLoad = () => {
        if (!shouldStickToBottomRef.current) {
            return;
        }

        scrollMessagesToBottom();
    };

    const handleMessagesScroll = async (event) => {
        const container = event.currentTarget;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        shouldStickToBottomRef.current = distanceFromBottom < 120;

        if (
            container.scrollTop > 120
            || !hasOlderMessages
            || isLoadingOlderMessages
            || messagesLoading
        ) {
            return;
        }

        preserveScrollRef.current = {
            previousScrollHeight: container.scrollHeight,
            previousScrollTop: container.scrollTop,
        };

        const olderMessages = await loadOlderMessages();
        if (!olderMessages.length) {
            preserveScrollRef.current = null;
        }
    };

    const openCreate = (group = false) => {
        setCreateError('');
        setSelectedFriendIds([]);
        setGroupName('');
        setForceGroupCreation(group);
        setIsCreateDialogOpen(true);
    };

    const submitCreate = async () => {
        if (!selectedFriendIds.length || isCreateBusy) {
            return;
        }

        if ((forceGroupCreation || selectedFriendIds.length > 1) && !groupName.trim()) {
            setCreateError('Please enter a group name before creating the conversation.');
            return;
        }

        try {
            await createConversation({
                friendIds: selectedFriendIds,
                forceGroupMode: forceGroupCreation,
                groupName,
            });
            setIsCreateDialogOpen(false);
            setSelectedFriendIds([]);
            setGroupName('');
            setForceGroupCreation(false);
            setIsMobileSidebarOpen(false);
        } catch (error) {
            setCreateError(error.response?.data?.detail || 'Unable to create a new conversation.');
        }
    };

    const handleStartVideoCall = () => {
        if (activeConversation?.type === 'direct' && activeDirectUser) {
            videoCallState.startCall(activeDirectUser, profile);
        } else {
            alert('Tính năng gọi video hiện chỉ hỗ trợ cho cuộc trò chuyện 1-1.');
        }
    };

    return (
        <div className="flex h-full min-h-0 min-w-0 overflow-hidden bg-[var(--app-bg)]">
            <aside
                className={`${isMobileSidebarOpen ? 'flex' : 'hidden'} soft-scroll min-h-0 w-full flex-col overflow-y-auto bg-[var(--sidebar-bg)] md:flex md:w-[320px] md:shrink-0`}
            >
                <div className="px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
                            />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search"
                                className="w-full rounded-full bg-[var(--input-bg)] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none shadow-[inset_0_0_0_1px_var(--input-border)] focus:bg-[var(--card-bg)] focus:shadow-[inset_0_0_0_1px_var(--accent-soft)]"
                            />
                        </div>
                        <IconButton onClick={() => openCreate(false)} title="New message">
                            <SquarePlus size={18} />
                        </IconButton>
                        <IconButton onClick={() => openCreate(true)} title="New group">
                            <MessageSquarePlus size={18} />
                        </IconButton>
                    </div>

                    <div className="mt-5 flex items-center gap-5 px-1">
                        <button type="button" className="border-b-2 border-[var(--accent)] pb-2 text-sm font-semibold text-[var(--accent)]">
                            All
                        </button>
                        <button type="button" className="pb-2 text-sm font-medium text-[var(--text-muted)]">
                            Unread
                        </button>
                    </div>
                </div>

                <div className="px-3 pb-4">
                    {bootstrapLoading ? (
                        <div className="flex items-center justify-center py-12 text-[var(--text-muted)]">
                            <LoaderCircle size={24} className="animate-spin" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="rounded-[24px] bg-white/70 px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                            No conversations found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredConversations.map((conversation) => (
                                <ConversationRow
                                    key={conversation.id}
                                    conversation={conversation}
                                    currentUserId={currentUserId}
                                    isActive={activeConversation?.id === conversation.id}
                                    onClick={() => {
                                        selectConversation(conversation.id);
                                        setIsMobileSidebarOpen(false);
                                    }}
                                    onlineUserIds={onlineUserIds}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            <main className={`${isMobileSidebarOpen ? 'hidden md:flex' : 'flex'} min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--card-bg)]`}>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        await handleFileSelected(file);
                    }}
                />

                {activeConversation ? (
                    <>
                        <header className="shrink-0 bg-[var(--card-bg)] px-4 py-4 md:px-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <IconButton onClick={() => setIsMobileSidebarOpen(true)} title="Open conversation list">
                                        <PanelLeft size={18} />
                                    </IconButton>

                                    <div className="shrink-0">
                                        {activeConversation.type === 'group' ? (
                                            <StackedAvatars participants={activeConversation.participants} size="sm" />
                                        ) : (
                                            <Avatar
                                                name={getConversationName(activeConversation, currentUserId)}
                                                src={activeDirectUser?.avatar_url}
                                                size="md"
                                                status={onlineUserIds.includes(activeDirectUser?.id)}
                                            />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h1 className="truncate text-xl font-bold text-[var(--text-primary)]">
                                            {getConversationName(activeConversation, currentUserId)}
                                        </h1>
                                        <p className="mt-1 truncate text-sm text-emerald-500">
                                            {activeConversation.type === 'group'
                                                ? `${getConversationParticipantCount(activeConversation)} members`
                                                : onlineUserIds.includes(activeDirectUser?.id)
                                                    ? 'Online'
                                                    : 'Offline'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <IconButton title="Start video call" onClick={handleStartVideoCall}>
                                        <Video size={18} />
                                    </IconButton>
                                    <IconButton title="Start voice call">
                                        <Phone size={18} />
                                    </IconButton>
                                    <IconButton title="Search in conversation">
                                        <Search size={18} />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => setIsConversationInfoOpen(true)}
                                        title="Conversation info"
                                    >
                                        <Info size={18} />
                                    </IconButton>
                                </div>
                            </div>
                        </header>

                        <div
                            ref={messagesScrollRef}
                            onScroll={handleMessagesScroll}
                            className="chat-canvas soft-scroll flex-1 overflow-y-auto px-4 py-6 md:px-6"
                        >
                            {messagesLoading ? (
                                <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
                                    <LoaderCircle size={28} className="animate-spin" />
                                </div>
                            ) : messagesError ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="rounded-2xl bg-red-50 px-6 py-5 text-center text-sm text-red-600">
                                        {messagesError}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {isLoadingOlderMessages ? (
                                        <div className="flex justify-center">
                                            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--input-bg)] px-4 py-2 text-xs font-medium text-[var(--text-muted)]">
                                                <LoaderCircle size={14} className="animate-spin" />
                                                Loading older messages
                                            </div>
                                        </div>
                                    ) : null}

                                    {messages.map((message, index) => {
                                        const isMine = message.sender_id === currentUserId;
                                        const previousMessage = messages[index - 1];
                                        const senderProfile = activeConversation.participants?.find(
                                            (item) => item.id === message.sender_id,
                                        );
                                        const shouldShowSenderName = activeConversation.type === 'group'
                                            && !isMine
                                            && (previousMessage?.sender_id !== message.sender_id
                                                || !isSameDay(previousMessage?.created_at, message.created_at));

                                        return (
                                            <div key={message.id}>
                                                {(index === 0 || !isSameDay(previousMessage?.created_at, message.created_at)) && (
                                                    <div className="my-4 flex justify-center">
                                                        <span className="rounded-full bg-[var(--timeline-bg)] px-4 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-[var(--timeline-text)]">
                                                            {formatDayDivider(message.created_at)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className={`flex gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                    {!isMine ? (
                                                        <div className="pt-8">
                                                            <Avatar
                                                                name={senderProfile?.display_name || 'User'}
                                                                src={senderProfile?.avatar_url}
                                                                size="sm"
                                                            />
                                                        </div>
                                                    ) : null}

                                                    <div className={`max-w-[84%] md:max-w-[68%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                                                        {shouldShowSenderName ? (
                                                            <p className="mb-1 ml-1 text-xs font-semibold text-[var(--text-muted)]">
                                                                {senderProfile?.display_name || senderProfile?.username || 'User'}
                                                            </p>
                                                        ) : null}

                                                        <div
                                                            className={`rounded-[18px] px-4 py-3 text-[15px] leading-6 ${
                                                                isMine
                                                                    ? 'rounded-br-md text-white shadow-[0_14px_28px_rgba(0,82,204,0.16)]'
                                                                    : 'rounded-bl-md bg-[var(--bubble-other)] text-[var(--text-primary)] shadow-[0_6px_20px_rgba(0,82,204,0.04)]'
                                                            }`}
                                                            style={isMine ? { background: 'var(--bubble-me)' } : undefined}
                                                        >
                                                            <Attachment message={message} onMediaLoad={handleAttachmentLoad} />
                                                        </div>

                                                        <p className={`mt-2 text-[11px] text-[var(--text-dim)] ${isMine ? 'text-right' : 'text-left'}`}>
                                                            {formatClock(message.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {typingLabel ? (
                                        <div className="flex justify-start">
                                            <div className="rounded-full bg-[var(--input-bg)] px-4 py-2 text-sm text-[var(--text-muted)]">
                                                {typingLabel} is typing...
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        <footer className="shrink-0 bg-[var(--footer-bg)] px-4 py-4 md:px-6">
                            <div className="rounded-[24px] bg-[var(--input-bg)] px-3 py-3">
                                <div className="flex items-end gap-2">
                                    <IconButton
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Upload attachment"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <LoaderCircle size={18} className="animate-spin" /> : <SquarePlus size={18} />}
                                    </IconButton>
                                    <IconButton onClick={() => fileInputRef.current?.click()} title="Upload image">
                                        <ImageIcon size={18} />
                                    </IconButton>
                                    <IconButton onClick={() => fileInputRef.current?.click()} title="Attach file">
                                        <Paperclip size={18} />
                                    </IconButton>

                                    <textarea
                                        rows={1}
                                        value={messageInput}
                                        onChange={handleComposerChange}
                                        onKeyDown={handleSendOnEnter}
                                        placeholder="Type a message..."
                                        className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-[var(--text-primary)] outline-none"
                                    />

                                    <div className="relative">
                                        <IconButton title="Emoji picker" onClick={() => setShowEmojiPicker((prev) => !prev)}>
                                            <SmilePlus size={18} />
                                        </IconButton>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-14 right-0 z-50 shadow-2xl">
                                                <Picker onEmojiClick={(emojiObject) => setMessageInput((prev) => prev + emojiObject.emoji)} theme={theme === 'dark' ? 'dark' : 'light'} />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            handleSendMessage();
                                            setShowEmojiPicker(false);
                                        }}
                                        disabled={!messageInput.trim() || isSendingMessage}
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-strong)] text-white shadow-[0_10px_24px_rgba(0,104,255,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSendingMessage ? <LoaderCircle size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
                                    </button>
                                </div>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[var(--empty-icon-bg)] text-[var(--accent)]">
                            <MessageSquarePlus size={34} />
                        </div>
                        <h2 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                            Select a conversation
                        </h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">
                            Pick an existing thread from the left or start a new chat based on the contacts already loaded from the backend.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="mt-6 inline-flex items-center gap-3 rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-semibold text-white md:hidden"
                        >
                            <PanelLeft size={18} />
                            Open conversations
                        </button>
                    </div>
                )}
            </main>

            <CreateConversationModal
                createError={createError}
                friends={friends}
                forceGroupMode={forceGroupCreation}
                groupName={groupName}
                isCreateBusy={isCreateBusy}
                isOpen={isCreateDialogOpen}
                onClose={() => {
                    setIsCreateDialogOpen(false);
                    setForceGroupCreation(false);
                }}
                onCreateConversation={submitCreate}
                onGroupNameChange={(event) => setGroupName(event.target.value)}
                onToggleFriend={(friendId) =>
                    setSelectedFriendIds((previous) =>
                        previous.includes(friendId)
                            ? previous.filter((item) => item !== friendId)
                            : [...previous, friendId],
                    )
                }
                onlineUserIds={onlineUserIds}
                selectedFriendIds={selectedFriendIds}
            />

            <ConversationInfoPanel
                key={`${activeConversation?.id || 'none'}-${isConversationInfoOpen ? 'open' : 'closed'}`}
                conversation={activeConversation}
                currentUserId={currentUserId}
                friends={friends}
                isBusy={isConversationActionBusy}
                isOpen={isConversationInfoOpen}
                messages={messages}
                onAddMembers={addConversationMembers}
                onClose={() => setIsConversationInfoOpen(false)}
                onDeleteConversation={deleteConversation}
                onUpdateConversation={updateConversation}
                onlineUserIds={onlineUserIds}
            />

            <IncomingCallOverlay 
                incomingCall={videoCallState.incomingCall}
                onAccept={() => videoCallState.acceptCall(profile)}
                onReject={() => videoCallState.rejectCall()}
            />

            <ActiveCallOverlay 
                activeCall={videoCallState.activeCall}
                localStream={videoCallState.localStream}
                remoteStream={videoCallState.remoteStream}
                onEndCall={() => videoCallState.endCall(videoCallState.activeCall?.partnerId)}
            />
        </div>
    );
}
