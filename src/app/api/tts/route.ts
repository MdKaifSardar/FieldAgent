import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
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

/**
 * Splits text into natural sentence chunks (<= 180 chars) for smooth,
 * natural articulation without truncating long agricultural advisories.
 */
function splitIntoNaturalChunks(text: string, maxLen = 180): string[] {
  // Split on Bengali danda (।), period (.), question mark (?), exclamation (!), comma (,)
  const rawParts = text.split(/([।\.\?!,;\n]+)/g);
  const chunks: string[] = [];
  let current = '';

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (!part) continue;

    if ((current + part).length <= maxLen) {
      current += part;
    } else {
      if (current.trim()) {
        chunks.push(current.trim());
      }
      if (part.length > maxLen) {
        // Fallback: break by words if a single clause is extra long
        const words = part.split(/\s+/);
        let wordChunk = '';
        for (const w of words) {
          if ((wordChunk + ' ' + w).length <= maxLen) {
            wordChunk += (wordChunk ? ' ' : '') + w;
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = w;
          }
        }
        current = wordChunk;
      } else {
        current = part;
      }
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
}

/**
 * Fetches an MP3 chunk from Google Neural TTS engine
 */
function fetchGoogleTtsChunk(text: string, langCode: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(langCode)}&client=tw-ob&q=${encodedText}`;

    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
        },
        timeout: 8000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`TTS provider returned HTTP ${res.statusCode}`));
        }
        const dataChunks: Buffer[] = [];
        res.on('data', (c) => dataChunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => resolve(Buffer.concat(dataChunks)));
      }
    );

    request.on('error', (err) => reject(err));
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('TTS request timed out'));
    });
  });
}

/**
 * Synthesizes text with Google TTS AI and stitches the MP3 frames
 */
async function synthesizeGoogleTts(text: string, lang: 'bn' | 'hi' | 'en'): Promise<Buffer> {
  const langCode = lang === 'bn' ? 'bn' : lang === 'hi' ? 'hi' : 'en-IN';
  const chunks = splitIntoNaturalChunks(text);
  
  const audioBuffers: Buffer[] = [];
  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    const buf = await fetchGoogleTtsChunk(chunk.trim(), langCode);
    audioBuffers.push(buf);
  }

  return Buffer.concat(audioBuffers);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, lang } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Truncate to maximum 1500 chars to prevent buffer overflows
    const safeText = text.trim().slice(0, 1500);

    // 1. BENGALI ('bn'): AWS Polly lacks Bengali voice -> route directly to Google's Bengali AI Engine
    if (lang === 'bn') {
      try {
        const audioBuffer = await synthesizeGoogleTts(safeText, 'bn');
        return new NextResponse(new Blob([audioBuffer as any], { type: 'audio/mpeg' }), {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        });
      } catch (bnErr: any) {
        console.warn('Google Bengali TTS synthesis failed:', bnErr.message);
        return NextResponse.json({
          fallback: true,
          reason: 'Cloud Bengali TTS temporarily unavailable, use device fallback',
        }, { status: 200 });
      }
    }

    // 2. HINDI & ENGLISH: Attempt AWS Polly (Kajal Neural / Aditi / Raveena)
    const client = getPollyClient();
    if (client) {
      const configs: Array<{ voiceId: VoiceId; engine: Engine; languageCode: LanguageCode }> = [];

      if (lang === 'hi') {
        configs.push({ voiceId: 'Kajal', engine: 'neural', languageCode: 'hi-IN' });
        configs.push({ voiceId: 'Aditi', engine: 'standard', languageCode: 'hi-IN' });
      } else {
        configs.push({ voiceId: 'Kajal', engine: 'neural', languageCode: 'en-IN' });
        configs.push({ voiceId: 'Raveena', engine: 'standard', languageCode: 'en-IN' });
        configs.push({ voiceId: 'Aditi', engine: 'standard', languageCode: 'en-IN' });
      }

      let audioStream: any = null;

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
          console.warn(`Polly attempt failed (${cfg.voiceId}):`, err?.message || err);
        }
      }

      if (audioStream) {
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
      }
    }

    // 3. Fallback to Google Neural TTS for Hindi/English if AWS credentials are not set
    try {
      const fallbackBuffer = await synthesizeGoogleTts(safeText, lang === 'hi' ? 'hi' : 'en');
      return new NextResponse(new Blob([fallbackBuffer as any], { type: 'audio/mpeg' }), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': fallbackBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    } catch (fallbackErr: any) {
      console.warn('TTS cloud fallback error:', fallbackErr.message);
      return NextResponse.json({
        fallback: true,
        reason: 'Cloud synthesis unavailable, use browser Web Speech API',
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error('API /api/tts POST Error:', error);
    return NextResponse.json({
      fallback: true,
      error: error?.message || 'Server error synthesizing speech',
    }, { status: 200 });
  }
}
