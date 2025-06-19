const {log} = require("./log_system");
const md = require('markdown-it')({
    html: true,        // 允许HTML标签
    linkify: true,     // 自动识别URL
    typographer: true  // 启用智能标点
}).use(require('markdown-it-task-lists'))  // 支持任务列表
    .use(require('markdown-it-mark'));        // 支持高亮标记

function validateCookie(req, res, callback) {
    if (!req.cookies || !req.cookies.username) {
        res.json({status: "error", cause: "NotLogin"});
    } else {
        callback();
    }
}

function parseMarkdown(markdown) {
    return md.render(markdown);
}

module.exports = {
    validateCookie,
    parseMarkdown
}