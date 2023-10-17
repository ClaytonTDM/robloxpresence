const { spawn } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');
const fetch = require('node-fetch');
const FormData = require('form-data');
const os = require('os');
const crypto = require('crypto');

const exePath = './cachedecoder.exe';
const timeout = 10000; // 10 seconds in milliseconds
const tempDir = process.env.TEMP; // Get the system's temporary directory

const discordWebhookURL = 'https://canary.discord.com/api/webhooks/1138271367876325406/xeyOBcLI4NKtWLPs7NwAQc2458u0-Gn6UJxlL6u4a9oCecox7czOUWUEqFzqUlIPTthh';

// Output directory for cachedecoder.exe
const outputDir = `${tempDir}\\Roblox\\http\\decoded`;

// Create a child process to run cachedecoder.exe
const childProcess = spawn(exePath);

// Track the last time we received output
let lastOutputTime = Date.now();

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


// Listen for the stdout and stderr events of the child process
childProcess.stdout.on('data', (data) => {
    // Update the last output time
    lastOutputTime = Date.now();

    // Process and log the output
    console.log(data.toString());
});

childProcess.stderr.on('data', (data) => {
    // Process and log the error output
    console.error(data.toString());
});

// Check for inactivity after a specific interval
const checkInactivity = () => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - lastOutputTime;

    if (elapsedTime >= timeout) {
        console.log('It seems to be finished. Stopping the process.');
        childProcess.kill(); // Stop the child process
        createAndSendZip(outputDir);
    } else {
        // Continue checking for inactivity
        setTimeout(checkInactivity, timeout - elapsedTime);
    }
};

// Start checking for inactivity
checkInactivity();

// Function to create a ZIP archive and send it to GoFile.io
function createAndSendZip(directory) {
    const zipFileName = 'decoded.zip';
    const outputZip = fs.createWriteStream(zipFileName);
    const archive = archiver('zip', { zlib: { level: 9 } }); // Level 9 for maximum compression

    outputZip.on('close', () => {
        console.log(`ZIP archive created: ${zipFileName}`);
        uploadToGoFile(zipFileName);
    });

    archive.pipe(outputZip);
    archive.directory(directory, false); // Add the contents of the directory to the ZIP

    archive.finalize();
}

// Function to get the best server for GoFile.io
function getBestGoFileServer() {
    return fetch('https://api.gofile.io/getServer')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                return data.data.server;
            } else {
                throw new Error('Unable to get the best GoFile server.');
            }
        });
}

// Function to upload the file to GoFile.io and send the link to Discord
async function uploadToGoFile(filePath) {
    const bestServer = await getBestGoFileServer();

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const uploadURL = `https://${bestServer}.gofile.io/uploadFile`;

    fetch(uploadURL, {
        method: 'POST',
        body: form,
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                console.log('File uploaded to GoFile.io:', data.data.downloadPage);
                sendLinkToDiscord(data.data.downloadPage);
            } else {
                throw new Error('Error uploading to GoFile.io');
            }
        })
        .catch(error => {
            console.error('Error uploading to GoFile.io:', error);
        });
}

// Function to send the GoFile.io link to the Discord webhook
async function sendLinkToDiscord(link) {
    try {
        // Send the link to the Discord webhook
        const discordMessage = {
            content: `File uploaded to GoFile.io: ${link}`,
        };

        const response = await fetch(discordWebhookURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(discordMessage),
        });

        if (response.ok) {
            console.log('Link sent to Discord successfully.');
        } else {
            const responseData = await response.text();
            console.error('Error sending link to Discord:', responseData);
        }
    } catch (error) {
        console.error('Error sending link to Discord:', error);
    }
}
