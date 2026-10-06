import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

console.log('Testing AWS DynamoDB Connectivity...');
console.log('AWS_REGION:', process.env.AWS_REGION || 'not set');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? (process.env.AWS_ACCESS_KEY_ID.slice(0, 6) + '...' + process.env.AWS_ACCESS_KEY_ID.slice(-4)) : 'not set');

const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  console.error('ERROR: AWS credentials not found in environment.');
  process.exit(1);
}

const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

try {
  console.log('Connecting to AWS and listing DynamoDB tables in', region, '...');
  const res = await client.send(new ListTablesCommand({}));
  console.log('SUCCESS! AWS Connection Established.');
  console.log('Tables found:', res.TableNames || []);

  const farmsTable = process.env.DYNAMODB_FARMS_TABLE || 'FieldGuard-Farms';
  const logsTable = process.env.DYNAMODB_LOGS_TABLE || 'FieldGuard-DecisionLogs';

  const hasFarms = res.TableNames && res.TableNames.includes(farmsTable);
  const hasLogs = res.TableNames && res.TableNames.includes(logsTable);

  console.log(`- Table [${farmsTable}]: ${hasFarms ? 'EXISTS' : 'NOT FOUND'}`);
  console.log(`- Table [${logsTable}]: ${hasLogs ? 'EXISTS' : 'NOT FOUND'}`);

  if (hasFarms) {
    console.log('Testing write/read to', farmsTable, '...');
    const docClient = DynamoDBDocumentClient.from(client);
    const testId = 'test-ping-' + Date.now();
    await docClient.send(new PutCommand({
      TableName: farmsTable,
      Item: {
        id: testId,
        test: true,
        ping: 'FieldGuard AWS Verification',
        timestamp: new Date().toISOString(),
      },
    }));
    console.log('Write to DynamoDB successful! Key:', testId);
    
    const readRes = await docClient.send(new GetCommand({
      TableName: farmsTable,
      Key: { id: testId },
    }));
    console.log('Read from DynamoDB successful! Item:', readRes.Item);
  }
} catch (err) {
  console.error('FAILED to connect to AWS DynamoDB:');
  console.error(err);
}
