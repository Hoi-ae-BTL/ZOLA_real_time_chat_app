import React, { useState } from 'react';
import { Phone, PhoneOff, Video as VideoIcon, Minimize2, Maximize2 } from 'lucide-react';
import { Avatar } from './ChatPrimitives';
import { useTranslation } from 'react-i18next';

export function IncomingCallOverlay({ incomingCall, onAccept, onReject }) {
    const { t } = useTranslation();
    if (!incomingCall) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex w-80 flex-col items-center rounded-3xl bg-[var(--card-bg)] p-6 shadow-2xl text-[var(--text-primary)]">
                <Avatar 
                    name={incomingCall.callerName || t('stranger')} 
                    src={incomingCall.callerAvatar} 
                    size="xl" 
                />
                
                <h3 className="mt-4 text-xl font-bold">{incomingCall.callerName || t('stranger')}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{t('callingYou')}</p>
                
                <div className="mt-8 flex w-full justify-center gap-6">
                    <button 
                        onClick={onReject}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
                    >
                        <PhoneOff size={24} />
                    </button>
                    <button 
                        onClick={onAccept}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:bg-green-600 animate-bounce"
                    >
                        <Phone size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ActiveCallOverlay({ activeCall, localStream, remoteStream, onEndCall }) {
    const { t } = useTranslation();
    const [isMinimized, setIsMinimized] = useState(false);

    const attachLocalVideo = (el) => {
        if (el && localStream && el.srcObject !== localStream) {
            el.srcObject = localStream;
        }
    };

    const attachRemoteVideo = (el) => {
        if (el && remoteStream && el.srcObject !== remoteStream) {
            el.srcObject = remoteStream;
        }
    };

    if (!activeCall) return null;

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-[100] flex w-72 flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl transition-all">
                <div className="flex items-center justify-between bg-zinc-800 px-3 py-2 cursor-pointer" onClick={() => setIsMinimized(false)}>
                    <div className="flex items-center gap-2 truncate">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="truncate text-sm font-medium text-white">{activeCall.partnerName}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }} className="text-zinc-400 hover:text-white">
                        <Maximize2 size={16} />
                    </button>
                </div>
                <div className="relative aspect-[3/4] bg-zinc-950">
                    {remoteStream ? (
                        <video ref={attachRemoteVideo} autoPlay playsInline className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-xs text-white/70">{t('connecting')}</div>
                    )}
                    {localStream && (
                        <div className="absolute bottom-2 right-2 h-20 w-14 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 shadow-lg">
                            <video ref={attachLocalVideo} autoPlay playsInline muted className="h-full w-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                        </div>
                    )}
                </div>
                <div className="flex justify-center bg-zinc-900 py-3">
                    <button onClick={onEndCall} className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600">
                        <PhoneOff size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-900 text-white">
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-6">
                <div className="flex items-center gap-3">
                    <Avatar 
                        name={activeCall.partnerName || t('stranger')} 
                        src={activeCall.partnerAvatar} 
                        size="md" 
                    />
                    <div>
                        <h3 className="font-semibold">{activeCall.partnerName || t('stranger')}</h3>
                        <p className="text-xs text-white/70">
                            {activeCall.established ? t('videoCalling') : t('ringing')}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsMinimized(true)}
                    className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition tooltip"
                    title={t('minimizeToChat')}
                >
                    <Minimize2 size={24} />
                </button>
            </div>

            <div className="relative flex-1 bg-zinc-950">
                {remoteStream ? (
                    <video 
                        ref={attachRemoteVideo} 
                        autoPlay 
                        playsInline 
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center animate-pulse">
                            <Avatar size="2xl" name={activeCall.partnerName} src={activeCall.partnerAvatar} />
                            <p className="mt-4 text-xl text-white/80">
                                {activeCall.established ? t('loadingStream') : t('waitingForAnswer')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Local Video - Floating Picture-in-Picture */}
                {localStream && (
                    <div className="absolute bottom-28 right-6 h-56 w-40 overflow-hidden rounded-2xl bg-zinc-800 shadow-2xl border-2 border-zinc-700/50">
                        <video 
                            ref={attachLocalVideo} 
                            autoPlay 
                            playsInline 
                            muted
                            className="h-full w-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center bg-gradient-to-t from-black/90 to-transparent pb-8 pt-12">
                <div className="flex items-center gap-6">
                    <button onClick={() => setIsMinimized(true)} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 transition tooltip" title="Thu nhỏ">
                        <Minimize2 size={24} />
                    </button>
                    <button 
                        onClick={() => onEndCall()}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
                    >
                        <PhoneOff size={28} />
                    </button>
                </div>
            </div>
        </div>
    );
}
