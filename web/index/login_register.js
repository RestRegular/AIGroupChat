function setUserCookie(username, expiresDays = 1) {
    const date = new Date();
    date.setTime(date.getTime() + (expiresDays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    const encodedUsername = encodeURIComponent(username);
    document.cookie = `username=${encodedUsername}; ${expires}; path=/`;
}

function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function deleteAllCookies() {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].split("=")[0];
        deleteCookie(cookie);
    }
}

function checkCookieValid(){
    const username = getCookie('username');
    if (username && username !== 'null' && username !== 'undefined') {
        hasLogin = true;
        fetch(serverURL + '/api/get_user_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: ""
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    loadSessionDatas(data.data);
                } else {
                    alert('Cookie 验证失败，请重新登录！');
                    setUserCookie(null, 0);
                    openAuthPopup();
                }
            })
            .catch(error => console.error("请求错误：", error))
    }
}

checkCookieValid()

function openAuthPopup() {
    if (hasLogin){
        alert('您已登录！无需重复登录或注册。');
        return;
    }
    authPopup.classList.remove('hidden');
    authPopup.classList.add('flex');
    setTimeout(() => {
        authContainer.classList.remove('scale-95', 'opacity-0');
        authContainer.classList.add('scale-100', 'opacity-100');
    }, 10);
}

// 隐藏弹窗
function closeAuthPopup() {
    authContainer.classList.remove('scale-100', 'opacity-100');
    authContainer.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        authPopup.classList.add('hidden');
        resetCodeTimer(); // 重置验证码计时器
    }, 300);
}

// 切换选项卡
function switchTab(activeTab, inactiveTab, activeForm, inactiveForm, activeTabWord, inactiveTabWord) {
    activeTab.classList.add('border-primary', 'text-primary');
    activeTab.classList.remove('border-transparent', 'text-gray-500');
    inactiveTab.classList.add('border-transparent', 'text-gray-500');
    inactiveTab.classList.remove('border-primary', 'text-primary');
    activeForm.classList.remove('hidden');
    inactiveForm.classList.add('hidden');
    activeTabWord.classList.remove('hidden')
    inactiveTabWord.classList.add('hidden')
}

function checkNotLogin() {
    if (hasLogin === false) {
        // 显示登录弹窗
        openAuthPopup();
        switchTab(loginTab, registerTab, loginForm, registerForm, registerTabWord, loginTabWord)
        return true;
    }
    return false;
}
function openRegisterPopup() {
    openAuthPopup();
    switchTab(registerTab, loginTab, registerForm, loginForm, loginTabWord, registerTabWord)
}
loginTab.addEventListener('click', () => switchTab(loginTab, registerTab, loginForm, registerForm, registerTabWord, loginTabWord));
registerTab.addEventListener('click', () => switchTab(registerTab, loginTab, registerForm, loginForm, loginTabWord, registerTabWord));
loginTabWord.addEventListener('click', () => switchTab(loginTab, registerTab, loginForm, registerForm, registerTabWord, loginTabWord));
registerTabWord.addEventListener('click', () => switchTab(registerTab, loginTab, registerForm, loginForm, loginTabWord, registerTabWord));
document.getElementById('close-auth').addEventListener('click', closeAuthPopup);
authPopup.addEventListener('click', (e) => {
    if (e.target === authPopup) {
        closeAuthPopup();
    }
});

toggleRegister.addEventListener('click', () => {
    const input = document.getElementById('register-password');
    if (input.type === 'password') {
        input.type = 'text';
        toggleRegister.innerHTML = '<i class="fa fa-eye"></i>';
    } else {
        input.type = 'password';
        toggleRegister.innerHTML = '<i class="fa fa-eye-slash"></i>';
    }
});

// 验证码倒计时
function startCodeTimer() {
    getCode.disabled = true;
    getCode.classList.add('bg-gray-300', 'text-gray-400');
    getCode.innerHTML = '60秒后重新获取';
    secondsLeft = 60;

    codeTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            getCode.innerHTML = `${secondsLeft}秒后重新获取`;
        } else {
            resetCodeTimer();
        }
    }, 1000);
}

function resetCodeTimer() {
    if (codeTimer) clearInterval(codeTimer);
    getCode.disabled = false;
    getCode.classList.remove('bg-gray-300', 'text-gray-400');
    getCode.innerHTML = '获取验证码';
}

// 获取验证码按钮事件
getCode.addEventListener('click', () => {
    const email = document.getElementById('register-email').value;
    if (!email) {
        alert('请先输入邮箱');
        return;
    }
    startCodeTimer();
    console.log('发送验证码到:', email); // 实际项目中调用发送验证码API
});

// 显示/隐藏加载状态
function showLoadingStateInButton(button) {
    button.disabled = true;
    button.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> 处理中...';
}

function hideLoadingStateInButton(button) {
    button.disabled = false;
    if (button.id === 'login-btn') {
        button.innerHTML = '<i class="fa fa-sign-in mr-2"></i> 登录';
    } else {
        button.innerHTML = '<i class="fa fa-user-plus mr-2"></i> 注册';
    }
}

function loadSessionDatas(sessionData) {
    for (const key in sessionData.ais) {
        const ai = sessionData.ais[key];
        addAIByObj(ai);
    }
}

// 登录按钮事件
document.getElementById('login-btn').addEventListener('click', () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }

    showLoadingStateInButton(document.getElementById('login-btn'));
    fetch(serverURL + '/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('登录成功');
                hasLogin = true;
                setUserCookie(username);
                loadSessionDatas(data.sessionData);
                closeAuthPopup();
            } else if (data.status === 'error') {
                if (data.cause === 'PasswordError') {
                    alert('密码错误');
                } else if (data.cause === 'UnexistNameError') {
                    const needRegister = confirm('用户不存在，是否注册?')
                    if (needRegister) {
                        document.getElementById('register-username').value = username;
                        switchTab(registerTab, loginTab, registerForm, loginForm, loginTabWord, registerTabWord);
                    }
                } else {
                    alert('登录失败，可能是服务器出现异常，请稍后再试！');
                }
            }
        })
        .catch(error => {
            console.error("请求错误：", error);
        })
        .finally(() => {
            hideLoadingStateInButton(document.getElementById('login-btn'));
        })
});

// 注册按钮事件
document.getElementById('register-btn').addEventListener('click', () => {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const email = document.getElementById('register-email').value;
    const code = document.getElementById('register-code').value;
    const agreeTerms = document.getElementById('agree-terms').checked;

    if (!username || !password || !email || !code || !agreeTerms) {
        alert('请填写所有必填信息并同意用户协议');
        return;
    }

    showLoadingStateInButton(document.getElementById('register-btn'));
    fetch(serverURL + '/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password,
            email: email,
            code: code
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('注册成功！请登录');
                document.getElementById('login-username').value = username;
                switchTab(loginTab, registerTab, loginForm, registerForm, registerTabWord, loginTabWord)
            } else if (data.status === 'error') {
                if (data.cause === "UsernameDuplicated") {
                    alert('用户名已存在，换一个名称试试吧！');
                } else {
                    alert('注册失败，可能是服务器出现异常，请稍后再试！');
                }
            }
        })
        .catch(error => {
            console.error("请求错误：", error);
        })
        .finally(() => {
            hideLoadingStateInButton(document.getElementById('register-btn'));
        })
});

// 切换菜单显示/隐藏
authBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 阻止事件冒泡

    if (authMenu.classList.contains('invisible')) {
        // 显示菜单
        authMenu.classList.remove('invisible', 'opacity-0', 'translate-y-2');
        authMenu.classList.add('opacity-100', 'translate-y-0');

        // 添加点击外部关闭菜单的事件
        document.addEventListener('click', closeAuthMenu);
    } else {
        // 隐藏菜单
        closeAuthMenu();
    }
});

function logout() {
    hasLogin = false;
    deleteAllCookies();
    singleAIArea.innerHTML = '';
    chatContainer.innerHTML = '';
    chatTitle.textContent = '';
    ais.length = 0;
}

// 点击菜单选项后关闭菜单
document.querySelectorAll('#auth-menu a').forEach(option => {
    option.addEventListener('click', (e) => {
        e.preventDefault();
        closeAuthMenu();
        const option_str = option.textContent.trim();
        if (option_str === '登录'){
            openAuthPopup();
        } else if (option_str === '注册'){
            openRegisterPopup();
        } else if (option_str === '退出登录') {
            if (hasLogin) {
                logout();
            } else {
                if (confirm('您还未登录，是否进行登录？')) {
                    openAuthPopup();
                }
            }
        } else {
            alert(option_str + '功能正在开发中');
        }
    });
});

// 关闭菜单
function closeAuthMenu() {
    authMenu.classList.add('invisible', 'opacity-0', 'translate-y-2');
    authMenu.classList.remove('opacity-100', 'translate-y-0');
    document.removeEventListener('click', closeAuthMenu);
}

// 显示加载状态
function showLoadingState() {
    authBtn.disabled = true;
    authBtn.classList.add('bg-gray-100');
    authLoading.classList.remove('opacity-0');
}

// 隐藏加载状态
function hideLoadingState() {
    authBtn.disabled = false;
    authBtn.classList.remove('bg-gray-100');
    authLoading.classList.add('opacity-0');
}