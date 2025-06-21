function isObject(obj) {
    return typeof obj === 'object' && obj !== null
}

function getTimeStr() {
    return `[ ${new Date().toISOString()} ]`
}

function processMsg(msg) {
    return isObject(msg) ? JSON.stringify(msg) : msg
}

function rlog(message, role="system") {
    console.log(`${getTimeStr()}
    Log(${role}) >> ${processMsg(message)}\n`)
}

function rwarn(message, level=1, role="system") {
    console.warn(`${getTimeStr()}
    Warn(${role}): ${level} >> ${processMsg(message)}\n`)
}

function rerror(error, role="system") {
    console.error(`${getTimeStr()}
    Error(${role}) >> ${processMsg(error.stack ? error.stack : error)}\n`)
}

module.exports = {
    rlog: rlog,
    rwarn: rwarn,
    rerror: rerror,
    getTimeStr
}