'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getSocket } from '../../hooks/useSocket';
import { useChatStore } from '../../store/useChatStore';

interface Peer {
  socketId: string;
  userId: string;
  userName: string;
  userImage?: string;
  stream?: MediaStream;
  pc: RTCPeerConnection;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isScreenSharing?: boolean;
}

interface VideoCallProps {
  conversationId: string;
  micMuted?: boolean;
  videoOff?: boolean;
  isScreenSharing?: boolean;
  onScreenShareToggle?: (isSharing: boolean) => void;
}

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

function PeerVideoTile({ peer }: { peer: Peer }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [peer.stream]);

  const initials = peer.userName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div className="relative bg-bg-secondary rounded-2xl overflow-hidden border border-border-default/40 flex items-center justify-center min-h-[120px] w-full h-full transition-colors">
      {peer.stream && (!peer.isCameraOff || peer.isScreenSharing) ? (
        <video
          key={`${peer.socketId}-${peer.isScreenSharing ? 'screen' : 'cam'}`}
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full ${peer.isScreenSharing ? 'object-contain bg-black' : 'object-cover'}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-bg-secondary to-bg-input/70">
          <div className="w-14 h-14 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-xl font-black text-brand-green shadow-sm">
            {initials}
          </div>
          <span className="text-xs text-text-primary font-extrabold">{peer.userName}</span>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-bg-secondary/90 backdrop-blur-sm rounded-lg px-2.5 py-1 z-10 border border-border-default/30 shadow-sm">
        <span className="text-[10px] font-bold text-text-primary truncate max-w-[100px]">{peer.userName}</span>
        {peer.isMuted && <span className="text-[9px] text-red-500 font-bold">🔇</span>}
        {peer.isCameraOff && !peer.isScreenSharing && <span className="text-[9px] text-red-500 font-bold">🚫</span>}
        {peer.isScreenSharing && <span className="text-[9px] text-amber-500 font-extrabold">🖥️ Presenting</span>}
      </div>
    </div>
  );
}

function LocalVideoTile({
  stream,
  userName,
  videoOff,
  micMuted,
  isScreenSharing,
}: {
  stream: MediaStream | null;
  userName: string;
  videoOff: boolean;
  micMuted: boolean;
  isScreenSharing: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const initials = userName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ME';

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      if (!videoOff) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [stream, videoOff, isScreenSharing]);

  return (
    <div
      className={`relative bg-gradient-to-b from-bg-secondary to-bg-input/70 rounded-2xl overflow-hidden border-2 border-brand-green/60 flex items-center justify-center min-h-[120px] w-full h-full transition-colors shadow-sm`}
    >
      {stream && (!videoOff || isScreenSharing) ? (
        <video
          key={`${stream.id}-${videoOff ? 'off' : 'on'}`}
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full ${isScreenSharing ? 'object-contain bg-black' : 'object-cover'}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-bg-secondary to-bg-input/70">
          <div className="w-14 h-14 rounded-full bg-brand-g``reen/20 border border-brand-green/40 flex items-center justify-center text-xl font-black text-brand-green shadow-sm">
            {initials}
          </div>
          <span className="text-xs text-text-primary font-extrabold">You</span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-bg-secondary/90 backdrop-blur-sm rounded-lg px-2.5 py-1 z-10 border border-border-default/30 shadow-sm">
        <span className="text-[10px] font-bold text-text-primary truncate max-w-[100px]">You</span>
        {micMuted && <span className="text-[9px] text-red-400">🔇</span>}
        {isScreenSharing && <span className="text-[9px] text-amber-400 font-bold">🖥️ Presenting</span>}
      </div>
    </div>
  );
}

// ─── Main VideoCall Component ─────────────────────────────────────────────────

export default function VideoCall({
  conversationId,
  micMuted: propMicMuted = true,
  videoOff: propVideoOff = true,
  isScreenSharing: propIsScreenSharing = false,
  onScreenShareToggle,
}: VideoCallProps) {
  const { data: session } = useSession();
  const { activeMeetingRoomId } = useChatStore();

  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(propIsScreenSharing);
  const [errorMsg, setErrorMsg] = useState('');

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());

  const updatePeers = useCallback((update: (prev: Map<string, Peer>) => Map<string, Peer>) => {
    peersRef.current = update(new Map(peersRef.current));
    setPeers(new Map(peersRef.current));
  }, []);

  // Sync mic hardware track when prop changes
  useEffect(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !propMicMuted;
    }
  }, [propMicMuted]);

  // Sync camera hardware track when prop changes
  useEffect(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !propVideoOff;
    }
  }, [propVideoOff]);

  // ─── Get Local Media ────────────────────────────────────────────────────

  const getLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getVideoTracks().forEach((t) => (t.enabled = !propVideoOff));
      stream.getAudioTracks().forEach((t) => (t.enabled = !propMicMuted));
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      setErrorMsg(
        err?.name === 'NotAllowedError'
          ? 'Camera/microphone access blocked by browser.'
          : 'Unable to access camera or microphone.'
      );
      return null;
    }
  }, [propMicMuted, propVideoOff]);

  // ─── Create PeerConnection for a specific peer ────────────────────────────

  const createPeerConnection = useCallback(
    (remoteSocketId: string, remoteUser: { userId: string; userName: string; userImage?: string }) => {
      const pc = new RTCPeerConnection(ICE_CONFIG);

      // Add local stream tracks to PC
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket()?.emit('webrtc:ice', {
            targetSocketId: remoteSocketId,
            candidate: event.candidate,
            roomId: conversationId,
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        updatePeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(remoteSocketId);
          next.set(remoteSocketId, {
            socketId: remoteSocketId,
            userId: remoteUser.userId,
            userName: remoteUser.userName,
            userImage: remoteUser.userImage,
            stream,
            pc,
            isMuted: existing?.isMuted,
            isCameraOff: existing?.isCameraOff,
            isScreenSharing: existing?.isScreenSharing,
          });
          return next;
        });
      };

      return pc;
    },
    [conversationId, updatePeers]
  );

  // ─── Socket Lifecycle ───────────────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    const init = async () => {
      await getLocalStream();
      socket.emit('room:join', {
        roomId: conversationId,
        userId: session?.user?.id,
        userName: session?.user?.name || 'Participant',
        userImage: session?.user?.image,
      });
    };

    // ─── room:peers — received by the NEW joiner with list of existing peers
    const onRoomPeers = async (existingPeers: Array<{ socketId: string; userId: string; userName: string; userImage?: string }>) => {
      for (const peerInfo of existingPeers) {
        const pc = createPeerConnection(peerInfo.socketId, peerInfo);
        updatePeers((prev) => {
          const next = new Map(prev);
          next.set(peerInfo.socketId, {
            socketId: peerInfo.socketId,
            userId: peerInfo.userId,
            userName: peerInfo.userName,
            userImage: peerInfo.userImage,
            pc,
          });
          return next;
        });

        // Create WebRTC Offer
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:offer', {
            targetSocketId: peerInfo.socketId,
            offer,
            roomId: conversationId,
          });
        } catch (err) {
          console.error('Error creating offer for peer:', peerInfo.socketId, err);
        }
      }
    };

    // ─── participant:joined — received by EXISTING peers when new user joins
    const onParticipantJoined = ({ socketId, userId, userName, userImage }: any) => {
      const pc = createPeerConnection(socketId, { userId, userName, userImage });
      updatePeers((prev) => {
        const next = new Map(prev);
        next.set(socketId, {
          socketId,
          userId,
          userName,
          userImage,
          pc,
        });
        return next;
      });
    };

    // ─── participant:left — remove peer
    const onParticipantLeft = ({ socketId }: any) => {
      updatePeers((prev) => {
        const next = new Map(prev);
        const peer = next.get(socketId);
        peer?.pc.close();
        next.delete(socketId);
        return next;
      });
    };

    // ─── webrtc:offer — create answer
    const onOffer = async ({ offer, fromSocketId, roomId }: any) => {
      let peer = peersRef.current.get(fromSocketId);
      if (!peer) {
        const pc = createPeerConnection(fromSocketId, { userId: fromSocketId, userName: 'Peer' });
        peer = { socketId: fromSocketId, userId: fromSocketId, userName: 'Peer', pc };
        updatePeers((prev) => new Map(prev).set(fromSocketId, peer!));
      }
      try {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', {
          targetSocketId: fromSocketId,
          answer,
          roomId,
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    // ─── webrtc:answer — finalize connection
    const onAnswer = async ({ answer, fromSocketId }: any) => {
      const peer = peersRef.current.get(fromSocketId);
      if (peer?.pc) {
        try {
          await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error setting remote answer:', err);
        }
      }
    };

    // ─── webrtc:ice — add ICE candidate
    const onIce = async ({ candidate, fromSocketId }: any) => {
      const peer = peersRef.current.get(fromSocketId);
      if (peer?.pc && peer.pc.remoteDescription) {
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    // ─── Media state sync from other participants
    const onMediaState = ({ userId: uid, micMuted: muted, videoOff: camOff }: any) => {
      updatePeers((prev) => {
        const next = new Map(prev);
        for (const [sid, peer] of next) {
          if (peer.userId === uid) {
            next.set(sid, { ...peer, isMuted: muted, isCameraOff: camOff });
            break;
          }
        }
        return next;
      });
    };

    // ─── Host kicked this user
    const onKicked = () => {
      alert('You have been removed from the room by the host.');
      socket.emit('room:leave', { roomId: conversationId });
      window.location.href = '/chat';
    };

    // ─── Meeting ended by host
    const onMeetingEnded = () => {
      alert('The host has ended the meeting.');
      window.location.href = '/chat';
    };

    // ─── Remote Screen Share State Sync
    const onScreenStart = ({ socketId }: any) => {
      updatePeers((prev) => {
        const next = new Map(prev);
        const peer = next.get(socketId);
        if (peer) {
          next.set(socketId, { ...peer, isScreenSharing: true });
        }
        return next;
      });
    };

    const onScreenStop = ({ socketId }: any) => {
      updatePeers((prev) => {
        const next = new Map(prev);
        const peer = next.get(socketId);
        if (peer) {
          next.set(socketId, { ...peer, isScreenSharing: false });
        }
        return next;
      });
    };

    socket.on('room:peers', onRoomPeers);
    socket.on('participant:joined', onParticipantJoined);
    socket.on('participant:left', onParticipantLeft);
    socket.on('webrtc:offer', onOffer);
    socket.on('webrtc:answer', onAnswer);
    socket.on('webrtc:ice', onIce);
    socket.on('participant_media_state', onMediaState);
    socket.on('screen:start', onScreenStart);
    socket.on('screen:stop', onScreenStop);
    socket.on('host:kicked', onKicked);
    socket.on('meeting:ended', onMeetingEnded);

    init();

    return () => {
      socket.off('room:peers', onRoomPeers);
      socket.off('participant:joined', onParticipantJoined);
      socket.off('participant:left', onParticipantLeft);
      socket.off('webrtc:offer', onOffer);
      socket.off('webrtc:answer', onAnswer);
      socket.off('webrtc:ice', onIce);
      socket.off('participant_media_state', onMediaState);
      socket.off('screen:start', onScreenStart);
      socket.off('screen:stop', onScreenStop);
      socket.off('host:kicked', onKicked);
      socket.off('meeting:ended', onMeetingEnded);
    };
  }, [conversationId, session, getLocalStream, createPeerConnection, updatePeers]);

  useEffect(() => {
    return () => {
      const socket = getSocket();
      if (socket && conversationId) {
        socket.emit('room:leave', { roomId: conversationId });
      }
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      peersRef.current.forEach((peer) => peer.pc.close());
      peersRef.current.clear();
    };
  }, [conversationId]);

  // ─── Mic / Camera Toggles ───────────────────────────────────────────────

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      const muted = !track.enabled;
      // Note: setMicMuted and setVideoOff need state hooks if used here
      getSocket()?.emit('participant_media_state', {
        conversationId,
        userId: session?.user?.id,
        micMuted: muted,
        videoOff: propVideoOff,
      });
    }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      const off = !track.enabled;
      // Note: setMicMuted and setVideoOff need state hooks if used here
      getSocket()?.emit('participant_media_state', {
        conversationId,
        userId: session?.user?.id,
        micMuted: propMicMuted,
        videoOff: off,
      });
    }
  };

  // ─── Screen Share ───────────────────────────────────────────────────────

  const toggleScreenShare = async (forceState?: boolean) => {
    const shouldShare = forceState !== undefined ? forceState : !isScreenSharing;
    const socket = getSocket();

    if (!shouldShare) {
      // Stop screen share
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
      onScreenShareToggle?.(false);
      socket?.emit('screen:stop', { roomId: conversationId, userId: session?.user?.id });

      // Restore camera track for all peers
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        peersRef.current.forEach((peer) => {
          const sender = peer.pc.getSenders().find((s) => s.track?.kind === 'video');
          sender?.replaceTrack(camTrack);
        });
      }
    } else {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        } catch {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        }

        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);
        onScreenShareToggle?.(true);
        socket?.emit('screen:start', { roomId: conversationId, userId: session?.user?.id });

        // Replace video track in all peer connections
        const screenTrack = stream.getVideoTracks()[0];
        peersRef.current.forEach((peer) => {
          const sender = peer.pc.getSenders().find((s) => s.track?.kind === 'video');
          sender?.replaceTrack(screenTrack);
        });

        // Auto stop when user clicks "Stop sharing" in browser banner
        screenTrack.onended = () => {
          toggleScreenShare(false);
        };
      } catch (err: any) {
        console.error('Screen share error:', err);
        onScreenShareToggle?.(false);
        if (err?.name !== 'NotAllowedError') {
          alert(`Screen share error: ${err?.message || 'Permission denied'}`);
        }
      }
    }
  };

  // Sync screen share state when propIsScreenSharing changes from Toolbar
  useEffect(() => {
    if (propIsScreenSharing && !screenStreamRef.current) {
      toggleScreenShare(true);
    } else if (!propIsScreenSharing && screenStreamRef.current) {
      toggleScreenShare(false);
    }
  }, [propIsScreenSharing]);

  // ─── Dynamic Video Grid Layout ──────────────────────────────────────────

  const peerArray = Array.from(peers.values());
  const totalTiles = peerArray.length + 1; // +1 for local

  // Check if local user or any remote peer is screen sharing
  const presenterPeer = peerArray.find((p) => p.isScreenSharing);
  const isAnyScreenSharing = isScreenSharing || !!presenterPeer;

  const gridClass =
    totalTiles === 1
      ? 'grid-cols-1'
      : totalTiles === 2
      ? 'grid-cols-2'
      : totalTiles <= 4
      ? 'grid-cols-2'
      : totalTiles <= 6
      ? 'grid-cols-3'
      : 'grid-cols-4';

  return (
    <div className="flex flex-col h-full bg-bg-primary rounded-2xl border border-border-default/40 overflow-hidden shadow-lg select-none relative transition-colors">
      {/* Active Local Screen Share Banner */}
      {isScreenSharing && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>🖥️ You are presenting your screen to everyone in the room</span>
          </div>
          <button
            onClick={() => toggleScreenShare(false)}
            className="px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold transition cursor-pointer"
          >
            Stop Sharing
          </button>
        </div>
      )}

      {/* Active Remote Presenter Banner */}
      {!isScreenSharing && presenterPeer && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>🖥️ {presenterPeer.userName} is presenting their screen</span>
          </div>
        </div>
      )}

      {/* Main Container Layout */}
      {isAnyScreenSharing ? (
        /* Spotlight Layout: Large Presenter Stage + Side Filmstrip */
        <div className="flex-1 flex flex-col md:flex-row gap-2 p-2 min-h-0 overflow-hidden">
          {/* Main Presenter Stage */}
          <div className="flex-1 h-full min-h-0 relative rounded-2xl overflow-hidden bg-black border border-border-default/30">
            {isScreenSharing ? (
              <LocalVideoTile
                stream={screenStream}
                userName={session?.user?.name || 'You'}
                videoOff={propVideoOff}
                micMuted={propMicMuted}
                isScreenSharing={true}
              />
            ) : presenterPeer ? (
              <PeerVideoTile peer={presenterPeer} />
            ) : null}
          </div>

          {/* Side Participant Filmstrip */}
          <div className="w-full md:w-56 h-32 md:h-full flex md:flex-col gap-2 overflow-auto shrink-0">
            {!isScreenSharing && (
              <div className="w-40 md:w-full h-full md:h-36 shrink-0">
                <LocalVideoTile
                  stream={localStream}
                  userName={session?.user?.name || 'You'}
                  videoOff={propVideoOff}
                  micMuted={propMicMuted}
                  isScreenSharing={false}
                />
              </div>
            )}
            {peerArray
              .filter((p) => p !== presenterPeer)
              .map((peer) => (
                <div key={peer.socketId} className="w-40 md:w-full h-full md:h-36 shrink-0">
                  <PeerVideoTile peer={peer} />
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* Standard Equal Grid Layout */
        <div className={`flex-1 grid ${gridClass} gap-2 p-3 overflow-auto`}>
          {/* Local Tile */}
          <LocalVideoTile
            stream={localStream}
            userName={session?.user?.name || 'You'}
            videoOff={propVideoOff}
            micMuted={propMicMuted}
            isScreenSharing={false}
          />

          {/* Remote Peer Tiles */}
          {peerArray.map((peer) => (
            <PeerVideoTile key={peer.socketId} peer={peer} />
          ))}
        </div>
      )}

      {/* Waiting overlay (only shown when alone and not sharing) */}
      {peerArray.length === 0 && !isScreenSharing && (
        propVideoOff ? (
          /* Camera Off: Central Glassmorphic Waiting Card */
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="flex flex-col items-center gap-3 text-center p-6 bg-bg-secondary/90 backdrop-blur-md rounded-3xl border border-border-default/50 max-w-sm shadow-xl transition-all">
              <div className="w-16 h-16 rounded-full bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-3xl animate-pulse">
                🎓
              </div>
              <p className="text-sm font-extrabold text-text-primary">Waiting for others to join…</p>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed font-semibold">When another participant joins, video will connect automatically.</p>
              {errorMsg && <p className="text-xs text-red-500 font-semibold mt-2">{errorMsg}</p>}
            </div>
          </div>
        ) : (
          /* Camera On: Sleek Top Pill Banner so user's face is 100% visible */
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
            <div className="flex items-center gap-2 px-4 py-2 bg-bg-secondary/90 backdrop-blur-md border border-border-default/50 rounded-full shadow-lg text-xs font-extrabold text-text-primary">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-ping shrink-0" />
              <span>👥 Waiting for others to join room...</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}
