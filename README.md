# The Message - Anonymous Encrypted Message Web App

A privacy-first, no-auth web application for creating and sharing anonymous, optionally encrypted secret messages via unique links.

## Features

- **Anonymous Message Creation** - No authentication, accounts, or tracking
- **Client-Side Encryption** - Zero-knowledge architecture using Web Crypto API
- **Password Protection** - Optional AES-256-GCM encryption
- **Terminal Aesthetic** - Old-school green CRT monitor UI with scanlines and glow effects
- **One-Click Destruction** - Permanently destroy messages and all responses
- **Printable QR Visit Cards** - PDF generation with QR code and password
- **Anonymous Response System** - Optional response channel with admin-only access
- **Auto-Expiration** - Messages expire after 30 days
- **2MB Message Limit** - Enforced on both messages and responses

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Backend**: Appwrite (Database & Storage)
- **Encryption**: Web Crypto API (AES-256-GCM, PBKDF2)
- **Styling**: Tailwind CSS + Custom Terminal Theme
- **PDF Generation**: PDFKit
- **QR Codes**: qrcode package
- **Language**: TypeScript

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── messages/
│   │       ├── route.ts                    # Create message
│   │       └── [id]/
│   │           ├── route.ts                # Get message
│   │           ├── destroy/route.ts        # Destroy message
│   │           ├── card/route.ts           # Generate PDF card
│   │           └── responses/route.ts      # Submit/view responses
│   ├── m/[id]/page.tsx                     # Message viewer
│   ├── admin/[id]/page.tsx                 # Admin panel (responses)
│   ├── success/page.tsx                    # Post-creation success
│   ├── page.tsx                            # Homepage (create message)
│   ├── layout.tsx                          # Root layout
│   └── globals.css                         # Terminal theme styles
├── lib/
│   ├── appwrite.ts                         # Appwrite client config
│   └── crypto.ts                           # Encryption utilities
└── types/
    └── index.ts                            # TypeScript interfaces
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Appwrite

1. Create an Appwrite project at [cloud.appwrite.io](https://cloud.appwrite.io)
2. Create a database named `themessage`
3. Create collections (see `APPWRITE_SETUP.md` for detailed schema)
4. Generate an API key with Database permissions

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Appwrite credentials:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
NEXT_PUBLIC_APPWRITE_DATABASE_ID=themessage
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=messages
NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID=responses
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Usage Flow

### Creating a Message

1. Visit homepage
2. Enter message content (up to 2MB)
3. Optionally set a password for encryption
4. Optionally enable anonymous responses
5. Click "CREATE MESSAGE"
6. Receive:
   - **Message URL** (shareable)
   - **Admin URL** (for responses/destruction)
   - Option to print QR visit card

### Viewing a Message

1. Open message URL
2. If encrypted, enter password to decrypt (client-side)
3. Read message
4. Optionally submit anonymous response
5. Click "DESTROY MESSAGE" to permanently delete

### Admin Panel

1. Open admin URL (contains unique token)
2. View all anonymous responses
3. Destroy message and all responses

## Security Features

- **Zero-Knowledge Encryption**: Passwords never leave the browser
- **Client-Side Decryption**: Messages decrypted entirely in browser
- **Secure Admin Tokens**: Cryptographically random tokens for admin operations
- **No User Tracking**: No cookies, sessions, or analytics
- **Auto-Expiration**: Messages expire after 30 days
- **One-Way Operations**: Message destruction is permanent

## Database Schema

### Messages Collection

- `content` (string, 2MB) - Encrypted or plain message
- `passwordHash` (string, optional) - SHA-256 hash for verification
- `allowResponse` (boolean) - Enable response input
- `adminToken` (string) - Secure token for admin operations
- `createdAt` (datetime) - Creation timestamp
- `expiresAt` (datetime) - 30 days from creation

### Responses Collection

- `messageId` (string) - Parent message reference
- `content` (string, 2MB) - Response content
- `createdAt` (datetime) - Submission timestamp

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages` | Create new message |
| GET | `/api/messages/[id]` | Retrieve message |
| POST | `/api/messages/[id]/destroy` | Destroy message (requires admin token) |
| GET | `/api/messages/[id]/card` | Generate PDF visit card |
| POST | `/api/messages/[id]/responses` | Submit anonymous response |
| GET | `/api/messages/[id]/responses` | Get responses (requires admin token) |

## Design Philosophy

- **Privacy First**: No data collection, no tracking
- **Minimalism**: Only essential features
- **Atmosphere**: Terminal aesthetic reinforces confidentiality
- **Security Over Convenience**: Client-side encryption, secure tokens
- **Intentional UI**: Every element serves the "secret message" experience

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Environment Variables on Vercel

Add all `.env.local` variables to Vercel project settings.

### Production Considerations

1. Set up Appwrite Functions for automatic message cleanup (30-day expiration)
2. Configure proper CORS settings in Appwrite
3. Enable rate limiting on API routes
4. Set `NEXT_PUBLIC_BASE_URL` for correct URL generation

## Cleanup Strategy

Messages older than 30 days should be automatically deleted. Options:

1. **Appwrite Functions**: Create a scheduled function
2. **Cron Job**: Use Vercel Cron Jobs or external service
3. **Manual Cleanup**: API endpoint with admin authentication

Example cleanup query:

```javascript
// Query messages where expiresAt < now
// Delete matching messages and their responses
```

## License

MIT

---

**Built with privacy, minimalism, and atmosphere in mind.**

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
