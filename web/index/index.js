// 侧边栏切换
toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    if (sidebar.classList.contains('-translate-x-full')) {
        toggleSidebarBtn.innerHTML = '<i class="fa fa-bars"></i>';
        mainContent.style.marginLeft = "0px";
    } else {
        toggleSidebarBtn.innerHTML = '<i class="fa fa-times"></i>';
        mainContent.classList.remove('max-w-3xl', 'mx-auto');
    }
});

// 编辑聊天标题
chatTitle.addEventListener('click', () => {
    chatTitle.classList.add('hidden');
    editTitleInput.classList.remove('hidden');
    editTitleInput.value = chatTitle.textContent;
    editTitleInput.focus();
});

editTitleInput.addEventListener('blur', () => {
    if (editTitleInput.value.trim() !== '' && chatTitle.textContent !== editTitleInput.value){
        updateAI(chatTitle.textContent, {
            aiName: editTitleInput.value
        })
        chatTitle.textContent = editTitleInput.value;
    }
    chatTitle.classList.remove('hidden');
    editTitleInput.classList.add('hidden');
});

editTitleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        editTitleInput.blur();
    }
});

// 调整输入框高度
messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    let height = Math.min(messageInput.scrollHeight, 120);
    height = Math.max(height, 45);
    messageInput.style.height = height + 'px';

    // 启用/禁用发送按钮
    sendBtn.disabled = messageInput.value.trim() === '';
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// 分享功能
shareBtn.addEventListener('click', () => {
    if (checkNotLogin()) return;
    shareModal.classList.remove('hidden');
    shareModal.classList.add('flex');
    document.getElementById('share-title').value = chatTitle.textContent;
    setTimeout(() => {
        shareContainer.classList.remove('scale-95', 'opacity-0');
        shareContainer.classList.add('scale-100', 'opacity-100');
    }, 10);
});

function closeShareModal() {
    shareContainer.classList.remove('scale-100', 'opacity-100');
    shareContainer.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        shareModal.classList.add('hidden');
        shareModal.classList.remove('flex');
    }, 300);
}

document.getElementById('close-share').addEventListener('click', closeShareModal);
document.getElementById('cancel-share').addEventListener('click', closeShareModal);

// 点击分享模态框外部关闭
shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) {
        closeShareModal();
    }
});

// 初始化
sendBtn.disabled = true;

// 为会话按钮添加切换会话事件
function addSessionBtnEvent(name) {
    let btnId = `ai-${name}-session-btn`;
    let elem = document.getElementById(btnId);
    elem.addEventListener('click', (e) => {
        // 更新标题
        const targetAI = elem.dataset.name
        chatTitle.textContent = targetAI;
        chatContainer.innerHTML = '';
        const messages = ais[targetAI].msgs
        // 更新聊天界面
        for (const msg of messages) {
            if (msg.role === 'user') {
                const {html, _} = getUserMsgHtml(profilePath, getCookie('username'), msg.content, msg.time);
                chatContainer.insertAdjacentHTML('beforeend', html);
            } else if (msg.role === 'assistant') {
                const aiMsgHtml = getAIMsgHtml(ais[targetAI].profileUrl, targetAI, msg.content, msg.time);
                chatContainer.insertAdjacentHTML('beforeend', aiMsgHtml);
            } else if (msg.role === 'system') {
                const systemMsgHtml = getSystemMsgHtml(msg.content);
                chatContainer.insertAdjacentHTML('beforeend', systemMsgHtml);
            } else {
                console.error(`Unknown message role: ${msg.role}`);
            }
        }
        chatContainer.scrollTop = chatContainer.scrollHeight;
    })
    btnId = `ai-${name}-session-edit-btn`;
    elem = document.getElementById(btnId);
    elem.addEventListener('click', (e) => {
        openModal(elem.dataset.name);
    })
    btnId = `ai-${name}-session-delete-btn`;
    elem = document.getElementById(btnId);
    elem.addEventListener('click', (e) => {
        if (confirm(`确定要删除此 AI（${elem.dataset.name}） 吗？`)) {
            fetch(serverURL + '/api/delete_ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    targetAI: elem.dataset.name
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        delete ais[elem.dataset.name];
                        if (chatTitle.textContent === elem.dataset.name) {
                            chatTitle.textContent = "";
                            chatContainer.innerHTML = '';
                        }
                        singleAIArea.removeChild(singleAIArea.querySelector(`#ai-${elem.dataset.name}-session-btn`));
                        alert("删除成功！")
                    } else {
                        alert(`删除失败，可能是服务器出现异常，请稍后重试！
Error: ${data.cause}`);
                    }
                })
                .catch(error => {
                    alert(`删除失败，可能是服务器出现异常，请稍后重试！\nError: ${JSON.stringify(error)}`);
                    console.error(error);
                });
        }
        else {
            alert("已取消删除。")
        }
    })
}

function addAI(profileUrl, name, url, modelID, apikey, sysSet, msgs) {
    ais[name] = {
        profileUrl: profileUrl,
        sysSet: sysSet,
        name: name,
        apikey: apikey,
        modelID: modelID,
        url: url,
        msgs: msgs
    };
    singleAIArea.insertAdjacentHTML('beforeend', getAICardHtml(name));
    addSessionBtnEvent(name);
}

function addAIByObj(ai) {
    const {profileUrl, name, url, modelID, apikey, sysSet, msgs} = ai;
    addAI(profileUrl, name, url, modelID, apikey, sysSet, msgs);
}

function addGroup(groupName, ais_, sysSet) {
    groups[groupName] = {
        ais: ais_,
        sysSet: sysSet,
        name: groupName
    }
    groupAIArea.innerHTML += getGroupCardHtml(groupName);
    addSessionBtnEvent(groupName);
}

function getAICardHtml(aiName) {
    if (ais[aiName]) {
        const profileUrl = ais[aiName].profileUrl;
        return `<div id="ai-${aiName}-session-btn" data-name="${aiName}" class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer group">
                    <div class="flex items-center">
                        <img src="${profileUrl}" alt="${aiName}" class="w-8 h-8 rounded-full mr-3">
                        <span data-name="${aiName}" id="ai-${aiName}-session-name">${aiName}</span>
                    </div>
                    
                    <!-- 按钮组 - 默认隐藏，悬停时显示 -->
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                        <!-- 编辑按钮 -->
                        <button data-name="${aiName}" id="ai-${aiName}-session-edit-btn" class="edit-btn p-2 rounded-full hover:bg-gray-200 text-gray-600 btn-hover">
                            <i class="fa fa-pencil transition-transform duration-300 hover:scale-110"></i>
                            <span class="sr-only">编辑</span>
                        </button>
                        
                        <!-- 删除按钮 -->
                        <button data-name="${aiName}" id="ai-${aiName}-session-delete-btn" class="delete-btn p-2 rounded-full hover:bg-red-100 text-red-500 btn-hover">
                            <i class="fa fa-trash-o transition-transform duration-300 hover:scale-110"></i>
                            <span class="sr-only">删除</span>
                        </button>
                    </div>
                </div>`
    } else {
        console.error(`AI [${aiName}] not found.`)
    }
}

function getGroupCardHtml(groupName) {
    if (groups[groupName]) {
        const members = groups[groupName].ais;
        return `<div data-name="${groupName}" id="group-${groupName}-session-btn" class="flex items-center p-2 rounded-lg bg-primary/10 cursor-pointer">
            <div class="flex -space-x-2">
                <img src="${members[0].profileUrl}" alt="${members[0].name}"
                     class="w-8 h-8 rounded-full border-2 border-white">
                <img src="${members[0].profileUrl}" alt="${members[1].name}"
                     class="w-8 h-8 rounded-full border-2 border-white">
            </div>
            <span class="ml-3">${groupName}</span>
        </div>`
    } else {
        console.error(`Group ${groupName} not found.`)
    }
}

newChatBtn.addEventListener('click', (e) => {
    if (checkNotLogin()) return;
    createChatModel.classList.remove('hidden');
    createChatModel.classList.add('flex');
    setTimeout(() => {
        createChatContainer.classList.remove('scale-95', 'opacity-0');
        createChatContainer.classList.add('scale-100', 'opacity-100');
    }, 10);
})

function closeCreateChatModal() {
    createChatContainer.classList.remove('scale-100', 'opacity-100');
    createChatContainer.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        createChatModel.classList.add('hidden');
        createChatModel.classList.remove('flex');
    }, 300);
}

createChatModel.addEventListener('click', (e) => {
    if (e.target === createChatModel) {
        closeCreateChatModal();
    }
});

// 选项卡切换事件
singleAiTab.addEventListener('click', () => {
    singleAiTab.classList.add('border-primary', 'text-primary');
    singleAiTab.classList.remove('border-transparent', 'text-gray-500');
    groupChatTab.classList.add('border-transparent', 'text-gray-500');
    groupChatTab.classList.remove('border-primary', 'text-primary');
    singleAiForm.classList.remove('hidden');
    groupChatForm.classList.add('hidden');
});

groupChatTab.addEventListener('click', () => {
    groupChatTab.classList.add('border-primary', 'text-primary');
    groupChatTab.classList.remove('border-transparent', 'text-gray-500');
    singleAiTab.classList.add('border-transparent', 'text-gray-500');
    singleAiTab.classList.remove('border-primary', 'text-primary');
    groupChatForm.classList.remove('hidden');
    singleAiForm.classList.add('hidden');
});

// 关闭按钮事件
document.getElementById('close-create-chat').addEventListener('click', closeCreateChatModal);
document.getElementById('cancel-create-chat').addEventListener('click', closeCreateChatModal);

// API Key显示/隐藏
showApiKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        showApiKeyBtn.innerHTML = '<i class="fa fa-eye"></i>';
    } else {
        apiKeyInput.type = 'password';
        showApiKeyBtn.innerHTML = '<i class="fa fa-eye-slash"></i>';
    }
});

// 确认创建按钮事件
confirmCreateChatBtn.addEventListener('click', () => {
    if (singleAiForm.classList.contains('hidden')) {
        // // 群聊会话创建逻辑
        // const groupName = document.getElementById('group-name').value;
        // const groupSysSet = document.getElementById('group-sys-set').value;
        // const selectedAIs = Array.from(document.querySelectorAll('input[name="selected-ais"]:checked')).map(checkbox =>
        //     checkbox.nextElementSibling.textContent
        // );
        //
        // if (!groupName || selectedAIs.length === 0) {
        //     alert('请填写群聊名称并选择至少一个AI助手');
        //     return;
        // }
        //
        // // 可以通过form元素获取数据（替代方案）
        // // const formData = new FormData(groupChatForm);
        // // console.log('群聊表单数据:', Object.fromEntries(formData.entries()));
        //
        // console.log('创建群聊会话:', {
        //     groupName,
        //     groupSysSet,
        //     selectedAIs
        // });
        // hideCreateChatModal();
    } else {
        // 单AI会话创建逻辑
        const aiName = document.getElementById('ai-name').value;
        const aiUrl = document.getElementById('ai-url').value;
        const modelID = document.getElementById('model-id').value;
        const apiKey = document.getElementById('api-key').value;
        const sysSet = document.getElementById('sys-set').value;

        if (!aiName || !aiUrl || !modelID || !apiKey) {
            alert('请填写AI名称、接口URL、Model ID和API Key');
            return;
        }

        fetch(serverURL + '/api/create_ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: aiName,
                url: aiUrl,
                modelID: modelID,
                apikey: apiKey,
                sysSet: sysSet,
                profileUrl: profilePath
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert("创建成功！");
                    addAI(profilePath, aiName, aiUrl, modelID, apiKey, sysSet, []);
                    (() => {
                        document.getElementById('ai-name').value = '';
                        document.getElementById('ai-url').value = '';
                        document.getElementById('model-id').value = '';
                        document.getElementById('api-key').value = '';
                        document.getElementById('sys-set').value = ''
                    })()
                } else if (data.status === 'error') {
                    alert(`创建失败，请稍后重试。\n失败原因：${data.cause}`);
                } else {
                    alert("创建失败，可能是服务器出现异常，请稍后再试！");
                }
            })
            .catch(err => {
                console.error(err);
                alert("创建失败，可能是服务器出现异常，请稍后再试！");
            })
            .finally(() => {
                closeCreateChatModal();
            })
    }
})

// 打开弹窗
function openModal(aiName) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    beforeEditAI = ais[aiName];
    document.getElementById('edit-ai-name').value = aiName;
    document.getElementById('edit-api-url').value = beforeEditAI.url;
    document.getElementById('edit-api-key').value = beforeEditAI.apikey;
    document.getElementById('edit-model-id').value =beforeEditAI.modelID;
    document.getElementById('edit-sys-set').value = beforeEditAI.sysSet;
    setTimeout(() => {
        container.classList.remove('scale-95', 'opacity-0');
        container.classList.add('scale-100', 'opacity-100');
    }, 10);
}

// 关闭弹窗
function closeModal() {
    container.classList.remove('scale-100', 'opacity-100');
    container.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// 绑定事件
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

// 点击模态框背景关闭弹窗
modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        closeModal();
    }
});

// API Key复制功能
if (copyBtn && apiKeyInput) {
    copyBtn.addEventListener('click', function() {
        apiKeyInput.select();
        document.execCommand('copy');

        // 复制成功反馈
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa fa-check mr-1"></i>已复制';
        copyBtn.classList.add('bg-green-100', 'text-green-700');

        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove('bg-green-100', 'text-green-700');
        }, 2000);
    });
}

function updateSessionBtn(pre, oldName, newName) {
    let elem = document.getElementById(`${pre}-${oldName}-session-btn`);
    elem.id = `${pre}-${newName}-session-btn`;
    elem.dataset.name = newName;
    elem = document.getElementById(`${pre}-${oldName}-session-edit-btn`);
    elem.id = `${pre}-${newName}-session-edit-btn`;
    elem.dataset.name = newName;
    elem = document.getElementById(`${pre}-${oldName}-session-delete-btn`);
    elem.id = `${pre}-${newName}-session-delete-btn`;
    elem.dataset.name = newName;
    elem = document.getElementById(`${pre}-${oldName}-session-name`);
    elem.id = `${pre}-${newName}-session-name`;
    elem.dataset.name = newName;
}

function updateAI(oldAIName, { aiName, apiUrl, modelID, apiKey, sysSet }) {
    beforeEditAI = ais[oldAIName];
    if (!aiName) aiName = oldAIName;
    if (!apiUrl) apiUrl = beforeEditAI.url;
    if (!modelID) modelID = beforeEditAI.modelID;
    if (!apiKey) apiKey = beforeEditAI.apikey;
    if (!sysSet) sysSet = beforeEditAI.sysSet;
    document.getElementById(`ai-${beforeEditAI.name}-session-name`).textContent = aiName;
    ais[aiName] = {
        name: aiName,
        url: apiUrl,
        modelID: modelID,
        apikey: apiKey,
        sysSet: sysSet,
        profileUrl: beforeEditAI.profileUrl,
        msgs: ais[beforeEditAI.name].msgs
    };
    if (beforeEditAI.name !== aiName) {
        delete ais[beforeEditAI.name];
    }
    updateSessionBtn('ai', beforeEditAI.name, aiName);
    fetch(serverURL + '/api/edit_ai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            oldName: beforeEditAI.name,
            newAI: {
                name: aiName,
                url: apiUrl,
                modelID: modelID,
                apikey: apiKey,
                sysSet: sysSet,
                profileUrl: beforeEditAI.profileUrl
            }
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                beforeEditAI = null;
                alert("修改成功！");
            } else if (data.status === 'error') {
                alert(`修改失败，请稍后重试。\n失败原因：${data.cause}`);
            } else {
                alert("修改失败，可能是服务器出现异常，请稍后再试！");
            }
        })
        .catch(err => {
            console.error(err);
            alert("修改失败，可能是服务器出现异常，请稍后再试！");
        })
}

confirmEditAIBtn.addEventListener('click', () => {
    const aiName = document.getElementById('edit-ai-name').value;
    const apiUrl = document.getElementById('edit-api-url').value;
    const apiKey = document.getElementById('edit-api-key').value;
    const modelID = document.getElementById('edit-model-id').value;
    const sysSet = document.getElementById('edit-sys-set').value;
    updateAI(beforeEditAI.name, {
        aiName,
        apiUrl,
        modelID,
        apiKey,
        sysSet
    });
    closeModal();
})