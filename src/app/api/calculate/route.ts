import { NextRequest, NextResponse } from 'next/server';
import { executePreset } from '../../../core/demoPresets';
import { runFeasibilityPlanner } from '../../../core/feasibilityPlanner';
import { fetchLiveWeatherForecast } from '../../../adapters/openMeteoAdapter';
import { logDecisionToDynamo } from '../../../adapters/dynamoDbAdapter';
import { FarmProfile } from '../../../types/farm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { presetId, farm } = body;

    // 1. If user requested a demo preset scenario
    if (presetId) {
      const result = executePreset(presetId);
      // Attempt to log decision to DynamoDB
      const farmId = result.plots[0]?.plotId || 'demo-farm';
      const logStatus = await logDecisionToDynamo(farmId, result);

      return NextResponse.json({
        ...result,
        storageStatus: logStatus.storage,
      });
    }

    // 2. If user supplied a custom/live farm profile
    if (farm) {
      const farmProfile = farm as FarmProfile;
      const forecast = await fetchLiveWeatherForecast(
        farmProfile.location.latitude,
        farmProfile.location.longitude
      );

      const result = runFeasibilityPlanner({
        plots: farmProfile.plots,
        awc_mm_per_m: farmProfile.soil.awc_mm_per_m,
        reserve: farmProfile.reserve,
        forecast,
        isDemoPreset: false,
      });

      const logStatus = await logDecisionToDynamo(farmProfile.id, result);

      return NextResponse.json({
        ...result,
        storageStatus: logStatus.storage,
      });
    }

    return NextResponse.json(
      { error: 'Please provide either a valid presetId or farm profile' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Calculation API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Calculation Error' },
      { status: 500 }
    );
  }
}
