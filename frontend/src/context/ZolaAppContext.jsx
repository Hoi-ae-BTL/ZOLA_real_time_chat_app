import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    addConversationMembersAPI,
    createConversationAPI,
    deleteConversationAPI,
    getConversationDetailsAPI,
    getConversationsAPI,
    getMessagesAPI,
    getMyProfileAPI,
    markConversationAsReadAPI,
    sendMessageAPI,
    updateConversationAPI,
    uploadConversationFileAPI,
} from '../api/chat.api';
import {
    acceptFriendRequestAPI,
    deleteFriendRequestAPI,
    getFriendRequestsAPI,
    getFriendsAPI,
    sendFriendRequestAPI,
} from '../api/friends.api';
import {
    getDirectConversationUser,
    sortConversations,
    sortMessages,
} from '../components/chat/chatUtils';
import { ZolaAppStoreContext } from './zolaAppStoreContext';
import { useChatSocket } from '../hooks/useChatSocket';
import { useVideoCall } from '../hooks/useVideoCall';

const THEME_STORAGE_KEY = 'zola_theme';
const SIDEBAR_ERROR_TIMEOUT_MS = 4000;
const MESSAGE_PAGE_SIZE = 100;

const getAttachmentPreviewLabel = (message) => {
    if (message.content) {
        return message.content;
    }

    if (message.img_url) {
        return 'Đã gửi một ảnh';
    }

    if (message.file_name) {
        return `Đã gửi ${message.file_name}`;
    }

    return 'Tin nhắn mới';
};

const normalizeConversationParticipants = ({
    conversation,
    currentUserId,
    friends,
    history = [],
    profile,
}) => {
    if (!conversation || conversation.type !== 'direct' || !currentUserId) {
        return conversation;
    }

    const participants = conversation.participants || [];
    const hasNamedOtherParticipant = participants.some(
        (participant) => participant.id !== currentUserId && (participant.display_name || participant.username),
    );

    if (hasNamedOtherParticipant) {
        return conversation;
    }

    const inferredOtherUserId = participants.find((participant) => participant.id !== currentUserId)?.id
        || history.find((message) => message.sender_id !== currentUserId)?.sender_id
        || (conversation.last_message_sender && conversation.last_message_sender !== currentUserId
            ? conversation.last_message_sender
            : null)
        || conversation.seen_by?.find((entry) => entry.user_id !== currentUserId)?.user_id
        || null;

    const inferredOtherUser = friends.find((friend) => friend.id === inferredOtherUserId);
    if (!inferredOtherUser) {
        return conversation;
    }

    const currentParticipant = participants.find((participant) => participant.id === currentUserId)
        || (profile
            ? {
                id: profile.id,
                username: profile.username,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
            }
            : null);

    const nextParticipants = [currentParticipant, inferredOtherUser]
        .filter(Boolean)
        .reduce((result, participant) => {
            if (!result.some((item) => item.id === participant.id)) {
                result.push(participant);
            }
            return result;
        }, []);

    return {
        ...conversation,
        participants: nextParticipants,
    };
};

export function ZolaAppProvider({ children }) {
    const token = localStorage.getItem('access_token');
    const typingTimeoutRef = useRef(null);
    const hasSentTypingRef = useRef(false);
    const lastEventIdRef = useRef(0);
    const videoCallEventRef = useRef(null);

    const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light');
    const [profile, setProfile] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [onlineUserIds, setOnlineUserIds] = useState([]);
    const [typingState, setTypingState] = useState({});
    const [bootstrapLoading, setBootstrapLoading] = useState(true);
    const [sidebarError, setSidebarError] = useState('');
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState('');
    const [hasOlderMessages, setHasOlderMessages] = useState(false);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isCreateBusy, setIsCreateBusy] = useState(false);
    const [isConversationActionBusy, setIsConversationActionBusy] = useState(false);
    const [friendActionLoadingMap, setFriendActionLoadingMap] = useState({});
    const activeConversationIdRef = useRef(null);

    const currentUserId = profile?.id || null;
    const activeConversation = conversations.find(
        (conversation) => conversation.id === activeConversationId,
    ) || null;
    const pendingRequestCount = friendRequests.filter(
        (request) => request.to_user_id === currentUserId,
    ).length;
    const directConversationMap = useMemo(() => {
        return conversations.reduce((map, conversation) => {
            if (conversation.type !== 'direct') {
                return map;
            }

            const otherUser = getDirectConversationUser(conversation, currentUserId);
            if (otherUser) {
                map[otherUser.id] = conversation;
            }

            return map;
        }, {});
    }, [conversations, currentUserId]);
    const incomingRequests = friendRequests.filter(
        (request) => request.to_user_id === currentUserId,
    );
    const outgoingRequests = friendRequests.filter(
        (request) => request.from_user_id === currentUserId,
    );

    const stopTyping = (conversationId) => {
        if (!hasSentTypingRef.current || !conversationId) {
            return;
        }

        hasSentTypingRef.current = false;
        sendEvent({
            type: 'typing_stop',
            conversation_id: conversationId,
        });
    };

    const upsertConversation = (conversation, history = []) => {
        if (!conversation) {
            return;
        }

        const normalizedConversation = normalizeConversationParticipants({
            conversation,
            currentUserId,
            friends,
            history,
            profile,
        });

        setConversations((previous) => {
            const filtered = previous.filter((item) => item.id !== normalizedConversation.id);
            return sortConversations([...filtered, normalizedConversation]);
        });
    };

    const upsertMessage = (message) => {
        setMessages((previous) => {
            const existingIndex = previous.findIndex((item) => item.id === message.id);
            if (existingIndex >= 0) {
                const nextMessages = [...previous];
                nextMessages[existingIndex] = {
                    ...nextMessages[existingIndex],
                    ...message,
                };
                return sortMessages(nextMessages);
            }

            return sortMessages([...previous, message]);
        });
    };

    const patchConversationWithMessage = (message) => {
        if (!message?.conversation_id) {
            return;
        }

        setConversations((previous) => {
            const target = previous.find((item) => item.id === message.conversation_id);
            if (!target) {
                return previous;
            }

            const nextConversation = {
                ...target,
                last_message_content: getAttachmentPreviewLabel(message),
                last_message_created_at: message.created_at,
                last_message_sender: message.sender_id,
                updated_at: message.updated_at || message.created_at,
            };

            const filtered = previous.filter((item) => item.id !== message.conversation_id);
            return sortConversations([...filtered, nextConversation]);
        });
    };

    const patchSeenState = (payload) => {
        setConversations((previous) =>
            previous.map((conversation) => {
                if (conversation.id !== payload.conversation_id) {
                    return conversation;
                }

                const existingSeen = conversation.seen_by || [];
                const otherSeen = existingSeen.filter((item) => item.user_id !== payload.user_id);

                return {
                    ...conversation,
                    seen_by: [
                        ...otherSeen,
                        {
                            user_id: payload.user_id,
                            seen_at: payload.seen_at,
                        },
                    ],
                };
            }),
        );
    };

    const upsertFriendRequest = (request) => {
        if (!request) {
            return;
        }

        setFriendRequests((previous) => {
            const filtered = previous.filter((item) => item.id !== request.id);
            return [request, ...filtered];
        });
    };

    const removeFriendRequestById = (requestId) => {
        setFriendRequests((previous) => previous.filter((item) => item.id !== requestId));
    };

    const upsertFriendFromFriendship = (friendship) => {
        if (!friendship || !currentUserId) {
            return;
        }

        const nextFriend =
            friendship.user_a?.id === currentUserId ? friendship.user_b : friendship.user_a;

        if (!nextFriend?.id) {
            return;
        }

        setFriends((previous) => {
            const filtered = previous.filter((item) => item.id !== nextFriend.id);
            return [nextFriend, ...filtered];
        });
    };

    const removeFriendByUserIds = (userAId, userBId) => {
        if (!currentUserId) {
            return;
        }

        const removedFriendId = userAId === currentUserId ? userBId : userAId;
        setFriends((previous) => previous.filter((item) => item.id !== removedFriendId));
    };

    const updateTypingUsers = (conversationId, userId, shouldAdd) => {
        if (!conversationId || !userId || userId === currentUserId) {
            return;
        }

        setTypingState((previous) => {
            const nextUsers = new Set(previous[conversationId] || []);

            if (shouldAdd) {
                nextUsers.add(userId);
            } else {
                nextUsers.delete(userId);
            }

            if (nextUsers.size === 0) {
                const nextState = { ...previous };
                delete nextState[conversationId];
                return nextState;
            }

            return {
                ...previous,
                [conversationId]: Array.from(nextUsers),
            };
        });
    };

    const hydrateConversation = async (conversationId) => {
        if (!conversationId) {
            return;
        }

        try {
            const conversation = await getConversationDetailsAPI(conversationId);
            upsertConversation(conversation);
        } catch (error) {
            console.error('Unable to hydrate conversation:', error);
        }
    };

    const loadBootstrapData = async () => {
        const [profileData, rawConversations, friendsData, requestsData] = await Promise.all([
            getMyProfileAPI(),
            getConversationsAPI(),
            getFriendsAPI(),
            getFriendRequestsAPI().catch(() => []),
        ]);

        const detailedConversations = await Promise.all(
            rawConversations.map(async (conversation) => {
                try {
                    return await getConversationDetailsAPI(conversation.id);
                } catch {
                    return conversation;
                }
            }),
        );

        return {
            friendsData,
            orderedConversations: sortConversations(detailedConversations),
            profileData,
            requestsData,
        };
    };

    const bootstrapApp = async () => {
        if (!token) {
            setBootstrapLoading(false);
            return;
        }

        setBootstrapLoading(true);
        setSidebarError('');

        try {
            const { friendsData, orderedConversations, profileData, requestsData } =
                await loadBootstrapData();

            setProfile(profileData);
            setFriends(friendsData);
            setFriendRequests(requestsData);
            setConversations(orderedConversations);
            setActiveConversationId((previous) => {
                if (previous && orderedConversations.some((item) => item.id === previous)) {
                    return previous;
                }

                return orderedConversations[0]?.id || null;
            });
        } catch (error) {
            console.error('Unable to bootstrap chat page:', error);
            setSidebarError('Không thể tải dữ liệu chat từ backend.');
        } finally {
            setBootstrapLoading(false);
        }
    };

    const handleSocketEvent = async (event) => {
        if (!event) {
            return;
        }

        if (event.meta?.event_id) {
            lastEventIdRef.current = Math.max(lastEventIdRef.current, event.meta.event_id);
        }

        if (event.type === 'sync_batch') {
            const nestedEvents = event.data?.events || [];
            for (const nestedEvent of nestedEvents) {
                await handleSocketEvent(nestedEvent);
            }
            return;
        }

        switch (event.type) {
            case 'presence_snapshot':
                setOnlineUserIds(event.data?.online_user_ids || []);
                return;
            case 'presence_changed':
                setOnlineUserIds((previous) => {
                    const nextUsers = new Set(previous);
                    if (event.data?.is_online) {
                        nextUsers.add(event.data.user_id);
                    } else {
                        nextUsers.delete(event.data.user_id);
                    }
                    return Array.from(nextUsers);
                });
                return;
            case 'conversation_created':
            case 'conversation_updated':
                upsertConversation(event.data);
                return;
            case 'conversation_members_added':
                upsertConversation(event.data?.conversation);
                return;
            case 'conversation_member_removed':
                if (event.data?.user_id === currentUserId) {
                    setConversations((previous) =>
                        previous.filter((conversation) => conversation.id !== event.conversation_id),
                    );
                    if (activeConversationId === event.conversation_id) {
                        setActiveConversationId(null);
                        setMessages([]);
                    }
                } else {
                    await hydrateConversation(event.conversation_id);
                }
                return;
            case 'conversation_hidden':
                if (event.data?.user_id === currentUserId) {
                    setConversations((previous) =>
                        previous.filter((conversation) => conversation.id !== event.conversation_id),
                    );
                    if (activeConversationId === event.conversation_id) {
                        setActiveConversationId(null);
                        setMessages([]);
                    }
                }
                return;
            case 'conversation_deleted':
                setConversations((previous) =>
                    previous.filter((conversation) => conversation.id !== event.conversation_id),
                );
                if (activeConversationId === event.conversation_id) {
                    setActiveConversationId(null);
                    setMessages([]);
                }
                return;
            case 'message_created':
            case 'attachment_uploaded':
                patchConversationWithMessage(event.data);
                updateTypingUsers(event.conversation_id, event.data?.sender_id, false);

                if (event.conversation_id === activeConversationId) {
                    upsertMessage(event.data);
                    if (event.data?.sender_id !== currentUserId && document.visibilityState === 'visible') {
                        markConversationAsReadAPI(event.conversation_id).catch(() => undefined);
                    }
                } else if (!conversations.some((conversation) => conversation.id === event.conversation_id)) {
                    await hydrateConversation(event.conversation_id);
                }
                return;
            case 'message_deleted':
                if (event.conversation_id === activeConversationId) {
                    upsertMessage(event.data);
                }
                patchConversationWithMessage(event.data);
                return;
            case 'message_read':
                patchSeenState(event.data);
                return;
            case 'friend_request_created':
                upsertFriendRequest(event.data);
                return;
            case 'friend_request_removed':
                removeFriendRequestById(event.data?.request_id);
                return;
            case 'friend_request_accepted':
                removeFriendRequestById(event.data?.request_id);
                upsertFriendFromFriendship(event.data?.friendship);
                return;
            case 'friendship_removed':
                removeFriendByUserIds(event.data?.user_a_id, event.data?.user_b_id);
                return;
            case 'typing_started':
                updateTypingUsers(event.conversation_id, event.data?.user_id, true);
                return;
            case 'typing_stopped':
                updateTypingUsers(event.conversation_id, event.data?.user_id, false);
                return;
            case 'sync_required':
                await bootstrapApp();
                return;
            default:
                if (event.type.startsWith('video_call_')) {
                    videoCallEventRef.current?.(event);
                }
                return;
        }
    };

    const { socketStatus, sendEvent } = useChatSocket({
        enabled: Boolean(token),
        token,
        lastEventIdRef,
        onEvent: handleSocketEvent,
    });

    const videoCallState = useVideoCall(currentUserId, sendEvent);
    videoCallEventRef.current = videoCallState.handleVideoCallEvent;

    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    useEffect(() => {
        if (!sidebarError) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setSidebarError('');
        }, SIDEBAR_ERROR_TIMEOUT_MS);

        return () => {
            window.clearTimeout(timer);
        };
    }, [sidebarError]);

    useEffect(() => {
        let isCancelled = false;

        const runBootstrap = async () => {
            if (!token) {
                setBootstrapLoading(false);
                return;
            }

            setBootstrapLoading(true);
            setSidebarError('');

            try {
                const { friendsData, orderedConversations, profileData, requestsData } =
                    await loadBootstrapData();

                if (isCancelled) {
                    return;
                }

                setProfile(profileData);
                setFriends(friendsData);
                setFriendRequests(requestsData);
                setConversations(orderedConversations);
                setActiveConversationId((previous) => {
                    if (previous && orderedConversations.some((item) => item.id === previous)) {
                        return previous;
                    }

                    return orderedConversations[0]?.id || null;
                });
            } catch (error) {
                console.error('Unable to bootstrap chat page:', error);
                if (!isCancelled) {
                    setSidebarError('Không thể tải dữ liệu chat từ backend.');
                }
            } finally {
                if (!isCancelled) {
                    setBootstrapLoading(false);
                }
            }
        };

        runBootstrap();

        return () => {
            isCancelled = true;
        };
    }, [token]);

    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            setMessagesError('');
            setHasOlderMessages(false);
            setIsLoadingOlderMessages(false);
            return undefined;
        }

        let isCancelled = false;

        const loadMessages = async () => {
            setMessagesLoading(true);
            setMessagesError('');
            setHasOlderMessages(false);
            setIsLoadingOlderMessages(false);

            try {
                const history = await getMessagesAPI(activeConversationId, {
                    limit: MESSAGE_PAGE_SIZE,
                    skip: 0,
                });
                if (isCancelled) {
                    return;
                }

                const sortedHistory = sortMessages(history);
                setMessages(sortedHistory);
                setHasOlderMessages(history.length === MESSAGE_PAGE_SIZE);
                setConversations((previous) => {
                    const targetConversation = previous.find((item) => item.id === activeConversationId);
                    if (!targetConversation) {
                        return previous;
                    }

                    const normalizedConversation = normalizeConversationParticipants({
                        conversation: targetConversation,
                        currentUserId,
                        friends,
                        history: sortedHistory,
                        profile,
                    });
                    if (normalizedConversation === targetConversation) {
                        return previous;
                    }

                    const filtered = previous.filter((item) => item.id !== activeConversationId);
                    return sortConversations([...filtered, normalizedConversation]);
                });
                await markConversationAsReadAPI(activeConversationId).catch(() => undefined);
            } catch (error) {
                console.error('Unable to fetch messages:', error);
                if (!isCancelled) {
                    setMessagesError('Không thể tải tin nhắn của cuộc trò chuyện này.');
                }
            } finally {
                if (!isCancelled) {
                    setMessagesLoading(false);
                }
            }
        };

        loadMessages();

        return () => {
            isCancelled = true;
        };
    }, [activeConversationId, currentUserId, friends, profile]);

    useEffect(() => {
        if (!activeConversationId) {
            return undefined;
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                markConversationAsReadAPI(activeConversationId).catch(() => undefined);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [activeConversationId]);

    useEffect(() => {
        return () => {
            clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    const selectConversation = (conversationId) => {
        setSidebarError('');
        stopTyping(activeConversationId);
        setActiveConversationId(conversationId);
    };

    const handleComposerChange = (event) => {
        const nextValue = event.target.value;
        setMessageInput(nextValue);

        if (!activeConversationId || socketStatus !== 'open') {
            return;
        }

        if (nextValue.trim() && !hasSentTypingRef.current) {
            hasSentTypingRef.current = true;
            sendEvent({
                type: 'typing_start',
                conversation_id: activeConversationId,
            });
        }

        clearTimeout(typingTimeoutRef.current);

        if (!nextValue.trim()) {
            stopTyping(activeConversationId);
            return;
        }

        typingTimeoutRef.current = setTimeout(() => {
            stopTyping(activeConversationId);
        }, 1200);
    };

    const handleSendMessage = async () => {
        const trimmedMessage = messageInput.trim();
        if (!trimmedMessage || !activeConversationId || isSendingMessage) {
            return;
        }

        setIsSendingMessage(true);
        setMessageInput('');
        stopTyping(activeConversationId);

        try {
            const createdMessage = await sendMessageAPI(activeConversationId, trimmedMessage);
            upsertMessage(createdMessage);
            patchConversationWithMessage(createdMessage);
        } catch (error) {
            console.error('Unable to send message:', error);
            setMessageInput(trimmedMessage);
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleSendOnEnter = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileSelected = async (file) => {
        if (!file || !activeConversationId) {
            return;
        }

        setIsUploading(true);

        try {
            await uploadConversationFileAPI(activeConversationId, file);
            if (socketStatus !== 'open') {
                const history = await getMessagesAPI(activeConversationId, {
                    limit: MESSAGE_PAGE_SIZE,
                    skip: 0,
                });
                setMessages(sortMessages(history));
                setHasOlderMessages(history.length === MESSAGE_PAGE_SIZE);
                await hydrateConversation(activeConversationId);
            }
        } catch (error) {
            console.error('Unable to upload attachment:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const loadOlderMessages = async () => {
        if (
            !activeConversationId
            || messagesLoading
            || isLoadingOlderMessages
            || !hasOlderMessages
        ) {
            return [];
        }

        const targetConversationId = activeConversationId;
        const skip = messages.length;

        setIsLoadingOlderMessages(true);

        try {
            const history = await getMessagesAPI(targetConversationId, {
                limit: MESSAGE_PAGE_SIZE,
                skip,
            });

            if (activeConversationIdRef.current !== targetConversationId) {
                return [];
            }

            if (history.length === 0) {
                setHasOlderMessages(false);
                return [];
            }

            setMessages((previous) => {
                const existingIds = new Set(previous.map((message) => message.id));
                const olderMessages = history.filter((message) => !existingIds.has(message.id));

                if (olderMessages.length === 0) {
                    return previous;
                }

                return sortMessages([...olderMessages, ...previous]);
            });
            setHasOlderMessages(history.length === MESSAGE_PAGE_SIZE);
            return history;
        } catch (error) {
            console.error('Unable to load older messages:', error);
            return [];
        } finally {
            if (activeConversationIdRef.current === targetConversationId) {
                setIsLoadingOlderMessages(false);
            }
        }
    };

    const createConversation = async ({
        friendIds,
        forceGroupMode = false,
        groupName = '',
    }) => {
        if (!friendIds?.length || isCreateBusy) {
            return null;
        }

        const isGroup = forceGroupMode || friendIds.length > 1;

        setIsCreateBusy(true);
        setSidebarError('');
        try {
            const createdConversation = await createConversationAPI({
                type: isGroup ? 'group' : 'direct',
                group_name: isGroup ? groupName.trim() || null : null,
                user_ids: friendIds,
            });

            upsertConversation(createdConversation);
            setActiveConversationId(createdConversation.id);
            setSidebarError('');
            return createdConversation;
        } finally {
            setIsCreateBusy(false);
        }
    };

    const startDirectChat = async (friendId) => {
        const existingConversation = directConversationMap[friendId];
        if (existingConversation) {
            setActiveConversationId(existingConversation.id);
            return existingConversation;
        }

        return createConversation({
            friendIds: [friendId],
        });
    };

    const updateConversation = async ({ conversationId, groupName }) => {
        if (!conversationId || isConversationActionBusy) {
            return null;
        }

        setIsConversationActionBusy(true);
        setSidebarError('');
        try {
            const updatedConversation = await updateConversationAPI(conversationId, {
                group_name: groupName?.trim() || null,
            });
            upsertConversation(updatedConversation);
            setSidebarError('');
            return updatedConversation;
        } catch (error) {
            console.error('Unable to update conversation:', error);
            setSidebarError(error.response?.data?.detail || 'Không thể cập nhật thông tin nhóm.');
            throw error;
        } finally {
            setIsConversationActionBusy(false);
        }
    };

    const addConversationMembers = async ({ conversationId, userIds }) => {
        if (!conversationId || !userIds?.length || isConversationActionBusy) {
            return null;
        }

        setIsConversationActionBusy(true);
        setSidebarError('');
        try {
            const updatedConversation = await addConversationMembersAPI(conversationId, userIds);
            upsertConversation(updatedConversation);
            setSidebarError('');
            return updatedConversation;
        } catch (error) {
            console.error('Unable to add conversation members:', error);
            setSidebarError(error.response?.data?.detail || 'Không thể thêm thành viên vào nhóm.');
            throw error;
        } finally {
            setIsConversationActionBusy(false);
        }
    };

    const deleteConversation = async ({ conversationId }) => {
        if (!conversationId || isConversationActionBusy) {
            return;
        }

        setIsConversationActionBusy(true);
        setSidebarError('');
        try {
            await deleteConversationAPI(conversationId);
            setConversations((previous) =>
                previous.filter((conversation) => conversation.id !== conversationId),
            );
            if (activeConversationId === conversationId) {
                setActiveConversationId(null);
                setMessages([]);
            }
            setSidebarError('');
        } catch (error) {
            console.error('Unable to delete conversation:', error);
            setSidebarError(error.response?.data?.detail || 'Không thể xóa cuộc trò chuyện này.');
            throw error;
        } finally {
            setIsConversationActionBusy(false);
        }
    };

    const withFriendActionLoading = async (key, callback) => {
        setFriendActionLoadingMap((previous) => ({
            ...previous,
            [key]: true,
        }));

        try {
            return await callback();
        } finally {
            setFriendActionLoadingMap((previous) => {
                const nextState = { ...previous };
                delete nextState[key];
                return nextState;
            });
        }
    };

    const sendFriendRequest = async (user) => {
        try {
            setSidebarError('');
            return await withFriendActionLoading(user.id, async () => {
                const request = await sendFriendRequestAPI(user.id);
                upsertFriendRequest(request);
                setSidebarError('');
                return request;
            });
        } catch (error) {
            console.error('Unable to send friend request:', error);
            setSidebarError(error.response?.data?.detail || 'Không thể gửi lời mời kết bạn.');
            throw error;
        }
    };

    const acceptFriendRequest = async (requestId) => {
        try {
            setSidebarError('');
            return await withFriendActionLoading(requestId, async () => {
                const friendship = await acceptFriendRequestAPI(requestId);
                removeFriendRequestById(requestId);
                upsertFriendFromFriendship(friendship);
                setSidebarError('');
                return friendship;
            });
        } catch (error) {
            console.error('Unable to accept friend request:', error);
            setSidebarError(error.response?.data?.detail || 'Không thể chấp nhận lời mời kết bạn.');
            throw error;
        }
    };

    const declineFriendRequest = async (requestId) => {
        try {
            setSidebarError('');
            return await withFriendActionLoading(requestId, async () => {
                await deleteFriendRequestAPI(requestId);
                removeFriendRequestById(requestId);
                setSidebarError('');
            });
        } catch (error) {
            console.error('Unable to remove friend request:', error);
            setSidebarError(error.response?.data?.detail || 'Không thể cập nhật lời mời kết bạn.');
            throw error;
        }
    };

    const typingLabel = (typingState[activeConversationId] || [])
        .map((userId) =>
            activeConversation?.participants?.find((participant) => participant.id === userId)?.display_name,
        )
        .filter(Boolean)
        .join(', ');

    const value = {
        acceptFriendRequest,
        addConversationMembers,
        activeConversation,
        activeConversationId,
        bootstrapApp,
        bootstrapLoading,
        conversations,
        createConversation,
        currentUserId,
        deleteConversation,
        declineFriendRequest,
        directConversationMap,
        friendActionLoadingMap,
        friendRequests,
        friends,
        handleComposerChange,
        handleFileSelected,
        handleSendMessage,
        handleSendOnEnter,
        incomingRequests,
        isCreateBusy,
        isConversationActionBusy,
        isLoadingOlderMessages,
        isSendingMessage,
        isUploading,
        hasOlderMessages,
        loadOlderMessages,
        messageInput,
        messages,
        messagesError,
        messagesLoading,
        onlineUserIds,
        outgoingRequests,
        pendingRequestCount,
        profile,
        selectConversation,
        sendFriendRequest,
        setMessageInput,
        setSidebarError,
        setTheme,
        sidebarError,
        socketStatus,
        startDirectChat,
        theme,
        toggleTheme: () => setTheme((previous) => (previous === 'dark' ? 'light' : 'dark')),
        typingLabel,
        updateConversation,
        upsertConversation,
        videoCallState,
    };

    return <ZolaAppStoreContext.Provider value={value}>{children}</ZolaAppStoreContext.Provider>;
}
