const {verifyCode} = require("./email");
const {rwarn, rlog} = require("./log_system");

const checkCookies = (req, res, next) => {
    if (req.cookies.username) {
        next();
    } else {
        return res.json({
            status: "error",
            cause: "NotLogin"
        });
    }
}

const varifyCodeRouter = (req, res, next) => {
    const {username, email, code} = req.body;
    const varify = verifyCode(email, code);
    if (!varify.valid) {
        rlog(`[${username}] varify code failed: ${varify.message}`);
        return res.json({
            status: "error",
            cause: varify.message
        });
    }
    rlog(`[${username}] varify code success`);
    next();
}

module.exports = {
    checkCookies,
    varifyCodeRouter
}