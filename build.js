const { exec } = require("child_process");
const currentDir = process.cwd();
if (process.argv[2] == "--chat" || process.argv[2] == "-c") {
  exec(
    `npm i pkg -g && pkg -t latest-win-x64 -C Brotli chat.js -o RobloxPresenceChat.exe`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }

      console.log(stdout);
    }
  );
} else if (process.argv[2] == "--webhook" || process.argv[2] == "-w") {
  exec(
    `npm i pkg -g && pkg -t latest-win-x64 -C Brotli index.js -o RobloxPresence.exe`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }

      console.log(stdout);
    }
  );
} else {
  console.log(`\n  node\x1b[1m build.js\x1b[0m [options]

  \x1b[2mOptions:\x1b[0m

    -c, --chat      Build the chat logger (will only work if the experience supports it)
    -w, --webhook   Build the webhook presence logger
    `);
}
