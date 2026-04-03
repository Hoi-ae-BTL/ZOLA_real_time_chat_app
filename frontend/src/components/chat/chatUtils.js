import { getApiBaseUrl } from '../../api/apiClient';

export const formatClock = (value) => {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
};

export const formatSidebarTime = (value) => {
    if (!value) {
        return '';
    }

    const target = new Date(value);
    const today = new Date();
    const diff = today.getTime() - target.getTime();
    const dayDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (dayDiff <= 0) {
        return formatClock(value);
    }

    if (dayDiff < 7) {
        return `${dayDiff}d`;
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }).format(target);
};

export const formatDateDivider = (value) => {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
};

export const isSameDay = (left, right) => {
    if (!left || !right) {
        return false;
    }

    const leftDate = new Date(left);
    const rightDate = new Date(right);

    return (
        leftDate.getFullYear() === rightDate.getFullYear()
        && leftDate.getMonth() === rightDate.getMonth()
        && leftDate.getDate() === rightDate.getDate()
    );
};

export const sortConversations = (items) => {
    return [...items].sort((left, right) => {
        const leftValue = new Date(left.last_message_created_at || left.updated_at || left.created_at || 0).getTime();
        const rightValue = new Date(
            right.last_message_created_at || right.updated_at || right.created_at || 0,
        ).getTime();

        return rightValue - leftValue;
    });
};

export const sortMessages = (items) => {
    return [...items].sort((left, right) => {
        return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
    });
};

export const getInitials = (name = '') => {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    if (parts.length === 0) {
        return 'Z';
    }

    return parts.map((part) => part[0]?.toUpperCase() || '').join('');
};

export const resolveAssetUrl = (path) => {
    if (!path || typeof path !== 'string') {
        return '';
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // Đảm bảo không bị lặp dấu gạch chéo
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};

export const getConversationName = (conversation, currentUserId) => {
    if (!conversation) {
        return 'No conversation selected';
    }

    if (conversation.type === 'group') {
        return conversation.group_name || 'Untitled group';
    }

    const otherParticipant = conversation.participants?.find(
        (participant) => participant.id !== currentUserId,
    );
    const namedParticipant = otherParticipant
        || conversation.participants?.find(
            (participant) => participant.id !== currentUserId && (participant.display_name || participant.username),
        )
        || conversation.participants?.find(
            (participant) => participant.display_name || participant.username,
        );

    return namedParticipant?.display_name || namedParticipant?.username || 'User';
};

export const getConversationSubtitle = (conversation) => {
    if (!conversation?.last_message_content) {
        return conversation?.type === 'group'
            ? 'New group created'
            : 'Start a conversation';
    }

    return conversation.last_message_content;
};

export const getDirectConversationUser = (conversation, currentUserId) => {
    return conversation?.participants?.find((participant) => participant.id !== currentUserId) || null;
};

export const getConversationParticipantCount = (conversation) => {
    if (!conversation) {
        return 0;
    }

    return conversation.participant_count ?? conversation.participants?.length ?? 0;
};
