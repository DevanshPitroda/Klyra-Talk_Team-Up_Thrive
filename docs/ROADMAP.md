# ChatApp — Development Roadmap

This document outlines the step-by-step development process, timeline, and dependencies for building ChatApp. The timeline spans approximately **59 days** across **5 development phases** of implementation, testing, and production tuning.

---

## Timeline Summary

| Phase | Title | Focus Areas | Est. Time | Key Deliverable |
|---|---|---|---|---|
| **Phase 1** | **Foundation** | Database modeling, Auth setup, Middleware, Mailers | ~9 Days | Protected routes & user onboarding flow |
| **Phase 2** | **Core Chat Engine** | Two-panel UI, pagination, WS sockets, presence | ~15 Days | Real-time text sending & dynamic typing |
| **Phase 3** | **Feature Expansion** | Groups management, Cloudinary upload, search | ~12 Days | Rich-media sharing & Group controls |
| **Phase 4** | **Polish & Advanced** | Expiring status stories, push updates, admin panel | ~11 Days | Complete status decks & monitoring admin |
| **Phase 5** | **Hardening** | E2E Crypto, code tuning, PWAs, deployment | ~12 Days | High security & live production launch |
| **Total** | | | **~59 Days** | **Production-Ready Application** |

---

## Phase 1 — Foundation (Week 1-2, ~9 Days)

**Goal**: Establish the base codebase structure, configure database collections, set up authentication, and configure middleware access protection.

### Task Breakdown

| # | Task | Description | Est. Days | Deliverables | Dependencies |
|---|---|---|---|---|---|
| **1.1** | Project Setup & Configuration | Scaffold folder structure. Initialize TSConfig configurations, ESLint settings, and package manifests. Install core dependencies. | 1.5 | `package.json`, `tsconfig.json` | None |
| **1.2** | Design System & Tailwind Theme | Map WhatsApp design token colors inside global styles. Configure theme switcher setup (Light/Dark). | 1 | `globals.css`, `tailwind.config.ts` | 1.1 |
| **1.3** | MongoDB Connection | Create singleton database connection with connection pool caching suitable for serverless invocations. | 1.5 | `src/lib/db.ts` | 1.1 |
| **1.4** | Database Models | Define Mongoose models with required data indexes, validators, and timestamps (User, Conversation, ConversationMember, Message, Status, Notification). | 1.5 | `src/models/*` | 1.3 |
| **1.5** | Auth.js Setup | Integrate Google OAuth provider. Configure JWT strategy (stateless). Set up user creation callbacks. | 1.5 | `src/lib/auth.ts`, `src/lib/auth.config.ts` | 1.4 |
| **1.6** | Registration Email System | Build automatic email dispatcher using Resend. Dispatch user welcome HTML email and administrative alerts on first-time login. | 1 | `src/lib/mailer.ts`, `src/services/email.service.ts` | 1.5 |
| **1.7** | Middleware & Route Guards | Implement Next.js middleware checking JWT sessions and redirection logic for protected routes (/chat, /admin). | 0.5 | `src/middleware.ts` | 1.5 |
| **1.8** | Onboarding UI Pages | Create customized login card layouts and profile setup screens (name, username, telephone, avatar photo crop selector). | 1 | `src/app/(auth)/*` | 1.2, 1.7 |

### Phase 1 Milestone ✅
- Users can securely authenticate using their Google Account.
- Automated onboarding welcomes the user and reports registration stats to admins.
- Route protection guards main panels.

---

## Phase 2 — Core Chat Engine (Week 2-4, ~15 Days)

**Goal**: Implement the core chat interface, build serverless APIs, set up the standalone Socket.IO socket hub, and deliver real-time messaging.

### Task Breakdown

| # | Task | Description | Est. Days | Deliverables | Dependencies |
|---|---|---|---|---|---|
| **2.1** | Main App Layout | Code the dual-panel template layout supporting responsive screen adaptations (collapses to single active pane on mobile screens). | 1.5 | `src/app/(main)/layout.tsx` | Phase 1 |
| **2.2** | Chat Sidebar UI | Design list layouts displaying active conversations with last message previews, unread badges, and contact lists search overrides. | 2 | `src/components/sidebar/*` | 2.1 |
| **2.3** | Chat Window UI | Build chat feed layouts using virtualized scroll blocks (`react-window`) to optimize large logs. | 2 | `src/components/chat/ChatWindow.tsx` | 2.1 |
| **2.4** | Message Input Component | Create multi-line expanding inputs containing emoji triggers, file selector menus, and audio control bindings. | 1 | `src/components/chat/ChatInput.tsx` | 2.3 |
| **2.5** | Conversation CRUD APIs | Develop API endpoints creating and fetching chat threads. Sort user conversation lists by last activity. | 1.5 | `src/app/api/conversations/*` | Phase 1 |
| **2.6** | Message CRUD APIs | Design cursor-paginated endpoints fetching message histories. Add edit and soft-delete endpoints. | 1.5 | `src/app/api/messages/*` | 2.5 |
| **2.7** | Socket.IO Server Setup | Set up the standalone socket process running on port 3001. Write connection authentication middleware verifying session JWTs. | 1.5 | `server/index.ts` | Phase 1 |
| **2.8** | Real-time Messaging | Map web socket client events to dispatch incoming messages instantly to room sub-channels. Support optimistic UI inserts. | 2 | `server/socket/handlers/chatHandler.ts` | 2.6, 2.7 |
| **2.9** | Typing Indicators | Write key event tracking listeners sending typing events to room participants. Draw bouncing dot bubble indicator. | 1 | `src/hooks/useTypingIndicator.ts` | 2.8 |
| **2.10** | Online Presence | Manage active socket lists. Broadcast user online/offline status updates. Show green indicator dots on user profiles. | 1 | `server/socket/handlers/presenceHandler.ts` | 2.7 |

### Phase 2 Milestone ✅
- Real-time communication functioning.
- Instant delivery of text messages, active typing indicators, and user online presence dots.
- Scrolling window setups for chat rooms.

---

## Phase 3 — Feature Expansion (Week 4-6, ~12 Days)

**Goal**: Deliver group conversations, Cloudinary media sharing, text indexes search, and message receipt status ticks.

### Task Breakdown

| # | Task | Description | Est. Days | Deliverables | Dependencies |
|---|---|---|---|---|---|
| **3.1** | Group Chat Implementation | Write endpoints creating groups, managing administrators, and inviting members. Handle group event notifications. | 3 | `src/components/group/*` | Phase 2 |
| **3.2** | Media Upload & Sharing | Integrate Cloudinary media APIs. Implement image resizing and compression on the client side before upload. | 2.5 | `src/app/api/upload/*`, `src/hooks/useMediaUpload.ts` | Phase 2 |
| **3.3** | Message Search | Add full-text indexes to messages. Design search input dialog overlays to locate key terms inside messages. | 2 | `src/app/api/messages/search/*` | Phase 2 |
| **3.4** | Read Receipts Status | Implement delivery/read tracking. Send web socket ticks updating message delivery status (Sent, Delivered, Read). | 2 | `src/components/chat/MessageStatus.tsx` | 2.8 |
| **3.5** | Reply & Forward | Allow user swipe replies or menu actions. Render parent context bars inside chat bubbles. | 1.5 | `src/components/chat/ReplyPreview.tsx` | Phase 2 |
| **3.6** | Emoji Picker Integration | Include search-supported emoji selections grouped in layout panels. | 1 | `src/components/chat/EmojiPicker.tsx` | 2.4 |

### Phase 3 Milestone ✅
- Users can create groups, assign administrators, and share media.
- Cloudinary asset integration supports file transfers.
- Double-blue check marks track message visibility.

---

## Phase 4 — Polish & Advanced Features (Week 6-8, ~11 Days)

**Goal**: Add status updates, browser push notifications, custom theme support, administrative control dashboards, and voice notes.

### Task Breakdown

| # | Task | Description | Est. Days | Deliverables | Dependencies |
|---|---|---|---|---|---|
| **4.1** | Status / Stories Feed | Develop 24-hour expiring status logs (media/text). Map auto-cleanup TTL indices in MongoDB. | 3 | `src/components/status/*` | Phase 3 |
| **4.2** | Push Notifications | Bind browser Notification APIs. Request device notification permissions and play alert audio files. | 2 | `src/hooks/useNotification.ts`, service workers | Phase 2 |
| **4.3** | Dark/Light Custom Themes | Implement CSS variable styling configurations. Persist preferences in local storage. | 1 | `src/providers/ThemeProvider.tsx` | Phase 2 |
| **4.4** | Admin Moderation Dashboard | Create overview cards displaying system health. Build lists to search, flag, or restrict profiles. | 3 | `src/app/admin/*` | Phase 2 |
| **4.5** | Voice Message Recorder | Implement audio recording via `MediaRecorder` APIs. Show active audio waveform canvas. | 2 | `src/components/chat/VoiceRecorder.tsx` | 3.2 |

### Phase 4 Milestone ✅
- Users can upload statuses/stories.
- Native push notifications alert users of background messages.
- Admin dashboard gives operators data moderation tools.

---

## Phase 5 — Production Hardening (Week 8-10, ~12 Days)

**Goal**: Implement End-to-End Encryption, optimize page load speed, write tests, build PWA integrations, and deploy to live servers.

### Task Breakdown

| # | Task | Description | Est. Days | Deliverables | Dependencies |
|---|---|---|---|---|---|
| **5.1** | End-to-End Encryption | Configure asymmetric cryptosystems using browser Web Crypto APIs (AES-GCM-256 keys exchanging via ECDH). | 3.5 | `src/utils/encryption.ts` | Phase 4 |
| **5.2** | Performance Optimizations | Run bundle analyses. Build image lazy load boundaries. Optimize database index usage. | 2 | Optimized bundles | Phase 4 |
| **5.3** | Testing Suite Implementation | Write Jest unit test coverages and Playwright E2E browser automation scripts targeting 80% coverage. | 3 | `tests/*` | Phase 4 |
| **5.4** | PWA Manifest & Offline Sync | Configure Workbox service worker caching. Support offline database access caches and message send queuing. | 2.5 | `public/manifest.json` | 5.2 |
| **5.5** | Server Deployment | Deploy Next.js to Vercel and the Socket.IO process to Railway. Set up MongoDB Atlas staging/prod. | 1 | Production instances | 5.3 |

### Phase 5 Milestone ✅
- Communication secured with client-side E2E encryption.
- PWA manifest allows desktop app installs.
- Code validated through automated CI/CD checks.

---

## Risk Mitigation Matrix

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Socket Connection Scaling** | High | Integrate Redis socket adapters. Distribute websocket connections across auto-scaled container pods. |
| **Database Read Latency** | High | Apply indexes for primary filters. Implement Mongoose query projection rules. Denormalize unread message counts. |
| **Asset Storage Cost Overruns** | Medium | Implement client-side image compression resizing before uploads. Set file upload limits (e.g., 25MB max). |
| **Web Crypto Compatibilities** | Low | Implement polyfill libraries. Fallback to server-mediated transport encryption if API calls are unsupported. |
