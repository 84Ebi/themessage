# Architecture Overview

## Anonymous Encrypted Message Web App

A privacy-first Next.js application using Appwrite backend with client-side encryption for zero-knowledge architecture.

---

## Core Architecture Decisions

### 1. Zero-Knowledge Encryption (Client-Side)

**Decision**: All encryption/decryption happens in the browser using Web Crypto API.

**Implementation**:
- Password never sent to server
- Message encrypted client-side before transmission
- Password hash (SHA-256) sent for verification only
- Decryption requires password re-entry on viewer page

**Benefits**:
- True privacy - server never sees plaintext passwords
- No password storage vulnerabilities
- User maintains complete control

**Trade-offs**:
- Cannot implement "forgot password"
- Slightly more complex client code

---

### 2. Separate Admin Links (Option C)

**Decision**: Generate unique admin URL with embedded token for creator operations.

**Implementation**:
- Each message has cryptographically secure `adminToken` (32-byte random)
- Admin URL: `/admin/[messageId]?token=...`
- Required for viewing responses and destroying messages
- Stored in localStorage for convenience

**Benefits**:
- No authentication system needed
- Shareable admin link (if creator chooses)
- Secure token-based authorization

**Trade-offs**:
- If admin URL lost, cannot access responses
- Token in URL visible in browser history

---

### 3. Appwrite as Backend

**Decision**: Use Appwrite Cloud for database and document storage.

**Implementation**:
- Two collections: `messages` and `responses`
- Client SDK for reads (public access)
- Server SDK for writes/deletes (admin operations)
- API Key secured in environment variables

**Benefits**:
- Managed infrastructure
- Real-time capabilities (future feature)
- Easy document-based storage
- Built-in security rules

**Trade-offs**:
- External dependency
- Cold-start latency possible
- Less control than custom DB

---

### 4. Message Size & Expiration

**Limits**:
- Max message size: 2MB (enforced client & server)
- Auto-expiration: 30 days from creation
- No message editing (immutable)

**Rationale**:
- 2MB accommodates lengthy text content
- 30-day expiration prevents indefinite storage
- Immutability ensures message integrity

---

## Data Flow

### Message Creation Flow

```
User (Browser)
  ↓
1. Enter message + optional password
  ↓
2. [Client] Encrypt message with password (if set)
  ↓
3. [Client] Hash password (SHA-256)
  ↓
4. POST /api/messages
  {
    message: "encrypted_base64_data" or "plaintext",
    password: "sha256_hash" or null,
    allowResponse: boolean
  }
  ↓
5. [Server] Generate messageId (nanoid)
  ↓
6. [Server] Generate adminToken (nanoid 32)
  ↓
7. [Server] Store in Appwrite
  {
    $id: messageId,
    content: message,
    passwordHash: hash or null,
    adminToken: token,
    allowResponse: boolean,
    createdAt: timestamp,
    expiresAt: timestamp + 30 days
  }
  ↓
8. [Server] Return URLs
  {
    messageUrl: "/m/[messageId]",
    adminUrl: "/admin/[messageId]?token=[adminToken]"
  }
  ↓
9. [Client] Store adminToken in localStorage
  ↓
10. Redirect to success page
```

---

### Message Viewing Flow

```
User opens /m/[messageId]
  ↓
1. GET /api/messages/[messageId]
  ↓
2. [Server] Fetch from Appwrite
  ↓
3. Return public data
  {
    messageId,
    content: encrypted or plain,
    isEncrypted: boolean,
    allowResponse: boolean
  }
  ↓
4. [Client] If isEncrypted:
     - Prompt for password
     - Decrypt client-side using Web Crypto API
     - Display decrypted message
   Else:
     - Display message directly
  ↓
5. [Client] Show "Destroy Message" button
  ↓
6. [Client] If allowResponse, show response input
```

---

### Message Destruction Flow

```
User clicks "Destroy Message"
  ↓
1. Confirm destruction (irreversible)
  ↓
2. POST /api/messages/[id]/destroy
   Body: { adminToken }
  ↓
3. [Server] Verify adminToken matches message.adminToken
  ↓
4. [Server] Delete all responses (messageId query)
  ↓
5. [Server] Delete message document
  ↓
6. Message link becomes invalid (404)
```

---

### Response Submission Flow

```
User (viewer) submits response
  ↓
1. POST /api/messages/[id]/responses
   Body: { content }
  ↓
2. [Server] Verify message.allowResponse === true
  ↓
3. [Server] Store response
  {
    $id: unique,
    messageId: id,
    content: content,
    createdAt: timestamp
  }
  ↓
4. Return success
```

---

### Response Viewing Flow (Admin)

```
Creator opens /admin/[id]?token=...
  ↓
1. GET /api/messages/[id]/responses?adminToken=...
  ↓
2. [Server] Verify adminToken
  ↓
3. [Server] Query responses where messageId = id
  ↓
4. Return array of responses
  [
    { id, content, createdAt },
    ...
  ]
  ↓
5. Display in admin panel
```

---

## Security Model

### Encryption Layer

| Component | Method | Purpose |
|-----------|--------|---------|
| Password Derivation | PBKDF2 (100k iterations) | Derive key from password |
| Encryption Algorithm | AES-256-GCM | Encrypt message content |
| Salt | 16-byte random | Prevent rainbow table attacks |
| IV | 12-byte random | Ensure unique ciphertexts |
| Password Verification | SHA-256 hash | Server-side verification without storing password |

### Authorization Model

| Operation | Required | Verification |
|-----------|----------|--------------|
| Create Message | None | Public endpoint |
| View Message | Message ID | Public (link = auth) |
| Decrypt Message | Password | Client-side only |
| Submit Response | Message ID | Verified via message.allowResponse |
| View Responses | Admin Token | Server verifies token match |
| Destroy Message | Admin Token | Server verifies token match |

### Attack Surface Analysis

| Threat | Mitigation |
|--------|------------|
| Password brute-force | PBKDF2 with 100k iterations |
| Admin token guessing | 32-byte cryptographically random token (2^256 space) |
| Message content leakage | Client-side encryption, server never sees plaintext |
| Response spoofing | No user identity, inherently anonymous |
| Link sharing | Intentional - links are meant to be shared |
| Admin URL leakage | User responsibility to secure admin link |

---

## Database Schema

### Messages Collection

```typescript
{
  $id: string;                 // Unique message ID (nanoid-21)
  content: string;             // Encrypted base64 or plaintext (max 2MB)
  passwordHash: string | null; // SHA-256 hash for verification
  allowResponse: boolean;      // Enable response input
  adminToken: string;          // 32-byte secure token
  createdAt: string;           // ISO 8601 timestamp
  expiresAt: string;           // createdAt + 30 days
}
```

**Indexes**:
- `adminToken` (key) - Fast admin lookups
- `expiresAt` (key) - Cleanup queries

**Permissions**:
- Read: Any (public)
- Create: Any (anonymous)
- Update: None (immutable)
- Delete: None (via API only)

### Responses Collection

```typescript
{
  $id: string;        // Unique response ID
  messageId: string;  // Parent message reference
  content: string;    // Response content (max 2MB)
  createdAt: string;  // ISO 8601 timestamp
}
```

**Indexes**:
- `messageId` (key) - Query responses by message

**Permissions**:
- Read: None (admin API only)
- Create: Any (anonymous)
- Update: None (immutable)
- Delete: None (cascade with message)

---

## API Design

### REST Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/messages` | POST | None | Create message |
| `/api/messages/[id]` | GET | None | Retrieve message |
| `/api/messages/[id]/destroy` | POST | Admin Token | Destroy message |
| `/api/messages/[id]/card` | GET | None | Generate PDF |
| `/api/messages/[id]/responses` | POST | None | Submit response |
| `/api/messages/[id]/responses` | GET | Admin Token | List responses |

### Response Formats

**Success (200/201)**:
```json
{
  "data": { ... },
  "success": true
}
```

**Error (4xx/5xx)**:
```json
{
  "error": "Human-readable error message"
}
```

---

## UI/UX Design

### Terminal Aesthetic

**Visual Elements**:
- Black background (`#000000`)
- Green text (`#00ff00`)
- Monospace font (Courier New)
- Glow effects (text-shadow)
- CRT scanlines (CSS overlay)
- Flicker animation (subtle)

**Design Constraints**:
- No navigation bars
- No branding
- No footers
- Minimal UI elements
- Each page serves single purpose

**Psychological Impact**:
- Evokes secrecy and confidentiality
- Old-school hacker/classified feel
- Serious, intentional atmosphere
- Reinforces "secret message" concept

---

## Deployment Architecture

### Recommended Stack

```
┌─────────────────────────────────────────┐
│         Vercel (Edge Network)           │
│  - Next.js App                          │
│  - API Routes                           │
│  - Static Assets                        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Appwrite Cloud (Backend)           │
│  - Messages Collection                  │
│  - Responses Collection                 │
│  - Document Storage                     │
└─────────────────────────────────────────┘
```

### Environment Configuration

**Required Variables**:
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` (server-only)
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
- `NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID`
- `NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID`
- `NEXT_PUBLIC_BASE_URL` (production domain)

---

## Maintenance & Operations

### Cleanup Strategy

**Automated Cleanup** (Recommended):
- Appwrite Function scheduled daily
- Query messages where `expiresAt < now()`
- Delete messages and cascade responses
- Log cleanup stats

**Manual Cleanup**:
- Admin endpoint with master key
- Requires additional authentication
- Query-based batch deletion

### Monitoring

**Key Metrics**:
- Message creation rate
- Average message size
- Encryption vs plaintext ratio
- Response submission rate
- Message destruction rate
- 404 rate (destroyed/expired messages)

### Scaling Considerations

**Current Limits**:
- Appwrite free tier: 75k documents
- Vercel free tier: Unlimited requests (with limits)
- No rate limiting implemented

**Future Enhancements**:
- Implement rate limiting per IP
- Add CAPTCHA for message creation
- Upgrade Appwrite plan for higher limits
- Consider CDN for static assets

---

## Future Enhancements (Out of Scope for MVP)

### Potential Features

1. **Message Expiration Timer** - Self-destruct after X views/hours
2. **Read Receipts** - Notify creator when message viewed
3. **File Attachments** - Encrypt and attach files
4. **Rich Text** - Markdown support with preview
5. **Custom Themes** - Additional terminal color schemes
6. **Message Templates** - Pre-formatted message types
7. **Analytics Dashboard** - Creator-specific stats
8. **API Access** - Programmatic message creation
9. **Browser Extension** - Quick message creation
10. **Mobile Apps** - Native iOS/Android

### Technical Debt

- Add comprehensive error logging
- Implement retry logic for Appwrite operations
- Add end-to-end tests
- Optimize bundle size
- Add Progressive Web App support
- Implement proper rate limiting
- Add CAPTCHA to prevent abuse

---

## Conclusion

This architecture prioritizes:
1. **Privacy** - Zero-knowledge encryption
2. **Simplicity** - Minimal features, clear purpose
3. **Security** - Cryptographic best practices
4. **Atmosphere** - UI reinforces confidentiality
5. **Maintainability** - Clean separation of concerns

The application successfully delivers an MVP that enables anonymous, encrypted message sharing without authentication, tracking, or unnecessary complexity.
