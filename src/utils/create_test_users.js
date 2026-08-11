const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const uri = 'mongodb+srv://dp_chat:Dpchat26@chatappcluster.s8ht3a9.mongodb.net/chatapp?retryWrites=true&w=majority&appName=chatappCluster';

async function run() {
  await mongoose.connect(uri);
  console.log('Connected to DB');

  const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    username: String,
    email: String,
    password: { type: String, select: false },
    role: String,
    isOnline: Boolean,
    emailVerified: Date
  }, { collection: 'users' }));

  await User.deleteMany({ email: { $in: ['alice@gmail.com', 'bob@gmail.com'] } });
  console.log('Cleaned old test users');

  const hashedPassword = await bcrypt.hash('Password123!', 12);

  const alice = await User.create({
    name: 'Alice Stark',
    username: 'alice_stark',
    email: 'alice@gmail.com',
    password: hashedPassword,
    role: 'user',
    isOnline: false,
    emailVerified: new Date()
  });

  const bob = await User.create({
    name: 'Bob Stark',
    username: 'bob_stark',
    email: 'bob@gmail.com',
    password: hashedPassword,
    role: 'user',
    isOnline: false,
    emailVerified: new Date()
  });

  console.log('Created Alice:', alice._id);
  console.log('Created Bob:', bob._id);
  process.exit(0);
}

run().catch(console.error);
