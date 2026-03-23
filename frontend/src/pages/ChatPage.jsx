import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChatPage() {
    const navigate = useNavigate();
    const [messageInput, setMessageInput] = useState('');

    // Dữ liệu giả lập (Mock Data) để giao diện không bị trống
    const mockFriends = [
        { id: 1, name: "Hưng (Backend)", lastMsg: "API login xong rồi nha!", time: "10:30" },
        { id: 2, name: "Tuấn (Design)", lastMsg: "Ê xem hộ cái logo", time: "09:15" },
        { id: 3, name: "Hà (Tester)", lastMsg: "Bug ngập mặt rồi anh ơi 😭", time: "Hôm qua" },
    ];

    const mockMessages = [
        { id: 1, sender: "Hưng (Backend)", text: "Tao deploy API lên server rồi đấy.", isMe: false },
        { id: 2, sender: "Me", text: "Ngon, để tao nối API vào giao diện.", isMe: true },
        { id: 3, sender: "Hưng (Backend)", text: "Nhớ gắn cái Bearer Token vào Header nhé!", isMe: false },
    ];

    // Hàm xử lý Đăng xuất
    const handleLogout = () => {
        localStorage.removeItem('access_token'); // Xóa vé
        navigate('/login'); // Đá về trang đăng nhập
    };

    return (
        // Container chính: Chiều cao bằng 100% màn hình, không cho cuộn trang (overflow-hidden)
        <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">

            {/* ================= CỘT TRÁI (SIDEBAR) ================= */}
            <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col min-w-[300px]">
                {/* Header Sidebar: Avatar và nút Đăng xuất */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            T
                        </div>
                        <span className="font-semibold text-gray-700">Thế Dev</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-red-500 hover:bg-red-50 px-3 py-1 rounded transition"
                    >
                        Đăng xuất
                    </button>
                </div>

                {/* Thanh tìm kiếm */}
                <div className="p-3 border-b border-gray-200">
                    <input
                        type="text"
                        placeholder="Tìm kiếm bạn bè..."
                        className="w-full bg-gray-100 px-4 py-2 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-300 transition"
                    />
                </div>

                {/* Danh sách bạn bè (Có thể cuộn) */}
                <div className="flex-1 overflow-y-auto">
                    {mockFriends.map((friend) => (
                        <div key={friend.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition">
                            <div className="w-12 h-12 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-semibold text-gray-800 truncate">{friend.name}</h3>
                                    <span className="text-xs text-gray-400">{friend.time}</span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">{friend.lastMsg}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ================= CỘT PHẢI (MAIN CHAT) ================= */}
            <div className="flex-1 flex flex-col bg-slate-50 relative">

                {/* Header Khung Chat: Tên người đang chat */}
                <div className="h-16 border-b border-gray-200 bg-white flex items-center px-6 shadow-sm z-10">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full mr-3"></div>
                    <div>
                        <h2 className="font-semibold text-gray-800">Hưng (Backend)</h2>
                        <span className="text-xs text-green-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span> Đang hoạt động
                        </span>
                    </div>
                </div>

                {/* Khu vực hiển thị tin nhắn (Cuộn dọc) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {mockMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                msg.isMe 
                                ? 'bg-blue-600 text-white rounded-br-none shadow-md' 
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                            }`}>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Ô nhập tin nhắn (Nằm dưới cùng) */}
                <div className="p-4 bg-white border-t border-gray-200 flex gap-3 items-center">
                    <button className="text-gray-400 hover:text-blue-500 transition">
                        {/* Icon đính kèm (Tạm dùng Emoji) */}
                        📎
                    </button>
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 bg-gray-100 px-4 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-300 transition"
                        onKeyDown={(e) => e.key === 'Enter' && setMessageInput('')}
                    />
                    <button
                        onClick={() => setMessageInput('')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-semibold shadow-md transition"
                    >
                        Gửi
                    </button>
                </div>

            </div>
        </div>
    );
}