import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { route } from "./router";
import { seedIfEmpty } from "./lib/store";

let catalogueReady: Promise<void> | null = null;

function ensureCatalogue(): Promise<void> {
  catalogueReady ??= seedIfEmpty().catch((error) => {
    catalogueReady = null;
    throw error;
  });
  return catalogueReady;
}

export async function handler(event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyResultV2> {
  try {
    await ensureCatalogue();
    return await route(event);
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Something went wrong. Please try again." }),
    };
  }
}
