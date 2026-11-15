const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const target = path.join(root, "src", "generated", "session-secret.ts");
const envSecret = process.env.SESSION_SECRET || "";
const secret = envSecret.length >= 32 ? envSecret : crypto.randomBytes(32).toString("hex");

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `export const builtSessionSecret = ${JSON.stringify(secret)};\n`);
console.log("Session secret is available to the server build.");
