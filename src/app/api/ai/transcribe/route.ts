import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { audioDataUrl, targetLanguage = 'English' } = await req.json();

    if (!audioDataUrl) {
      return NextResponse.json(
        { success: false, error: 'audioDataUrl is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is not configured in .env.local' },
        { status: 500 }
      );
    }

    // Extract base64 and mimetype
    const match = audioDataUrl.match(/^data:(audio\/[a-zA-Z0-9+-.]+);base64,(.*)$/);
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Invalid audio data URL format' },
        { status: 400 }
      );
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const promptText = `Please transcribe this audio and translate it to ${targetLanguage}. If it is already in ${targetLanguage}, just transcribe it. Output only the transcription/translation.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ]
        })
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({}));
      const msg = errBody?.error?.message || `Gemini API error (${geminiRes.status})`;
      console.error('Gemini Transcribe Error:', msg);
      return NextResponse.json(
        { success: false, error: msg },
        { status: geminiRes.status }
      );
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Gemini did not return transcription.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error('API Error in /api/ai/transcribe:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
