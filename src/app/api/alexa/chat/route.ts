import { NextRequest, NextResponse } from 'next/server';
import { runAlexaAgent } from '../../../../core/agent/bedrockAgent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, history = [], farmId = 'farm-bardhaman-01', language = 'en' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'A user query string is required.' },
        { status: 400 }
      );
    }

    const result = await runAlexaAgent(query, history, farmId, language);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Alexa+ Chat API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to process voice assistant query',
      },
      { status: 500 }
    );
  }
}
