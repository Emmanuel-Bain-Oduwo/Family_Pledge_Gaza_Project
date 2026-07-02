const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const frontendRoot = path.resolve(__dirname, "../..");

execSync("npm run build", { cwd: frontendRoot, stdio: "inherit" });

const source = path.join(frontendRoot, ".next");
const targets = [
  path.join(__dirname, ".next"),
  path.resolve(__dirname, "../..", ".next"),
];

for (const target of targets) {
  if (path.resolve(target) === path.resolve(source)) continue;
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
}
