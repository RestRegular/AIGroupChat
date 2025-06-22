const {verifyCode} = require("./email");
const {rwarn, rlog} = require("./log_system");
const {User} = require("./sql_tool");

const checkCookies = (req, res, next) => {
    if (req.cookies.username) {
        User.getByUsername(req.cookies.username)
            .then(user => {
                rlog(`[${req.cookies.username}] CookieVerificationSuccess`);
                req.userId = user.id;
                next();
            })
            .catch(err => {
                rwarn(`[${req.username}] CookieVerificationFailed: ${err.message}`);
                return res.json({
                    status: "error",
                    cause: err.message
                });
            })
    } else {
        return res.json({
            status: "error",
            cause: "CookieVerificationFailed"
        });
    }
}

const varifyCodeRouter = (req, res, next) => {
    const {username, email, code} = req.body;
    verifyCode(email, code, varify => {
        if (!varify.valid) {
            rlog(`[${username}] varify code failed: ${varify.message}`);
            return res.json({
                status: "error",
                cause: varify.message
            });
        }
        rlog(`[${username}] varify code success`);
        next();
    });
}

module.exports = {
    checkCookies,
    varifyCodeRouter
}