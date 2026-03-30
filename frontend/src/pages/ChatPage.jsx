import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfileAPI, getConversationsAPI, getConversationDetailsAPI, getMessagesAPI, sendMessageAPI } from '../api/chat.api';
import { logoutAPI } from '../api/auth.api';
import { jwtDecode } from "jwt-decode";

// Import các icon thanh mảnh từ Lucide
import {
    Search, MoreVertical, Send, Paperclip, MessageSquarePlus,
    Image as ImageIcon, Smile, Phone, Video,
    User, LogOut, Settings, LoaderCircle
} from 'lucide-react';

export default function ChatPage() {
    const navigate = useNavigate();
    const [messageInput, setMessageInput] = useState('');
    
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [isLoadingSidebar, setIsLoadingSidebar] = useState(true);
    const [sidebarError, setSidebarError] = useState('');
    
    const [messages, setMessages] = useState([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [messagesError, setMessagesError] = useState('');

    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Lấy thông tin user từ token và tải profile
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            const decodedToken = jwtDecode(token);
            const userInfo = { id: decodedToken.sub };
            setCurrentUser(userInfo);

            const fetchProfile = async () => {
                try {
                    const profileData = await getMyProfileAPI();
                    setUserProfile(profileData);
                } catch (error) {
                    console.error("Không thể tải profile người dùng:", error);
                }
            };
            fetchProfile();
        } else {
            setIsLoadingSidebar(false);
        }
    }, []);

    // Tải danh sách cuộc trò chuyện
    useEffect(() => {
        if (!currentUser) return;
        const fetchConversations = async () => {
            try {
                setIsLoadingSidebar(true);
                const initialConvos = await getConversationsAPI();
                if (initialConvos.length === 0) {
                    setConversations([]);
                    setIsLoadingSidebar(false);
                    return;
                }
                const detailedConvosPromises = initialConvos.map(conv => getConversationDetailsAPI(conv.id));
                const detailedConvos = await Promise.all(detailedConvosPromises);
                setConversations(detailedConvos);
                if (detailedConvos.length > 0) {
                    setActiveConversationId(detailedConvos[0].id);
                }
            } catch (err) {
                setSidebarError("Không thể tải danh sách cuộc trò chuyện.");
            } finally {
                setIsLoadingSidebar(false);
            }
        };
        fetchConversations();
    }, [currentUser]);

    // Tải tin nhắn khi activeConversationId thay đổi
    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            return;
        }
        const fetchMessages = async () => {
            try {
                setIsLoadingMessages(true);
                setMessagesError('');
                const messageData = await getMessagesAPI(activeConversationId);
                setMessages(messageData);
            } catch (err) {
                setMessagesError("Không thể tải tin nhắn.");
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [activeConversationId]);

    const handleLogout = () => { logoutAPI(); };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !activeConversationId) return;

        const tempMessageInput = messageInput;
        setMessageInput(''); // Xóa input ngay lập tức để người dùng có thể gõ tiếp

        try {
            const newMessage = await sendMessageAPI(activeConversationId, tempMessageInput);
            // Cập nhật giao diện ngay lập tức với tin nhắn mới
            setMessages(prevMessages => [...prevMessages, newMessage]);
        } catch (error) {
            console.error("Lỗi gửi tin nhắn:", error);
            setMessageInput(tempMessageInput); // Trả lại nội dung nếu gửi thất bại
            // Có thể thêm state để hiển thị lỗi gửi tin nhắn
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getConversationDisplayData = (conv) => {
        if (!currentUser) return { avatar: <User size={24} />, name: "Đang tải..." };
        if (conv.type === 'group') return { avatar: <User size={24} />, name: conv.group_name || 'Nhóm không tên' };
        const otherUser = conv.participants?.find(p => p.id !== currentUser.id);
        if (otherUser) return { avatar: otherUser.avatar_url ? <img src={otherUser.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <User size={24} />, name: otherUser.display_name };
        if (conv.participants?.length === 1 && conv.participants[0].id === currentUser.id) {
            const self = conv.participants[0];
            return { avatar: self.avatar_url ? <img src={self.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <User size={24} />, name: `${self.display_name} (Bạn)` };
        }
        return { avatar: <User size={24} />, name: "Cuộc trò chuyện trống" };
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const activeConversationDisplay = activeConversation ? getConversationDisplayData(activeConversation) : null;

    return (
        <div className="flex h-screen bg-white font-sans text-slate-900 antialiased overflow-hidden">
            {/* --- SIDEBAR --- */}
            <div className="w-[350px] border-r border-slate-100 flex flex-col bg-slate-50/50">
                {/* User Profile Header */}
                <div className="p-5 flex justify-between items-center bg-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                {userProfile ? userProfile.display_name.charAt(0).toUpperCase() : '...'}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">{userProfile ? userProfile.display_name : 'Đang tải...'}</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Thiết lập trạng thái</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><Settings size={18} /></button>
                        <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-full text-red-400 transition-colors"><LogOut size={18} /></button>
                    </div>
                </div>
                {/* Search Bar */}
                <div className="p-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input type="text" placeholder="Tìm kiếm bạn bè..." className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm" />
                    </div>
                </div>
                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto px-2">
                    <h4 className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tin nhắn gần đây</h4>
                    {isLoadingSidebar ? (
                        <div className="flex justify-center items-center h-40"><LoaderCircle size={24} className="animate-spin text-slate-300" /></div>
                    ) : sidebarError ? (
                        <div className="text-center p-4 text-sm text-red-500">{sidebarError}</div>
                    ) : conversations.length > 0 ? (
                        conversations.map((conv) => {
                            const displayData = getConversationDisplayData(conv);
                            const isActive = conv.id === activeConversationId;
                            return (
                                <div key={conv.id} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 mb-1 ${isActive ? 'bg-blue-50 shadow-sm' : 'hover:bg-white'}`} onClick={() => setActiveConversationId(conv.id)}>
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex-shrink-0 flex items-center justify-center text-slate-500 overflow-hidden">{displayData.avatar}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className={`font-bold text-[14px] truncate ${isActive ? 'text-blue-800' : 'text-slate-800'}`}>{displayData.name}</h3>
                                            <span className={`text-[10px] ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>{conv.last_message_created_at ? new Date(conv.last_message_created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                        </div>
                                        <p className={`text-xs truncate ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>{conv.last_message_content || 'Chưa có tin nhắn'}</p>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center p-8 flex flex-col items-center justify-center h-full text-slate-400">
                            <MessageSquarePlus size={48} className="mb-4 text-slate-300" />
                            <h4 className="font-bold text-slate-500">Chưa có cuộc trò chuyện nào</h4>
                            <p className="text-sm mt-1">Hãy tìm kiếm bạn bè và bắt đầu kết nối!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MAIN CHAT --- */}
            <div className="flex-1 flex flex-col bg-white">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-[76px] border-b border-slate-100 flex items-center justify-between px-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold shadow-sm overflow-hidden">{activeConversationDisplay.avatar}</div>
                                <div>
                                    <h2 className="font-bold text-slate-800">{activeConversationDisplay.name}</h2>
                                    <p className="text-[11px] text-green-500 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Đang trực tuyến
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-blue-500 rounded-xl transition-all"><Phone size={20} /></button>
                                <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-blue-500 rounded-xl transition-all"><Video size={20} /></button>
                                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                                <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><MoreVertical size={20} /></button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                            {isLoadingMessages ? (
                                <div className="flex justify-center items-center h-full"><LoaderCircle size={32} className="animate-spin text-slate-300" /></div>
                            ) : messagesError ? (
                                <div className="text-center p-4 text-sm text-red-500">{messagesError}</div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUser.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                            {!isMe && <div className="w-8 h-8 rounded-lg bg-slate-200 mb-1"></div>}
                                            <div className={`max-w-[65%] group`}>
                                                <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>
                                                    {msg.content}
                                                </div>
                                                <p className={`text-[10px] mt-1 text-slate-400 ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Modern Input Bar */}
                        <div className="p-5 bg-white border-t border-slate-100">
                            <div className="max-w-4xl mx-auto bg-slate-100/80 rounded-2xl flex items-center p-1.5 gap-1 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all border border-transparent focus-within:border-blue-200">
                                <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Paperclip size={20} /></button>
                                <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><ImageIcon size={20} /></button>
                                <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Nhập nội dung tin nhắn..." className="flex-1 bg-transparent px-2 py-2 outline-none text-sm text-slate-700 placeholder:text-slate-400" />
                                <button className="p-2 text-slate-400 hover:text-yellow-500 transition-colors"><Smile size={20} /></button>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95" onClick={handleSendMessage}>
                                    <Send size={18} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                         <MessageSquarePlus size={64} className="mb-4 text-slate-300" />
                         <h4 className="font-bold text-lg text-slate-500">Chào mừng đến với ZOLA</h4>
                         <p className="text-sm mt-2">Chọn một cuộc trò chuyện để bắt đầu nhắn tin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}