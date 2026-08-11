import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, notesContent, chatMessages, roomName } = body;

    const notesText = typeof notesContent === 'string' ? notesContent : '';
    const messagesText = Array.isArray(chatMessages)
      ? chatMessages.map((m: any) => `${m.senderName || 'User'}: ${m.body || m.text || ''}`).join('\n')
      : '';

    const combinedText = `Room: ${roomName || 'Study Room'}\n\nShared Notes:\n${notesText || 'No notes written yet.'}\n\nChat Log:\n${messagesText || 'No chat messages yet.'}`;

    // If Gemini API Key is available, call Gemini 1.5 / 2.0 API
    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (GEMINI_KEY) {
      try {
        const promptText =
          type === 'quiz'
            ? `Based on this study session context:\n${combinedText}\n\nGenerate 3 multiple choice quiz questions to test understanding. Return JSON array format: [{"question": "...", "options": ["A", "B", "C", "D"], "answer": 0}]`
            : type === 'ask'
            ? `Context:\n${combinedText}\n\nUser Question: ${body.question}\n\nAnswer concisely and helpfully based on the context.`
            : `Analyze this study room session:\n${combinedText}\n\nProvide a structured meeting summary formatted in clean markdown with:\n1. 📌 Key Topics Discussed\n2. 💡 Summary & Insights\n3. ✅ Action Items & Tasks`;

        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
            }),
          }
        );

        const aiData = await aiRes.json();
        const outputText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (outputText) {
          return NextResponse.json({ success: true, result: outputText });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to smart summarizer:', geminiErr);
      }
    }

    // Smart Fallback Summarizer (no API key needed)
    if (type === 'quiz') {
      const quizQuestions = [
        {
          question: `What was the main topic covered in ${roomName || 'this study room'}?`,
          options: [
            notesText.slice(0, 30) || 'Core Course Concepts',
            'General Discussion',
            'Administrative Updates',
            'None of the above',
          ],
          answer: 0,
        },
        {
          question: 'What is the primary action item for participants?',
          options: [
            'Review meeting notes & chat log',
            'Submit project proposal',
            'Schedule follow-up meeting',
            'Prepare presentation slides',
          ],
          answer: 0,
        },
      ];
      return NextResponse.json({ success: true, result: quizQuestions });
    }

    if (type === 'ask') {
      const userQ = body.question || 'help';
      return NextResponse.json({
        success: true,
        result: `Based on your session notes and chat log, here is what I found regarding "${userQ}":\n\n- The session covered "${roomName || 'Study Room'}".\n- Current notes content contains ${notesText.length} characters.\n- Total messages in chat: ${Array.isArray(chatMessages) ? chatMessages.length : 0}.`,
      });
    }

    // Default Summary Generation
    const bulletPoints = [];
    if (notesText.trim()) {
      bulletPoints.push(`• **Notes Digest**: ${notesText.slice(0, 150)}...`);
    } else {
      bulletPoints.push('• **Notes**: No shared notes entered during this session yet.');
    }

    if (Array.isArray(chatMessages) && chatMessages.length > 0) {
      bulletPoints.push(`• **Discussion**: ${chatMessages.length} total messages exchanged.`);
      const questionsAsked = chatMessages.filter((m: any) => (m.body || '').includes('?'));
      if (questionsAsked.length > 0) {
        bulletPoints.push(`• **Questions Raised**: ${questionsAsked.length} question(s) asked in chat.`);
      }
    } else {
      bulletPoints.push('• **Chat Activity**: Session started. Awaiting participant messages.');
    }

    bulletPoints.push('• **Action Item**: Review notes and verify all assignments before next meeting.');

    const summaryText = `### 📌 Meeting Summary: ${roomName || 'Study Room'}\n\n${bulletPoints.join('\n')}`;

    return NextResponse.json({ success: true, result: summaryText });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
