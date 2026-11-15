import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "src", "generated", "session-secret.ts");
const envSecret = process.env.SESSION_SECRET || "";
const secret = envSecret.length >= 32 ? "" : crypto.randomBytes(32).toString("hex");

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `export const builtSessionSecret = ${JSON.stringify(secret)};\n`);
