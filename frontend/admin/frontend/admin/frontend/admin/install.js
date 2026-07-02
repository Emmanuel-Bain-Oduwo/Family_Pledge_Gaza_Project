const { execSync } = require("child_process");
const path = require("path");

const realApp = path.resolve(__dirname, "../../../..");
execSync("npm install", { cwd: realApp, stdio: "inherit" });
