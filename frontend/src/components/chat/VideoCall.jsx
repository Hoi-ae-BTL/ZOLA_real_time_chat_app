import { Phone, VideoOff, MicOff, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

const VideoCall = ({ localStream, remoteStream, onEndCall }) => {
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    useEffect(() => {
        if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
        if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    }, [localStream, remoteStream]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
            <div className="relative w-full max-w-4xl h-[600px] flex gap-4 p-4">
                <video ref={remoteVideoRef} autoPlay className="flex-1 bg-gray-800 rounded-2xl object-cover" />
                <video ref={localVideoRef} autoPlay muted className="absolute bottom-10 right-10 w-48 h-32 bg-gray-700 rounded-xl border-2 border-white object-cover" />

                <button onClick={onEndCall} className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-500 p-4 rounded-full text-white">
                    <Phone size={32} className="rotate-[135deg]" />
                </button>
            </div>
        </div>
    );
};
export default VideoCall;