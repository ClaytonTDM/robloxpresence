const os = require('os');
const crypto = require('crypto');

function generateHWID() {
    const networkInterfaces = os.networkInterfaces();
    const macAddresses = [];

    for (const key in networkInterfaces) {
        const interfaces = networkInterfaces[key];
        for (const intf of interfaces) {
            if (!intf.internal) {
                macAddresses.push(intf.mac);
            }
        }
    }

    // Sort and hash the MAC addresses to create a unique identifier
    const sortedMacs = macAddresses.sort().join('');
    const hwid = crypto.createHash('sha1').update(sortedMacs).digest('hex');

    return hwid;
}

const hwid = generateHWID();
console.log(hwid)