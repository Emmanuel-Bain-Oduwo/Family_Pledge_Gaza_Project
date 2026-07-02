const { execSync } = require("child_process");
const path = require("path");

const frontendRoot = path.resolve(__dirname, "../..");
execSync("npm install", { cwd: frontendRoot, stdio: "inherit" });
