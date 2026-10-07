import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const tableName = process.env.DYNAMODB_FARMS_TABLE || 'FieldGuard-Farms';

if (!accessKeyId || !secretAccessKey) {
  console.error('AWS credentials missing');
  process.exit(1);
}

const client = new DynamoDBClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
});
const docClient = DynamoDBDocumentClient.from(client);

const customFarm = {
  id: 'farm-custom-' + Date.now(),
  farmName: 'Kaif Sardar Bardhaman Plot',
  location: {
    latitude: 23.2324,
    longitude: 87.8615,
    villageOrPincode: 'Bardhaman, West Bengal',
    displayName: 'Bardhaman Agri Hub'
  },
  soil: {
    texture: 'clay_loam',
    awc_mm_per_m: 140
  },
  reserve: {
    type: 'sump',
    capacity_liters: 15000,
    currentAvailable_liters: 12000,
    dimensions: { length_m: 3, width_m: 2.5, depth_m: 2 }
  },
  plots: [
    {
      plotId: 'plot-custom-1',
      crop: 'Tomato',
      stage: 'mid',
      area_sqm: 4047,
      kc: 1.15,
      rootDepth_m: 0.8,
      depletionFraction_p: 0.4,
      irrigationMethod: 'drip'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

console.log('Writing full custom farm profile to DynamoDB table:', tableName);
await docClient.send(new PutCommand({
  TableName: tableName,
  Item: customFarm,
}));
console.log('Write complete! ID:', customFarm.id);

console.log('Fetching back from DynamoDB...');
const res = await docClient.send(new GetCommand({
  TableName: tableName,
  Key: { id: customFarm.id },
}));

console.log('Read verification:');
console.log('- Farm Name:', res.Item.farmName);
console.log('- Soil Texture:', res.Item.soil.texture, `(AWC: ${res.Item.soil.awc_mm_per_m} mm/m)`);
console.log('- Reserve:', res.Item.reserve.capacity_liters, 'L Capacity /', res.Item.reserve.currentAvailable_liters, 'L Available');
console.log('- Plots:', res.Item.plots.length, 'Plot ->', res.Item.plots[0].crop, res.Item.plots[0].irrigationMethod);
console.log('ALL EXACT CUSTOMISATIONS STORED IN AWS DYNAMODB!');
