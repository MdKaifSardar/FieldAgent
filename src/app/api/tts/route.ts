import { NextRequest, NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand, Engine, VoiceId, LanguageCode } from '@aws-sdk/client-polly';

let pollyClient: PollyClient | null = null;

function getPollyClient(): PollyClient | null {
  if (pollyClient) return pollyClient;

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'ap-south-1';

  if (accessKeyId && secretAccessKey) {
    try {
      pollyClient = new PollyClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      return pollyClient;
    } catch (err) {
      console.warn('Could not initialize AWS Polly client:', err);
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, lang } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Truncate to maximum 1500 chars to avoid buffer overflows and high latency
    const safeText = text.trim().slice(0, 1500);

    // Bengali ('bn') is not natively supported by Amazon Polly. Signal frontend fallback immediately.
    if (lang === 'bn') {
      return NextResponse.json({
        fallback: true,
        reason: 'Bengali is routed to device-native Web Speech API for authentic phonetics'
      }, { status: 200 });
    }

    const client = getPollyClient();
    if (!client) {
      return NextResponse.json({
        fallback: true,
        reason: 'AWS credentials not configured on server, use browser fallback'
      }, { status: 200 });
    }

    // Determine primary & secondary voice configs
    const configs: Array<{ voiceId: VoiceId; engine: Engine; languageCode: LanguageCode }> = [];

    if (lang === 'hi') {
      // 1st choice: Kajal (Neural Hindi)
      configs.push({ voiceId: 'Kajal', engine: 'neural', languageCode: 'hi-IN' });
      // 2nd choice: Aditi (Standard Hindi)
      configs.push({ voiceId: 'Aditi', engine: 'standard', languageCode: 'hi-IN' });
    } else {
      // English (Indian accent)
      // 1st choice: Kajal (Neural Bilingual Indian English)
      configs.push({ voiceId: 'Kajal', engine: 'neural', languageCode: 'en-IN' });
      // 2nd choice: Raveena (Standard Indian English)
      configs.push({ voiceId: 'Raveena', engine: 'standard', languageCode: 'en-IN' });
      // 3rd choice: Aditi (Standard Bilingual)
      configs.push({ voiceId: 'Aditi', engine: 'standard', languageCode: 'en-IN' });
    }

    let audioStream: any = null;
    let lastError: any = null;

    for (const cfg of configs) {
      try {
        const command = new SynthesizeSpeechCommand({
          Text: safeText,
          OutputFormat: 'mp3',
          VoiceId: cfg.voiceId,
          Engine: cfg.engine,
          LanguageCode: cfg.languageCode,
        });

        const response = await client.send(command);
        if (response.AudioStream) {
          audioStream = response.AudioStream;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Polly synthesize attempt failed with voice ${cfg.voiceId} (${cfg.engine}):`, err?.message || err);
      }
    }

    if (!audioStream) {
      return NextResponse.json({
        fallback: true,
        reason: lastError?.message || 'Polly synthesis unsuccessful, falling back to Web Speech'
      }, { status: 200 });
    }

    // Convert stream to Buffer / Uint8Array
    let audioBytes: Uint8Array;
    if (audioStream instanceof Uint8Array) {
      audioBytes = audioStream;
    } else if (typeof audioStream.transformToByteArray === 'function') {
      audioBytes = await audioStream.transformToByteArray();
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      audioBytes = Buffer.concat(chunks);
    }

    return new NextResponse(new Blob([audioBytes as any], { type: 'audio/mpeg' }), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBytes.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });

  } catch (error: any) {
    console.error('API /api/tts POST Error:', error);
    return NextResponse.json({
      fallback: true,
      error: error?.message || 'Server error synthesizing speech'
    }, { status: 200 });
  }
}
