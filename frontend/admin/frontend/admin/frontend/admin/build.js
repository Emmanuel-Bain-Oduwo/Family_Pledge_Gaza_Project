const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const realApp = path.resolve(__dirname, "../../../..");

execSync("npm run build", { cwd: realApp, stdio: "inherit" });

const source = path.join(realApp, ".next");
const targets = [
  path.join(__dirname, ".next"),
  path.resolve(__dirname, "../..", ".next"),
];

for (const target of targets) {
  if (path.resolve(target) === path.resolve(source)) continue;
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
}
