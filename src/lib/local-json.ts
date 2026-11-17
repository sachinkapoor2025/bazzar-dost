import "server-only";
import fs from "node:fs";
import path from "node:path";

export function readJsonArray<T>(file: string): T[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : "";
    if (code !== "ENOENT") console.error(error);
    return [];
  }
}

export function writeJsonArray(file: string, rows: unknown[]): boolean {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
    fs.copyFileSync(tmp, file);
    fs.unlinkSync(tmp);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
