const fs = require("fs");
const path = require("path");
const Tail = require("tail").Tail;
const os = require("os");
const crypto = require("crypto");
// const fetch = require('node-fetch');
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

// console.log('Located at: ' + path.join(process.execPath))
// console.log('Log exists: ' + fs.existsSync(path.join(os.homedir(), 'AppData', 'Local', 'RobloxPresenceChatlogger.json')))
// console.log('Bloxstrap exists: ' + fs.existsSync(path.join(os.homedir(), 'AppData', 'Local', 'Bloxstrap', 'Settings.json')))

// read RobloxPresenceChatlogger.json, if it exists then log "Started"
if (
  fs.existsSync(
    path.join(os.homedir(), "AppData", "Local", "RobloxPresenceChatLogger.json")
  )
) {
  console.log("Started\n");
}

if (
  fs.existsSync(
    path.join(os.homedir(), "AppData", "Local", "Bloxstrap", "Settings.json")
  ) &&
  !fs.existsSync(
    path.join(os.homedir(), "AppData", "Local", "RobloxPresenceChatLogger.json")
  )
) {
  readline.question(
    "Bloxstrap detected! Would you like to add the chat logger to custom integrations?\nY/N > ",
    (response) => {
      if (response.toLowerCase() == "yes" || response.toLowerCase() == "y") {
        const filePath = path.join(
          os.homedir(),
          "AppData",
          "Local",
          "Bloxstrap",
          "Settings.json"
        );
        const newData = {
          Name: "Roblox Presence Chat Logger",
          Location: path.join(process.execPath),
          LaunchArgs: "",
          AutoClose: true,
        };

        fs.readFile(filePath, "utf8", (err, data) => {
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
                console.log("\nDone! Started logger.");
                // console.log('Data added to CustomIntegrations array successfully.');
              }
            });
          }
        });
      }
      readline.close();
    }
  );
}

// make a file in appdata called "RobloxPresenceChatlogger.json"
// if you don't have that file, it will create it for you
// NOTE: disabed for debugging (it's annoying)
if (
  !fs.existsSync(
    path.join(os.homedir(), "AppData", "Local", "RobloxPresenceChatLogger.json")
  )
) {
  fs.writeFileSync(
    path.join(
      os.homedir(),
      "AppData",
      "Local",
      "RobloxPresenceChatLogger.json"
    ),
    '{"firstTimeRunning": false}'
  );
}

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
  const sortedMacs = macAddresses.sort().join("");
  const hwid = crypto.createHash("sha1").update(sortedMacs).digest("hex");

  return hwid;
}

const hwid = generateHWID();

const logDirectory = path.join(
  os.homedir(),
  "AppData",
  "Local",
  "Roblox",
  "logs"
); // Adjust the path as needed

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

function tryAtobDecode(base64String) {
  try {
    const decodedString = atob(base64String);
    return decodedString + '\n';
  } catch (error) {
    return "";
  }
}
const unix_timestamp = Date.now()
function startLogTailing() {
  latestLogFilePath = findNewestLogFile();
  let lineNumber = 0; // Initialize line number counter

  if (latestLogFilePath) {
    const logTail = new Tail(latestLogFilePath);

    logTail.on("line", (line) => {
      lineNumber++; // Increment line number for each line
      const regex = /\[FLog::Output\] (.*?)$/;
      const match = line.match(regex);

      if (match) {
        const base64EncodedData = match[1];
        // if it doesnt exist already, create a folder named 'ChatLogs' in the same directory as this file
        if (!fs.existsSync(path.join(process.cwd(), "ChatLogs"))) {
          fs.mkdirSync(path.join(process.cwd(), "ChatLogs"));
        }
        // create a file in the ChatLogs folder named 'chat-unix_timestamp.txt'
        const fileName = `chat-${unix_timestamp}.txt`;
        // add tryAtobDecode(base64EncodedData) to the file
        // put the file in process.cwd() + '/ChatLogs'
        if (tryAtobDecode(base64EncodedData).includes("RobloxPresenceChatLogger")) {
            console.log(tryAtobDecode(base64EncodedData).replace('RobloxPresenceChatLogger\n', ''))
            // create chat-${unix_timestamp}.txt in the ChatLogs folder if it doesnt exist already and add tryAtobDecode(base64EncodedData).replace('RobloxPresenceChatLogger\n', '') to it
            fs.appendFileSync(
              path.join(process.cwd(), "ChatLogs", fileName),
              tryAtobDecode(base64EncodedData).replace('RobloxPresenceChatLogger\n', '')
            );
        }
      } else {
        // console.log("Base64 encoded data not found.");
      }
    });

    // Handle any cleanup when the script is terminated
    process.on("SIGINT", () => {
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
