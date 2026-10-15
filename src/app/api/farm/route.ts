import { NextRequest, NextResponse } from 'next/server';
import { 
  saveFarmProfileToDynamo, 
  getFarmProfileFromDynamo,
  getFarmsByUserId,
  deleteFarmFromDynamo
} from '../../../adapters/dynamoDbAdapter';
import { FarmProfile } from '../../../types/farm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { farm } = body;

    if (!farm || !farm.id) {
      return NextResponse.json(
        { error: 'Valid farm profile with id is required' },
        { status: 400 }
      );
    }

    const farmProfile = farm as FarmProfile;
    // Server-side save with direct AWS IAM credentials
    const result = await saveFarmProfileToDynamo(farmProfile);

    return NextResponse.json({
      success: result.success,
      storage: result.storage,
      farmId: farmProfile.id,
      savedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('API /api/farm POST Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save farm to DynamoDB' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get('farmId');
    const userId = searchParams.get('userId');

    // 1. Fetch all parcels for a user
    if (userId) {
      const farms = await getFarmsByUserId(userId);
      return NextResponse.json({ farms, storage: 'aws_dynamodb' });
    }

    // 2. Fetch single farm by farmId
    if (farmId) {
      const farm = await getFarmProfileFromDynamo(farmId);
      if (!farm) {
        return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
      }
      return NextResponse.json({ farm, storage: 'aws_dynamodb' });
    }

    return NextResponse.json(
      { error: 'farmId or userId parameter is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('API /api/farm GET Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch farm from DynamoDB' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get('farmId');

    if (!farmId) {
      return NextResponse.json(
        { error: 'farmId parameter is required' },
        { status: 400 }
      );
    }

    const success = await deleteFarmFromDynamo(farmId);
    return NextResponse.json({ success, farmId });
  } catch (error: any) {
    console.error('API /api/farm DELETE Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete farm' },
      { status: 500 }
    );
  }
}

