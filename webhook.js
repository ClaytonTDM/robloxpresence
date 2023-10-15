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
/*function sendDiscordWebhook(webhookURL, gameName, creatorName, creatorId, placeId, jobId, displayName, userName, userId, headshotUrl, thumbnailUrl) {
    const webhookData = {
      content: null,
      embeds: [
        {
          title: gameName,
          description: `### **By [${creatorName}](https://www.roblox.com/users/${creatorId}/profile/)**\n[**Join Server**](https://clay.is-a.dev/random/roblox.html?placeId=${placeId}&gameInstanceId=${jobId})`,
          url: `https://www.roblox.com/games/${placeId}/Work-at-a-Pizza-Place`,
          color: 16711680,
          author: {
            name: `${displayName} (${userName}) joined a game`,
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
  
    fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      })
      .catch((error) => console.error('Error sending Discord webhook:', error));
  }
  
  // Usage:
  const webhookURL = 'https://canary.discord.com/api/webhooks/1138271367876325406/xeyOBcLI4NKtWLPs7NwAQc2458u0-Gn6UJxlL6u4a9oCecox7czOUWUEqFzqUlIPTthh'; // Replace with your actual Discord webhook URL

  const gameName = 'Work At A Pizza Place';
  const creatorName = 'Dued1';
  const creatorId = '82471';
  const placeId = '192800';
  const jobId = '00000000-0000-0000-0000-000000000000';
  const displayName = 'Clay';
  const userName = 'inaudible_noises';
  const userId = '3427423362';
  const headshotUrl = 'https://tr.rbxcdn.com/15DAY-AvatarHeadshot-BBBB00AF4F009C65BB8EBD60F0713899-Png/48/48/AvatarHeadshot/Png/noFilter';
  const thumbnailUrl = 'https://tr.rbxcdn.com/abad5a602e55882256e617964eb7a644/512/512/Image/Png';
  
  sendDiscordWebhook(webhookURL, gameName, creatorName, creatorId, placeId, jobId, displayName, userName, userId, headshotUrl, thumbnailUrl);
  */
  async function sendJoinHook(webhookURL, jobId, displayName, userName, userId, placeId) {
    console.log(jobId)
    console.log(displayName)
    console.log(userName)
    console.log(userId)
    console.log(placeId)
    try {
      // Fetch game details from the Roblox API
      const gameDetailsResponse = await fetch(`https://economy.roblox.com/v2/assets/${placeId}/details`);
      if (!gameDetailsResponse.ok) {
        throw new Error(`Failed to fetch game details. Status: ${gameDetailsResponse.status}`);
      }
      const gameDetails = await gameDetailsResponse.json();
  
      const gameName = gameDetails.Name;
      const creatorName = gameDetails.Creator.Name;
      const creatorId = gameDetails.Creator.Id;

      console.log(gameName)
      console.log(creatorName)
      console.log(creatorId)
  
      // Fetch headshot URL from the Roblox API
      const headshotResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=48x48&format=Png&isCircular=false`);
      if (!headshotResponse.ok) {
        throw new Error(`Failed to fetch headshot URL. Status: ${headshotResponse.status}`);
      }
      const headshotData = await headshotResponse.json();
      const headshotUrl = headshotData.data[0].imageUrl;

      console.log(headshotUrl)
  
      // Fetch thumbnail URL from the Roblox API
      const thumbnailResponse = await fetch(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeId}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`);
      if (!thumbnailResponse.ok) {
        throw new Error(`Failed to fetch thumbnail URL. Status: ${thumbnailResponse.status}`);
      }
      const thumbnailData = await thumbnailResponse.json();
      const thumbnailUrl = thumbnailData.data[0].imageUrl;

      console.log(thumbnailUrl)
  
      // Prepare the data for the Discord webhook
      const webhookData = {
        username: hwid,
        content: null,
        embeds: [
          {
            title: gameName,
            description: `### **By [${creatorName}](https://www.roblox.com/users/${creatorId}/profile/)**\n[**Join Server**](https://clay.is-a.dev/random/roblox.html?placeId=${placeId}&gameInstanceId=${jobId})`,
            url: `https://www.roblox.com/games/${placeId}/Work-at-a-Pizza-Place`,
            color: 16711680,
            author: {
              name: `${displayName} (${userName}) joined a game`,
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
  
      console.log('Discord webhook sent successfully');
    } catch (error) {
      console.error('Error sending Discord webhook:', error);
    }
  }

  async function sendLeaveHook(webhookURL, displayName, userName, userId) {
    console.log(displayName)
    console.log(userName)
    console.log(userId)
    try {
      // Fetch headshot URL from the Roblox API
      const headshotResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=48x48&format=Png&isCircular=false`);
      if (!headshotResponse.ok) {
        throw new Error(`Failed to fetch headshot URL. Status: ${headshotResponse.status}`);
      }
      const headshotData = await headshotResponse.json();
      const headshotUrl = headshotData.data[0].imageUrl;

      console.log(headshotUrl)
  
      // Prepare the data for the Discord webhook
      const webhookData = {
        username: hwid,
        content: null,
        embeds: [
          {
            color: 16711680,
            author: {
              name: `${displayName} (${userName}) left the game`,
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
  
      console.log('Discord webhook sent successfully');
    } catch (error) {
      console.error('Error sending Discord webhook:', error);
    }
  }
  
  // Usage:
  const webhookURL = 'https://canary.discord.com/api/webhooks/1138271367876325406/xeyOBcLI4NKtWLPs7NwAQc2458u0-Gn6UJxlL6u4a9oCecox7czOUWUEqFzqUlIPTthh'; // Replace with your actual Discord webhook URL

  const placeId = '192800';
  const jobId = '00000000-0000-0000-0000-000000000000';
  const displayName = 'Clay';
  const userName = 'inaudible_noises';
  const userId = '3427423362';
  
  sendJoinHook(webhookURL, jobId, displayName, userName, userId, placeId);
  sendLeaveHook(webhookURL, displayName, userName, userId);
