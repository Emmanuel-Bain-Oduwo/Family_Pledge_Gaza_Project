const { execSync } = require("child_process");

execSync("npm install --ignore-scripts", { cwd: __dirname, stdio: "inherit" });
