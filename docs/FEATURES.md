# ChatApp Functional Features Specification

This document details the functional specifications and technical requirements for ChatApp.

---

## 1. Feature Map Overview

```
                      ┌─────────────────────────────────┐
                      │            ChatApp              │
                      └──────────────┬──────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
┌────────▼────────┐         ┌────────▼────────┐         ┌────────▼────────┐
│ Authentication  │         │ Messaging Core  │         │  User Systems   │
│ ├─ Google Auth  │         │ ├─ Text / Emojis│         │ ├─ Status / St. │
│ ├─ JWT Sessions │         │ ├─ Media / Files│         │ ├─ Push Alerts  │
│ └─ Admin Mails  │         │ ├─ Group Chats  │         │ ├─ Themes / Dark│
│                 │         │ └─ Read Receipts│         │ └─ Admin Panel  │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

---

## 2. Core Functional Requirements

### F-001: User Onboarding & Authentication
- **Google OAuth 2.0 Integration**: Sign in using Google accounts via Auth.js.
- **Stateless Session Management**: Stores user sessions in secure HTTP-only cookies using JSON Web Tokens (30-day expiration).
- **Onboarding Form**: First-time logins redirect users to a profile setup page (`/register`) to input their name, select a username, add a bio, and upload an avatar.
- **Registration Notifications**:
  - **User Onboarding Email**: Resend automatically sends a welcome email with onboarding tips to the new user.
  - **Admin Registration Alert**: Admins receive an automated notification email detailing the new user's registration and current platform registration stats.

---

### F-002: Real-Time Messaging Engine
- **Direct Messaging**: One-on-one private chat rooms between users.
- **Support for Media Attachments**: Send text messages alongside attachments (images, video, audio, files).
- **Optimistic UI Updates**: Client-side Zustand stores immediately display new outgoing messages with a "sending" status before database confirmation.
- **Smart Timestamp Dividers**: Sorts messages with smart time markers (e.g., "Just now", "5 mins ago", "10:30 AM", "Yesterday", or calendar dates).
- **Infinite History Load**: Loads message history with cursor-paginated queries (50 messages per page) as the user scrolls up.

---

### F-003: Group Conversations
- **Group Creation Wizard**: Create group chats, set group profile images, write descriptions, and select initial members.
- **User Role Hierarchy**:
  - **Owner**: The group creator. Has full permissions, including deleting the group and managing Admin promotions.
  - **Admin**: Can invite new members, remove members, and edit group details.
  - **Member**: Can send messages and view group information.
- **Group Event Notifications**: Auto-generates system notification alerts inside the chat room when users join, leave, get promoted, or update group details.

---

### F-004: Message Management Actions
- **Message Editing**: Users can edit their sent messages. Edited messages display an "Edited" label next to their timestamp.
- **Soft Deletion**: Users can delete messages using two options:
  - **Delete for Everyone**: Replaces the message content with a "This message was deleted" placeholder for all participants.
  - **Delete for Me**: Hides the message from the requester's chat logs while preserving it for other chat participants.
- **Message Thread Replies**: Quote and reply to messages. Clicking a quote preview scrolls the chat feed to the original message location.
- **Message Forwarding**: Forward messages to selected chats or group rooms.

---

### F-005: Delivery Tracking (Read Receipts)
- **Status Ticks**:
  - **Single Ticks (✓)**: Message has been saved to the database.
  - **Double Ticks (✓✓)**: Recipient socket client received the message.
  - **Double Blue Ticks (✓✓)**: Recipient opened the chat room and viewed the message.
- **Group Tracking**: In group chats, checkmarks display grey until all participants receive the message, and blue once all participants read the message. Users can click the status checks to see detailed read/delivery times per member.

---

### F-006: Presence & Typing Indicators
- **Typing Indicator**: Shows typing indicators below the chat room header when participants are active.
  - Generates typing status updates 300ms after the first keystroke.
  - Automatically clears typing indicators after 3 seconds of keystroke inactivity.
- **Online Presence Ticks**: Displays online indicators on avatars when users have active socket connections. Displays a "Last seen at [time]" timestamp when users are offline.

---

### F-007: Rich-Media Attachments & Cloudinary Proxy
- **Asset Storage**: Uploads all media assets to Cloudinary.
- **Automatic Image Compression**: Compresses image attachments on the client-side before upload to reduce network traffic.
- **Media Lightbox Viewer**: View uploaded images and play videos inside full-screen overlay viewers.
- **File Transfers**: Share document attachments (PDFs, spreadsheets, slide decks) with size metrics and download links. Enforces size limits: Images (25MB), Video (64MB), Audio (25MB), Documents (100MB).

---

### F-008: Voice Message Recorder
- **Media Capture**: Record voice messages using native browser `MediaRecorder` APIs.
- **Waveform Canvas Preview**: Shows a live canvas waveform preview of audio frequency signals while recording.
- **Audio Waveform Player**: Renders custom playback waveforms with speed controls, pause options, and track indicators.

---

### F-009: Expiring Status Stories
- **Expiring Status Updates**: Upload statuses (text with colored backgrounds, images, or short videos) that auto-delete after 24 hours.
- **Ring Indicators**: Shows colored borders around user profile pictures when they have active, unviewed status updates.
- **Auto-Cleanup**: Automatically deletes expired status media using MongoDB TTL indexes.

---

### F-010: Notification Systems
- **Push Notifications**: Sends native browser notifications using web service workers when new messages arrive while the application is in the background.
- **Sound Alerts**: Plays sound files on incoming messages.
- **Notification Controls**: Manage notifications inside settings panels (mute individual conversation notifications, mute all notifications, or disable alerts).

---

### F-011: Administration Moderation
- **Analytics Metrics Dashboard**: Admins can view statistics dashboards detailing registration growth, active daily users, and daily messaging activity logs.
- **User Directory Actions**: Lock, unlock, ban, unban, or delete user accounts. Adjust user access roles.
- **Flagged Content Moderation**: View reported content in a central moderation panel.

---

### F-012: Security Hardening (Phase 5)
- **End-to-End Encryption**: Encrypts text body contents on the client side using Web Crypto APIs (AES-GCM-256 keys exchanged via ECDH). The server only stores encrypted message payloads.
- **Rate-Limiting Guards**: Restricts request rates using API middleware to prevent abuse (e.g., maximum 60 messages/minute, 10 uploads/minute).
- **Zod Data Sanitization**: Parses and validates all API payloads against strict schemas before database processing.
