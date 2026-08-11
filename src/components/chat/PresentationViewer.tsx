'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../hooks/useSocket';

interface PresentationViewerProps {
  conversationId: string;
}

export default function PresentationViewer({ conversationId }: PresentationViewerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(10); // Default estimate for scrolling control
  const [uploading, setUploading] = useState(false);
  const [isPresenter, setIsPresenter] = useState(false);

  // 1. Listen to remote presentation sync events
  useEffect(() => {
    let activeSocket: ReturnType<typeof getSocket> = null;

    const bindListeners = () => {
      const socket = getSocket();
      if (!socket) return;
      activeSocket = socket;

      if (conversationId) {
        socket.emit('join_room', conversationId);
      }

      socket.off('presentation_start', handleRemoteStart);
      socket.off('slide_change', handleRemoteSlideChange);
      socket.off('presentation_stop', handleRemoteStop);

      socket.on('presentation_start', handleRemoteStart);
      socket.on('slide_change', handleRemoteSlideChange);
      socket.on('presentation_stop', handleRemoteStop);
      socket.on('connect', bindListeners);
    };

    const handleRemoteStart = ({ url, name, total }: any) => {
      setFileUrl(url);
      setFilename(name);
      setPageNum(1);
      setTotalPages(total || 10);
      setIsPresenter(false); // Remote user is presenting
    };

    const handleRemoteSlideChange = ({ page }: any) => {
      setPageNum(page);
    };

    const handleRemoteStop = () => {
      setFileUrl(null);
      setFilename(null);
      setPageNum(1);
      setIsPresenter(false);
    };

    bindListeners();

    const timer = setInterval(() => {
      if (!activeSocket) bindListeners();
    }, 500);

    return () => {
      clearInterval(timer);
      if (activeSocket) {
        activeSocket.off('presentation_start', handleRemoteStart);
        activeSocket.off('slide_change', handleRemoteSlideChange);
        activeSocket.off('presentation_stop', handleRemoteStop);
        activeSocket.off('connect', bindListeners);
      }
    };
  }, [conversationId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        const url = data.data.url;
        setFileUrl(url);
        setFilename(file.name);
        setPageNum(1);
        setIsPresenter(true);

        // Broadcast presentation start
        const socket = getSocket();
        if (socket) {
          socket.emit('presentation_start', {
            conversationId,
            url,
            name: file.name,
            total: 20, // Default slide page boundary
          });
        }
      }
    } catch (err) {
      console.error('Failed to upload presentation:', err);
      alert('Upload failed. Please try a different PDF / PPT file.');
    } finally {
      setUploading(false);
    }
  };

  const handleNextPage = () => {
    if (pageNum >= totalPages) return;
    const nextPage = pageNum + 1;
    setPageNum(nextPage);

    const socket = getSocket();
    if (socket) {
      socket.emit('slide_change', {
        conversationId,
        page: nextPage,
      });
    }
  };

  const handlePrevPage = () => {
    if (pageNum <= 1) return;
    const prevPage = pageNum - 1;
    setPageNum(prevPage);

    const socket = getSocket();
    if (socket) {
      socket.emit('slide_change', {
        conversationId,
        page: prevPage,
      });
    }
  };

  const handleStopPresenting = () => {
    setFileUrl(null);
    setFilename(null);
    setPageNum(1);
    setIsPresenter(false);

    const socket = getSocket();
    if (socket) {
      socket.emit('presentation_stop', { conversationId });
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary rounded-2xl border border-border-default/40 overflow-hidden shadow-lg transition-colors">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border-default/40 shrink-0 select-none">
        <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
          <span>📊 Synchronized Presentation</span>
        </div>
        {filename && (
          <span className="text-[10px] text-brand-green font-bold truncate max-w-[200px]">
            {isPresenter ? 'Hosting: ' : 'Viewing: '} {filename}
          </span>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 bg-bg-primary flex flex-col relative overflow-hidden transition-colors">
        {fileUrl ? (
          <div className="flex-1 flex flex-col relative bg-bg-primary">
            {filename?.toLowerCase().endsWith('.ppt') || filename?.toLowerCase().endsWith('.pptx') ? (
              /* PowerPoint File Notice Card (Browsers require PDF for native in-browser slide viewing) */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-bg-primary">
                <div className="w-16 h-16 rounded-2xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center text-3xl mb-3 shadow-sm">
                  📊
                </div>
                <h3 className="text-sm font-extrabold text-text-primary mb-1">PowerPoint Deck Active</h3>
                <p className="text-xs text-text-secondary font-mono bg-bg-input px-3 py-1 rounded-lg border border-border-default/40 mb-3 truncate max-w-sm font-bold">
                  {filename}
                </p>
                <p className="text-xs text-text-secondary max-w-md mb-5 leading-relaxed font-semibold">
                  Web browsers require slide decks to be in <span className="text-brand-green font-bold">PDF format</span> to present slides natively inside the room. Save your PPTX as a PDF or use <b>🖥️ Share Screen</b> to present your PowerPoint window directly!
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-brand-green hover:bg-brand-hover text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-sm"
                  >
                    📄 Upload PDF Slide Deck
                  </button>
                  {isPresenter && (
                    <button
                      onClick={handleStopPresenting}
                      className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-sm"
                    >
                      Stop Presenting
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* PDF Native In-Browser Document Renderer */
              <object
                key={`${fileUrl}-${pageNum}`}
                data={`${fileUrl}#page=${pageNum}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                type="application/pdf"
                className="w-full h-full border-none"
              >
                <embed
                  src={`${fileUrl}#page=${pageNum}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  type="application/pdf"
                  className="w-full h-full border-none"
                />
              </object>
            )}

            {/* Float slide controller (PDF slides) */}
            {!filename?.toLowerCase().endsWith('.ppt') && !filename?.toLowerCase().endsWith('.pptx') && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-bg-secondary/95 border border-border-default/40 px-4 py-2 rounded-2xl shadow-xl text-text-primary select-none z-20 transition-colors">
                <button
                  onClick={handlePrevPage}
                  disabled={pageNum <= 1}
                  className="p-1 hover:bg-bg-input disabled:opacity-40 rounded-lg transition cursor-pointer"
                >
                  ◀
                </button>
                <span className="text-xs font-mono font-extrabold text-text-primary">
                  Slide {pageNum}
                </span>
                <button
                  onClick={handleNextPage}
                  className="p-1 hover:bg-bg-input rounded-lg transition cursor-pointer"
                >
                  ▶
                </button>

                {isPresenter && (
                  <>
                    <div className="w-[1px] h-4 bg-border-default mx-1" />
                    <button
                      onClick={handleStopPresenting}
                      className="px-2 py-0.5 bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg text-[10px] font-extrabold transition cursor-pointer"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none text-text-secondary gap-3 bg-bg-secondary/60">
            <div className="w-16 h-16 rounded-2xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center text-3xl shadow-sm">
              📊
            </div>
            <div>
              <p className="text-sm font-extrabold text-text-primary">No Active Presentation</p>
              <p className="text-xs text-text-secondary mt-1 max-w-xs font-semibold">Upload a PDF slide deck to share it with everyone in real-time.</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.ppt,.pptx"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4.5 py-2.5 bg-brand-green hover:bg-brand-hover disabled:bg-bg-input disabled:text-text-muted text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full w-3.5 h-3.5 border-2 border-white border-t-transparent" />
                  Uploading...
                </>
              ) : (
                'Upload PDF / Slides'
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
