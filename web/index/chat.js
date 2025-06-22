function getSystemMsgHtml(msg) {
    return `<div class="flex justify-center message-appear">
        <span class="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">${msg}</span>
    </div>`
}

function getAIMsgHtml(profilePath, aiName, msg, time) {
    const themeDropdownHtml = (codeId) => `
        <div class="theme-dropdown relative ml-2">
          <button class="theme-select-btn text-gray-400 hover:text-black transition-colors text-sm px-2 py-1 rounded flex items-center" data-code-id="${codeId}">
            <i class="fa fa-paint-brush mr-1"></i>主题
            <i class="fa fa-caret-down ml-1"></i>
          </button>
          <div class="theme-options absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg dropdown-shadow z-10 hidden max-h-[200px] overflow-y-auto" style="scrollbar-width: none;" data-code-id="${codeId}">
            ${availableCodeThemes.map(theme => 
              `<button class="theme-option w-full text-gray-500 text-left px-4 py-2 text-sm hover:bg-gray-200 transition-colors flex items-center ${theme === 'default' ? 'font-medium' : ''}" 
                 data-theme="${theme}" data-code-id="${codeId}">
                ${theme}
              </button>`).join('')}
          </div>
        </div>`;

    let processedMsg = msg.replace(/<pre><code([^>]*)class="([^"]*)"([^>]*)>([\s\S]*?)<\/code><\/pre>/g,
        (match, p1, classes, p3, codeContent) => {
        const langMatch = classes.match(/language-(\w+)/);
        const lang = (langMatch && langMatch[1] !== 'undefined') ? langMatch[1] : 'plaintext';
        const id = 'code-' + Math.random().toString(36).substring(2, 10);
        return `<div class="code-container bg-white rounded-lg overflow-hidden mb-4 shadow-md border border-gray-200">
            <div class="code-header flex justify-between items-center px-4 py-2 bg-gray-100 text-white border-b border-gray-200">
                <div class="flex items-center space-x-2">
                    <div class="flex space-x-1">
                        <span class="w-3 h-3 rounded-full bg-red-500"></span>
                        <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span class="w-3 h-3 rounded-full bg-green-500"></span>
                    </div>
                    <span class="code-lang text-sm font-medium text-gray-600">${lang}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="code-copy-btn text-gray-400 hover:text-black transition-colors text-sm px-2 py-1 rounded" data-code-id="${id}">
                        <i class="fa fa-copy mr-1"></i>复制
                    </button>
                    ${themeDropdownHtml(id)}
                    <button class="theme-toggle text-gray-400 hover:text-black transition-colors text-sm px-2 py-1 rounded" data-code-id="${id}">
                        <i class="fa fa-moon-o mr-1"></i>暗色
                    </button>
                </div>
            </div>
            <pre id="${id}" class="m-0 p-4 overflow-x-auto"><code${p1}class="hljs ${classes}"${p3} style="background-color: transparent;">${codeContent}</code></pre>
        </div>`;
    });

    processedMsg = processedMsg.replace(/<a\s+([^>]+)>([^<]+)<\/a>/g, (match, href, content) =>
        `<a ${href} class="text-primary hover:text-secondary transition-colors duration-300 link-underline">${content}</a>`);

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
                            <span class="text-xs text-gray-500 ml-1" style="font-size: 0.85rem;">${formatDate(time)}</span>
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