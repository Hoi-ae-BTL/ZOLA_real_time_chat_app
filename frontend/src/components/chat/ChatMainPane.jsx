import {
    FileText,
    Image as ImageIcon,
    Info,
    LoaderCircle,
    MessageSquarePlus,
    PanelLeft,
    Paperclip,
    SendHorizontal,
    SmilePlus,
} from 'lucide-react';
import { Avatar, StackedAvatars } from './ChatPrimitives';
import {
    formatClock,
    formatDateDivider,
    getConversationName,
    getDirectConversationUser,
    isSameDay,
    resolveAssetUrl,
} from './chatUtils';

const renderMessageContent = (message) => (
    <div className="space-y-3">
        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        {message.img_url && (
            <img
                src={resolveAssetUrl(message.img_url)}
                alt="attachment"
                className="max-h-[280px] w-full rounded-[18px] object-cover"
            />
        )}
        {message.file_url && (
            <a
                href={resolveAssetUrl(message.file_url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-2xl border border-[var(--bubble-other-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-inherit"
            >
                <FileText size={18} />
                <span>{message.file_name || 'Tệp đính kèm'}</span>
            </a>
        )}
    </div>
);

const HeaderAction = ({ children, onClick, title }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-dim)] transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
    >
        {children}
    </button>
);

export default function ChatMainPane({
    activeConversation,
    currentUserId,
    fileInputRef,
    handleComposerChange,
    handleFileSelected,
    handleOpenFilePicker,
    handleSendMessage,
    handleSendOnEnter,
    isLoadingMessages,
    isMobileSidebarOpen,
    isSendingMessage,
    isUploading,
    messageInput,
    messages,
    messagesEndRef,
    messagesError,
    onlineUserIds,
    onOpenConversationInfo,
    onOpenSidebar,
    socketTypingLabel,
}) {
    const directUser = activeConversation
        ? getDirectConversationUser(activeConversation, currentUserId)
        : null;

    return (
        <main className={`${isMobileSidebarOpen ? 'hidden' : 'flex'} min-h-0 min-w-0 flex-col overflow-hidden xl:flex`}>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />

            {activeConversation ? (
                <>
                    <header className="sticky top-0 z-20 shrink-0 border-b border-[var(--divider)] bg-[var(--header-bg)] px-4 py-4 backdrop-blur-md md:px-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-primary)] xl:hidden"
                                    onClick={onOpenSidebar}
                                >
                                    <PanelLeft size={18} />
                                </button>

                                <div className="shrink-0">
                                    {activeConversation.type === 'group' ? (
                                        <StackedAvatars participants={activeConversation.participants} size="sm" />
                                    ) : (
                                        <Avatar
                                            name={getConversationName(activeConversation, currentUserId)}
                                            src={directUser?.avatar_url}
                                            size="md"
                                            status={onlineUserIds.includes(directUser?.id)}
                                        />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h1 className="truncate text-lg font-black text-[var(--text-primary)] md:text-xl">
                                        {getConversationName(activeConversation, currentUserId)}
                                    </h1>
                                    <p className="mt-0.5 truncate text-sm text-[var(--text-muted)]">
                                        {activeConversation.type === 'group'
                                            ? `${activeConversation.participants?.length || 0} thành viên`
                                            : onlineUserIds.includes(directUser?.id)
                                              ? 'Đang trực tuyến'
                                              : 'Đã ngoại tuyến'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <HeaderAction onClick={onOpenConversationInfo} title="Thông tin cuộc trò chuyện">
                                    <Info size={18} />
                                </HeaderAction>
                            </div>
                        </div>
                    </header>

                    <div className="chat-canvas soft-scroll flex-1 overflow-y-auto px-4 py-5 md:px-6">
                        {isLoadingMessages ? (
                            <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
                                <LoaderCircle size={30} className="animate-spin" />
                            </div>
                        ) : messagesError ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-center text-sm text-red-600">
                                    {messagesError}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message, index) => {
                                    const isMine = message.sender_id === currentUserId;
                                    const previousMessage = messages[index - 1];
                                    const showDateDivider =
                                        index === 0 ||
                                        !isSameDay(previousMessage?.created_at, message.created_at);
                                    const senderProfile = activeConversation.participants?.find(
                                        (participant) => participant.id === message.sender_id,
                                    );

                                    return (
                                        <div key={message.id}>
                                            {showDateDivider && (
                                                <div className="my-5 flex justify-center">
                                                    <span className="rounded-full bg-[var(--timeline-bg)] px-4 py-1.5 text-[11px] font-semibold text-[var(--timeline-text)]">
                                                        {formatDateDivider(message.created_at)}
                                                    </span>
                                                </div>
                                            )}

                                            <div className={`flex items-end gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                {!isMine && (
                                                    <Avatar
                                                        name={senderProfile?.display_name || 'User'}
                                                        src={senderProfile?.avatar_url}
                                                        size="sm"
                                                    />
                                                )}

                                                <div className={`max-w-[84%] md:max-w-[66%] ${isMine ? '' : 'min-w-0'}`}>
                                                    {!isMine && activeConversation.type === 'group' && (
                                                        <p className="mb-1 ml-1 text-[11px] font-semibold text-[var(--text-dim)]">
                                                            {senderProfile?.display_name}
                                                        </p>
                                                    )}

                                                    <div
                                                        className={`rounded-[20px] px-4 py-3 text-[15px] leading-6 shadow-sm ${
                                                            isMine
                                                                ? 'rounded-br-md bg-[var(--bubble-me)] text-white'
                                                                : 'rounded-bl-md border border-[var(--bubble-other-border)] bg-[var(--bubble-other)] text-[var(--text-primary)]'
                                                        }`}
                                                    >
                                                        {renderMessageContent(message)}
                                                    </div>
                                                    <p className={`mt-1 text-[11px] text-[var(--text-dim)] ${isMine ? 'text-right' : 'text-left'}`}>
                                                        {formatClock(message.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {socketTypingLabel && (
                                    <div className="flex justify-start">
                                        <div className="rounded-full border border-[var(--bubble-other-border)] bg-[var(--bubble-other)] px-4 py-2 text-sm text-[var(--text-muted)]">
                                            {socketTypingLabel} đang nhập...
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    <footer className="sticky bottom-0 z-20 shrink-0 border-t border-[var(--divider)] bg-[var(--footer-bg)] px-4 py-4 backdrop-blur-md md:px-6">
                        <div className="rounded-[24px] border border-[var(--input-border)] bg-[var(--composer-bg)] px-3 py-3 shadow-[var(--composer-shadow)]">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleOpenFilePicker}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--accent-faint)] hover:text-[var(--accent-strong)]"
                                >
                                    {isUploading ? <LoaderCircle size={18} className="animate-spin" /> : <Paperclip size={18} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleOpenFilePicker}
                                    className="hidden h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--accent-faint)] hover:text-[var(--accent-strong)] md:inline-flex"
                                >
                                    <ImageIcon size={18} />
                                </button>

                                <textarea
                                    rows={1}
                                    value={messageInput}
                                    onChange={handleComposerChange}
                                    onKeyDown={handleSendOnEnter}
                                    placeholder="Nhập tin nhắn..."
                                    className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-dim)]"
                                />

                                <button
                                    type="button"
                                    className="hidden h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--accent-faint)] hover:text-[var(--accent-strong)] md:inline-flex"
                                >
                                    <SmilePlus size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || isSendingMessage}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSendingMessage ? <LoaderCircle size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
                                </button>
                            </div>
                        </div>
                    </footer>
                </>
            ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--empty-icon-bg)] text-[var(--accent)] shadow-[var(--card-shadow)]">
                        <MessageSquarePlus size={36} />
                    </div>
                    <h2 className="mt-5 text-3xl font-black text-[var(--text-primary)]">Chọn một cuộc trò chuyện</h2>
                    <p className="mt-2 max-w-md text-base text-[var(--text-muted)]">
                        Chọn chat ở cột bên trái hoặc tạo mới để bắt đầu nhắn tin.
                    </p>
                    <button
                        type="button"
                        onClick={onOpenSidebar}
                        className="mt-6 inline-flex items-center gap-3 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white xl:hidden"
                    >
                        <PanelLeft size={18} />
                        Mở danh sách chat
                    </button>
                </div>
            )}
        </main>
    );
}
