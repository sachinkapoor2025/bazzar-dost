import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export function memoryMode(): boolean {
  return process.env.USE_MEMORY_DB === "true";
}

export function environmentName(): string {
  return process.env.ENVIRONMENT ?? "dev";
}

let document: DynamoDBDocumentClient | null = null;

export function docClient(): DynamoDBDocumentClient {
  if (document) return document;
  const endpoint = process.env.DYNAMODB_ENDPOINT;
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION ?? "us-east-1",
    ...(endpoint
      ? {
          endpoint,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "local",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "local",
          },
        }
      : {}),
  });
  document = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
  return document;
}

export function productsTable(): string {
  return process.env.PRODUCTS_TABLE ?? `bazaardost-products-${environmentName()}`;
}

export function ordersTable(): string {
  return process.env.ORDERS_TABLE ?? `bazaardost-orders-${environmentName()}`;
}

export function cartsTable(): string {
  return process.env.CARTS_TABLE ?? `bazaardost-carts-${environmentName()}`;
}

export function customersTable(): string {
  return process.env.CUSTOMERS_TABLE ?? `bazaardost-customers-${environmentName()}`;
}

export function eventsTable(): string {
  return process.env.EVENTS_TABLE ?? `bazaardost-events-${environmentName()}`;
}

export function configTable(): string {
  return process.env.CONFIG_TABLE ?? `bazaardost-config-${environmentName()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function ttlInDays(days: number): number {
  return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
}
