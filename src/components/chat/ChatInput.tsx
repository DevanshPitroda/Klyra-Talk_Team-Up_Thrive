'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import EmojiPicker from './EmojiPicker';
import { cn } from '../../utils/cn';
import { Smile, Paperclip } from 'lucide-react';

interface AttachmentMeta {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface ChatInputProps {
  onSendMessage: (text: string, attachments?: AttachmentMeta[], extra?: {
    type?: string;
    viewOnce?: boolean;
    pollData?: { question: string; options: string[] };
    locationData?: { lat: number; lng: number; label: string };
  }) => void;
  onTyping: (isTyping: boolean) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Poll Modal ───────────────────────────────────────────────────────────────
function PollModal({ onClose, onSend }: {
  onClose: () => void;
  onSend: (question: string, options: string[]) => void;
}) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => {
    if (options.length < 4) setOptions([...options, '']);
  };

  const updateOption = (i: number, val: string) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const canSubmit = question.trim().length > 0 && options.filter(o => o.trim()).length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-6 w-[90vw] max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <span className="text-xl">📊</span> Create Poll
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-bg-input rounded-full text-text-secondary hover:text-text-primary transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="text-xs text-text-secondary mb-1 block">Question</label>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask something..."
            className="w-full bg-bg-input border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-brand-green/50 transition"
          />
        </div>

        <div className="mb-4 space-y-2">
          <label className="text-xs text-text-secondary mb-1 block">Options</label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 bg-bg-input border border-border-default rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-brand-green/50 transition"
              />
              {options.length > 2 && (
                <button onClick={() => removeOption(i)} className="p-1 text-text-secondary hover:text-red-400 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {options.length < 4 && (
            <button onClick={addOption} className="text-xs text-brand-green hover:text-brand-hover flex items-center gap-1 transition mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add option
            </button>
          )}
        </div>

        <button
          onClick={() => canSubmit && onSend(question.trim(), options.filter(o => o.trim()))}
          disabled={!canSubmit}
          className="w-full py-2.5 bg-brand-green hover:bg-brand-hover disabled:bg-bg-input disabled:text-text-muted text-white text-sm font-semibold rounded-xl transition"
        >
          Send Poll
        </button>
      </div>
    </div>
  );
}

// ─── AI Image Modal ───────────────────────────────────────────────────────────
function AIImageModal({ onClose, onSend }: {
  onClose: () => void;
  onSend: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Generation failed');
      onSend(prompt);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-6 w-[90vw] max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <span className="text-xl">✨</span> AI Image Generator
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-bg-input rounded-full text-text-secondary hover:text-text-primary transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="text-xs text-text-secondary mb-1 block">Describe the image</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="A futuristic city at sunset with flying cars..."
            rows={3}
            className="w-full bg-bg-input border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-brand-green/50 resize-none transition"
          />
        </div>

        {error && (
          <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {error.includes('GEMINI_API_KEY') ? (
              <span>Gemini API key not set. Add <code className="bg-black/30 px-1 rounded">GEMINI_API_KEY=your_key</code> to <code className="bg-black/30 px-1 rounded">.env.local</code> and restart the server.</span>
            ) : error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || generating}
          className="w-full py-2.5 bg-brand-green hover:bg-brand-hover disabled:bg-bg-input disabled:text-text-muted text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" />
              Generating...
            </>
          ) : (
            <>✨ Generate & Send</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main ChatInput ───────────────────────────────────────────────────────────
export default function ChatInput({ onSendMessage, onTyping }: ChatInputProps) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewOnce, setViewOnce] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ─── Voice Note Recording State ─────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());

        // Convert to data URL or upload
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSendMessage('', [{ url: base64Audio, filename: 'Voice Note.webm', size: audioBlob.size, mimeType: 'audio/webm' }], { type: 'audio' });
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-expand textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Preview URL for selected image
  useEffect(() => {
    if (!selectedFile) { setPreviewUrl(null); return; }
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [selectedFile]);

  // Close attach menu and emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadError(null);
    setViewOnce(false);
    if (file && file.size > 15 * 1024 * 1024) {
      setUploadError('File too large (max 15 MB)');
      return;
    }
    setSelectedFile(file);
    setShowAttachMenu(false);
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setViewOnce(false);
  };

  // ── Location ──
  const handleSendLocation = useCallback(() => {
    setShowAttachMenu(false);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFetchingLocation(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        onSendMessage('', undefined, { type: 'location', locationData: { lat, lng, label } });
      },
      (err) => {
        setFetchingLocation(false);
        alert('Could not get location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onSendMessage]);

  // ── Poll ──
  const handleSendPoll = (question: string, options: string[]) => {
    setShowPollModal(false);
    onSendMessage('', undefined, { type: 'poll', pollData: { question, options } });
  };

  // ── AI Image ──
  const handleSendAI = async (prompt: string) => {
    setShowAIModal(false);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const attachment: AttachmentMeta = {
        url: data.data.url,
        filename: data.data.filename,
        size: data.data.size,
        mimeType: data.data.mimeType,
      };
      onSendMessage(`✨ ${prompt}`, [attachment], { type: 'image' });
    } catch (err: any) {
      alert('AI generation failed: ' + err.message);
    }
  };

  // ── Emoji Picker select handler ──
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const nextText = val.substring(0, start) + emoji + val.substring(end);
      setText(nextText);
      
      // Auto-expand check and caret position set
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      }, 0);
    } else {
      setText((prev) => prev + emoji);
    }
  };

  // ── Main Submit ──
  const handleSubmit = async () => {
    const hasText = text.trim() !== '';
    const hasFile = selectedFile !== null;
    if (!hasText && !hasFile) return;

    let attachments: AttachmentMeta[] = [];

    if (hasFile) {
      setUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile!);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message || 'Upload failed');
        attachments = [data.data];
      } catch (err: any) {
        setUploadError(err.message || 'Upload failed. Please try again.');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const isImg = selectedFile?.type.startsWith('image/');
    onSendMessage(
      text.trim(),
      attachments.length > 0 ? attachments : undefined,
      isImg && viewOnce ? { viewOnce: true } : undefined
    );

    setText('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setViewOnce(false);
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    textareaRef.current?.focus();
  };

  const isImage = selectedFile?.type.startsWith('image/') ?? false;
  const isVideo = selectedFile?.type.startsWith('video/') ?? false;
  const canSend = (text.trim() !== '' || selectedFile !== null) && !uploading && !fetchingLocation;

  return (
    <>
      {/* Modals */}
      {showPollModal && <PollModal onClose={() => setShowPollModal(false)} onSend={handleSendPoll} />}
      {showAIModal && <AIImageModal onClose={() => setShowAIModal(false)} onSend={handleSendAI} />}

      <div className="h-auto bg-bg-secondary border-t border-border-default shrink-0 z-20 sticky bottom-0 pb-[env(safe-area-inset-bottom)] shadow-lg">

        {/* File Preview Bar */}
        {selectedFile && (
          <div className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-border-default/30">
            <div className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-bg-input border border-border-default/40 flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              ) : isVideo ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-brand-green">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-brand-green">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-text-secondary mt-0.5">{formatBytes(selectedFile.size)}</p>
              {/* View Once toggle (images only) */}
              {isImage && (
                <button
                  onClick={() => setViewOnce(v => !v)}
                  className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border transition ${viewOnce ? 'bg-brand-green/20 border-brand-green text-brand-green' : 'border-border-default text-text-secondary hover:text-text-primary'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  {viewOnce ? '👁 View Once ON' : 'View Once'}
                </button>
              )}
            </div>
            <button onClick={handleRemoveFile} className="shrink-0 p-1 rounded-full hover:bg-bg-input text-text-secondary hover:text-text-primary transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="px-4 py-1.5 text-[11px] text-red-400 bg-red-500/10 border-b border-red-500/20 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {uploadError}
          </div>
        )}

        {/* Main Input Row */}
        <div className="flex items-end gap-3 px-4 py-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt"
            onChange={handleFileSelect}
          />

          {/* Composer Bubble containing Emoji, Textarea, and Attachment Paperclip */}
          <div className="flex-1 bg-bg-input rounded-xl border border-transparent focus-within:border-brand-green/30 px-3 py-1.5 transition flex items-end gap-2">
            
            {/* Emoji button inside composer bubble (Left side) */}
            <div className="relative flex items-center mb-0.5 shrink-0" ref={emojiPickerRef}>
              <button
                onClick={() => {
                  setShowEmojiPicker((v) => !v);
                  setShowAttachMenu(false);
                }}
                className={cn(
                  'p-1.5 rounded-full transition cursor-pointer text-text-secondary hover:text-text-primary',
                  showEmojiPicker && 'text-brand-green'
                )}
                title="Emojis"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-50">
                  <EmojiPicker
                    onSelectEmoji={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </div>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={selectedFile ? 'Add a caption...' : 'Type a message...'}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder-text-muted resize-none max-h-[120px] min-h-[20px] py-1 select-text"
              style={{ height: '28px' }}
            />

            {/* Paperclip / Attachment button inside composer bubble (Right side) */}
            <div className="relative flex items-center mb-0.5 shrink-0" ref={attachMenuRef}>
              <button
                onClick={() => {
                  setShowAttachMenu(v => !v);
                  setShowEmojiPicker(false);
                }}
                className={cn(
                  'p-1.5 rounded-full transition cursor-pointer text-text-secondary hover:text-text-primary',
                  showAttachMenu && 'text-brand-green'
                )}
                title="Attach"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Attach Menu Popup aligned to the right edge */}
              {showAttachMenu && (
                <div className="absolute bottom-12 right-0 bg-bg-secondary border border-border-default/60 rounded-2xl shadow-2xl p-2 min-w-[180px] z-20 flex flex-col gap-0.5">
                  {/* File/Photo */}
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg-input text-text-primary text-sm transition text-left cursor-pointer"
                  >
                    <span className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-base shrink-0">📎</span>
                    <span className="font-semibold text-text-primary">File / Photo</span>
                  </button>

                  {/* Location */}
                  <button
                    onClick={handleSendLocation}
                    disabled={fetchingLocation}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg-input text-text-primary text-sm transition text-left disabled:opacity-60 cursor-pointer"
                  >
                    <span className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-base shrink-0">📍</span>
                    <span className="font-semibold text-text-primary">{fetchingLocation ? 'Getting location...' : 'Location'}</span>
                  </button>

                  {/* Poll */}
                  <button
                    onClick={() => { setShowPollModal(true); setShowAttachMenu(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg-input text-text-primary text-sm transition text-left cursor-pointer"
                  >
                    <span className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-base shrink-0">📊</span>
                    <span className="font-semibold text-text-primary">Poll</span>
                  </button>

                  {/* AI Image */}
                  <button
                    onClick={() => { setShowAIModal(true); setShowAttachMenu(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg-input text-text-primary text-sm transition text-left cursor-pointer"
                  >
                    <span className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-base shrink-0">✨</span>
                    <span className="font-semibold text-text-primary">AI Image</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Send or Mic Button */}
          <div className="py-1">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold shadow-md animate-pulse shrink-0"
              >
                <span>🔴</span>
                <span>{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                <span>Send</span>
              </button>
            ) : canSend ? (
              <button
                onClick={handleSubmit}
                disabled={!canSend}
                className="p-3 bg-brand-green hover:bg-brand-hover disabled:bg-bg-input disabled:text-text-muted text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
              >
                {uploading || fetchingLocation ? (
                  <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 transform rotate-90">
                    <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.087l-1.414 4.926a.75.75 0 0 0 .826.95 21.896 21.896 0 0 0 16.502-7.977a.75.75 0 0 0 0-.968 21.896 21.896 0 0 0-16.502-7.977Z" />
                  </svg>
                )}
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="p-3 bg-bg-input hover:bg-border-default/40 text-text-secondary hover:text-brand-green rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
                title="Hold or click to record Voice Note"
              >
                🎙️
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
