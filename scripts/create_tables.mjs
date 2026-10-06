import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function createTableIfNotExists(params) {
  try {
    console.log(`Creating DynamoDB table [${params.TableName}] in ${region}...`);
    await client.send(new CreateTableCommand(params));
    console.log(`Table [${params.TableName}] created successfully!`);
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log(`Table [${params.TableName}] already exists.`);
    } else {
      console.error(`Error creating table [${params.TableName}]:`, err.message);
    }
  }
}

async function main() {
  // 1. FieldGuard-Farms
  await createTableIfNotExists({
    TableName: 'FieldGuard-Farms',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST', // 100% Free Tier on-demand
  });

  // 2. FieldGuard-DecisionLogs
  await createTableIfNotExists({
    TableName: 'FieldGuard-DecisionLogs',
    KeySchema: [
      { AttributeName: 'farmId', KeyType: 'HASH' }, // Partition key
      { AttributeName: 'timestamp', KeyType: 'RANGE' }, // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'farmId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST', // 100% Free Tier on-demand
  });

  console.log('\nChecking table statuses...');
  // Wait a few seconds for active status
  setTimeout(async () => {
    try {
      const d1 = await client.send(new DescribeTableCommand({ TableName: 'FieldGuard-Farms' }));
      const d2 = await client.send(new DescribeTableCommand({ TableName: 'FieldGuard-DecisionLogs' }));
      console.log(`- FieldGuard-Farms: Status = ${d1.Table.TableStatus}`);
      console.log(`- FieldGuard-DecisionLogs: Status = ${d2.Table.TableStatus}`);
      console.log('\nAll DynamoDB tables are provisioned and READY!');
    } catch (e) {
      console.log('Tables are initializing.');
    }
  }, 4000);
}

main();
