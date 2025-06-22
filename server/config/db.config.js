const { env, setup } = require('../module/env');
const {rlog} = require("../module/log_system");

let dbConfig = {};

setup('../.env');

module.exports = {
    host: env.DB_HOST || 'localhost',
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'ai_chat',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};