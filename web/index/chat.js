function getSystemMsgHtml(msg) {
    return `<div class="flex justify-center">
        <span class="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">${msg}</span>
    </div>`
}

function getAIMsgHtml(profilePath, aiName, msg, time) {
    return `<div class="flex items-start message-appear">
        <img src="${profilePath}" alt="${aiName}" class="w-8 h-8 rounded-full mr-3">
        <div class="max-w-[80%]">
            <div class="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
                ${msg}
            </div>
            <span class="text-xs text-gray-500 ml-1" style="font-size: 0.85rem;">${formatDate(time)}</span>
        </div>
    </div>`
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
    fetch(serverURL + "/chat", {
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