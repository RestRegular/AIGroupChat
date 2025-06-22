const axios = require('axios');
const {rlog, rerror, rwarn, getTimeStr} = require('./log_system')
const {json} = require("express");
const fs = require("node:fs");
const path = require("path");
const {AIConfig, User} = require("./sql_tool");

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
        profileUrl: profileUrl,
        sysSet: sysSet,
        modelID: modelID,
        name: name,
        apikey: apikey,
        url: url
    };

    AIConfig.create(req.userId, ai)
        .then(result => {
            if (result > 0) {
                callbacks.success();
            } else {
                callbacks.failed();
            }
        })
        .catch(err => {
            rerror(err);
            callbacks.failed();
        });
}

function getAIResponse(req, aiName, msgs, callbacks) {
    AIConfig.getByUserIdAndName(req.userId, aiName)
        .then(async aiConfig => {
            return await axios(getConfig(aiConfig.url, aiConfig.api_key, getData(msgs, aiConfig.model_id)))
                .then(response => {
                    callbacks.success(response.data);
                })
                .catch(err => {
                    callbacks.failed(err);
                })
        })
        .catch(err => {
            callbacks.failed(err);
        });
}

function deleteAI(req, aiName, callbacks) {
    AIConfig.getByUserIdAndName(req.userId, aiName)
        .then(aiConfig => {
            AIConfig.delete(aiConfig.id)
                .then(status => {
                    if (status) {
                        callbacks.success();
                    } else {
                        callbacks.failed();
                    }
                })
                .catch(err => {
                    rerror(`DeleteAiFailed: ${err}`);
                    callbacks.failed();
                });
        })
        .catch(err => {
            rerror(`GetAiConfigFailed: ${err}`);
        })
}

module.exports = {
    addAI,
    getAIResponse,
    deleteAI
}