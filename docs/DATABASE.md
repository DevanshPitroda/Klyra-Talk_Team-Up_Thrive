# ChatApp Database Design Specification

Database Instance: **MongoDB** | Modeling Layer: **Mongoose ODM**

---

## 1. Entity-Relationship Diagram (ERD)

```
       ┌──────────────┐             ┌──────────────┐
       │     User     │1           *│ Notification │
       └──────┬───────┘             └──────────────┘
              │1
              ├─────────────────────────────────────┐
              │1                                    │1
       ┌──────▼──────────────┐               ┌──────▼──────────────┐
       │ ConversationMember  │*              │       Status        │*
       └──────▲──────────────┘               └─────────────────────┘
              │*
              │1
       ┌──────┴──────────────┐
       │    Conversation     │1
       └──────▲──────────────┘
              │1
              │*
       ┌──────┴──────────────┐
       │       Message       │*
       └─────────────────────┘
```

- **`User`** connects to **`ConversationMember`** (1-to-many relationship mapping conversations).
- **`Conversation`** contains multiple **`ConversationMember`** mappings and multiple **`Message`** logs.
- **`Message`** belongs to a **`Conversation`** and has an optional `replyToId` linking to a parent **`Message`** (self-referencing).
- **`User`** creates **`Status`** entries (expiring in 24 hours) and receives **`Notification`** instances.

---

## 2. Collection Schemas

### 2.1 `users` Collection
Tracks user profiles, authentication metadata, and online status.

| Field Name | Type | Required | Default | Indexes | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary Key | Standard unique identifier |
| `name` | `String` | Yes | — | Text | User's display name |
| `email` | `String` | Yes | — | Unique, Text | Google account email address |
| `image` | `String` | No | `null` | — | Cloudinary profile image link |
| `about` | `String` | No | `"Hey! I am using ChatApp"` | — | Custom user bio message |
| `phone` | `String` | No | `null` | Unique (Sparse) | Optional phone number |
| `role` | `String` | Yes | `"user"` | Secondary | System access level (`user` or `admin`) |
| `isOnline` | `Boolean` | Yes | `false` | Secondary | Active socket status |
| `lastSeen` | `Date` | No | `null` | — | Timestamp of last socket disconnect |
| `isBanned` | `Boolean` | Yes | `false` | Secondary | Ban status set by admins |
| `emailVerified`| `Date` | No | `null` | — | Verification confirmation time |

---

### 2.2 `conversations` Collection
Stores chat threads. Contains denormalized fields to optimize sidebar loading speeds.

| Field Name | Type | Required | Default | Indexes | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary Key | — |
| `type` | `String` | Yes | — | Secondary | Chat mode (`direct` or `group`) |
| `name` | `String` | No | `null` | — | Group name (ignored for direct chats) |
| `image` | `String` | No | `null` | — | Group profile image (Cloudinary link) |
| `description` | `String` | No | `null` | — | Group bio (max 512 characters) |
| `createdBy` | `ObjectId` | Yes | — | — | Creator's user ID |
| `lastMessageId`| `ObjectId` | No | `null` | — | Denormalized ID of the last sent message |
| `lastMessageAt`| `Date` | No | `null` | Compound | Denormalized timestamp of the last message |
| `isArchived` | `Boolean` | Yes | `false` | — | Archives group (soft-delete) |

---

### 2.3 `conversation_members` Collection
A join table linking users to conversations, tracking unread messages and settings.

| Field Name | Type | Required | Default | Indexes | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary Key | — |
| `conversationId`| `ObjectId`| Yes | — | Compound | Link to conversation |
| `userId` | `ObjectId` | Yes | — | Compound | Link to user profile |
| `role` | `String` | Yes | `"member"` | — | Group hierarchy (`member`, `admin`, `owner`) |
| `joinedAt` | `Date` | Yes | `now` | — | Membership join time |
| `lastReadAt` | `Date` | No | `null` | — | Cursor to compute unread notifications |
| `isMuted` | `Boolean` | Yes | `false` | — | Mutes notification dispatches |
| `isArchived` | `Boolean` | Yes | `false` | Compound | Hides conversation from active dashboard |
| `unreadCount` | `Number` | Yes | `0` | — | Denormalized unread count preview |

- *Compound Unique Index*: `{ conversationId: 1, userId: 1 }`
- *Compound Query Index*: `{ userId: 1, isArchived: 1 }`

---

### 2.4 `messages` Collection
Stores chat messages. Includes media details, delivery statuses, and read receipts.

| Field Name | Type | Required | Default | Indexes | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary Key | — |
| `conversationId`| `ObjectId`| Yes | — | Compound | Target chat room |
| `senderId` | `ObjectId` | Yes | — | Secondary | Sender's user ID |
| `body` | `String` | No | `null` | Text | Text body (ignored for attachments) |
| `type` | `String` | Yes | `"text"` | — | Mode (`text`, `image`, `video`, `audio`, `file`, `system`) |
| `attachments` | `Array` | No | `[]` | — | List of maps: `{ url, filename, size, mimeType }` |
| `replyToId` | `ObjectId` | No | `null` | — | Links to a parent reply message ID |
| `seenBy` | `Array` | Yes | `[]` | — | Read receipts tracker list: `[{ userId, seenAt }]` |
| `deliveredTo` | `Array` | Yes | `[]` | — | Delivery receipt list: `[{ userId, deliveredAt }]` |
| `isEdited` | `Boolean` | Yes | `false` | — | Flag showing if message was updated |
| `editedAt` | `Date` | No | `null` | — | Timestamp of message edit |
| `isDeleted` | `Boolean` | Yes | `false` | — | Soft-delete flag |

- *Compound Query Index*: `{ conversationId: 1, createdAt: -1 }` (for pagination)

---

### 2.5 `statuses` Collection
Manages status stories that expire after 24 hours.

| Field Name | Type | Required | Default | Indexes | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary Key | — |
| `userId` | `ObjectId` | Yes | — | Secondary | Author's user ID |
| `type` | `String` | Yes | — | — | Status type (`text`, `image`, `video`) |
| `content` | `String` | No | `null` | — | Text story content or caption |
| `backgroundColor`| `String`| No | `null` | — | Hex styling for text stories |
| `mediaUrl` | `String` | No | `null` | — | Cloudinary image/video link |
| `viewedBy` | `Array` | Yes | `[]` | — | Status views tracker: `[{ userId, viewedAt }]` |
| `expiresAt` | `Date` | Yes | — | TTL Index | Expiration time (created time + 24 hours) |

- *TTL Index configuration*: `{ expiresAt: 1 }` with `expireAfterSeconds: 0`.

---

### 2.6 `notifications` Collection
Tracks user notifications. Includes a TTL index that automatically deletes entries after 30 days.

| Field Name | Type | Required | Default | Indexes | Description |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary Key | — |
| `userId` | `ObjectId` | Yes | — | Compound | Recipient's user ID |
| `type` | `String` | Yes | — | — | Type (`message`, `group_invite`, `mention`, `system`) |
| `title` | `String` | Yes | — | — | Notification title |
| `body` | `String` | Yes | — | — | Message content details preview |
| `referenceId` | `ObjectId` | No | `null` | — | Associated conversation or message ID |
| `isRead` | `Boolean` | Yes | `false` | Compound | Mark read flag |
| `createdAt` | `Date` | Yes | `now` | TTL Index | Creation timestamp |

- *TTL Index configuration*: `{ createdAt: 1 }` with `expireAfterSeconds: 2592000` (30 days).

---

## 3. Indexing Strategy

| Collection | Index Fields | Type | Purpose |
|---|---|---|---|
| **`users`** | `{ email: 1 }` | Unique | User lookup during Google authentication logins |
| **`users`** | `{ name: "text", email: "text" }` | Text | Global user search query filtering |
| **`conversations`**| `{ lastMessageAt: -1 }` | Standard | Sorts active chat threads on the user sidebar |
| **`conversation_members`**| `{ conversationId: 1, userId: 1 }` | Unique Compound | Fast membership checks |
| **`conversation_members`**| `{ userId: 1, isArchived: 1 }` | Compound | Loads a user's active chats sidebar |
| **`messages`** | `{ conversationId: 1, createdAt: -1 }` | Compound | Paginated message logs fetching |
| **`messages`** | `{ body: "text" }` | Text | Full-text message history search queries |
| **`statuses`** | `{ expiresAt: 1 }` | TTL | Auto-deletes status stories after 24 hours |
| **`notifications`**| `{ userId: 1, isRead: 1, createdAt: -1 }`| Compound | Displays unread notification banners |
| **`notifications`**| `{ createdAt: 1 }` | TTL | Auto-deletes old notifications after 30 days |

---

## 4. Denormalization Optimizations
To support scales with minimal compute query constraints, we apply denormalization:

- **`conversations.lastMessageId`**: Caches the ID of the last sent message. This avoids complex lookup joins when rendering the chat sidebar preview.
- **`conversations.lastMessageAt`**: Caches the timestamp of the last message to allow fast sorting of chat feeds.
- **`conversation_members.unreadCount`**: Caches unread message counts. This avoids running `count` queries across thousands of documents every time the sidebar loads.
