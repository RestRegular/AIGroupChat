const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const {addAI, getAIResponse, deleteAI} = require("./module/ai_req.js");
const {rlog, rwarn, rerror, getTimeStr} = require("./module/log_system.js");
const {validateCookie, parseMarkdown, parseAisInUserData, pool, checkConnection} = require("./module/utils.js");
const {sendVerificationEmail, verifyCode} = require("./module/email");
const {varifyCodeRouter, checkCookies} = require("./module/routers");
const {AIConfig, User} = require("./module/sql_tool");

checkConnection().then();

const app = express();

// 中间件：解析 JSON 请求体
app.use(express.json());
app.use(cookieParser());

// 中间件：记录所有请求
app.use((req, res, next) => {
    rlog(`${req.method} ${req.path}`)
    next();
});

// 静态文件处理
app.use(express.static('D:\\ClionProjects\\ai_group_chat\\web\\index'));

// 添加中间件
app.use('/api', checkCookies);

app.get('/', (req, res) => {
    res.sendFile('D:\\ClionProjects\\ai_group_chat\\web\\index\\index.html');
})

app.post('/send_varification_email', (req, res) => {
    const {email} = req.body;
    sendVerificationEmail(email, 5, (hasSuccess) => {
        if (hasSuccess) {
            res.json({status: "success"});
        } else {
            res.json({status: "error", cause: "EmailSendError"});
        }
    })
})

app.post('/register', varifyCodeRouter, (req, res) => {
    const {username, password, email} = req.body;
    // 已更新为使用数据库管理数据
    User.getByUsername(username)
        .then(result => {
            if (result) {
                res.json({status: "error", cause: "UsernameDuplicated"});
            } else {
                User.create({
                    username: username,
                    password: password,
                    email: email
                })
                    .then(insertId => {
                        if (insertId > 0) {
                            res.json({status: "success"});
                        } else {
                            res.json({status: "error", cause: "DatabaseError"});
                        }
                    })
                    .catch(err => {
                        res.json({status: "error", cause: err.message});
                    })
            }
        })
        .catch(err => {
            rerror(err);
            res.json({status: "error", cause: err.message});
        })
})

app.post('/login', (req, res) => {
    User.getByUsername(req.body.username)
        .then(user => {
            if (!user) {
                res.json({status: "error", cause: "用户不存在"});
            } else if (user.password !== req.body.password) {
                res.json({status: "error", cause: "密码错误"});
            } else {
                // 密码验证成功
                // 发送用户信息
                const data = {
                    status: "success"
                }
                AIConfig.getByUserId(user.id)
                    .then(rows => {
                        data.aiConfigs = rows.map(row => AIConfig.parse(row));
                        res.json(data);
                    })
                    .catch(err => {
                        res.json({status: "error", cause: err.message})
                    })
            }
        })
        .catch(err => {
            res.json({status: "error", cause: err.message});
        })
})

app.post('/api/create_ai', (req, res) => {
    addAI(req, {
        success: () => {
            res.json({status: "success"})
        },
        failed: () => {
            res.json({status: "error", cause: "ServerError"});
        }
    });
})

app.post('/api/get_ai_msgs', (req, res) => {
    AIConfig.getByUserIdAndName(req.userId, req.body.aiName)
        .then(aiConfig => {
            AIConfig.getChats(aiConfig.id)
                .then(msgs => {
                    res.json({
                        status: "success",
                        msgs: msgs.map(msg => {
                            return {
                                role: msg.role,
                                content: msg.role === "assistant" ?
                                    parseMarkdown(msg.content) : msg.content,
                                time: msg.time
                            }
                        })
                    });
                })
                .catch(err => {
                    rwarn(`[${req.username}] GetChatMsgsFailed: ${err.message}`);
                    res.json({status: "error", cause: err.message});
                })
        })
        .catch(err => {
            rwarn(`[${req.username}] GetChatMsgsFailed: ${err.message}`);
            res.json({status: "error", cause: err.message});
        })
})

app.post('/api/get_user_data', (req, res) => {
    User.getById(req.userId)
        .then(user => {
            const data = {
                status: "success"
            }
            AIConfig.getByUserId(user.id)
                .then(rows => {
                    data.aiConfigs = rows.map(row => AIConfig.parse(row));
                    res.json(data);
                })
                .catch(err => {
                    rerror(`[${req.username}] GetAIConfigsFailed: ${err.message}`);
                    res.json({status: "error", cause: err.message});
                })
        })
        .catch(err => {
            rwarn(`[${req.username}] GetUserDataFailed: ${err.message}`);
            res.json({status: "error", cause: err.message});
        })
})

app.post('/api/chat', (req, res) => {
    const {msg, targetAI} = req.body;
    AIConfig.getByUserIdAndName(req.userId, targetAI)
        .then(aiConfig => {
            AIConfig.getChats(aiConfig.id)
                .then(chats => {
                    const msgs = chats.map(chat => {
                        return {
                            role: chat.role,
                            content: chat.content
                        }
                    });
                    msgs.push(msg);
                    getAIResponse(req, targetAI, msgs, {
                        success: (resData) => {
                            const time = Date.now();
                            const resMsg = {
                                role: "assistant",
                                content: resData.choices[0].message.content,
                                time: time
                            }
                            const sendMsg = {
                                role: "assistant",
                                content: parseMarkdown(resMsg.content),
                                time: time
                            }
                            AIConfig.appendChats(aiConfig.id, [msg, resMsg])
                                .then(result => {
                                    rlog(`[${req.username}] AppendChatSuccess`);
                                    res.json({
                                        status: "success",
                                        data: sendMsg
                                    });
                                })
                                .catch(err => {
                                    rerror(`AppendChatError: ${err.message}`);
                                    res.json({
                                        status: "error",
                                        cause: err.message
                                    })
                                });
                        },
                        failed: (err) => {
                            rerror(err);
                            res.json({status: "error", cause: JSON.stringify(err)});
                        }
                    })
                })
                .catch((err) => {
                    rerror(err);
                    res.json({status: "error", cause: err.message});
                })
        })
        .catch((err) => {
            rerror(err);
            res.json({status: "error", cause: err.message});
        })
})

app.post('/api/delete_ai', (req, res) => {
    deleteAI(req, req.body.targetAI, {
        success: () => {
            res.json({status: "success"})
        },
        failed: () => {
            res.json({status: "error", cause: "ServerError"});
        }
    });
})

app.post('/api/edit_ai', (req, res) => {
    const {oldName, newAI} = req.body;
    AIConfig.getByUserIdAndName(req.userId, oldName)
        .then(aiConfig => {
            AIConfig.update(aiConfig.id, newAI)
                .then(status => {
                    if (status) {
                        res.json({status: "success"});
                    } else {
                        rerror(`UpdateAiFailed: ${err}`);
                        res.json({status: "error", cause: "ServerError"});
                    }
                })
                .catch(err => {
                    rerror(`UpdateAiFailed: ${err}`);
                    res.json({status: "error", cause: err.message});
                })
        })
        .catch(err => {
            rerror(`GetAiFailed: ${err}`);
            res.json({status: "error", cause: err.message});
        })
})

// 404 处理
app.use((req, res) => {
    fs.readFile(path.join(__dirname, 'resource', 'not_found.html'), 'utf-8', (err, data) => {
        res.status(404).send(data);
    })
});

// 错误处理
app.use((err, req, res, next) => {
    rerror(err);
    res.status(500).send('Something went wrong!');
});

app.listen(3000, () => {
    rlog('Server started on port http://localhost:3000');
})