# Appwrite Database Setup

This document describes the Appwrite database schema for the anonymous encrypted message application.

## Database: `themessage`

### Collection: `messages`

**Attributes:**
- `content` (string, required, size: 2097152) - Encrypted or plain message content (2MB limit)
- `passwordHash` (string, optional, size: 64) - SHA-256 hash of password for verification
- `allowResponse` (boolean, required, default: false) - Whether responses are enabled
- `adminToken` (string, required, size: 64, indexed) - Secure token for admin operations
- `createdAt` (datetime, required) - Message creation timestamp
- `expiresAt` (datetime, required, indexed) - Expiration timestamp (30 days from creation)

**Indexes:**
- `adminToken` (key index) - For fast admin token lookups
- `expiresAt` (key index) - For cleanup queries

**Permissions:**
- Read: Any
- Create: Any
- Update: None
- Delete: None (only via API with admin token)

### Collection: `responses`

**Attributes:**
- `messageId` (string, required, size: 255, indexed) - Reference to parent message
- `content` (string, required, size: 2097152) - Response content (2MB limit)
- `createdAt` (datetime, required) - Response creation timestamp

**Indexes:**
- `messageId` (key index) - For fetching responses by message

**Permissions:**
- Read: None (only via API with admin token)
- Create: Any
- Update: None
- Delete: None (deleted when parent message is destroyed)

## Setup Instructions

1. Create a new Appwrite project at https://cloud.appwrite.io
2. Create a database named `themessage`
3. Create the `messages` collection with the attributes and permissions above
4. Create the `responses` collection with the attributes and permissions above
5. Create an API key with Database permissions for server-side operations
6. Update `.env.local` with your project credentials

## Cleanup Strategy

Messages are automatically marked for deletion 30 days after creation via the `expiresAt` field. Implement a scheduled function or cron job to:

```javascript
// Query messages where expiresAt < now
// Delete matching messages and their responses
```

Alternatively, use Appwrite Functions with a scheduled trigger to run cleanup daily.
