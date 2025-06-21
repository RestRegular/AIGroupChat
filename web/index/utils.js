// 全局变量
const serverURL = "http://localhost:3000";
const apiURL = serverURL + '/api'
const profilePath = 'https://picsum.photos/200/200?random=user';
const ais = {};
const groups = {};
let hasLogin = false;
let beforeEditAI = null;

// DOM元素
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const chatTitle = document.getElementById('chat-title');
const editTitleInput = document.getElementById('edit-title');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatContainer = document.getElementById('chat-container');
const shareBtn = document.getElementById('share-btn');
const shareModal = document.getElementById('share-modal');
const shareContainer = document.getElementById('share-container');
const typingIndicator = document.getElementById('typing-indicator');
const mainContent = document.getElementById('main-content');
const singleAIArea = document.getElementById('single-ai-area')
const groupAIArea = document.getElementById('ai-group-area')
const recentHistoryArea = document.getElementById('recent-history-area')
const newChatBtn = document.getElementById('new-chat-btn');
const createChatModel = document.getElementById('create-chat-modal');
const createChatContainer = document.getElementById('create-chat-container');
const singleAiTab = document.getElementById('single-ai-tab');
const singleAiForm = document.getElementById('single-ai-form');
const groupChatTab = document.getElementById('group-chat-tab');
const groupChatForm = document.getElementById('group-chat-form');
const showApiKeyBtn = document.getElementById('show-api-key');
const apiKeyInput = document.getElementById('api-key');
const confirmCreateChatBtn = document.getElementById('confirm-create-chat');
const authBtn = document.getElementById('auth-btn');
const authMenu = document.getElementById('auth-menu');
const authLoading = document.getElementById('auth-loading');
const authPopup = document.getElementById('auth-popup');
const authContainer = document.getElementById('auth-container');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginTabWord = document.getElementById('switch-to-login');
const registerTabWord = document.getElementById('switch-to-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toggleLogin = document.getElementById('toggle-login');
const toggleRegister = document.getElementById('toggle-register');
const getCode = document.getElementById('get-code');
const modal = document.getElementById('edit-ai-modal');
const container = document.getElementById('edit-ai-container');
const closeBtn = document.getElementById('close-edit-ai');
const cancelBtn = document.getElementById('cancel-edit-ai');
const confirmEditAIBtn = document.getElementById('confirm-edit-ai');
const copyBtn = document.getElementById('copy-api-key');
const editApiKeyInput = document.getElementById('api-key');

function getCookie(name) {
    const cookieStr = document.cookie;
    const cookies = cookieStr.split('; ');
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.split('=');
        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null;
}

// 生成类似 UUID 的唯一标识符
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatDate(date) {
    // 如果传入的是时间戳，先转换为Date对象
    if (typeof date === 'number') {
        date = new Date(date);
    }
    // 获取当前时间和目标时间的时间戳（毫秒）
    const now = new Date();
    const targetTime = date.getTime();
    const currentTime = now.getTime();

    // 计算时间差（分钟）
    const diffInMinutes = Math.floor((currentTime - targetTime) / (1000 * 60));

    // 根据时间差返回不同的结果
    if (diffInMinutes < 2) {
        return "刚刚";
    } else if (diffInMinutes < 5) {
        return `${diffInMinutes}分钟前`;
    } else {
        // 如果超过12分钟，返回格式化的完整时间
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}