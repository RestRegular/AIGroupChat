const fs = require('fs');

const env = {};

function setup(envPath) {
    const data = fs.readFileSync(envPath, 'utf8');
    data.split('\n').forEach(line => {
        line = line.trim();
        const valid = line.includes('=');
        const key = valid ? line.split('=')[0] : '';
        env[key] = valid ? line.substring(key.length + 1) : undefined;
    })
}

module.exports = {
    setup,
    env
}