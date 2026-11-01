import { DeleteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, memoryMode } from "./db";

export type Item = Record<string, unknown> & { PK: string; SK: string };

const memory = new Map<string, Map<string, Item>>();

function bucket(tableName: string): Map<string, Item> {
  let table = memory.get(tableName);
  if (!table) {
    table = new Map();
    memory.set(tableName, table);
  }
  return table;
}

function keyOf(pk: string, sk: string): string {
  return `${pk}::${sk}`;
}

export function clearAll(): void {
  memory.clear();
}

export function isConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String((error as { name?: string }).name) : "";
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return name === "ConditionalCheckFailedException" || code === "ConditionalCheckFailedException";
}

export async function putItem(tableName: string, item: Item, expectedVersion?: number): Promise<void> {
  if (memoryMode()) {
    const table = bucket(tableName);
    const key = keyOf(item.PK, item.SK);
    const existing = table.get(key);
    if (expectedVersion !== undefined && existing && Number(existing.version ?? 0) !== expectedVersion) {
      const error = new Error("Conditional check failed");
      (error as Error & { name: string }).name = "ConditionalCheckFailedException";
      throw error;
    }
    table.set(key, item);
    return;
  }
  await docClient().send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ...(expectedVersion !== undefined
        ? {
            ConditionExpression: "version = :version",
            ExpressionAttributeValues: { ":version": expectedVersion },
          }
        : {}),
    }),
  );
}

export async function getItem(tableName: string, pk: string, sk: string): Promise<Item | null> {
  if (memoryMode()) return bucket(tableName).get(keyOf(pk, sk)) ?? null;
  const result = await docClient().send(new GetCommand({ TableName: tableName, Key: { PK: pk, SK: sk } }));
  return (result.Item as Item | undefined) ?? null;
}

export async function deleteItem(tableName: string, pk: string, sk: string): Promise<void> {
  if (memoryMode()) {
    bucket(tableName).delete(keyOf(pk, sk));
    return;
  }
  await docClient().send(new DeleteCommand({ TableName: tableName, Key: { PK: pk, SK: sk } }));
}

export async function queryPk(tableName: string, pk: string): Promise<Item[]> {
  if (memoryMode()) return [...bucket(tableName).values()].filter((item) => item.PK === pk);
  const items: Item[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient().send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": pk },
        ExclusiveStartKey: startKey,
      }),
    );
    items.push(...((result.Items ?? []) as Item[]));
    startKey = result.LastEvaluatedKey;
  } while (startKey);
  return items;
}

export async function queryIndex(tableName: string, index: "GSI1" | "GSI2" | "GSI3", pk: string): Promise<Item[]> {
  const pkName = `${index}PK`;
  if (memoryMode()) return [...bucket(tableName).values()].filter((item) => item[pkName] === pk);
  const items: Item[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient().send(
      new QueryCommand({
        TableName: tableName,
        IndexName: index,
        KeyConditionExpression: `${pkName} = :pk`,
        ExpressionAttributeValues: { ":pk": pk },
        ExclusiveStartKey: startKey,
      }),
    );
    items.push(...((result.Items ?? []) as Item[]));
    startKey = result.LastEvaluatedKey;
  } while (startKey);
  return items;
}

export async function scanTable(tableName: string): Promise<Item[]> {
  if (memoryMode()) return [...bucket(tableName).values()];
  const items: Item[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient().send(new ScanCommand({ TableName: tableName, ExclusiveStartKey: startKey }));
    items.push(...((result.Items ?? []) as Item[]));
    startKey = result.LastEvaluatedKey;
  } while (startKey);
  return items;
}
