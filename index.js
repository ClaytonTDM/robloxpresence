const fs = require('fs');
const path = require('path');
const Tail = require('tail').Tail;
const os = require('os');
const crypto = require('crypto');
const fetch = require('node-fetch');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// console.log('Located at: ' + path.join(process.execPath))
// console.log('Log exists: ' + fs.existsSync(path.join(os.homedir(), 'AppData', 'Local', 'RobloxPresence.json')))
// console.log('Bloxstrap exists: ' + fs.existsSync(path.join(os.homedir(), 'AppData', 'Local', 'Bloxstrap', 'Settings.json')))

// read robloxpresence.json, if it exists then log "Started"
if (fs.existsSync(path.join(os.homedir(), 'AppData', 'Local', 'RobloxPresence.json'))) {
  console.log('Started\n')
}

if (fs.existsSync(path.join(os.homedir(), 'AppData', 'Local', 'Bloxstrap', 'Settings.json')) && !fs.existsSync(path.join(os.homedir(), 'AppData', 'Local', 'RobloxPresence.json'))) {
  readline.question('Bloxstrap detected! Would you like to add the webhook to custom integrations?\nY/N > ', response => {
    if (response.toLowerCase() == 'yes' || response.toLowerCase() == 'y') {
      const filePath = path.join(os.homedir(), 'AppData', 'Local', 'Bloxstrap', 'Settings.json');
      const newData = {
        Name: 'Roblox Presence Webhook',
        Location: path.join(process.execPath),
        LaunchArgs: '',
        AutoClose: true,
      };

      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          // console.error('Error reading the file:', err);
        } else {
          const settings = JSON.parse(data);

          if (!Array.isArray(settings.CustomIntegrations)) {
            settings.CustomIntegrations = [];
          }

          settings.CustomIntegrations.push(newData);

          fs.writeFile(filePath, JSON.stringify(settings, null, 2), (err) => {
            if (err) {
              // console.error('Error writing the file:', err);
            } else {
              console.log('\nDone! Started webhook.')
              // console.log('Data added to CustomIntegrations array successfully.');
            }
          });
        }
      });
    }
    readline.close();
  });
}

        // make a file in appdata called "RobloxPresence.json"
        // if you don't have that file, it will create it for you
        // NOTE: disabed for debugging (it's annoying)
        if (!fs.existsSync(path.join(os.homedir(), 'AppData', 'Local', 'RobloxPresence.json'))) {
          fs.writeFileSync(path.join(os.homedir(), 'AppData', 'Local', 'RobloxPresence.json'), '{"firstTimeRunning": false}')
        }

let userName
let userId
let displayName
// let placeId
let webhookURL = 'https://canary.discord.com/api/webhooks/1138271367876325406/xeyOBcLI4NKtWLPs7NwAQc2458u0-Gn6UJxlL6u4a9oCecox7czOUWUEqFzqUlIPTthh'

// Generate a unique HWID based on system information
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

const logDirectory = path.join(os.homedir(), 'AppData', 'Local', 'Roblox', 'logs'); // Adjust the path as needed

let currentPlaceID = null;
let latestLogFilePath = null;

// Function to find the newest log file in the directory
function findNewestLogFile() {
  try {
    const files = fs.readdirSync(logDirectory);
    let newestLog = null;

    for (const file of files) {
      const filePath = path.join(logDirectory, file);
      const stats = fs.statSync(filePath);

      if (!newestLog || stats.ctimeMs > newestLog.stats.ctimeMs) {
        newestLog = { filePath, stats };
      }
    }

    return newestLog ? newestLog.filePath : null;
  } catch (error) {
    // console.error('Error reading log directory:', error);
    return null;
  }
}
function encodeName(inputString) {
  // Replace characters other than Latin English letters, spaces, and dollar signs with nothing
  const filteredString = inputString.replace(/[^a-zA-Z\s$]/g, '');

  // Replace spaces and dollar signs with hyphens
  const resultString = filteredString.replace(/[$\s]+/g, '-');

  return resultString;
}
async function sendJoinHook(webhookURL, jobId, displayName, userName, userId, placeId) {
  // console.log(`JobID ${jobId}`)
  // console.log(`DisplayName ${displayName}`)
  // console.log(`UserName ${userName}`)
  // console.log(`UserID ${userId}`)
  // console.log(`PlaceID ${placeId}`)
  try {
    // Fetch game details from the Roblox API
    const gameDetailsResponse = await fetch(`https://economy.roblox.com/v2/assets/${placeId}/details`);
    if (!gameDetailsResponse.ok) {
      throw new Error(`Failed to fetch game details. Status: ${gameDetailsResponse.status}`);
    }
    const gameDetails = await gameDetailsResponse.json();

    let formattedCreatorUrl

    const gameName = gameDetails.Name;
    const creatorName = gameDetails.Creator.Name;
    const creatorType = gameDetails.Creator.CreatorType;
    const creatorId = gameDetails.Creator.CreatorTargetId;

    if (creatorType == "Group") {
      formattedCreatorUrl = `https://roblox.com/groups/${creatorId}/${encodeName(creatorName)}`
    } else {
      formattedCreatorUrl = `https://roblox.com/users/${creatorId}/profile`
    }

    // console.log(`GameName ${gameName}`)
    // console.log(`CreatorName ${creatorName}`)
    // console.log(`CreatorID ${creatorId}`)

    // Fetch headshot URL from the Roblox API
    const headshotResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=48x48&format=Png&isCircular=false`);
    if (!headshotResponse.ok) {
      throw new Error(`Failed to fetch headshot URL. Status: ${headshotResponse.status}`);
    }
    const headshotData = await headshotResponse.json();
    const headshotUrl = headshotData.data[0].imageUrl;

    // console.log(`HeadshotURL ${headshotUrl}`)

    // Fetch thumbnail URL from the Roblox API
    const thumbnailResponse = await fetch(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeId}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`);
    if (!thumbnailResponse.ok) {
      throw new Error(`Failed to fetch thumbnail URL. Status: ${thumbnailResponse.status}`);
    }
    const thumbnailData = await thumbnailResponse.json();
    const thumbnailUrl = thumbnailData.data[0].imageUrl;

    // console.log(`ThumbnailURL ${thumbnailUrl}`)

    // Prepare the data for the Discord webhook
    /*
    {
      "content": null,
      "embeds": [
        {
          "title": "Work At A Pizza Place",
          "description": "**By [Dued1](https://www.roblox.com/users/82471/profile/)**\n### [**Join Server**](https://clay.is-a.dev/random/roblox.html?placeId=192800&gameInstanceId=00000000-0000-0000-0000-000000000000)",
          "url": "https://www.roblox.com/games/192800/Work-at-a-Pizza-Place",
          "color": 16711680,
          "author": {
            "name": "Clay (inaudible_noises) joined a game",
            "url": "https://www.roblox.com/users/3427423362/profile",
            "icon_url": "https://tr.rbxcdn.com/15DAY-AvatarHeadshot-BBBB00AF4F009C65BB8EBD60F0713899-Png/48/48/AvatarHeadshot/Png/noFilter"
          },
          "thumbnail": {
            "url": "https://tr.rbxcdn.com/abad5a602e55882256e617964eb7a644/128/128/Image/Png"
          }
        }
      ],
      "attachments": []
    }
    */

    const webhookData = {
      username: hwid,
      content: null,
      embeds: [
        {
          title: gameName,
          description: `**By [${creatorName}](${formattedCreatorUrl})**\n### [**Join Server**](https://clay.is-a.dev/random/roblox.html?placeId=${placeId}&gameInstanceId=${jobId})`,
          url: `https://www.roblox.com/games/${placeId}/Work-at-a-Pizza-Place`,
          color: 16711680,
          author: {
            name: `${displayName} (${userName}) joined`,
            url: `https://www.roblox.com/users/${userId}/profile`,
            icon_url: headshotUrl,
          },
          thumbnail: {
            url: thumbnailUrl,
          },
        },
      ],
      attachments: [],
    };

    // Send the Discord webhook
    const response = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      throw new Error(`Failed to send Discord webhook. Status: ${response.status}`);
    }

    // console.log('Sent!');
  } catch (error) {
    // console.error('Error:', error);
  }
}

async function sendLeaveHook(webhookURL, displayName, userName, userId) {
  // console.log(displayName)
  // console.log(userName)
  // console.log(userId)
  try {
    // Fetch headshot URL from the Roblox API
    const headshotResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=48x48&format=Png&isCircular=false`);
    if (!headshotResponse.ok) {
      throw new Error(`Failed to fetch headshot URL. Status: ${headshotResponse.status}`);
    }
    const headshotData = await headshotResponse.json();
    const headshotUrl = headshotData.data[0].imageUrl;

    // console.log(`HeadshotURL ${headshotUrl}`)

    // Prepare the data for the Discord webhook
    /*
    {
      "content": null,
      "embeds": [
        {
          "url": "https://www.roblox.com/games/192800/Work-at-a-Pizza-Place",
          "color": 16711680,
          "author": {
            "name": "Clay (inaudible_noises) left the game",
            "url": "https://www.roblox.com/users/3427423362/profile",
            "icon_url": "https://tr.rbxcdn.com/15DAY-AvatarHeadshot-BBBB00AF4F009C65BB8EBD60F0713899-Png/48/48/AvatarHeadshot/Png/noFilter"
          }
        }
      ],
      "attachments": []
    }
    */
    const webhookData = {
      username: hwid,
      content: null,
      embeds: [
        {
          color: 16711680,
          author: {
            name: `${displayName} (${userName}) left`,
            url: `https://www.roblox.com/users/${userId}/profile`,
            icon_url: headshotUrl,
          },
        },
      ],
      attachments: [],
    };

    // Send the Discord webhook
    const response = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      throw new Error(`Failed to send Discord webhook. Status: ${response.status}`);
    }

    // console.log('Discord webhook sent successfully');
  } catch (error) {
    // console.error('Error sending Discord webhook:', error);
  }
}

function itemFromJoinUrl(url, item) {
  let regex;

  if (item === 'UserName' || item === 'DisplayName') {
    regex = new RegExp(`%22${item}%22%3a%22([^%]+)%22`);
  } else if (item === 'PlaceId') {
    regex = new RegExp(`%22${item}%22%3a([^%]+)%2c`);
  } else if (item === 'JobId') {
    regex = new RegExp(`{"jobId":"([^"]+)"`);
  } else if (item === 'UserId') {
    regex = new RegExp(`%22${item}%22%3a([^%]+)%2c.*`)
  } else {
    // console.log('Invalid item parameter');
    return null;
  }

  const match = url.match(regex);

  if (match) {
    // console.log(`Matched found for ${item}`);
    return decodeURIComponent(match[1]); // Decode URL-encoded value
  } else {
    // console.log(`No match for ${item}`);
    return null;
  }
}



function startLogTailing() {
  latestLogFilePath = findNewestLogFile();
  let lineNumber = 0; // Initialize line number counter
  let lastPlayerInfo = {}; // Store the last player info

  if (latestLogFilePath) {
    const logTail = new Tail(latestLogFilePath);

    logTail.on('line', (line) => {
      lineNumber++; // Increment line number for each line

      // Check for player info lines


      if (line.includes('"joinScriptUrl"')) {
        // console.log('URL line found')
        userName = itemFromJoinUrl(line, 'UserName')
        displayName = itemFromJoinUrl(line, 'DisplayName')
        placeId = itemFromJoinUrl(line, 'PlaceId')
        userId = itemFromJoinUrl(line, 'UserId')
      }

      // Check for lines that indicate a player joining the game
      const joinMatch = line.match(/! Joining game '(.*)' place (\d+) at/);
      if (joinMatch && displayName) {
        const jobID = joinMatch[1];
        const placeID = joinMatch[2];
        currentPlaceID = placeID;
        sendJoinHook(webhookURL, jobID, displayName, userName, userId, placeID)
        lastPlayerInfo = {}; // Reset last player info
      }

      // Check for lines that indicate a player leaving the game
      if (line.includes('Time to disconnect replication data') && displayName) {
        currentPlaceID = null;
        sendLeaveHook(webhookURL, displayName, userName, userId)
        lastPlayerInfo = {}; // Reset last player info
      }
    });

    // Handle any cleanup when the script is terminated
    process.on('SIGINT', () => {
      logTail.unwatch();
      // console.log('Script terminated');
      process.exit();
    });
  }
}


// Start monitoring the newest log file
// console.log('Started\n')
startLogTailing();

// Periodically check for the newest log file and switch if necessary
setInterval(() => {

  const newLogFilePath = findNewestLogFile();
  if (newLogFilePath !== latestLogFilePath) {
    // Switch to tailing the new log file
    latestLogFilePath = newLogFilePath;
    startLogTailing();
  }
}, 2000); // Check for a new log file every 2 seconds
