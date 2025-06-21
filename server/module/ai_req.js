const axios = require('axios');
const {rlog, rerror, rwarn, getTimeStr} = require('./log_system')
const {json} = require("express");
const fs = require("node:fs");
const path = require("path");

function getData(msgs, modelID = "deepseek-chat", maxToken = 2048) {
    return {
        "messages": msgs,
        "model": modelID,
        "frequency_penalty": 0,
        "max_tokens": maxToken,
        "presence_penalty": 0,
        "response_format": {
            "type": "text"
        },
        "stop": null,
        "stream": false,
        "stream_options": null,
        "temperature": 1,
        "top_p": 1,
        "tools": null,
        "tool_choice": "none",
        "logprobs": false,
        "top_logprobs": null
    }
}

function getConfig(url, apikey, data) {
    return {
        method: 'post',
        maxBodyLength: Infinity,
        url: url,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apikey}`
        },
        data: data
    }
}

function addAI(req, callbacks) {
    const {profileUrl, sysSet, modelID, name, apikey, url} = req.body;
    const username = req.cookies.username;
    const ai = {
        url: url,
        name: name,
        apikey: apikey,
        modelID: modelID,
        profileUrl: profileUrl,
        sysSet: sysSet,
        msgs: []
    };
    fs.readFile(path.join(__dirname, '..', '/data', '/users.json'), 'utf8', (err, data) => {
        if (err) {
            rerror(err);
            return callbacks.failed();
        }
        try {
            const usersData = JSON.parse(data);
            const userData = usersData[username];
            if (userData.data.ais[name]) {
                rerror(`AI name [${name}] duplicated.`);
                return callbacks.failed();
            }
            userData.data.ais[name] = ai;
            usersData[username] = userData;
            fs.writeFile(path.join(__dirname, '..', '/data', '/users.json'), JSON.stringify(usersData, null, 4), 'utf8', (err) => {
                if (err) {
                    rerror(err);
                    return callbacks.failed();
                }
                rlog(`Added AI [${name}]`);
                return callbacks.success();
            });
        } catch (e) {
            rerror(e);
            return callbacks.failed();
        }
    })
}

function getAIResponse(username, aiName, msgs, callbacks) {
    fs.readFile(path.join(__dirname, '..', '/data', '/users.json'), 'utf8', async (err, data) => {
        if (err) {
            rerror(err);
            return;
        }
        let usersData
        try {
            usersData = JSON.parse(data);
            const ais = usersData[username].data.ais;
            if (!ais[aiName]) {
                callbacks.failed(new Error(`AI [${aiName}] not found.`));
            }
            const ai = ais[aiName];
            return await axios(getConfig(ai.url, ai.apikey, getData(msgs, ai.modelID)))
                .then((response) => {
                    callbacks.success(response.data);
                })
                .catch((err) => {
                    callbacks.failed(err);
                })
        } catch (e) {
            callbacks.failed(e);
        }
    })
}

function deleteAI(username, aiName, callbacks) {
    fs.readFile(path.join(__dirname, '..', '/data', '/users.json'), 'utf8', (err, data) => {
        if (err) {
            rerror(err);
            return callbacks.failed();
        }
        try {
            const usersData = JSON.parse(data);
            const userData = usersData[username];
            delete userData.data.ais[aiName];
            usersData[username] = userData;
            fs.writeFile(path.join(__dirname, '..', '/data', '/users.json'), JSON.stringify(usersData, null, 4), 'utf8', (err) => {
                if (err) {
                    rerror(err);
                    return callbacks.failed();
                }
                rlog(`Deleted AI [${aiName}]`);
                return callbacks.success();
            })
        } catch (e) {
            rerror(e);
            return callbacks.failed();
        }
    });
}

module.exports = {
    addAI,
    getAIResponse,
    deleteAI
}