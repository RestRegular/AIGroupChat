function getSystemMsgHtml(msg) {
    return `<div class="flex justify-center">
        <span class="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">${msg}</span>
    </div>`
}

function getAIMsgHtml(profilePath, aiName, msg, time) {
    // 预处理msg，为code标签添加代码框容器和顶部栏
    const processedMsg = msg.replace(/<pre><code([^>]*)class="([^"]*)"([^>]*)>([\s\S]*?)<\/code><\/pre>/g,
        (match, p1, classes, p3, codeContent) => {
        // 从class中提取语言信息
        const langMatch = classes.match(/language-(\w+)/);
        const lang = langMatch ? langMatch[1] : 'plaintext';

        // 生成随机ID用于复制功能
        const id = 'code-' + Math.random().toString(36).substring(2, 10);

        return `<div class="code-container bg-white rounded-lg overflow-hidden mb-4 shadow-lg border border-gray-200">
            <div class="code-header flex justify-between items-center px-4 py-2 bg-gray-100 text-white border-b border-gray-200">
                <div class="flex items-center space-x-2">
                    <div class="flex space-x-1">
                        <span class="w-3 h-3 rounded-full bg-red-500"></span>
                        <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span class="w-3 h-3 rounded-full bg-green-500"></span>
                    </div>
                    <span id="${id}-lang" class="text-sm font-medium text-gray-600">${lang}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="copy-btn text-gray-400 hover:text-white transition-colors text-sm px-2 py-1 rounded" data-code-id="${id}">
                        <i class="fa fa-copy mr-1"></i>复制
                    </button>
                    <button class="theme-toggle text-gray-400 hover:text-white transition-colors text-sm px-2 py-1 rounded" data-code-id="${id}">
                        <i class="fa fa-moon-o mr-1"></i>亮色
                    </button>
                </div>
            </div>
            <pre id="${id}" class="m-0 p-4 overflow-x-auto"><code${p1}class="hljs ${classes}"${p3}>${codeContent}</code></pre>
        </div>`;
    });

    return `<div class="flex items-start message-appear">
        <img src="${profilePath}" alt="${aiName}" class="w-8 h-8 rounded-full mr-3">
        <div class="max-w-[80%]">
            <div class="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
                ${processedMsg}
            </div>
            <span class="text-xs text-gray-500 ml-1" style="font-size: 0.85rem;">${formatDate(time)}</span>
        </div>
    </div>`;
}

document.addEventListener('click', function(e) {
    // 复制功能
    if (e.target.closest('.copy-btn')) {
        const btn = e.target.closest('.copy-btn');
        const codeId = btn.getAttribute('data-code-id');
        const codeElement = document.getElementById(codeId);
        const textToCopy = codeElement.textContent;

        navigator.clipboard.writeText(textToCopy).then(function() {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa fa-check mr-1"></i>已复制';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        });
    }

    // 主题切换功能
    if (e.target.closest('.theme-toggle')) {
        const btn = e.target.closest('.theme-toggle');
        const codeId = btn.getAttribute('data-code-id');
        const codeContainer = document.getElementById(codeId).closest('.code-container');
        const codeElement = document.getElementById(codeId).querySelector('code');
        const codeLang = document.getElementById(codeId + '-lang');

        // 切换主题
        if (codeContainer.classList.contains('bg-gray-800')) {
            codeContainer.classList.remove('bg-gray-800', 'border-gray-700');
            codeContainer.classList.add('bg-white', 'border-gray-200');
            codeContainer.querySelector('.code-header').classList.remove('bg-gray-900', 'border-gray-700');
            codeContainer.querySelector('.code-header').classList.add('bg-gray-100', 'border-gray-200');
            codeContainer.querySelector('.code-header span').classList.remove('text-gray-300');
            codeContainer.querySelector('.code-header span').classList.add('text-gray-700');
            codeElement.classList.remove('text-gray-100');
            codeElement.classList.add('text-gray-900');
            btn.innerHTML = '<i class="fa fa-sun-o mr-1"></i>亮色';
            codeLang.classList.remove('text-gray-100');
            codeLang.classList.add('text-gray-600');
        } else {
            codeContainer.classList.add('bg-gray-800', 'border-gray-700');
            codeContainer.classList.remove('bg-white', 'border-gray-200');
            codeContainer.querySelector('.code-header').classList.add('bg-gray-900', 'border-gray-700');
            codeContainer.querySelector('.code-header').classList.remove('bg-gray-100', 'border-gray-200');
            codeContainer.querySelector('.code-header span').classList.add('text-gray-300');
            codeContainer.querySelector('.code-header span').classList.remove('text-gray-700');
            codeElement.classList.add('text-gray-100');
            codeElement.classList.remove('text-gray-900');
            btn.innerHTML = '<i class="fa fa-moon-o mr-1"></i>暗色';
            codeLang.classList.remove('text-gray-600');
            codeLang.classList.add('text-gray-100');
        }
    }
});

function getUserMsgHtml(profilePath, userName, msg, time) {
    const uid = generateUUID();
    return {
        html: `<div class="flex items-start justify-end message-appear">
                    <div class="max-w-[80%]">
                        <div class="flex justify-end">
                            <div class="inline-block bg-primary text-white rounded-lg rounded-tr-none p-3 shadow-sm">
                                <p>${msg}</p>
                            </div>
                        </div>
                        <div class="flex justify-end">
                            <i id="${uid}" class="fa fa-exclamation-circle text-red mr-2 hidden" style="color: #e74c3c;"></i>
                            <span class="text-xs text-gray-500 mr-1" style="font-size: 0.85rem;">${formatDate(time)}</span>
                        </div>
                    </div>
                    <img src="${profilePath}" alt="用户头像" class="w-8 h-8 rounded-full ml-3">
                </div>`,
        id: uid
    }
}

function recordMessage(aiName, role, message, time) {
    if (ais[aiName]) {
        ais[aiName].msgs.push({
            role: role,
            content: message,
            time: time
        })
    } else {
        console.error(`AI ${aiName} 不存在`);
    }
}

function updateCodeHighlight() {
    document.querySelectorAll('code').forEach((block) => {
        hljs.highlightElement(block);
    });
}

// 发送消息
function sendMessage() {
    if (checkNotLogin()) return;
    const msg = messageInput.value.trim();
    if (!msg) return;
    const targetAI = chatTitle.textContent;
    // 添加用户消息到聊天区域
    let time = Date.now();
    const {html, id} = getUserMsgHtml(profilePath, '用户', msg, Date.now());
    recordMessage(targetAI, 'user', msg, time);
    const reqMsg = {
        role: 'user',
        content: msg,
        time: time
    };

    chatContainer.insertAdjacentHTML('beforeend', html);
    messageInput.value = '';
    messageInput.style.height = '45px';
    sendBtn.disabled = true;
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const warnElem = document.getElementById(id);

    // 显示AI正在输入的指示器
    typingIndicator.classList.remove('hidden');

    // 获取AI回复内容
    fetch(apiURL + "/chat", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            targetAI: targetAI,
            msg: reqMsg
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                time = Date.now();
                const aiMessageHTML = getAIMsgHtml(ais[targetAI].profileUrl, targetAI, data.data.content, time);
                recordMessage(targetAI, 'assistant', data.data.content, time);
                chatContainer.insertAdjacentHTML('beforeend', aiMessageHTML);
                chatContainer.scrollTop = chatContainer.scrollHeight;
                updateCodeHighlight();
            } else {
                warnElem.classList.remove('hidden');
                console.error("获取AI回复内容失败：", data.cause);
            }
        })
        .catch(error => {
            console.error("请求错误：", error);
            warnElem.classList.remove('hidden');
        })
        .finally(() => {
            typingIndicator.classList.add('hidden');
        })
}

sendBtn.addEventListener('click', sendMessage);