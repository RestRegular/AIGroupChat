const nodemailer = require('nodemailer');
const crypto = require('crypto');

// 配置邮件传输
const transporter = nodemailer.createTransport({
    service: 'QQ', // 使用的邮件服务，也可以使用其他服务如 QQ、163 等
    auth: {
        user: '3228097751@qq.com', // 你的邮箱地址
        pass: 'lfcmeliordijcibj' // 你的邮箱密码或应用专用密码
    }
});

// 存储验证码的映射，实际应用中建议使用数据库
const verificationCodes = new Map();

// 生成随机验证码
function generateVerificationCode(length = 6) {
    return crypto.randomInt(10**(length-1), 10**length).toString();
}

// 发送验证码邮件
async function sendVerificationEmail(email, expiredTime=5){
    const code = generateVerificationCode();

    // 设置验证码有效期
    const expiresAt = Date.now() + expiredTime * 60 * 1000;
    verificationCodes.set(email, { code, expiresAt });

    const mailOptions = {
        from: '3228097751@qq.com',
        to: email,
        subject: 'AI Chat 邮箱验证码',
        text: `您的验证码是：${code}，有效期${expiredTime}分钟。`
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('发送邮件失败:', error);
        return false;
    }
}

// 验证用户输入的验证码
function verifyCode(email, userCode) {
    const storedCode = verificationCodes.get(email);

    if (!storedCode) {
        return { valid: false, message: '请先获取验证码' };
    }

    if (Date.now() > storedCode.expiresAt) {
        verificationCodes.delete(email);
        return { valid: false, message: '验证码已过期，请重新获取' };
    }

    if (userCode !== storedCode.code) {
        return { valid: false, message: '验证码不正确' };
    }

    verificationCodes.delete(email);
    return { valid: true, message: '验证成功' };
}

module.exports = {
    sendVerificationEmail,
    verifyCode
};