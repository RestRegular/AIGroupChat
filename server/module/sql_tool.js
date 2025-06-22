const {pool} = require('./utils');
const {rlog, rerror, rwarn} = require("./log_system");

class AIConfig {
    // 创建 AI 配置
    static async create(userId, config) {
        const [result] = await pool.execute(
            `insert into ai_configs (user_id, name, url, model_id, api_key, sys_set, profile_url)
            values (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                config.name,
                config.url,
                config.modelID,
                config.apikey,
                config.sysSet,
                config.profileUrl
            ]
        );
        rlog(`Added AI config [${config.name}] for user [${userId}]`);
        return result.insertId;
    }

    static async getByUserIdAndName(userId, name) {
        const [result] = await pool.execute(
            `SELECT * FROM ai_configs WHERE user_id = ? AND name = ?`,
            [userId, name]
        );
        return result[0];
    }

    // 获取用户的所有 AI 配置
    static async getByUserId(userId) {
        const [rows] = await pool.execute(
            `select * from ai_configs where user_id = ?`, [userId]
        );
        rlog(`get ai config by user id [${userId}]`);
        return rows;
    }

    // 根据 id 获取AI配置
    static async getById(id) {
        const [rows] = await pool.execute(
            `select * from ai_configs where id = ?`, [id]
        );
        return rows[0];
    }

    // 更新 AI 配置
    static async update(id, {name, url, modelID, apikey, sysSet, profileUrl}) {
        const [result] = await pool.execute(
            `update ai_configs 
             set name = ?, url = ?, model_id = ?, api_key = ?, sys_set = ?, profile_url = ?
             where id = ?`,
            [
                name,
                url,
                modelID,
                apikey,
                sysSet,
                profileUrl,
                id
            ]
        );
        rlog(`Update AI config [${id}] ${result.affectedRows > 0 ? 'successfully' : 'failed'}`)
        return result.affectedRows > 0;
    }

    // 删除 AI 配置
    static async delete(id) {
        const [result] = await pool.execute(
            `delete from ai_configs where id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    // 获取 AI 聊天记录
    static async getChats(id) {
        const [rows] = await pool.execute(
            `select * from messages where ai_config_id = ?`,
            [id]
        );
        rlog(`get chat msgs by id ${id}`);
        return rows;
    }

    static async appendChats(id, msgs) {
        const values = msgs.flatMap(msg => [
            id, msg.role, msg.content, msg.time
        ]);
        const [result] = await pool.execute(
            `insert into messages (ai_config_id, role, content, time) 
             values ${msgs.map(() => "(?, ?, ?, ?)").join(', ')}`,
            values
        );
        if (result.affectedRows > 0) {
            rlog(`append chat [${id}]`)
        } else {
            rwarn(`append chat [${id}] failed`)
        }
        return result.affectedRows;
    }

    static parse(aiDatas) {
        return {
            name: aiDatas.name,
            url: aiDatas.url,
            sysSet: aiDatas.sys_set,
            modelID: aiDatas.model_id,
            apikey: aiDatas.api_key,
            profileUrl: aiDatas.profile_url
        }
    }
}

class User {
    // 创建用户
    static async create(user) {
        const [result] = await pool.execute(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [user.username, user.password, user.email]
        );
        rlog(`registered new user: [${user.username}]`);
        return result.insertId;
    }

    // 获取所有用户
    static async getAll() {
        const [rows] = await pool.execute('SELECT * FROM users');
        rlog(`get all users`);
        return rows;
    }

    // 根据ID获取用户
    static async getById(id) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
        rlog(`get user by id: [${id}]`);
        return rows[0];
    }

    // 根据用户名获取用户
    static async getByUsername(username) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        rlog(`get user by username: [${username}]`);
        return rows.length > 0 ? rows[0] : undefined;
    }

    // 更新用户
    static async update(id, user) {
        const [result] = await pool.execute(
            'UPDATE users SET username = ?, password = ?, email = ? WHERE id = ?',
            [user.username, user.password, user.email, id]
        );
        rlog(`update user: [${id}]`);
        return result.affectedRows > 0;
    }

    // 删除用户
    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        rlog(result.affectedRows > 0 ? `delete user: [${id}]` : `delete user [${id}] failed`);
        return result.affectedRows > 0;
    }
}

class EmailVerificationCode {
    // 创建验证码记录
    static async create(email, verificationCode, purpose, expiresAt) {
        const [result] = await pool.execute(
            `INSERT INTO email_verification_codes (email, verification_code, purpose, created_at, expires_at)
             VALUES (?, ?, ?, ?, ?)`,
            [email, verificationCode, purpose, new Date().getTime(), expiresAt]
        );
        rlog(`Created email verification code for ${email} with purpose ${purpose}`);
        return result.insertId;
    }

    // 根据验证码和过期时间查询记录
    static async getByCodeAndExpires(verificationCode, expiresAt) {
        const [rows] = await pool.execute(
            `SELECT * FROM email_verification_codes WHERE verification_code = ? AND expires_at > ?`,
            [verificationCode, expiresAt]
        );
        return rows[0];
    }

    // 更新验证码使用状态
    static async markAsUsed(id, usedAt) {
        const [result] = await pool.execute(
            `UPDATE email_verification_codes SET is_used = 1, used_at = ? WHERE id = ?`,
            [usedAt, id]
        );
        rlog(`Marked email verification code with id ${id} as used`);
        return result.affectedRows > 0;
    }

    // 清理过期记录
    static async cleanExpiredCodes() {
        const [result] = await pool.execute(
            `DELETE FROM email_verification_codes WHERE expires_at < NOW()`
        );
        rlog(`Cleaned ${result.affectedRows} expired email verification codes`);
        return result.affectedRows;
    }
}

module.exports = {
    AIConfig: AIConfig,
    User: User,
    EmailVerificationCode: EmailVerificationCode,
};