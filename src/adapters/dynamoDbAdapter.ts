import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
} from '@aws-sdk/lib-dynamodb';
import { FarmProfile } from '../types/farm';
import { DecisionResponse } from '../types/decision';

// In-memory fallback for offline development
const inMemoryFarms = new Map<string, FarmProfile>();
const inMemoryLogs = new Map<string, any[]>();

let docClient: DynamoDBDocumentClient | null = null;

function getDocClient(): DynamoDBDocumentClient | null {
  if (docClient) return docClient;

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'ap-south-1'; // Default: Mumbai

  if (accessKeyId && secretAccessKey) {
    try {
      const client = new DynamoDBClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      docClient = DynamoDBDocumentClient.from(client);
      return docClient;
    } catch (err) {
      console.warn('Could not initialize AWS DynamoDB client, falling back to local store:', err);
    }
  }

  return null;
}

/**
 * Saves the exact custom farm profile to Amazon DynamoDB (Table: FieldGuard-Farms).
 * If called in the browser, routes via server-side /api/farm to protect AWS IAM credentials.
 * If called in Node.js runtime, uses the AWS SDK Document Client directly.
 */
export async function saveFarmProfileToDynamo(farm: FarmProfile): Promise<{ success: boolean; storage: 'aws_dynamodb' | 'local_memory' }> {
  // 1. Browser context: call Next.js server API
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/farm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, storage: data.storage || 'aws_dynamodb' };
      }
    } catch (err) {
      console.warn('Network call to /api/farm failed, saving locally:', err);
    }
    inMemoryFarms.set(farm.id, farm);
    return { success: true, storage: 'local_memory' };
  }

  // 2. Server context: Direct AWS SDK call
  const client = getDocClient();
  const tableName = process.env.DYNAMODB_FARMS_TABLE || 'FieldGuard-Farms';

  if (client) {
    try {
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: farm,
        })
      );
      return { success: true, storage: 'aws_dynamodb' };
    } catch (error) {
      console.error('DynamoDB PutCommand failed, caching locally:', error);
    }
  }

  // Fallback
  inMemoryFarms.set(farm.id, farm);
  return { success: true, storage: 'local_memory' };
}

/**
 * Retrieves the farm profile from Amazon DynamoDB by its unique ID.
 */
export async function getFarmProfileFromDynamo(farmId: string): Promise<FarmProfile | null> {
  // 1. Browser context: call Next.js server API
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/farm?farmId=${encodeURIComponent(farmId)}`);
      if (res.ok) {
        const data = await res.json();
        return data.farm as FarmProfile;
      }
    } catch (err) {
      console.warn('Network call to fetch farm failed:', err);
    }
    return inMemoryFarms.get(farmId) || null;
  }

  // 2. Server context: Direct AWS SDK call
  const client = getDocClient();
  const tableName = process.env.DYNAMODB_FARMS_TABLE || 'FieldGuard-Farms';

  if (client) {
    try {
      const response = await client.send(
        new GetCommand({
          TableName: tableName,
          Key: { id: farmId }, // Primary Key matches table schema (id)
        })
      );
      if (response.Item) {
        return response.Item as FarmProfile;
      }
    } catch (error) {
      console.error('DynamoDB GetCommand failed, falling back to local memory:', error);
    }
  }

  return inMemoryFarms.get(farmId) || null;
}

/**
 * Logs an irrigation decision recommendation into Amazon DynamoDB (Table: FieldGuard-DecisionLogs).
 */
export async function logDecisionToDynamo(
  farmId: string, 
  decision: DecisionResponse
): Promise<{ success: boolean; storage: 'aws_dynamodb' | 'local_memory' }> {
  // 1. Browser context: call Next.js server API
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/decision-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, decision }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, storage: data.storage || 'aws_dynamodb' };
      }
    } catch (err) {
      console.warn('Network call to log decision failed, caching locally:', err);
    }
    return { success: true, storage: 'local_memory' };
  }

  // 2. Server context: Direct AWS SDK call
  const client = getDocClient();
  const tableName = process.env.DYNAMODB_LOGS_TABLE || 'FieldGuard-DecisionLogs';
  const timestamp = new Date().toISOString();

  const logItem = {
    farmId,
    timestamp,
    decision: decision.decision,
    primaryAction: decision.primaryAction,
    totalDemand_liters: decision.totalFarmDemand_liters,
    availableWater_liters: decision.availableWater_liters,
    waterShortfall_liters: decision.waterShortfall_liters,
    deferredVolume_liters: decision.environmentalLedger.deferredVolume_liters,
    electricitySaved_kwh: decision.environmentalLedger.electricitySaved_kwh,
    carbonOffset_kg_co2: decision.environmentalLedger.carbonOffset_kg_co2,
    engineVersion: decision.metadata.engineVersion,
  };

  if (client) {
    try {
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: logItem,
        })
      );
      return { success: true, storage: 'aws_dynamodb' };
    } catch (error) {
      console.error('DynamoDB log save failed, caching locally:', error);
    }
  }

  // Fallback
  const existing = inMemoryLogs.get(farmId) || [];
  existing.unshift(logItem);
  inMemoryLogs.set(farmId, existing);

  return { success: true, storage: 'local_memory' };
}
