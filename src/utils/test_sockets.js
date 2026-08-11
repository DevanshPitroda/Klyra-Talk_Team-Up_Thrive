const { io } = require('socket.io-client');

const SOCKET_URL = 'http://localhost:3001';
const CONVERSATION_ID = '6a5487b0fa6f94257c9448aa'; // Mock conversation ID

// IDs of our test users
const ALICE_ID = '6a5487affa6f94257c94481c';
const BOB_ID = '6a5487b0fa6f94257c94481d';

console.log('🚀 Starting Real-Time Socket.IO Test...');

// 1. Connect Alice's Socket
const aliceSocket = io(SOCKET_URL, { forceNew: true, transports: ['websocket'] });

// 2. Connect Bob's Socket
const bobSocket = io(SOCKET_URL, { forceNew: true, transports: ['websocket'] });

let aliceConnected = false;
let bobConnected = false;
let messageReceivedByBob = false;

function checkCompletion() {
  if (aliceConnected && bobConnected && messageReceivedByBob) {
    console.log('\n🎉 ALL REAL-TIME TESTS PASSED SUCCESSFULLY! ✅');
    aliceSocket.disconnect();
    bobSocket.disconnect();
    process.exit(0);
  }
}

// Set up Alice
aliceSocket.on('connect', () => {
  console.log('🟢 Alice Socket Connected.');
  aliceSocket.emit('user_connected', ALICE_ID);
});

aliceSocket.on('online_users', (users) => {
  console.log('👥 Alice received online users list:', users);
  aliceSocket.emit('join_room', CONVERSATION_ID);
  aliceConnected = true;
  triggerMessage();
});

// Set up Bob
bobSocket.on('connect', () => {
  console.log('🟢 Bob Socket Connected.');
  bobSocket.emit('user_connected', BOB_ID);
});

bobSocket.on('online_users', (users) => {
  console.log('👥 Bob received online users list:', users);
  bobSocket.emit('join_room', CONVERSATION_ID);
  bobConnected = true;
  triggerMessage();
});

// Listen for message on Bob's client
bobSocket.on('new_message', ({ conversationId, message }) => {
  console.log(`\n📬 Bob received real-time message in room [${conversationId}]:`);
  console.log(`   From: ${message.senderId.name}`);
  console.log(`   Body: "${message.body}"`);
  
  if (message.body === 'Hey Bob, this is a real-time socket test!') {
    messageReceivedByBob = true;
    checkCompletion();
  }
});

// Trigger send when both are ready
function triggerMessage() {
  if (aliceConnected && bobConnected) {
    console.log('\n💬 Alice is sending a real-time message...');
    aliceSocket.emit('send_message', {
      conversationId: CONVERSATION_ID,
      message: {
        _id: 'msg_' + Date.now(),
        conversationId: CONVERSATION_ID,
        senderId: {
          _id: ALICE_ID,
          name: 'Alice Stark'
        },
        body: 'Hey Bob, this is a real-time socket test!',
        type: 'text',
        attachments: [],
        createdAt: new Date().toISOString()
      }
    });
  }
}

// Timeout check
setTimeout(() => {
  console.error('\n❌ Test timed out. Check if Socket.IO server is running on http://localhost:3001');
  aliceSocket.disconnect();
  bobSocket.disconnect();
  process.exit(1);
}, 8000);
