import type { APIGatewayProxyResultV2 } from "aws-lambda";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-Id",
};

export function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    body: JSON.stringify(body),
  };
}

export function corsPreflight(): APIGatewayProxyResultV2 {
  return { statusCode: 204, headers: CORS_HEADERS, body: "" };
}

export function ok(body: unknown) {
  return json(200, body);
}

export function created(body: unknown) {
  return json(201, body);
}
