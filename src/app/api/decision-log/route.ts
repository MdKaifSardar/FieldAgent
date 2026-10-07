import { NextRequest, NextResponse } from 'next/server';
import { logDecisionToDynamo } from '../../../adapters/dynamoDbAdapter';
import { DecisionResponse } from '../../../types/decision';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { farmId, decision } = body;

    if (!farmId || !decision) {
      return NextResponse.json(
        { error: 'farmId and decision payload are required' },
        { status: 400 }
      );
    }

    const result = await logDecisionToDynamo(farmId, decision as DecisionResponse);

    return NextResponse.json({
      success: result.success,
      storage: result.storage,
      farmId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('API /api/decision-log POST Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to log decision to DynamoDB' },
      { status: 500 }
    );
  }
}
