'use client';

import React, { useRef, useState, useEffect } from 'react';
import { getSocket } from '../../hooks/useSocket';

interface WhiteboardProps {
  conversationId: string;
}

export default function Whiteboard({ conversationId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#00a884'); // Brand green default
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  // Undo/redo history stored as ImageData snapshots
  const strokeHistory = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);

  // Remote peer pointer indicator
  const [remotePointer, setRemotePointer] = useState<{ x: number; y: number; name: string } | null>(null);
  const pointerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cache drawing colors
  const colors = [
    { value: '#00a884', name: 'green' },
    { value: '#007bff', name: 'blue' },
    { value: '#dc3545', name: 'red' },
    { value: '#ffc107', name: 'yellow' },
    { value: '#ffffff', name: 'white' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI displays (Retina)
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;
  }, []);

  // Sync canvas size on window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !contextRef.current) return;

      // Cache existing drawing in memory before resizing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const context = contextRef.current;
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';

      // Restore drawing
      context.drawImage(tempCanvas, 0, 0, tempCanvas.width / 2, tempCanvas.height / 2);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to remote Socket.IO events for live drawing synchronization
  useEffect(() => {
    let activeSocket: ReturnType<typeof getSocket> = null;

    const bindListeners = () => {
      const socket = getSocket();
      if (!socket) return;
      activeSocket = socket;

      // Ensure socket is joined to room
      if (conversationId) {
        socket.emit('join_room', conversationId);
      }

      socket.off('draw_line', handleRemoteDraw);
      socket.off('canvas_clear', handleRemoteClear);
      socket.off('whiteboard:pointer', handleRemotePointer);

      socket.on('draw_line', handleRemoteDraw);
      socket.on('canvas_clear', handleRemoteClear);
      socket.on('whiteboard:pointer', handleRemotePointer);
      socket.on('connect', bindListeners);
    };

    const handleRemoteDraw = ({ prevX, prevY, x, y, color: drawColor, size }: any) => {
      const context = contextRef.current;
      if (!context) return;

      context.beginPath();
      context.strokeStyle = drawColor;
      context.lineWidth = size;
      context.moveTo(prevX, prevY);
      context.lineTo(x, y);
      context.stroke();
      context.closePath();
    };

    const handleRemoteClear = () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (!canvas || !context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleRemotePointer = ({ x, y, name }: any) => {
      setRemotePointer({ x, y, name });
      if (pointerTimeoutRef.current) clearTimeout(pointerTimeoutRef.current);
      pointerTimeoutRef.current = setTimeout(() => setRemotePointer(null), 2000);
    };

    bindListeners();

    // Retry binding if socket wasn't ready on first tick
    const timer = setInterval(() => {
      if (!activeSocket) bindListeners();
    }, 500);

    return () => {
      clearInterval(timer);
      if (activeSocket) {
        activeSocket.off('draw_line', handleRemoteDraw);
        activeSocket.off('canvas_clear', handleRemoteClear);
        activeSocket.off('whiteboard:pointer', handleRemotePointer);
        activeSocket.off('connect', bindListeners);
      }
    };
  }, [conversationId]);

  // Coordinates helper
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const lastCoords = useRef<{ x: number; y: number } | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    // Snapshot current canvas state for undo
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      const snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
      strokeHistory.current.push(snapshot);
      redoStack.current = []; // Clear redo on new stroke
      if (strokeHistory.current.length > 50) strokeHistory.current.shift(); // Cap history
    }

    lastCoords.current = coords;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !lastCoords.current) return;
    e.preventDefault(); // Prevent scrolling on touch screens

    const coords = getCoordinates(e);
    if (!coords) return;

    const prevX = lastCoords.current.x;
    const prevY = lastCoords.current.y;
    const { x, y } = coords;

    const activeColor = tool === 'eraser' ? '#202c33' : color; // Erase matches whiteboard container background color

    // Draw locally
    const context = contextRef.current;
    context.beginPath();
    context.strokeStyle = activeColor;
    context.lineWidth = lineWidth;
    context.moveTo(prevX, prevY);
    context.lineTo(x, y);
    context.stroke();
    context.closePath();

    // Broadcast remote draw event
    const socket = getSocket();
    if (socket) {
      socket.emit('draw_line', {
        conversationId,
        prevX,
        prevY,
        x,
        y,
        color: activeColor,
        size: lineWidth,
      });
    }

    lastCoords.current = coords;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastCoords.current = null;
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context || strokeHistory.current.length === 0) return;

    // Save current state to redo stack
    const currentState = context.getImageData(0, 0, canvas.width, canvas.height);
    redoStack.current.push(currentState);

    // Restore previous state
    const previous = strokeHistory.current.pop()!;
    context.putImageData(previous, 0, 0);

    // Broadcast undo
    getSocket()?.emit('canvas_clear', { conversationId });
    // Re-emit current state as an image (simplified: just send clear + redraw not supported here)
  };

  const handleRedo = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context || redoStack.current.length === 0) return;

    const snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
    strokeHistory.current.push(snapshot);

    const next = redoStack.current.pop()!;
    context.putImageData(next, 0, 0);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    if (confirm('Are you sure you want to clear the whiteboard for everyone?')) {
      context.clearRect(0, 0, canvas.width, canvas.height);

      const socket = getSocket();
      if (socket) {
        socket.emit('canvas_clear', { conversationId });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary rounded-2xl border border-border-default/40 overflow-hidden relative shadow-lg transition-colors">
      
      {/* Controls Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-default/40 bg-bg-secondary shrink-0 select-none">
        
        {/* Colors & Eraser */}
        <div className="flex items-center gap-2">
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                setColor(c.value);
                setTool('pen');
              }}
              style={{ backgroundColor: c.value }}
              className={`w-6 h-6 rounded-full border cursor-pointer transition ${tool === 'pen' && color === c.value ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-75 hover:opacity-100'}`}
              title={c.name}
            />
          ))}

          <div className="w-[1px] h-6 bg-border-default mx-1 shrink-0" />

          {/* Eraser Button */}
          <button
            onClick={() => setTool('eraser')}
            className={`px-2 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition ${tool === 'eraser' ? 'bg-brand-green/20 text-brand-green border border-brand-green/30' : 'hover:bg-bg-input text-text-secondary hover:text-text-primary'}`}
            title="Eraser"
          >
            <span>🧽</span> Eraser
          </button>
        </div>

        {/* Thickness & Clear */}
        <div className="flex items-center gap-3">
          {/* Thickness Selector */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span>Size:</span>
            <input
              type="range"
              min="1"
              max="15"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-16 h-1 bg-border-default accent-brand-green rounded-lg cursor-pointer"
            />
            <span className="font-mono w-4 text-right font-bold text-text-primary">{lineWidth}</span>
          </div>

          <div className="w-[1px] h-6 bg-border-default shrink-0" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            className="p-1.5 hover:bg-bg-input text-text-secondary hover:text-text-primary rounded-lg transition cursor-pointer"
            title="Undo (local)"
          >
            ↩️
          </button>
          <button
            onClick={handleRedo}
            className="p-1.5 hover:bg-bg-input text-text-secondary hover:text-text-primary rounded-lg transition cursor-pointer"
            title="Redo (local)"
          >
            ↪️
          </button>

          <div className="w-[1px] h-6 bg-border-default shrink-0" />

          {/* Clear Board Button */}
          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-text-secondary rounded-lg transition cursor-pointer"
            title="Clear Board for Everyone"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>

      </div>

      {/* Canvas */}
      <div className="flex-1 bg-[#202c33] cursor-crosshair overflow-hidden relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 block w-full h-full"
        />
        {/* Remote Peer Pointer */}
        {remotePointer && (
          <div
            className="absolute pointer-events-none z-10 flex items-center gap-1 -translate-x-1/2 -translate-y-1/2"
            style={{ left: remotePointer.x, top: remotePointer.y }}
          >
            <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-lg animate-pulse" />
            <span className="text-[10px] font-bold bg-black/70 text-amber-300 px-1.5 py-0.5 rounded-md whitespace-nowrap">
              {remotePointer.name}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
