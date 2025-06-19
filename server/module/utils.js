const {log} = require("./log_system");
const md = require('markdown-it')({
    html: true,        // ����HTML��ǩ
    linkify: true,     // �Զ�ʶ��URL
    typographer: true  // �������ܱ��
}).use(require('markdown-it-task-lists'))  // ֧�������б�
    .use(require('markdown-it-mark'));        // ֧�ָ������

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