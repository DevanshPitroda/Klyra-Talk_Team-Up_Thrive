// Standalone Socket.IO server — runs on PORT 3001 alongside Next.js (PORT 3000)
// Start with: node server/socket-server.js

const { createServer } = require('http');
const { Server }       = require('socket.io');
const mongoose         = require('mongoose');

const PORT = process.env.SOCKET_PORT || 3001;
const CLIENT_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const MONGODB_URI = process.env.MONGODB_URI;

// Track connected users: userId (string) → socketId (string)
const connectedUsers = new Map();
// Track which socket IDs map to userIds
const socketToUser = new Map();

// Track study room participants: roomId → Map<socketId, { userId, userName, userImage }>
const roomParticipants = new Map();

// Connect to MongoDB Atlas
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('🔌 [Socket Server] MongoDB connected successfully!'))
    .catch((err) => console.error('❌ [Socket Server] MongoDB connection failed:', err.message));
} else {
  console.warn('⚠️ [Socket Server] MONGODB_URI is not defined in environment variables.');
}

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin:      [CLIENT_URL, 'http://localhost:3000'],
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout:  60000,
  pingInterval: 25000,
});

// Helper: safe cast string/ObjectId
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ─── Auth: Register user ───────────────────────────────────────────────
  socket.on('user_connected', async (userId) => {
    if (!userId) return;

    connectedUsers.set(userId, socket.id);
    socketToUser.set(socket.id, userId);
    socket.userId = userId;

    // Join personal user room to receive global updates (unread badges, new messages, etc)
    socket.join(`user_${userId}`);

    // Broadcast online status
    io.emit('user_online', userId);
    console.log(`[Socket] User online: ${userId} (${socket.id})`);

    // Send online users list to client
    socket.emit('online_users', Array.from(connectedUsers.keys()));

    // Mark undelivered messages for this user as DELIVERED
    try {
      if (mongoose.connection.readyState === 1) {
        const db = mongoose.connection.db;
        const userObjId = toObjectId(userId);

        // Find memberships
        const memberships = await db.collection('conversationmembers')
          .find({ userId: userObjId })
          .toArray();
        const convIds = memberships.map(m => m.conversationId);

        if (convIds.length > 0) {
          // Update messages in these conversations sent by others that don't have this user in deliveredTo
          const now = new Date();
          await db.collection('messages').updateMany(
            {
              conversationId: { $in: convIds },
              senderId: { $ne: userObjId },
              'deliveredTo.userId': { $ne: userObjId }
            },
            {
              $push: { deliveredTo: { userId: userObjId, timestamp: now } }
            }
          );

          // Notify members in user rooms
          convIds.forEach(convId => {
            socket.to(convId.toString()).emit('messages_delivered', {
              conversationId: convId.toString(),
              userId: userId,
              timestamp: now.toISOString()
            });
          });
        }
      }
    } catch (err) {
      console.error('[Socket] Error updating delivery receipts on connect:', err.message);
    }
  });

  // ─── Join conversation/study room ─────────────────────────────────────────
  const handleJoinRoom = async (roomId) => {
    if (!roomId) return;

    socket.join(roomId);
    socket.currentRoomId = roomId;
    console.log(`[Socket] ${socket.userId || socket.id} joined room: ${roomId}`);

    // Mark messages in this room sent by others as SEEN and DELIVERED by this user
    const userId = socket.userId;
    if (!userId) return;

    try {
      if (mongoose.connection.readyState === 1) {
        const db = mongoose.connection.db;
        const userObjId = toObjectId(userId);
        const convObjId = toObjectId(roomId);
        const now = new Date();

        // 1. Add to deliveredTo if not present
        await db.collection('messages').updateMany(
          {
            conversationId: convObjId,
            senderId: { $ne: userObjId },
            'deliveredTo.userId': { $ne: userObjId }
          },
          {
            $push: { deliveredTo: { userId: userObjId, timestamp: now } }
          }
        );

        // 2. Add to seenBy if not present
        await db.collection('messages').updateMany(
          {
            conversationId: convObjId,
            senderId: { $ne: userObjId },
            'seenBy.userId': { $ne: userObjId }
          },
          {
            $push: { seenBy: { userId: userObjId, timestamp: now } }
          }
        );

        // 3. Reset unread count for this membership
        await db.collection('conversationmembers').updateOne(
          { conversationId: convObjId, userId: userObjId },
          { $set: { unreadCount: 0 } }
        );

        // 4. Notify everyone in room that messages are seen by this user
        io.to(roomId).emit('messages_seen', {
          conversationId: roomId,
          userId,
          timestamp: now.toISOString()
        });
      }
    } catch (err) {
      console.error('[Socket] Error updating seen receipts on join_room:', err.message);
    }
  };

  socket.on('join_room', handleJoinRoom);
  socket.on('join_conversation', handleJoinRoom);

  // ─── Leave conversation room ───────────────────────────────────────────
  socket.on('leave_room', (conversationId) => {
    socket.leave(conversationId);
    console.log(`[Socket] ${socket.userId} left room: ${conversationId}`);
  });

  // ─── Send message event ────────────────────────────────────────────────
  socket.on('send_message', async (data) => {
    const { conversationId, message } = data;
    if (!conversationId || !message) return;

    const senderId = message.senderId._id;
    const now = new Date();

    try {
      if (mongoose.connection.readyState === 1) {
        const db = mongoose.connection.db;
        const msgObjId = toObjectId(message._id);
        const convObjId = toObjectId(conversationId);

        // Get members of this conversation
        const membersList = await db.collection('conversationmembers')
          .find({ conversationId: convObjId })
          .toArray();

        const updates = { deliveredTo: [], seenBy: [] };

        // For each member, check if they are online and/or in the room
        for (const member of membersList) {
          const memberIdStr = member.userId.toString();
          if (memberIdStr === senderId) continue; // Skip sender

          const memberSocketId = connectedUsers.get(memberIdStr);
          if (memberSocketId) {
            // Member is online -> Delivered!
            updates.deliveredTo.push({ userId: member.userId, timestamp: now });

            // Check if member is currently in the room
            const socketsInRoom = io.sockets.adapter.rooms.get(conversationId);
            if (socketsInRoom && socketsInRoom.has(memberSocketId)) {
              // Member has the chat open -> Seen!
              updates.seenBy.push({ userId: member.userId, timestamp: now });
            }
          }
        }

        // Apply updates to the database
        if (updates.deliveredTo.length > 0 || updates.seenBy.length > 0) {
          const updateQuery = {};
          if (updates.deliveredTo.length > 0) {
            updateQuery.deliveredTo = { $each: updates.deliveredTo };
          }
          if (updates.seenBy.length > 0) {
            updateQuery.seenBy = { $each: updates.seenBy };
          }

          await db.collection('messages').updateOne(
            { _id: msgObjId },
            { $push: updateQuery }
          );

          // Merge updates into the message object sent to clients
          message.deliveredTo = [...(message.deliveredTo || []), ...updates.deliveredTo.map(d => ({ userId: d.userId.toString(), timestamp: d.timestamp.toISOString() }))];
          message.seenBy = [...(message.seenBy || []), ...updates.seenBy.map(s => ({ userId: s.userId.toString(), timestamp: s.timestamp.toISOString() }))];
        }
      }
    } catch (err) {
      console.error('[Socket] Error updating receipt on send_message:', err.message);
    }

    // Emit the new message directly to every member's personal user room
    try {
      if (mongoose.connection.readyState === 1) {
        const db = mongoose.connection.db;
        const convObjId = toObjectId(conversationId);
        const membersList = await db.collection('conversationmembers')
          .find({ conversationId: convObjId })
          .toArray();

        membersList.forEach((member) => {
          io.to(`user_${member.userId.toString()}`).emit('new_message', {
            conversationId,
            message,
          });
        });
      } else {
        // Fallback if DB not ready
        io.to(conversationId).emit('new_message', { conversationId, message });
      }
    } catch (err) {
      // Fallback
      io.to(conversationId).emit('new_message', { conversationId, message });
    }
  });

  // ─── Explicit mark as seen (when active chat receives a new message) ────
  socket.on('mark_as_seen', async ({ conversationId, messageId }) => {
    const userId = socket.userId;
    if (!userId || !conversationId) return;

    try {
      if (mongoose.connection.readyState === 1) {
        const db = mongoose.connection.db;
        const userObjId = toObjectId(userId);
        const now = new Date();

        const updateFilter = { conversationId: toObjectId(conversationId), senderId: { $ne: userObjId } };
        if (messageId) {
          updateFilter._id = toObjectId(messageId);
        }

        // Update delivered
        await db.collection('messages').updateMany(
          { ...updateFilter, 'deliveredTo.userId': { $ne: userObjId } },
          { $push: { deliveredTo: { userId: userObjId, timestamp: now } } }
        );

        // Update seen
        await db.collection('messages').updateMany(
          { ...updateFilter, 'seenBy.userId': { $ne: userObjId } },
          { $push: { seenBy: { userId: userObjId, timestamp: now } } }
        );

        // Reset unreadCount to 0 for this user
        await db.collection('conversationmembers').updateOne(
          { conversationId: toObjectId(conversationId), userId: userObjId },
          { $set: { unreadCount: 0 } }
        );

        // Notify room
        io.to(conversationId).emit('messages_seen', {
          conversationId,
          userId,
          timestamp: now.toISOString()
        });
      }
    } catch (err) {
      console.error('[Socket] Error in mark_as_seen:', err.message);
    }
  });

  // ─── Message Reactions & Pins ──────────────────────────────────────────
  socket.on('message_reaction', ({ conversationId, messageId, reactions }) => {
    if (conversationId) {
      io.to(conversationId).emit('message_reaction', { conversationId, messageId, reactions });
    }
  });

  socket.on('message_pin', ({ conversationId, messageId, isPinned, pinnedAt }) => {
    if (conversationId) {
      io.to(conversationId).emit('message_pin', { conversationId, messageId, isPinned, pinnedAt });
    }
  });

  // ─── Typing indicators ─────────────────────────────────────────────────
  socket.on('typing_start', ({ conversationId, userName }) => {
    socket.to(conversationId).emit('typing_start', { conversationId, userName });
  });

  socket.on('typing_stop', ({ conversationId, userName }) => {
    socket.to(conversationId).emit('typing_stop', { conversationId, userName });
  });

  // ─── Poll Real-time Sync ───────────────────────────────────────────────
  socket.on('poll_vote', ({ conversationId, pollId, poll }) => {
    socket.to(conversationId).emit('poll_updated', { pollId, poll });
  });

  socket.on('poll:create', ({ conversationId, poll }) => {
    if (conversationId) {
      socket.to(conversationId).emit('poll:created', poll);
    }
  });

  socket.on('poll:vote', ({ conversationId, poll }) => {
    if (conversationId) {
      io.to(conversationId).emit('poll:updated', poll);
    }
  });

  // ─── Collaborative Study Room Events ───────────────────────────────────
  socket.on('draw_line', (data) => {
    const { conversationId } = data;
    if (conversationId) {
      socket.to(conversationId).emit('draw_line', data);
    }
  });

  socket.on('canvas_clear', ({ conversationId }) => {
    if (conversationId) {
      socket.to(conversationId).emit('canvas_clear');
    }
  });

  socket.on('whiteboard:pointer', (data) => {
    const { conversationId } = data || {};
    if (conversationId) socket.to(conversationId).emit('whiteboard:pointer', data);
  });

  socket.on('note_update', (data) => {
    const { conversationId } = data;
    if (conversationId) {
      socket.to(conversationId).emit('note_update', data);
    }
  });

  // ─── Presentation Synchronizer Events ────────────────────────────────
  socket.on('presentation_start', (data) => {
    const { conversationId } = data;
    if (conversationId) {
      socket.to(conversationId).emit('presentation_start', data);
    }
  });

  socket.on('slide_change', (data) => {
    const { conversationId } = data;
    if (conversationId) {
      socket.to(conversationId).emit('slide_change', data);
    }
  });

  socket.on('presentation_stop', ({ conversationId }) => {
    if (conversationId) {
      socket.to(conversationId).emit('presentation_stop');
    }
  });

  // ─── WebRTC Signaling & Room Membership Sync ──────────────────────────────
  socket.on('room_member_joined', ({ conversationId }) => {
    if (conversationId) io.to(conversationId).emit('room_member_joined', { conversationId });
  });

  socket.on('room_member_left', ({ conversationId, userId }) => {
    if (conversationId) io.to(conversationId).emit('room_member_left', { conversationId, userId });
  });

  // Real-time Mic/Cam State Sync across room members
  socket.on('participant_media_state', ({ conversationId, userId, micMuted, videoOff }) => {
    if (conversationId) {
      io.to(conversationId).emit('participant_media_state', { userId, micMuted, videoOff });
    }
  });

  // Real-time Hand Raising / Lowering
  socket.on('raise_hand_toggle', ({ conversationId, userId, userName, isHandRaised }) => {
    if (conversationId) {
      io.to(conversationId).emit('raise_hand_toggle', { userId, userName, isHandRaised });
    }
  });

  // Host Control: Mute All Participants
  socket.on('host_mute_all', ({ conversationId }) => {
    if (conversationId) {
      socket.to(conversationId).emit('host_mute_all');
    }
  });

  // Real-time In-Meeting Chat
  socket.on('room_chat_message', ({ conversationId, message }) => {
    if (conversationId) {
      io.to(conversationId).emit('room_chat_message', message);
    }
  });

  // Real-time Collaborative Whiteboard
  socket.on('draw_line', (data) => {
    const { conversationId } = data || {};
    if (conversationId) {
      socket.to(conversationId).emit('draw_line', data);
    }
  });

  socket.on('canvas_clear', ({ conversationId }) => {
    if (conversationId) {
      socket.to(conversationId).emit('canvas_clear');
    }
  });

  socket.on('whiteboard_draw_event', ({ conversationId, drawData }) => {
    if (conversationId) {
      socket.to(conversationId).emit('whiteboard_draw_event', drawData);
    }
  });

  // Real-time Collaborative Shared Notes
  socket.on('note_update', (data) => {
    const { conversationId } = data || {};
    if (conversationId) {
      socket.to(conversationId).emit('note_update', data);
    }
  });

  socket.on('shared_notes_update', ({ conversationId, notesContent }) => {
    if (conversationId) {
      socket.to(conversationId).emit('shared_notes_update', { notesContent });
    }
  });

  socket.on('peer_joined', ({ conversationId }) => {
    if (conversationId) socket.to(conversationId).emit('peer_joined', { senderSocketId: socket.id });
  });

  socket.on('video_offer', (data) => {
    const { conversationId } = data;
    if (conversationId) socket.to(conversationId).emit('video_offer', { ...data, senderSocketId: socket.id });
  });

  socket.on('video_answer', (data) => {
    const { conversationId } = data;
    if (conversationId) socket.to(conversationId).emit('video_answer', { ...data, senderSocketId: socket.id });
  });

  socket.on('ice_candidate', (data) => {
    const { conversationId } = data;
    if (conversationId) socket.to(conversationId).emit('ice_candidate', { ...data, senderSocketId: socket.id });
  });

  socket.on('video_call_end', ({ conversationId }) => {
    if (conversationId) socket.to(conversationId).emit('video_call_ended');
  });

  // ─── Study Room: Join with full state hydration ──────────────────────────
  socket.on('room:join', ({ roomId, userId, userName, userImage }) => {
    if (!roomId) return;

    socket.join(roomId);
    socket.currentRoomId = roomId;

    if (!roomParticipants.has(roomId)) {
      roomParticipants.set(roomId, new Map());
    }
    roomParticipants.get(roomId).set(socket.id, { userId, userName, userImage, socketId: socket.id });

    // Send the joining peer a list of all existing peer socket IDs so they can initiate WebRTC offers
    const existingPeers = Array.from(roomParticipants.get(roomId).values()).filter(
      (p) => p.socketId !== socket.id
    );
    socket.emit('room:peers', existingPeers);

    // Notify everyone else that a new peer joined
    socket.to(roomId).emit('participant:joined', {
      socketId: socket.id,
      userId,
      userName,
      userImage,
    });

    console.log(`[Socket] ${userName} (${socket.id}) joined study room: ${roomId}`);
  });

  // ─── Study Room: Leave ────────────────────────────────────────────────────
  socket.on('room:leave', ({ roomId }) => {
    const participants = roomParticipants.get(roomId);
    if (participants) {
      participants.delete(socket.id);
      if (participants.size === 0) roomParticipants.delete(roomId);
    }
    socket.leave(roomId);
    io.to(roomId).emit('participant:left', { socketId: socket.id, userId: socket.userId });
    console.log(`[Socket] ${socket.userId} left study room: ${roomId}`);
  });

  // ─── Study Room: Screen Share ─────────────────────────────────────────────
  socket.on('screen:start', ({ roomId, userId }) => {
    if (roomId) socket.to(roomId).emit('screen:start', { socketId: socket.id, userId });
  });

  socket.on('screen:stop', ({ roomId, userId }) => {
    if (roomId) socket.to(roomId).emit('screen:stop', { socketId: socket.id, userId });
  });

  // ─── Study Room: Host Controls ────────────────────────────────────────────
  socket.on('host:kick', ({ roomId, targetUserId }) => {
    // Find target socket and emit disconnect notice
    const targetSocketId = connectedUsers.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('host:kicked');
    }
    if (roomId) io.to(roomId).emit('participant:left', { userId: targetUserId, kicked: true });
  });

  socket.on('meeting:end', ({ roomId }) => {
    if (roomId) {
      io.to(roomId).emit('meeting:ended');
      roomParticipants.delete(roomId);
    }
  });

  // ─── WebRTC Targeted Signaling (socket-to-socket for mesh) ───────────────
  socket.on('webrtc:offer', ({ targetSocketId, offer, roomId }) => {
    io.to(targetSocketId).emit('webrtc:offer', { offer, fromSocketId: socket.id, roomId });
  });

  socket.on('webrtc:answer', ({ targetSocketId, answer, roomId }) => {
    io.to(targetSocketId).emit('webrtc:answer', { answer, fromSocketId: socket.id, roomId });
  });

  socket.on('webrtc:ice', ({ targetSocketId, candidate, roomId }) => {
    io.to(targetSocketId).emit('webrtc:ice', { candidate, fromSocketId: socket.id, roomId });
  });

  // ─── Disconnect ────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const userId = socket.userId;
    const roomId = socket.currentRoomId;

    if (userId) {
      connectedUsers.delete(userId);
      socketToUser.delete(socket.id);
      io.emit('user_offline', userId);
      console.log(`[Socket] User offline: ${userId}`);
    }

    // Clean up room participant on disconnect
    if (roomId && roomParticipants.has(roomId)) {
      roomParticipants.get(roomId).delete(socket.id);
      if (roomParticipants.get(roomId).size === 0) roomParticipants.delete(roomId);
      io.to(roomId).emit('participant:left', { socketId: socket.id, userId });
    }

    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n🔌 Socket.IO server running on http://localhost:${PORT}`);
  console.log(`   Accepting connections from: ${CLIENT_URL}\n`);
});
