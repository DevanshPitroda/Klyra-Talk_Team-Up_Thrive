# ChatApp API Specification

Version: **1.0.0** | Base URL: `/api` | Authentication: **Auth.js JWT Session Cookie**

---

## 1. Overview
All API routes (except authorization callback paths) require a valid authentication session.
- **Content-Type**: `application/json` (except `/api/upload` which expects `multipart/form-data`)
- **Headers**: Requester's identity is verified via encrypted HTTP-only session cookies.
- **Pagination**: Offset-based pagination for entity directories; Cursor-based pagination for messages.

## 2. Response Formats

### Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true,
    "nextCursor": "667f1a2b3c4d5e6f7a8b9c0d"
  }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request properties.",
    "details": {
      "field": "phone",
      "issue": "Invalid telephone number format."
    }
  }
}
```

### System Error Codes
- **`UNAUTHORIZED`** (401): Missing or expired session cookie.
- **`FORBIDDEN`** (403): User lacks permission to modify target entity.
- **`NOT_FOUND`** (404): Target resource does not exist.
- **`VALIDATION_ERROR`** (422): Input parameters failed schema parsing validation.
- **`DUPLICATE_ENTRY`** (409): Resource already exists.
- **`RATE_LIMITED`** (429): API request count exceeds threshold limits.

---

## 3. Auth API Endpoints

### NextAuth Handler
`* /api/auth/[...nextauth]`
- **Authentication**: Public
- **Description**: NextAuth internal routing (login, callback processing, session payload retrieval).

---

## 4. User API Endpoints

### Search User Directory
`GET /api/users`
- **Authentication**: Required
- **Query Params**:
  - `q` (string, required): Search query term matching email or name.
  - `page` (number, default: 1): Directory offset page.
  - `limit` (number, default: 20): Result size limit.
- **Response Data**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "667f1a2b3c4d5e6f7a8b9c0d",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "image": "https://res.cloudinary.com/...",
      "about": "Busy",
      "isOnline": true,
      "lastSeen": "2026-07-12T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "hasMore": false }
}
```

### Get Profile Details
`GET /api/users/:userId`
- **Authentication**: Required
- **Response Data**: Full user details object.

### Update Profile
`PATCH /api/users/:userId`
- **Authentication**: Required (Own user profile matches target `:userId`)
- **Request Body**:
```json
{
  "name": "Jane Updated",
  "about": "Available",
  "phone": "+1234567890",
  "image": "https://res.cloudinary.com/..."
}
```
- **Response Data**: Updated user record.

### Deactivate User
`DELETE /api/users/:userId`
- **Authentication**: Required (Own user profile matches target `:userId`)
- **Response Data**: Success acknowledgement message.

---

## 5. Conversation API Endpoints

### List Conversations
`GET /api/conversations`
- **Authentication**: Required
- **Query Params**:
  - `type` (string, optional): Filter results (`direct` or `group`).
  - `page` (number, default: 1): Directory page.
  - `limit` (number, default: 20): Result limit.
- **Response Data**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "conv_668fa...",
      "type": "direct",
      "unreadCount": 2,
      "members": [
        { "_id": "usr_1...", "name": "Jane Smith", "image": "..." }
      ],
      "lastMessage": {
        "body": "See you soon!",
        "senderId": "usr_1...",
        "createdAt": "2026-07-12T10:00:00.000Z"
      },
      "updatedAt": "2026-07-12T10:00:00.000Z"
    }
  ]
}
```

### Create Conversation
`POST /api/conversations`
- **Authentication**: Required
- **Request Body**:
```json
{
  "type": "group",
  "participants": ["usr_1...", "usr_2..."],
  "name": "Development Team",
  "image": "https://res.cloudinary.com/...",
  "description": "App planning group"
}
```
- **Response Data**: Created conversation database object.

### Mark Conversation As Read
`POST /api/conversations/:conversationId/read`
- **Authentication**: Required (Must be member of conversation)
- **Response Data**: Resets user's unread count badge to `0`.

### Add Members to Group
`POST /api/conversations/:conversationId/members`
- **Authentication**: Required (Must be Group Admin)
- **Request Body**:
```json
{
  "userIds": ["usr_99..."]
}
```
- **Response Data**: Success acknowledgement. Generates group system message.

### Remove Member from Group
`DELETE /api/conversations/:conversationId/members`
- **Authentication**: Required (Must be Group Admin)
- **Request Body**:
```json
{
  "userId": "usr_99..."
}
```
- **Response Data**: Success acknowledgement.

---

## 6. Message API Endpoints

### Get Conversation Messages
`GET /api/conversations/:conversationId/messages`
- **Authentication**: Required (Must be member of conversation)
- **Query Params**:
  - `cursor` (string, optional): Message ID indicating threshold.
  - `limit` (number, default: 50): Page result limit.
- **Response Data**: List of messages older than the `cursor` timestamp.

### Send Message
`POST /api/conversations/:conversationId/messages`
- **Authentication**: Required (Must be member of conversation)
- **Request Body**:
```json
{
  "body": "Check out this document",
  "type": "file",
  "attachments": [
    {
      "url": "https://res.cloudinary.com/...",
      "filename": "specification.pdf",
      "size": 1048576,
      "mimeType": "application/pdf"
    }
  ],
  "replyToId": "msg_88..."
}
```
- **Response Data**: Saved message record. Broadcasts `message:receive` via socket.

### Edit Message
`PATCH /api/messages/:messageId`
- **Authentication**: Required (Must be sender of the message)
- **Request Body**:
```json
{
  "body": "Fixed typo here."
}
```
- **Response Data**: Updated message object.

### Delete Message
`DELETE /api/messages/:messageId`
- **Authentication**: Required (Must be sender of the message)
- **Query Params**:
  - `forEveryone` (boolean, default: true)
- **Response Data**: Flags message as soft-deleted.

---

## 7. Media API Endpoints

### Upload Media Asset
`POST /api/upload`
- **Authentication**: Required
- **Request Payload**: `multipart/form-data` containing `file` element and `type` parameter (image/video/audio/file).
- **Response Data**:
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "filename": "photo.jpg",
    "size": 204800,
    "mimeType": "image/jpeg",
    "publicId": "chatapp/abc123"
  }
}
```

---

## 8. Socket.IO Event Mappings

Websocket operations run on a separate port (`3001`). JWT session tokens are required during connection handshakes.

### Client-to-Server Event Emits

- **`message:send`**: Sends new messages to conversation rooms.
  - *Payload*: `{ conversationId: string, body?: string, type: string, attachments?: Attachment[], replyToId?: string }`
- **`message:delivered`**: Updates delivery ticks for a message.
  - *Payload*: `{ messageId: string, conversationId: string }`
- **`message:read`**: Triggers blue tick marks for read logs.
  - *Payload*: `{ conversationId: string, messageId: string }`
- **`message:typing`**: Updates participant typing indicator bubbles.
  - *Payload*: `{ conversationId: string, isTyping: boolean }`
- **`conversation:join` / `conversation:leave`**: Connects/disconnects client sockets to room channels.
  - *Payload*: `{ conversationId: string }`

### Server-to-Client Broadcast Events

- **`message:receive`**: Delivers active message alerts to room members.
  - *Payload*: `{ message: Message, conversationId: string }`
- **`message:updated`**: Signals edits made to messages.
  - *Payload*: `{ messageId: string, body: string, editedAt: string }`
- **`message:deleted`**: Signals soft-deletion updates of message contents.
  - *Payload*: `{ messageId: string, conversationId: string }`
- **`message:delivered:ack` / `message:read:ack`**: Confirms recipient receipt.
  - *Payload*: `{ messageId: string, userId: string, timestamp: string }`
- **`user:typing`**: Signals client typing activities.
  - *Payload*: `{ conversationId: string, userId: string, isTyping: boolean }`
- **`user:status`**: Broadcasts online status updates.
  - *Payload*: `{ userId: string, isOnline: boolean, lastSeen: string }`
