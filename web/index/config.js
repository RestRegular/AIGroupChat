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
        },
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
    });
});