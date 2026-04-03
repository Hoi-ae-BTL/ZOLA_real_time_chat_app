import { useState, useRef, useCallback } from 'react';
import Peer from 'peerjs';

export function useVideoCall(currentUserId, sendEvent) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    
    const peerRef = useRef(null);
    const callRef = useRef(null);
    const localStreamRef = useRef(null);

    const cleanupCall = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
        if (callRef.current) {
            callRef.current.close();
            callRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setActiveCall(null);
        setIncomingCall(null);
    }, []);

    const endCall = useCallback((remoteUserId) => {
        const idToEnd = remoteUserId || activeCall?.partnerId || incomingCall?.callerId;
        if (idToEnd && sendEvent) {
            sendEvent({
                type: 'video_call_end',
                target_user_id: idToEnd,
                data: {}
            });
        }
        cleanupCall();
    }, [activeCall, incomingCall, sendEvent, cleanupCall]);

    const handleVideoCallEvent = useCallback((event) => {
        if (!event) return;
        const { type, data } = event;

        if (type === 'video_call_request') {
            if (activeCall || incomingCall) {
                sendEvent({
                    type: 'video_call_reject',
                    target_user_id: data.callerId,
                    data: { reason: 'busy' }
                });
                return;
            }
            setIncomingCall({
                callerId: data.callerId,
                callerName: data.callerName,
                callerAvatar: data.callerAvatar,
                peerId: data.peerId
            });
        } else if (type === 'video_call_accept') {
            const partnerPeerId = data.peerId;
            if (activeCall && !activeCall.established && partnerPeerId) {
                const call = peerRef.current.call(partnerPeerId, localStreamRef.current);
                callRef.current = call;

                call.on('stream', (userVideoStream) => {
                    setRemoteStream(userVideoStream);
                });

                call.on('close', () => {
                    cleanupCall();
                });

                setActiveCall(prev => ({ ...prev, established: true }));
            }
        } else if (type === 'video_call_reject') {
            cleanupCall();
            alert('Cuộc gọi đã bị từ chối.');
        } else if (type === 'video_call_end') {
            cleanupCall();
        }
    }, [activeCall, incomingCall, sendEvent, cleanupCall]);

    const startCall = async (targetUser, currentUserProfile) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream;

            const peer = new Peer({
                host: '0.peerjs.com',
                port: 443,
                secure: true
            });
            peerRef.current = peer;

            peer.on('open', (id) => {
                setActiveCall({
                    partnerId: targetUser.id,
                    partnerName: targetUser.display_name || targetUser.username,
                    partnerAvatar: targetUser.avatar_url,
                    established: false,
                    isCaller: true
                });

                sendEvent({
                    type: 'video_call_request',
                    target_user_id: targetUser.id,
                    data: {
                        callerId: currentUserProfile.id,
                        callerName: currentUserProfile.display_name || currentUserProfile.username,
                        callerAvatar: currentUserProfile.avatar_url,
                        peerId: id
                    }
                });
            });

            peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                cleanupCall();
            });

        } catch (error) {
            console.error('Lỗi truy cập thiết bị:', error);
            alert('Không thể truy cập Camera hoặc Microphone.');
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream;

            const peer = new Peer({
                host: '0.peerjs.com',
                port: 443,
                secure: true
            });
            peerRef.current = peer;

            peer.on('open', (id) => {
                setActiveCall({
                    partnerId: incomingCall.callerId,
                    partnerName: incomingCall.callerName,
                    partnerAvatar: incomingCall.callerAvatar,
                    established: true,
                    isCaller: false
                });

                sendEvent({
                    type: 'video_call_accept',
                    target_user_id: incomingCall.callerId,
                    data: {
                        peerId: id
                    }
                });
                
                setIncomingCall(null);
            });

            peer.on('call', (call) => {
                callRef.current = call;
                call.answer(localStreamRef.current);
                
                call.on('stream', (userVideoStream) => {
                    setRemoteStream(userVideoStream);
                });
                
                call.on('close', () => {
                    cleanupCall();
                });
            });

            peer.on('error', (err) => {
                console.error('PeerJS error on accept:', err);
                cleanupCall();
            });

        } catch (error) {
             console.error('Lỗi truy cập thiết bị:', error);
             rejectCall();
        }
    };

    const rejectCall = () => {
        if (incomingCall) {
            sendEvent({
                type: 'video_call_reject',
                target_user_id: incomingCall.callerId,
                data: {}
            });
            setIncomingCall(null);
        }
        cleanupCall();
    };

    return {
        localStream,
        remoteStream,
        incomingCall,
        activeCall,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        handleVideoCallEvent
    };
}
