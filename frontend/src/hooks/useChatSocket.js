import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { getApiBaseUrl } from '../api/apiClient';

const buildSocketUrl = (token) => {
    const url = new URL(getApiBaseUrl());
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    url.searchParams.set('token', token);
    return url.toString();
};

export const useChatSocket = ({ enabled, token, lastEventIdRef, onEvent }) => {
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const queuedEventsRef = useRef([]);
    const reconnectAttemptsRef = useRef(0);
    const heartbeatRef = useRef(null);
    const [socketStatus, setSocketStatus] = useState(enabled && token ? 'connecting' : 'idle');

    const handleIncomingEvent = useEffectEvent((event) => {
        onEvent?.(event);
    });

    const flushQueuedEvents = () => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        while (queuedEventsRef.current.length > 0) {
            const payload = queuedEventsRef.current.shift();
            socketRef.current.send(payload);
        }
    };

    const sendEvent = (payload) => {
        const serializedPayload = JSON.stringify(payload);
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(serializedPayload);
            return true;
        }

        queuedEventsRef.current.push(serializedPayload);
        return false;
    };

    useEffect(() => {
        if (!enabled || !token) {
            return undefined;
        }

        let isDisposed = false;

        const clearHeartbeat = () => {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
        };

        const connect = () => {
            if (isDisposed) {
                return;
            }

            setSocketStatus('connecting');
            const socket = new WebSocket(buildSocketUrl(token));
            socketRef.current = socket;

            socket.onopen = () => {
                reconnectAttemptsRef.current = 0;
                setSocketStatus('open');
                flushQueuedEvents();

                if (lastEventIdRef?.current > 0) {
                    socket.send(
                        JSON.stringify({
                            type: 'sync_request',
                            last_event_id: lastEventIdRef.current,
                        }),
                    );
                }

                clearHeartbeat();
                heartbeatRef.current = setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 25000);
            };

            socket.onmessage = (messageEvent) => {
                try {
                    const parsed = JSON.parse(messageEvent.data);
                    handleIncomingEvent(parsed);
                } catch (error) {
                    console.error('Invalid websocket payload:', error);
                }
            };

            socket.onerror = () => {
                socket.close();
            };

            socket.onclose = () => {
                clearHeartbeat();

                if (isDisposed) {
                    return;
                }

                setSocketStatus('closed');
                const reconnectDelay = Math.min(5000, 1000 * (2 ** reconnectAttemptsRef.current));
                reconnectAttemptsRef.current += 1;
                reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
            };
        };

        connect();

        return () => {
            isDisposed = true;
            clearHeartbeat();
            clearTimeout(reconnectTimeoutRef.current);
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [enabled, lastEventIdRef, token]);

    return {
        socketStatus,
        sendEvent,
    };
};
