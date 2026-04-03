import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  vi: {
    translation: {
      // Menu / Navigation
      search: "Tìm kiếm",
      settings: "Cài đặt",
      signOut: "Đăng xuất",
      all: "Tất cả",
      unread: "Chưa đọc",
      messages: "Tin nhắn",
      contacts: "Danh bạ",
      help: "Trợ giúp",
      
      // Settings Page
      security: "Bảo mật tài khoản",
      privacy: "Quyền riêng tư",
      notifications: "Thông báo",
      theme: "Giao diện",
      language: "Ngôn ngữ",
      
      manageAccount: "Quản lý tài khoản",
      qrCode: "Mã QR",
      
      appearance: "Hiển thị",
      appearanceDesc: "Tuỳ chỉnh giao diện ứng dụng trên thiết bị của bạn.",
      light: "Sáng",
      dark: "Tối",
      system: "Hệ thống",

      privacyAndSecurity: "Quyền riêng tư & Bảo mật",
      viewFullPolicy: "Xem chi tiết chính sách",
      
      lastSeen: "Trạng thái hoạt động",
      lastSeenValue: "Mọi người đều có thể thấy",
      e2e: "Mã hoá đầu cuối",
      e2eValue: "Kích hoạt bảo vệ tất cả tin nhắn",
      twoFactor: "Xác thực 2 bước",
      twoFactorValue: "Bật qua SMS",
      blockList: "Danh sách chặn",
      blockListValue: "Quản lý liên hệ bị hạn chế",

      storageAndData: "Dữ liệu & Cấu hình",
      storageDesc: "Quản lý tập tin đa phương tiện và bộ nhớ đệm.",
      used: "Đã dùng",
      photos: "Hình ảnh",
      videos: "Video",
      documents: "Tài liệu",
      otherApps: "Ứng dụng khác",

      friendsSynced: "Bạn bè đã đồng bộ",
      chatsStored: "Cuộc trò chuyện",
      onlineContacts: "Liên hệ trực tuyến",
      connected: "Đã kết nối",
      syncing: "Đang nạp...",
      
      // Language Picker
      vietnamese: "Tiếng Việt",
      english: "Tiếng Anh",

      // Chat Page
      newMessage: "Nhắn tin mới",
      newGroup: "Tạo nhóm mới",
      noConversations: "Không tìm thấy cuộc trò chuyện nào.",
      selectConversation: "Chọn một đoạn chat",
      selectConversationDesc: "Chọn một liên hệ từ danh sách bên trái hoặc tạo đoạn chat mới để bắt đầu ngay.",
      openConversations: "Mở danh sách đoạn chat",
      
      startVideoCall: "Bắt đầu gọi Video",
      startVoiceCall: "Bắt đầu gọi thoại",
      searchInConversation: "Tìm kiếm trong cuộc trò chuyện",
      conversationInfo: "Thông tin hội thoại",
      
      typeMessage: "Nhập tin nhắn...",
      uploadAttachment: "Tải lên tệp đính kèm",
      uploadImage: "Tải lên hình ảnh",
      attachFile: "Đính kèm tệp",
      emojiPicker: "Bộ chọn Emoji",
      isTyping: "đang soạn tin nhắn...",

      // Video Call Overlays
      stranger: "Người lạ",
      callingYou: "Đang gọi cho bạn...",
      connecting: "Đang kết nối...",
      calling: "Đang gọi...",
      ringing: "Đang đổ chuông...",
      videoCalling: "Đang gọi video",
      waitingForAnswer: "Đang chờ đối phương bắt máy...",
      loadingStream: "Đang tải luồng video...",
      minimizeToChat: "Thu nhỏ để nhắn tin",
      minimize: "Thu nhỏ",

      // Common / Misc
      online: "Trực tuyến",
      offline: "Ngoại tuyến",
      today: "HÔM NAY",
      members: "thành viên"
    }
  },
  en: {
    translation: {
      search: "Search",
      settings: "Settings",
      signOut: "Sign out",
      all: "All",
      unread: "Unread",
      messages: "Messages",
      contacts: "Contacts",
      help: "Help",
      
      security: "Account Security",
      privacy: "Privacy",
      notifications: "Notifications",
      theme: "Interface Theme",
      language: "Language",
      
      manageAccount: "Manage Account",
      qrCode: "QR Code",
      
      appearance: "Appearance",
      appearanceDesc: "Customize how Zola looks on your device.",
      light: "Light",
      dark: "Dark",
      system: "System",

      privacyAndSecurity: "Privacy & Security",
      viewFullPolicy: "View Full Policy",
      
      lastSeen: "Last Seen Status",
      lastSeenValue: "Everyone can see",
      e2e: "E2E Encryption",
      e2eValue: "Active for all chats",
      twoFactor: "2-Step Verification",
      twoFactorValue: "Enabled via SMS",
      blockList: "Block List",
      blockListValue: "Manage restricted contacts",

      storageAndData: "Storage and Data",
      storageDesc: "Manage your chat media and cached files.",
      used: "Used",
      photos: "Photos",
      videos: "Videos",
      documents: "Documents",
      otherApps: "Other Apps",

      friendsSynced: "Friends synced",
      chatsStored: "Chats stored",
      onlineContacts: "Online contacts",
      connected: "Connected",
      syncing: "Syncing",
      
      vietnamese: "Vietnamese",
      english: "English",

      newMessage: "New message",
      newGroup: "New group",
      noConversations: "No conversations found.",
      selectConversation: "Select a conversation",
      selectConversationDesc: "Pick an existing thread from the left or start a new chat based on the contacts already loaded.",
      openConversations: "Open conversations",
      
      startVideoCall: "Start video call",
      startVoiceCall: "Start voice call",
      searchInConversation: "Search in conversation",
      conversationInfo: "Conversation info",
      
      typeMessage: "Type a message...",
      uploadAttachment: "Upload attachment",
      uploadImage: "Upload image",
      attachFile: "Attach file",
      emojiPicker: "Emoji picker",
      isTyping: "is typing...",

      stranger: "Stranger",
      callingYou: "Calling you...",
      connecting: "Connecting...",
      calling: "Calling...",
      ringing: "Ringing...",
      videoCalling: "Video calling",
      waitingForAnswer: "Waiting for answer...",
      loadingStream: "Loading video stream...",
      minimizeToChat: "Minimize to chat",
      minimize: "Minimize",

      online: "Online",
      offline: "Offline",
      today: "TODAY",
      members: "members"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi', // Mặc định là Tiếng Việt
    lng: 'vi',         // Ép ngôn ngữ sang vi nếu không bắt được
    interpolation: {
      escapeValue: false // React đã chống XSS mặc định
    }
  });

export default i18n;
