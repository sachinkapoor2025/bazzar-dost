import { CreateTableCommand, DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const endpoint = process.env.DYNAMODB_ENDPOINT ?? "http://127.0.0.1:8000";
const environment = process.env.ENVIRONMENT ?? "local";
const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

const names = [
  `bazaardost-products-${environment}`,
  `bazaardost-orders-${environment}`,
  `bazaardost-carts-${environment}`,
  `bazaardost-customers-${environment}`,
  `bazaardost-events-${environment}`,
  `bazaardost-config-${environment}`,
];

function attributes(indexes: string[]) {
  const names = ["PK", "SK", ...indexes.flatMap((index) => [`${index}PK`, `${index}SK`])];
  return names.map((AttributeName) => ({ AttributeName, AttributeType: "S" as const }));
}

function keys() {
  return [
    { AttributeName: "PK", KeyType: "HASH" as const },
    { AttributeName: "SK", KeyType: "RANGE" as const },
  ];
}

function gsi(index: string) {
  return {
    IndexName: index,
    KeySchema: [
      { AttributeName: `${index}PK`, KeyType: "HASH" as const },
      { AttributeName: `${index}SK`, KeyType: "RANGE" as const },
    ],
    Projection: { ProjectionType: "ALL" as const },
  };
}

async function main() {
  const existing = new Set((await client.send(new ListTablesCommand({}))).TableNames ?? []);
  const plans = [
    { name: names[0], indexes: ["GSI1"] },
    { name: names[1], indexes: ["GSI1", "GSI2", "GSI3"] },
    { name: names[2], indexes: ["GSI1"] },
    { name: names[3], indexes: ["GSI1"] },
    { name: names[4], indexes: ["GSI1"] },
    { name: names[5], indexes: [] },
  ];
  for (const plan of plans) {
    if (existing.has(plan.name)) {
      console.log(`exists ${plan.name}`);
      continue;
    }
    await client.send(
      new CreateTableCommand({
        TableName: plan.name,
        BillingMode: "PAY_PER_REQUEST",
        AttributeDefinitions: attributes(plan.indexes),
        KeySchema: keys(),
        GlobalSecondaryIndexes: plan.indexes.length ? plan.indexes.map(gsi) : undefined,
      }),
    );
    console.log(`created ${plan.name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
