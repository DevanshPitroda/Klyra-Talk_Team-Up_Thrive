import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, history } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (GEMINI_KEY) {
      try {
        const contents = [];
        // Add chat history if available
        if (Array.isArray(history)) {
          for (const msg of history) {
            contents.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }],
            });
          }
        }
        contents.push({ role: 'user', parts: [{ text: prompt }] });

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          }
        );

        const aiData = await aiRes.json();
        const outputText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (outputText) {
          return NextResponse.json({ success: true, text: outputText });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call error, using fallback:', geminiErr);
      }
    }

    // Smart Fallback Assistant response when Gemini key is not configured
    let fallbackText = `I am your AI Study Assistant! You asked: "${prompt}"\n\n`;
    if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi')) {
      fallbackText += `Hello ${session.user.name || 'there'}! 👋 How can I assist you with your studies, notes, or code today?`;
    } else if (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('javascript') || prompt.toLowerCase().includes('python')) {
      fallbackText += `Here is a helpful tip for coding:\n- Breakdown complex problems into smaller helper functions.\n- Write clean, modular code.\n- Use descriptive variable names.`;
    } else if (prompt.toLowerCase().includes('quiz')) {
      fallbackText += `Here is a quick study check:\n1. What is the difference between synchronous and asynchronous code?\n2. How does state management work in React?\n\nKeep up the great work!`;
    } else {
      fallbackText += `Here are key recommendations for study success:\n- Use active recall and spaced repetition.\n- Collaborate with study buddies in Study Rooms.\n- Summarize key takeaways after each meeting.`;
    }

    return NextResponse.json({ success: true, text: fallbackText });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
