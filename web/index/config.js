tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#4F46E5', // 主色调：靛蓝色
                secondary: '#818CF8', // 次要色：浅靛蓝色
                accent: '#A5B4FC', // 强调色：更浅的靛蓝色
                neutral: '#F3F4F6', // 中性色：浅灰色
                'neutral-dark': '#374151', // 深色中性色：深灰色
            },
            fontFamily: {
                inter: ['Inter', 'system-ui', 'sans-serif'],
            },
        }
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
    });
});

let currentLightTheme = 'light';
let currentTheme = 'default';

document.addEventListener('click', e => {
    // 复制功能
    if (e.target.closest('.code-copy-btn')) {
        const btn = e.target.closest('.code-copy-btn');
        const codeId = btn.getAttribute('resource-code-id');
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
    // 亮暗切换功能
    else if (e.target.closest('.theme-toggle')) {
        const codeContainers = document.querySelectorAll('.code-container');
        const codeElements = document.querySelectorAll('.code');
        const codeLangs = document.querySelectorAll('.code-lang');
        const themeToggles = document.querySelectorAll('.theme-toggle');
        const codeCopyBtns = document.querySelectorAll('.code-copy-btn');
        const themeSelectBtns = document.querySelectorAll('.theme-select-btn');
        // 切换主题
        if (currentLightTheme === 'dark') {
            for (const codeContainer of codeContainers) {
                codeContainer.classList.remove('bg-gray-800', 'border-gray-700');
                codeContainer.classList.add('bg-white', 'border-gray-200');
                codeContainer.querySelector('.code-header').classList.remove('bg-gray-900', 'border-gray-700');
                codeContainer.querySelector('.code-header').classList.add('bg-gray-100', 'border-gray-200');
                codeContainer.querySelector('.code-header span').classList.remove('text-gray-300');
                codeContainer.querySelector('.code-header span').classList.add('text-gray-700');
            }
            for (const codeElement of codeElements) {
                codeElement.classList.remove('text-gray-100');
                codeElement.classList.add('text-gray-900');
            }
            for (const themeToggle of themeToggles){
                themeToggle.innerHTML = '<i class="fa fa-moon-o mr-1"></i>暗色';
                themeToggle.classList.remove('hover:text-white');
                themeToggle.classList.add('hover:text-black');
            }
            for (const codeCopyBtn of codeCopyBtns) {
                codeCopyBtn.classList.remove('hover:text-white');
                codeCopyBtn.classList.add('hover:text-black');
            }
            for (const codeLang of codeLangs) {
                codeLang.classList.remove('text-gray-100');
                codeLang.classList.add('text-gray-600');
            }
            for (const themeSelectBtn of themeSelectBtns) {
                themeSelectBtn.classList.remove('hover:text-white');
                themeSelectBtn.classList.add('hover:text-black');
            }
            changeCodeTheme('github');
            currentLightTheme = 'light';
        } else {
            for (const codeContainer of codeContainers) {
                codeContainer.classList.add('bg-gray-800', 'border-gray-700');
                codeContainer.classList.remove('bg-white', 'border-gray-200');
                codeContainer.querySelector('.code-header').classList.add('bg-gray-900', 'border-gray-700');
                codeContainer.querySelector('.code-header').classList.remove('bg-gray-100', 'border-gray-200');
                codeContainer.querySelector('.code-header span').classList.add('text-gray-300');
                codeContainer.querySelector('.code-header span').classList.remove('text-gray-700');
            }
            for (const codeElement of codeElements) {
                codeElement.classList.add('text-gray-100');
                codeElement.classList.remove('text-gray-900');
            }
            for (const themeToggle of themeToggles) {
                themeToggle.innerHTML = '<i class="fa fa-sun-o mr-1"></i>亮色';
                themeToggle.classList.remove('hover:text-black');
                themeToggle.classList.add('hover:text-white');
            }
            for (const codeCopyBtn of codeCopyBtns) {
                codeCopyBtn.classList.add('hover:text-white');
                codeCopyBtn.classList.remove('hover:text-black');
            }
            for (const codeLang of codeLangs) {
                codeLang.classList.remove('text-gray-600');
                codeLang.classList.add('text-gray-100');
            }
            for (const themeSelectBtn of themeSelectBtns) {
                themeSelectBtn.classList.remove('hover:text-black');
                themeSelectBtn.classList.add('hover:text-white');
            }
            changeCodeTheme('atom-one-dark');
            currentLightTheme = 'dark';
        }
    }
    // 切换主题菜单
    else if (e.target.closest('.theme-select-btn')) {
        e.stopPropagation();
        const btn = e.target.closest('.theme-select-btn');
        const codeId = btn.getAttribute('resource-code-id');
        const optionsMenu = document.querySelector(`.theme-options[data-code-id="${codeId}"]`);
        // 关闭其他所有下拉菜单
        document.querySelectorAll('.theme-options').forEach((menu) => {
            if (menu.getAttribute('resource-code-id') !== codeId) {
                menu.classList.add('hidden');
            }
        });
        // 切换当前下拉菜单
        optionsMenu.classList.toggle('hidden');
        return;
    }
    // 切换主题功能
    else if (e.target.closest('.theme-option')) {
        e.stopPropagation();
        const option = e.target.closest('.theme-option');
        const theme = option.getAttribute('resource-theme');
        changeCodeTheme(theme);
        currentTheme = theme;
        e.target.closest('.theme-options').classList.add('hidden');
    }

    document.querySelectorAll('.theme-options').forEach((menu) => {
        menu.classList.add('hidden');
    });
});

function changeCodeTheme(theme) {
    if (!theme in availableCodeThemes) {
        theme = "default"
    }
    document.getElementById('hljs-theme').href = `https://cdn.jsdelivr.net/` +
        `gh/highlightjs/cdn-release@11.7.0/build/styles/${theme}.min.css`;
}