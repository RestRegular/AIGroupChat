const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require("node:fs");
const path = require("node:path");
const {EmailVerificationCode} = require("./sql_tool");
const {rerror} = require("./log_system");

// 配置邮件传输
const transporter = nodemailer.createTransport({
    host: 'smtp.yeah.net', // Yeah.net SMTP 服务器地址
    port: 465,             // SSL 端口（推荐）
    secure: true,          // 使用 SSL 加密
    auth: {
        user: 'aichat_official@yeah.net',
        pass: 'WUpy7Tt6ru3uJgsd'
    }
});

// 生成随机验证码
function generateVerificationCode(length = 6) {
    return crypto.randomInt(10**(length-1), 10**length).toString();
}

// 发送验证码邮件
function sendVerificationEmail(email, expiredTime=5, callback){
    const code = generateVerificationCode();
    // 设置验证码有效期
    const expiresAt = Date.now() + expiredTime * 60 * 1000;
    EmailVerificationCode.create(email, code, "register", expiresAt)
        .then(async result => {
            let html = fs.readFileSync(path.join(__dirname, '..', '/resource', '/certification.html'), 'utf8');
            html = html.replace('&VERIFY_CODE&', code)
                .replace('&EXPIRATION_TIME&', expiredTime.toString());
            const mailOptions = {
                from: '"AI Chat" <aichat_official@yeah.net>',
                to: email,
                subject: 'AI Chat 验证码',
                html: html
            };
            try {
                await transporter.sendMail(mailOptions);
                callback(true);
            } catch (error) {
                console.error('发送邮件失败:', error);
                callback(false);
            }
        })
        .catch(err => {
            rerror(`create email certification code failed: ${err.message}`);
            callback(false);
        })
}

// 验证用户输入的验证码
function verifyCode(email, userCode, callback) {
    const usedAt = new Date().getTime();
    EmailVerificationCode.getByCodeAndExpires(userCode, usedAt)
        .then(ver => {
            if (!ver) return callback({ valid: false, message: '验证码已过期或还未获取验证码' });

            EmailVerificationCode.markAsUsed(ver.id, usedAt)
                .then(() => {
                    callback({ valid: true, message: '验证成功' });
                })
                .catch(err => {
                    callback({ valid: false, message: err.message });
                });
        })
        .catch(err => {
            callback({ valid: false, message: err.message });
        })
}

module.exports = {
    sendVerificationEmail,
    verifyCode
};