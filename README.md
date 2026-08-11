# 💬 Klyra — Talk, Team-Up, Thrive

**Klyra** is a production-ready, full-stack real-time messaging, group chat, and WebRTC study room application built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, MongoDB, Auth.js (Google OAuth), and Socket.IO.

---

## ✨ Features

- 💬 **Real-Time Messaging**: Instant Socket.IO bi-directional events with typing indicators, online presence, and delivery/read receipts (`✓`/`✓✓`).
- 🔍 **In-Chat Message Search**: Real-time filtering by text keyword, sender, or file attachment.
- 🎨 **Adaptive Doodle Pattern & 11 Themes**: WhatsApp Web authentic doodle wallpaper that seamlessly blends across Light mode, Dark mode, and 11 custom color themes.
- 🎓 **Study & Meeting Rooms**: WebRTC 1-on-1 and group video/audio calls, real-time canvas whiteboards, polling system, screen sharing, and room code invitations.
- 🤖 **AI Assistant & Speech-to-Text**: Whisper audio note transcription & 8-language translation, Gemini AI chat assistant, and AI image generator.
- 📷 **View-Once Media & Disappearing Messages**: Self-destructing View-Once photos/text with configurable disappearing message timers (24h / view once).
- 📌 **Reactions, Pins & Forwarding**: Emoji reactions, pinned message header banners, and multi-recipient message forwarding.
- 🔒 **End-to-End Security**: Auth.js with Google OAuth & JWT sessions, bcrypt password hashing, Mongoose ODM, and Resend transactional emails.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 16** | React framework with App Router, SSR & Route Handlers |
| **React 19 & TypeScript** | Component UI library & type safety |
| **Tailwind CSS v4** | Custom utility styling & theme design tokens |
| **MongoDB & Mongoose** | Document database & ODM schema modeling |
| **Auth.js (NextAuth.js v5)** | OAuth providers & JWT session strategy |
| **Socket.IO & WebRTC** | Real-time events, signaling & video conferencing |
| **Cloudinary** | Cloud media storage with local fallback |
| **Resend** | Transactional welcome & alert email delivery |

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/klyra.git
cd klyra
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/klyra
AUTH_SECRET=your-openssl-generated-auth-secret
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
RESEND_API_KEY=re_your_resend_key
SOCKET_PORT=3001
```

### 4. Run Development Servers
Start the main Next.js app & Socket.IO server:
```bash
# Start Next.js App
npm run dev

# Start Socket.IO Server (separate terminal)
node server/socket-server.js
```

---

## 📦 Production Deployment Guide

### Deploy Frontend (Vercel)
1. Push project to GitHub repository.
2. Import project into Vercel and add environment variables from `.env.local`.
3. Deploy!

### Deploy Socket.IO Server (Railway / Render)
1. Deploy `server/socket-server.js` on Railway or Render.
2. Set `NEXT_PUBLIC_SOCKET_URL` on Vercel to point to your Railway/Render URL.
