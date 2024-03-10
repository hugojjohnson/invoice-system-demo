const fs = require("fs");

// === Functions === 
async function readJson(path) {
    const myData = await fs.readFileSync(path);
    let json;
    json = JSON.parse(myData)
    return json;
}

async function writeJson(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, "\t"));
}

module.exports = { readJson, writeJson };