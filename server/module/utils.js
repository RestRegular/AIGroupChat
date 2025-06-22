const {rlog, rerror} = require("./log_system");
const md = require('markdown-it')({
    html: true,        // 允许HTML标签
    linkify: true,     // 自动识别URL
    typographer: true  // 启用智能标点
}).use(require('markdown-it-task-lists'))  // 支持任务列表
    .use(require('markdown-it-mark'));        // 支持高亮标记
const dbConfig = require("../config/db.config");
const mysql = require("mysql2/promise");

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

function parseAisInUserData(data) {
    const ais = [];
    Object.keys(data.ais).forEach(key => {
        const ai = data.ais[key];
        ai.msgs = ai.msgs.map(msg => {
            msg.content = parseMarkdown(msg.content);
            return msg;
        })
        ais.push(ai);
    });
    data.ais = ais;
    return data;
}

const pool = mysql.createPool(dbConfig);

async function checkConnection() {
    try {
        await pool.getConnection((err, connection) => {
            if (err) {
                rerror(`Database connected failed: ${err.message}`);
                process.exit(1);
            } else {
                rlog(`Database connected successfully`);
                connection.release();
            }
        });
    } catch (error) {
        rerror(`Database connected failed: ${error.message}`);
        throw error;
    }
}

module.exports = {
    validateCookie,
    parseMarkdown,
    parseAisInUserData,
    pool,
    checkConnection
}