import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadFile } from '@/lib/cloudinary';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'A prompt is required' }, { status: 422 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'GEMINI_API_KEY is not configured in .env.local' },
      { status: 503 }
    );
  }

  try {
    // Call Gemini imagen API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({}));
      const msg = errBody?.error?.message || `Gemini API error (${geminiRes.status})`;
      return NextResponse.json({ success: false, error: msg }, { status: 502 });
    }

    const geminiData = await geminiRes.json();

    // Find the image part in the response
    const parts: any[] = geminiData?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart) {
      return NextResponse.json(
        { success: false, error: 'Gemini did not return an image. Try a more descriptive prompt.' },
        { status: 502 }
      );
    }

    const mimeType: string = imagePart.inlineData.mimeType;
    const base64Data: string = imagePart.inlineData.data;
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `ai_generated_${Date.now()}.png`;

    // Upload to Cloudinary or local fallback
    const uploadResult = await uploadFile(buffer, filename, mimeType);

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.url,
        filename,
        mimeType,
        size: buffer.length,
        prompt,
      },
    });
  } catch (err: any) {
    console.error('[AI generate-image] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
