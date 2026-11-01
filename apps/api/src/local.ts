import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

loadEnvFile(path.resolve(__dirname, "../../../.env"));
loadEnvFile(path.resolve(__dirname, "../../.env"));
process.env.USE_MEMORY_DB ??= "true";
process.env.ENVIRONMENT ??= "local";

const port = Number(process.env.PORT ?? 4000);

async function main() {
  const { handler } = await import("./index");
  const { seedIfEmpty } = await import("./lib/store");
  await seedIfEmpty();
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", async () => {
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.end();
        return;
      }
      const event = {
        version: "2.0",
        routeKey: `${req.method} ${url.pathname}`,
        rawPath: url.pathname,
        rawQueryString: url.search.slice(1),
        headers: Object.fromEntries(Object.entries(req.headers).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])),
        queryStringParameters: Object.fromEntries(url.searchParams),
        requestContext: { http: { method: req.method ?? "GET", path: url.pathname } },
        body: Buffer.concat(chunks).toString("utf8"),
        isBase64Encoded: false,
      } as APIGatewayProxyEventV2;
      const result = (await handler(event, {} as never)) as Exclude<APIGatewayProxyResultV2, string>;
      res.statusCode = result.statusCode ?? 200;
      for (const [key, value] of Object.entries(result.headers ?? {})) {
        if (typeof value === "string") res.setHeader(key, value);
      }
      res.end(result.body ?? "");
    });
  });
  server.listen(port, () => {
    console.log(`BazaarDost API at http://127.0.0.1:${port}`);
    if (process.env.USE_MEMORY_DB === "true") console.log("Using the in-memory catalogue. Set DYNAMODB_ENDPOINT to use DynamoDB Local.");
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
