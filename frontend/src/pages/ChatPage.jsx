import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Import các icon thanh mảnh từ Lucide
import {
    Search, MoreVertical, Send, Paperclip,
    Image as ImageIcon, Smile, Phone, Video,
    User, LogOut, Settings
} from 'lucide-react';

export default function ChatPage() {
    const navigate = useNavigate();
    const [messageInput, setMessageInput] = useState('');

    const mockFriends = [
        { id: 1, name: "Hưng (Backend)", lastMsg: "API login xong rồi nha!", time: "10:30", active: true },
        { id: 2, name: "Tuấn (Design)", lastMsg: "Ê xem hộ cái logo", time: "09:15", active: false },
        { id: 3, name: "Hà (Tester)", lastMsg: "Bug ngập mặt rồi anh ơi 😭", time: "Hôm qua", active: false },
    ];

    const mockMessages = [
        { id: 1, sender: "Hưng", text: "Tao deploy API lên server rồi đấy.", isMe: false, time: "10:28" },
        { id: 2, sender: "Me", text: "Ngon, để tao nối API vào giao diện.", isMe: true, time: "10:29" },
        { id: 3, sender: "Hưng", text: "Nhớ gắn cái Bearer Token vào Header nhé!", isMe: false, time: "10:30" },
    ];

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-white font-sans text-slate-900 antialiased overflow-hidden">

            {/* --- SIDEBAR --- */}
            <div className="w-[350px] border-r border-slate-100 flex flex-col bg-slate-50/50">
                {/* User Profile Header */}
                <div className="p-5 flex justify-between items-center bg-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                T
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Thế Nguyễn</h3>
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
                        <input
                            type="text"
                            placeholder="Tìm kiếm bạn bè..."
                            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Friends List */}
                <div className="flex-1 overflow-y-auto px-2">
                    <h4 className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tin nhắn gần đây</h4>
                    {mockFriends.map((friend) => (
                        <div key={friend.id} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 mb-1 ${friend.active ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}>
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex-shrink-0 flex items-center justify-center text-slate-500">
                                <User size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-bold text-[14px] text-slate-800 truncate">{friend.name}</h3>
                                    <span className="text-[10px] text-slate-400">{friend.time}</span>
                                </div>
                                <p className={`text-xs truncate ${friend.active ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                                    {friend.lastMsg}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- MAIN CHAT --- */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Chat Header */}
                <div className="h-[76px] border-b border-slate-100 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold shadow-sm">
                            H
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Hưng (Backend)</h2>
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
                    {mockMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                            {!msg.isMe && <div className="w-8 h-8 rounded-lg bg-slate-200 mb-1"></div>}
                            <div className={`max-w-[65%] group`}>
                                <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                    msg.isMe 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                                <p className={`text-[10px] mt-1 text-slate-400 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                                    {msg.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modern Input Bar */}
                <div className="p-5 bg-white border-t border-slate-100">
                    <div className="max-w-4xl mx-auto bg-slate-100/80 rounded-2xl flex items-center p-1.5 gap-1 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all border border-transparent focus-within:border-blue-200">
                        <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Paperclip size={20} /></button>
                        <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><ImageIcon size={20} /></button>
                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Nhập nội dung tin nhắn..."
                            className="flex-1 bg-transparent px-2 py-2 outline-none text-sm text-slate-700 placeholder:text-slate-400"
                        />
                        <button className="p-2 text-slate-400 hover:text-yellow-500 transition-colors"><Smile size={20} /></button>
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                            onClick={() => setMessageInput('')}
                        >
                            <Send size={18} fill="currentColor" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}