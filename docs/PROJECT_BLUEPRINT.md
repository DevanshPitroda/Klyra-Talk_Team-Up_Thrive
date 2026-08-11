# ChatApp — Project Blueprint

## 1. Project Overview
- **App Name**: ChatApp
- **Description**: A production-ready, WhatsApp-inspired real-time chat application.
- **Core Goals**: Real-time messaging, group chats, media sharing, status updates, and admin management.
- **Target Audience**: Teams, communities, and personal use.

## 2. Tech Stack

| Technology | Version | Category | Purpose |
|---|---|---|---|
| **Next.js** | 16.2.10 | Framework | React framework with App Router, SSR, API routes |
| **React** | 19.2.4 | UI Library | Component-based user interface |
| **TypeScript** | ^5 | Language | Static typing and compile-time checks |
| **Tailwind CSS** | ^4 | Styling | Utility-first CSS framework |
| **MongoDB** | latest | Database | NoSQL document-based database |
| **Mongoose** | latest | ODM | MongoDB object modeling for Node.js |
| **Auth.js (NextAuth)** | v5 beta | Authentication | Google OAuth provider, stateless JWT sessions |
| **Socket.IO** | ^4 | Real-time | Bidirectional event-based communication |
| **Cloudinary** | latest | Storage | Cloud media storage for image/video/file uploads |
| **Resend** | latest | Email | Transactional email delivery service |
| **Zustand** | ^4 | State | Client-side global state management |
| **Zod** | ^3 | Validation | Schema validation for API inputs and configuration |
| **clsx + tailwind-merge** | latest | Utility | Dynamically merging Tailwind CSS classes |
| **Lucide React** | latest | Icons | Clean icon library for UI consistency |
| **react-window** | latest | Performance | Virtual scrolling list for large message sets |
| **Jest** | latest | Testing | Unit and integration testing |
| **Playwright** | latest | Testing | End-to-end user flow testing |
| **ESLint** | ^9 | Linting | Static code analysis |

## 3. Architecture Overview
The application consists of a hybrid Server/Client structure optimized for Next.js App Router and real-time Socket.IO communication:

- **Client Layer**: Next.js App Router (React Server Components for static parts + Hydrated Client Components for interactive sections like the chat engine).
- **API Layer**: Next.js Route Handlers acting as REST endpoints. They route request validation via Zod schemas down to the business logic Services Layer.
- **Real-time Layer**: A dedicated Node.js server running Socket.IO on its own port (3001) that holds web socket sessions.
- **Data Layer**: MongoDB Atlas containing 6 collections with schema modeling verified through Mongoose.
- **Auth Layer**: Auth.js handling Google OAuth flow and setting stateless HTTP-only JWT cookies.
- **Storage Layer**: Media upload via Direct Cloudinary APIs.
- **Email Layer**: Transactional registration alerts dispatched via Resend SDK.

### System Architecture Diagram
```
Client (Browser)
  │
  ├── REST API (Next.js Route Handlers, port 3000)
  │     └── Services Layer → MongoDB Atlas
  │                          ├── Cloudinary (media storage)
  │                          └── Resend (registration emails)
  │
  └── Socket.IO Client → Socket.IO Server (port 3001)
                             └── MongoDB Atlas (tracks user status/messages)
```

## 4. Complete Folder Structure

```
chat-app/
├── .env.local                        # Environment variables (local dev secrets, git-ignored)
├── .env.example                      # Template for env vars
├── next.config.ts                    # Next.js configurations
├── tailwind.config.ts                # Tailwind design tokens config
├── tsconfig.json                     # TypeScript compiler configuration
├── package.json                      # Scripts and dependencies
├── postcss.config.mjs                # PostCSS utility config
├── eslint.config.mjs                 # ESLint settings
│
├── docs/                             # Architecture specifications and documentation
│   ├── PROJECT_BLUEPRINT.md          # Project specifications and architecture blueprint
│   ├── ROADMAP.md                    # Development timeline and milestones
│   ├── API_SPEC.md                   # REST and Socket.IO API specification
│   ├── DATABASE.md                   # Database collection schemas and query index patterns
│   ├── UI_GUIDE.md                   # Design guidelines, colors, layouts and UI assets catalog
│   └── FEATURES.md                   # Complete functional requirement documentation
│
├── public/
│   ├── icons/                        # Web manifest icons (PWA icons)
│   ├── sounds/                       # Notification click/receive audio clips
│   └── images/                       # Application logos, default user avatars
│
├── src/
│   ├── app/                          # Next.js App Router root
│   │   ├── layout.tsx                # Root layout supplying providers, fonts, and base HTML metadata
│   │   ├── page.tsx                  # Home router/redirection handler to login or main dashboard
│   │   ├── globals.css               # Base Tailwind CSS styles and dynamic color tokens
│   │   │
│   │   ├── (auth)/                   # Authentication route group (no URL prefix)
│   │   │   ├── layout.tsx            # Centered grid container layout for auth screens
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login component featuring Google OAuth sign-in trigger
│   │   │   └── register/
│   │   │       └── page.tsx          # Profile setup page for first-time registrants
│   │   │
│   │   ├── (main)/                   # Core authenticated app route group
│   │   │   ├── layout.tsx            # Responsive two-panel workspace containing Sidebar + active chat window
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx          # Sidebar container with fallback empty chat state for desktop view
│   │   │   │   └── [conversationId]/
│   │   │   │       └── page.tsx      # Main panel focused on an individual active chat thread
│   │   │   ├── groups/
│   │   │   │   ├── page.tsx          # List of user groups and group creation buttons
│   │   │   │   └── [groupId]/
│   │   │   │       └── page.tsx      # Active group chat view
│   │   │   ├── contacts/
│   │   │   │   └── page.tsx          # Comprehensive directory list for searching new contacts
│   │   │   ├── profile/
│   │   │   │   └── page.tsx          # User page allowing profile picture, name, and bio modifications
│   │   │   ├── settings/
│   │   │   │   └── page.tsx          # Settings panel for managing themes, notifications, and block lists
│   │   │   └── status/
│   │   │       └── page.tsx          # Statuses/stories board displaying active feeds
│   │   │
│   │   ├── admin/                    # Admin Dashboard route group
│   │   │   ├── layout.tsx            # Protected panel navigation layout for admin views
│   │   │   ├── page.tsx              # Overview analytics hub displaying user activity stats
│   │   │   ├── users/
│   │   │   │   └── page.tsx          # User management and authorization/ban matrix data table
│   │   │   └── reports/
│   │   │       └── page.tsx          # Moderator view reviewing reported content
│   │   │
│   │   └── api/                      # Next.js Server API endpoints
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts      # Auth.js core configuration catch-all route handler
│   │       ├── users/
│   │       │   ├── route.ts          # REST endpoints for searching directories or creation
│   │       │   ├── [userId]/
│   │       │   │   └── route.ts      # Profile updating, fetching, or account deactivation endpoint
│   │       │   └── online/
│   │       │       └── route.ts      # Fetching live lists of active users
│   │       ├── conversations/
│   │       │   ├── route.ts          # Fetching active conversation previews or initiating chats
│   │       │   └── [conversationId]/
│   │       │       ├── route.ts      # Customizing group description, name or exiting
│   │       │       ├── messages/
│   │       │       │   └── route.ts  # Cursor-paginated message logs loading or adding messages
│   │       │       ├── read/
│   │       │       │   └── route.ts  # Sending read cursor ticks across conversation messages
│   │       │       └── members/
│   │       │           └── route.ts  # Management endpoint to add or kick members
│   │       ├── messages/
│   │       │   ├── [messageId]/
│   │       │   │   └── route.ts      # Editing own messages or soft-deleting messages
│   │       │   └── search/
│   │       │       └── route.ts      # Searching user message records across conversations
│   │       ├── upload/
│   │       │   └── route.ts          # Proxied media storage file uploading endpoint
│   │       ├── notifications/
│   │       │   └── route.ts          # Managing user push notification preferences
│   │       └── admin/
│   │           ├── users/
│   │           │   └── route.ts      # Admin-level ban, role settings configuration route
│   │           └── stats/
│   │               └── route.ts      # System-wide metrics fetch endpoint
│   │
│   ├── components/                   # UI Elements
│   │   ├── ui/                       # Primitive base style objects
│   │   │   ├── Avatar.tsx            # Profile picture block with online dot indicator
│   │   │   ├── Badge.tsx             # Unread count label component
│   │   │   ├── Button.tsx            # Styled variant button with loading state support
│   │   │   ├── Dialog.tsx            # Access-guarded overlay confirmations
│   │   │   ├── Dropdown.tsx          # Utility action drawer triggers
│   │   │   ├── Input.tsx             # Base input containing icon alignment support
│   │   │   ├── Modal.tsx             # Blur-backdrop overlay window
│   │   │   ├── Skeleton.tsx          # UI loading shape indicators
│   │   │   ├── Spinner.tsx           # Progress spin loop
│   │   │   ├── Toast.tsx             # Feedback notification message blocks
│   │   │   └── Tooltip.tsx           # Floating info popups
│   │   │
│   │   ├── chat/                     # Chat-related elements
│   │   │   ├── ChatBubble.tsx        # Message rendering with styling by author (sent/received)
│   │   │   ├── ChatHeader.tsx        # Top status and control actions pane of the chat frame
│   │   │   ├── ChatInput.tsx         # Expanding message compiler with Emoji/Attachment selectors
│   │   │   ├── ChatList.tsx          # Main scroll wrapper for previews of conversations
│   │   │   ├── ChatListItem.tsx      # Individual preview row in the sidebar listing
│   │   │   ├── ChatWindow.tsx        # Wrapper connecting header, message log, and input window
│   │   │   ├── EmojiPicker.tsx       # Search-capable and category-mapped emoji collection grid
│   │   │   ├── MediaPreview.tsx      # Lightbox view for previewing image and video attachments
│   │   │   ├── MessageStatus.tsx     # Double blue/grey check marks representing message tracking
│   │   │   ├── ReplyPreview.tsx      # Input layout rendering selected parent replies
│   │   │   ├── TypingIndicator.tsx   # Live typing bouncing-dots element
│   │   │   ├── VoiceRecorder.tsx     # Waveform audio capturing tool
│   │   │   └── DateDivider.tsx       # Date headers ("Today", "Yesterday")
│   │   │
│   │   ├── sidebar/                  # Sidebar navigation elements
│   │   │   ├── Sidebar.tsx           # Base left container managing settings and tabs
│   │   │   ├── SidebarHeader.tsx     # Top profile shortcut pane and quick search filter
│   │   │   ├── SidebarTabs.tsx       # Tab selectors for changing views (Chats/Groups/Status)
│   │   │   └── ContactSearch.tsx     # User discovery popup overlay
│   │   │
│   │   ├── group/                    # Group elements
│   │   │   ├── CreateGroupModal.tsx  # Form wizard modal creating group instances
│   │   │   ├── GroupInfo.tsx         # Detail sidebar listing group data, media, and description
│   │   │   ├── GroupMemberList.tsx   # Role lists managing admins and group membership
│   │   │   └── AddMembersModal.tsx   # Selection wizard for adding new members
│   │   │
│   │   ├── profile/                  # User profile elements
│   │   │   ├── ProfileCard.tsx       # View card showing other users' stats
│   │   │   ├── ProfileEditor.tsx     # Form for updating user profile fields
│   │   │   └── AvatarUpload.tsx      # Image uploading with basic crop helper
│   │   │
│   │   ├── status/                   # Status elements
│   │   │   ├── StatusRing.tsx        # Colorful status ring border wrapper
│   │   │   ├── StatusViewer.tsx      # Multi-segment story layout viewer
│   │   │   └── CreateStatus.tsx      # Media upload or text status creator
│   │   │
│   │   └── shared/                   # Shared system utilities
│   │       ├── Header.tsx            # Global headers
│   │       ├── EmptyState.tsx        # Missing resource screen indicator
│   │       ├── ErrorBoundary.tsx     # Layout boundary error isolation fallback
│   │       └── OnlineIndicator.tsx   # Core status green light dot
│   │
│   ├── hooks/                        # Custom React state hooks
│   │   ├── useSocket.ts              # Socket connection tracker
│   │   ├── useChat.ts                # Message sending actions wrapper
│   │   ├── useConversations.ts       # Live updates to conversation listings
│   │   ├── useMessages.ts            # Cursor-paginated message buffer manager
│   │   ├── useOnlineStatus.ts        # Dynamic online status visual tracker
│   │   ├── useTypingIndicator.ts     # Debounced keystroke typing event emitter
│   │   ├── useNotification.ts        # Interface hook for system push notifications
│   │   ├── useMediaUpload.ts         # Multi-part file upload hook
│   │   ├── useDebounce.ts            # Input optimization debounce hook
│   │   └── useInfiniteScroll.ts      # IntersectionObserver window scroll trigger
│   │
│   ├── lib/                          # Framework configuration wrappers
│   │   ├── auth.ts                   # Auth.js callbacks, hooks and handlers setup
│   │   ├── auth.config.ts            # Google OAuth configuration setup
│   │   ├── db.ts                     # Database connection caching wrapper
│   │   ├── socket.ts                 # Socket client instance wrapper
│   │   ├── cloudinary.ts             # Cloudinary asset storage config
│   │   ├── mailer.ts                 # Resend/Nodemailer connection setup
│   │   ├── email-templates/          # HTML formatting templates
│   │   │   ├── welcome.ts            # User onboarding welcoming layout template
│   │   │   ├── registration-admin.ts # Notification email template for administrators
│   │   │   └── registration-user.ts  # Generic user email template
│   │   └── validators.ts             # Custom validation mappings (Zod schemas)
│   │
│   ├── models/                       # Database collection layouts (Mongoose schemas)
│   │   ├── User.ts                   # User profiles layout schema
│   │   ├── Conversation.ts           # Shared conversations details structure schema
│   │   ├── ConversationMember.ts     # User-to-conversation metadata link schema
│   │   ├── Message.ts                # Messages containing content and status schema
│   │   ├── Notification.ts           # Actionable notifications tracking schema
│   │   └── Status.ts                 # Expiring statuses model configuration
│   │
│   ├── services/                     # Business logic layers (Mongoose operations)
│   │   ├── user.service.ts           # Operations on user profiles
│   │   ├── conversation.service.ts   # Operations on conversation updates
│   │   ├── message.service.ts        # Fetching, saving, and updating messages
│   │   ├── notification.service.ts   # Creating notifications
│   │   ├── email.service.ts          # Mail sending triggers
│   │   └── upload.service.ts         # Image uploads proxy
│   │
│   ├── store/                        # Global Client state handlers (Zustand)
│   │   ├── useAuthStore.ts           # Access sessions, profile cache
│   │   ├── useChatStore.ts           # Active conversation logs, threads
│   │   ├── useSocketStore.ts         # Socket.IO connection status
│   │   └── useUIStore.ts             # Nav panels, modals, themes
│   │
│   ├── providers/                    # React layout wrapper hooks
│   │   ├── AuthProvider.tsx          # NextAuth session configuration provider
│   │   ├── SocketProvider.tsx        # Event-binding context for websocket operations
│   │   ├── ThemeProvider.tsx         # Dark/Light CSS context provider
│   │   └── ToastProvider.tsx         # Layout system to trigger alert banners
│   │
│   ├── types/                        # Types and interfaces definitions
│   │   ├── index.ts                  # Shared entry point for types
│   │   ├── user.ts                   # User and profile models mapping
│   │   ├── message.ts                # Message content layout profiles
│   │   ├── conversation.ts           # Group parameters mappings
│   │   ├── socket.ts                 # Type checks for WS payloads
│   │   └── api.ts                    # REST Request and Response interfaces
│   │
│   ├── utils/                        # Base utility collections
│   │   ├── cn.ts                     # Layout class merger (clsx + tailwind-merge)
│   │   ├── formatDate.ts             # Human-readable timestamp utility
│   │   ├── formatFileSize.ts         # File size label parser
│   │   ├── encryption.ts             # AES E2E cryptographic functions
│   │   ├── linkParser.ts             # Regex parser for URL strings
│   │   └── constants.ts              # Global environment properties
│   │
│   └── middleware.ts                 # Next.js authentication middleware route guards
│
├── server/                           # Custom Socket.IO real-time server
│   ├── index.ts                      # Standalone Node server running on port 3001
│   ├── socket/
│   │   ├── handlers/                 # Message listeners
│   │   │   ├── chatHandler.ts        # Send, read, typing events logic
│   │   │   ├── presenceHandler.ts    # User online tracking events
│   │   │   ├── groupHandler.ts       # Room changes for groups
│   │   │   └── notificationHandler.ts# Instantly forwarding notifications
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts     # JWT session verification on socket connect
│   │   └── events.ts                 # String constants for WS events
│   └── utils/
│       └── onlineUsers.ts            # Active socket mapper helper
│
└── tests/                            # Quality assurance testing folder
    ├── unit/                         # Unit tests
    ├── integration/                  # Integration tests
    └── e2e/                          # End-to-end user tests
```

## 5. Environment Variables
To get the application up and running, you need to configure the following environment variables in `.env.local` for development:

```env
# Client & Server Base URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# MongoDB Atlas URI
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/chatapp?retryWrites=true&w=majority

# NextAuth.js Configuration
AUTH_SECRET=9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p3q2r1s0t  # Generate with: openssl rand -base64 32
AUTH_GOOGLE_ID=google-client-id-here
AUTH_GOOGLE_SECRET=google-client-secret-here

# Cloudinary CDN Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Resend Transactional Mail Service API key
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@chatapp.com
ADMIN_EMAIL=admin@chatapp.com

# Standalone Socket Server Settings
SOCKET_PORT=3001
```

## 6. Development Workflow and Scripts

- **`npm run dev`**: Starts Next.js development server at [http://localhost:3000](http://localhost:3000).
- **`npm run socket:dev`**: Launches the Socket.IO event handler server at port `3001` with hot-reloading.
- **`npm run build`**: Assembles the optimized Next.js app bundle.
- **`npm run start`**: Fires the compiled Next.js build.
- **`npm run lint`**: Analyzes directories using ESLint.
- **`npm run test`**: Runs unit tests via Jest.
- **`npm run test:e2e`**: Performs browser simulations using Playwright.
