'use client';

import React, { useState } from 'react';
import { useStudyRoomStore } from '../store/useStudyRoomStore';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

export default function AISummaryPanel() {
  const { currentRoom } = useStudyRoomStore();

  const [activeTab, setActiveTab] = useState<'summary' | 'ask' | 'quiz'>('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  // Ask AI state
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswers, setAiAnswers] = useState<Array<{ q: string; a: string }>>([]);
  const [isAsking, setIsAsking] = useState(false);

  // Quiz state
  const [quizList, setQuizList] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'summary',
          roomName: currentRoom?.name || 'Study Room',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(typeof data.result === 'string' ? data.result : JSON.stringify(data.result));
      }
    } catch (err) {
      console.error('AI summary error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;

    const q = userQuestion.trim();
    setUserQuestion('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ask',
          question: q,
          roomName: currentRoom?.name || 'Study Room',
        }),
      });
      const data = await res.json();
      if (data.success) {
        const answer = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
        setAiAnswers((prev) => [...prev, { q, a: answer }]);
      }
    } catch (err) {
      console.error('Ask AI error:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    setSelectedAnswers({});
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quiz',
          roomName: currentRoom?.name || 'Study Room',
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.result)) {
        setQuizList(data.result);
      }
    } catch (err) {
      console.error('Generate quiz error:', err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="w-80 bg-bg-secondary border-l border-border-default/40 flex flex-col h-full shrink-0 select-none text-text-primary transition-colors">

      {/* Header */}
      <div className="p-3.5 border-b border-border-default/30 flex items-center justify-between">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
          <span>🤖 AI Study Assistant</span>
        </h3>
        <span className="text-[9px] bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
          Gemini AI
        </span>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-border-default/20 bg-bg-primary/20 text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 text-center transition cursor-pointer border-b-2 ${
            activeTab === 'summary' ? 'border-brand-green text-brand-green' : 'border-transparent text-text-secondary'
          }`}
        >
          ✨ Summary
        </button>
        <button
          onClick={() => setActiveTab('ask')}
          className={`flex-1 py-2 text-center transition cursor-pointer border-b-2 ${
            activeTab === 'ask' ? 'border-brand-green text-brand-green' : 'border-transparent text-text-secondary'
          }`}
        >
          💬 Ask AI
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 py-2 text-center transition cursor-pointer border-b-2 ${
            activeTab === 'quiz' ? 'border-brand-green text-brand-green' : 'border-transparent text-text-secondary'
          }`}
        >
          🧩 Quiz
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">

        {/* Tab 1: AI Summary */}
        {activeTab === 'summary' && (
          <div className="space-y-3">
            <div className="bg-bg-primary/40 border border-border-default/30 p-3.5 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <span>📌 Session Insights</span>
              </h4>
              {summary ? (
                <div className="text-xs text-text-secondary space-y-1.5 whitespace-pre-line leading-relaxed">
                  {summary}
                </div>
              ) : (
                <p className="text-xs text-text-secondary leading-relaxed">
                  Generate instant AI summary, key discussion topics, and action items from this session.
                </p>
              )}
            </div>

            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="w-full py-2.5 bg-brand-green hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition shadow cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Session...</span>
                </>
              ) : (
                <span>✨ Generate Session Summary</span>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Ask AI Assistant */}
        {activeTab === 'ask' && (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex-1 space-y-3 overflow-y-auto min-h-[160px] max-h-[360px] p-1">
              {aiAnswers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-text-secondary py-8">
                  <span className="text-2xl">🤖</span>
                  <p className="text-xs font-semibold">Ask AI Anything</p>
                  <p className="text-[10px] text-text-secondary">Ask questions about study topics, meeting notes, or concepts.</p>
                </div>
              ) : (
                aiAnswers.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-2.5 text-xs text-brand-green font-semibold">
                      ❓ {item.q}
                    </div>
                    <div className="bg-bg-primary rounded-xl p-2.5 text-xs text-text-primary leading-relaxed whitespace-pre-line border border-border-default/20">
                      💡 {item.a}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAskAI} className="space-y-2 pt-2 border-t border-border-default/30">
              <input
                type="text"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="Ask AI a question..."
                required
                className="w-full px-3 py-2 bg-bg-input border border-border-default/40 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-green"
              />
              <button
                type="submit"
                disabled={isAsking || !userQuestion.trim()}
                className="w-full py-2 bg-brand-green text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {isAsking ? 'Thinking...' : '🚀 Send Question'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: AI Flashcards & Quiz */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="w-full py-2.5 bg-brand-green hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition shadow cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGeneratingQuiz ? '⏳ Creating Quiz...' : '🧩 Generate Practice Quiz'}
            </button>

            {quizList.length > 0 && (
              <div className="space-y-4">
                {quizList.map((q, qIdx) => (
                  <div key={qIdx} className="bg-bg-primary rounded-xl p-3 border border-border-default/20 space-y-2">
                    <p className="text-xs font-bold text-text-primary">{qIdx + 1}. {q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[qIdx] === optIdx;
                        const isCorrect = optIdx === q.answer;
                        const hasAnswered = selectedAnswers[qIdx] !== undefined;

                        return (
                          <button
                            key={optIdx}
                            onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                            disabled={hasAnswered}
                            className={`w-full text-left p-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                              hasAnswered
                                ? isCorrect
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                                  : isSelected
                                  ? 'bg-red-500/20 border-red-500/40 text-red-400 font-bold'
                                  : 'bg-bg-input border-border-default/20 opacity-50'
                                : 'bg-bg-input border-border-default/30 text-text-primary hover:border-brand-green/40'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
