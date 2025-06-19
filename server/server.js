const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const {addAI, getAIResponse, deleteAI} = require("./module/ai_req.js");
const {log, warn, error, getTimeStr} = require("./module/log_system.js");
const {validateCookie, parseMarkdown} = require("./module/utils.js");

const app = express();

// 中间件：解析 JSON 请求体
app.use(express.json());
app.use(cookieParser());

// 中间件：记录所有请求
app.use((req, res, next) => {
    log(`${req.method} ${req.path}`)
    next();
});

// 静态文件处理
app.use(express.static('D:\\ClionProjects\\ai_group_chat\\web\\index'));

app.get('/', (req, res) => {
    res.sendFile('D:\\ClionProjects\\ai_group_chat\\web\\index\\index.html');
})

app.post('/api/register', (req, res) => {
    // 暂时使用静态文件处理
    const {username, password, email, code} = req.body;
    fs.readFile(path.join(__dirname, '/data', '/users.json'), 'utf8', (err, data) => {
        if (err) {
            error(err);
            res.json({status: "error", cause: "FileReadError"});
            return;
        }
        try {
            const usersData = JSON.parse(data);
            if (usersData[username]) {
                res.json({status: "error", cause: "UsernameDuplicated"});
                return;
            }
            usersData[username] = {
                username: username,
                password: password,
                email: email,
                data: {
                    ais: {},
                    groups: {},
                    sessionHistory: []
                }
            };
            fs.writeFile(path.join(__dirname, '/data', '/users.json'), JSON.stringify(usersData, null, 4), (err) => {
                if (err) {
                    error(err);
                    res.json({status: "error", cause: "FileWriteError"});
                    return;
                }
                res.json({status: "success"});
            })
        } catch (e) {
            error(e);
            res.json({status: "error", cause: "JSONParseError"});
        }
    })
})

app.post('/api/login', (req, res) => {
    fs.readFile(path.join(__dirname, '/data', '/users.json'), 'utf8', (err, data) => {
        if (err) {
            error(err);
            res.json({status: "error", cause: "FileReadError"});
            return;
        }
        try {
            const usersData = JSON.parse(data);
            if (usersData[req.body.username]) {
                if (usersData[req.body.username].password === req.body.password) {
                    log(`[${req.body.username}] login success`)
                    const data = usersData[req.body.username].data;
                    data.ais = Object.fromEntries(Object.entries(data.ais).map(([name, ai]) => {
                        ai.msgs = ai.msgs.map(msg => {
                            return {role: msg.role, content: parseMarkdown(msg.content)}
                        })
                        return [name, ai];
                    }));
                    res.json({
                        status: "success",
                        sessionData: data
                    });
                } else {
                    warn(`[${req.body.username}] login failed`)
                    res.json({status: "error", cause: "PasswordError"});
                }
            } else {
                res.json({status: "error", cause: "UnexistNameError"});
            }
        } catch (e) {
            error(e);
            res.json({status: "error", cause: "JSONParseError"});
        }
    });
})

app.post('/api/create_ai', (req, res) => {
    validateCookie(req, res, () => {
        addAI(req, {
            success: () => {
                res.json({status: "success"})
            },
            failed: () => {
                res.json({status: "error", cause: "ServerError"});
            }
        });
    })
})

app.post('/api/get_user_data', (req, res) => {
    validateCookie(req, res, () => {
        fs.readFile(path.join(__dirname, '/data', '/users.json'), 'utf8', (err, data) => {
            if (err) {
                error(err);
                res.json({status: "error", cause: "FileReadError"});
                return;
            }
            try {
                const usersData = JSON.parse(data);
                res.json({
                    status: "success",
                    data: usersData[req.cookies.username].data
                })
            } catch (e) {
                error(e);
                res.json({status: "error", cause: "JSONParseError"});
            }
        })
    })
})

app.post('/chat', (req, res) => {
    fs.readFile(path.join(__dirname, '/data', '/users.json'), 'utf8', (err, data) => {
        if (err) {
            error(err);
            res.json({status: "error", cause: "FileReadError"});
            return;
        }
        validateCookie(req, res, () => {
            try {
                const usersData = JSON.parse(data);
                const msgs = usersData[req.cookies.username].data.ais[req.body.targetAI].msgs;
                const {msg, targetAI} = req.body;
                msgs.push(msg);
                getAIResponse(req.cookies.username, targetAI, msgs, {
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
                        msgs.push(resMsg);
                        usersData[req.cookies.username].data.ais[targetAI].msgs = msgs;
                        fs.writeFile(path.join(__dirname, '/data', '/users.json'), JSON.stringify(usersData, null, 4), (err) => {
                            if (err) {
                                error(err);
                                res.json({status: "error", cause: "FileWriteError"});
                                return;
                            }
                            log(`[${req.cookies.username}] chat with AI [${targetAI}] success`)
                            res.json({
                                status: "success",
                                data: sendMsg
                            })
                        })
                    },
                    failed: (err) => {
                        error(err);
                        res.json({status: "error", cause: JSON.stringify(err)});
                    }
                })
            } catch (e) {
                error(e);
                res.json({status: "error", cause: "ServerError"});
            }
        })
    })
})

app.post('/api/delete_ai', (req, res) => {
    validateCookie(req, res, () => {
        deleteAI(req.cookies.username, req.body.targetAI, {
            success: () => {
                res.json({status: "success"})
            },
            failed: () => {
                res.json({status: "error", cause: "ServerError"});
            }
        });
    });
})

app.post('/api/edit_ai', (req, res) => {
    validateCookie(req, res, () => {
        fs.readFile(path.join(__dirname, '/data', '/users.json'), 'utf8', (err, data) => {
            if (err) {
                warn(`[${req.cookies.username}] failed to edit ai [${req.body.oldName}]`)
                error(err);
                res.json({status: "error", cause: "FileReadError"});
                return;
            }
            try {
                const usersData = JSON.parse(data);
                const oldAI = usersData[req.cookies.username].data.ais[req.body.oldName];
                if (oldAI){
                    if (oldAI.name === req.body.newAI.name ||
                        !usersData[req.cookies.username].data.ais[req.body.newAI.name]) {
                        req.body.newAI.msgs = oldAI.msgs;
                        if (oldAI.name === req.body.newAI.name) {
                            usersData[req.cookies.username].data.ais[req.body.oldName] = req.body.newAI;
                        } else {
                            usersData[req.cookies.username].data.ais[req.body.newAI.name] = req.body.newAI;
                            delete usersData[req.cookies.username].data.ais[req.body.oldName];
                        }
                        fs.writeFile(path.join(__dirname, '/data', '/users.json'), JSON.stringify(usersData, null, 4), (err) => {
                            if (err) {
                                error(err);
                                res.json({status: "error", cause: "FileWriteError"});
                                return;
                            }
                            log(`[${req.cookies.username}] edit AI [${req.body.oldName}] success`)
                            res.json({status: "success"})
                        })
                    } else {
                        warn(`[${req.cookies.username}] failed to edit ai [${req.body.oldName}]`)
                        res.json({status: "error", cause: "DuplicatedNameError"});
                    }
                } else {
                    warn(`[${req.cookies.username}] failed to edit ai [${req.body.oldName}]`)
                    res.json({status: "error", cause: "UnexistNameError"});
                }
            } catch (e) {
                warn(`[${req.cookies.username}] failed to edit ai [${req.body.oldName}]`)
                error(e);
                res.json({status: "error", cause: "ServerError"});
            }
        })
    })
})

// 404 处理
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// 错误处理
app.use((err, req, res, next) => {
    error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.listen(3000, () => {
    log('Server started on port http://localhost:3000');
})