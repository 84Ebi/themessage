# Quick Start Guide

Get your anonymous encrypted message app running in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Appwrite account (free at [cloud.appwrite.io](https://cloud.appwrite.io))

---

## Step 1: Clone & Install

```bash
cd /home/ebi/themessage
npm install
```

---

## Step 2: Set Up Appwrite

### Create Project

1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Create new project
3. Name it `themessage`
4. Copy your Project ID

### Create Database

1. Navigate to **Databases** → **Create Database**
2. Name: `themessage`
3. Copy Database ID

### Create Messages Collection

1. Click **Create Collection**
2. Name: `messages`
3. Copy Collection ID

**Add Attributes**:

| Name | Type | Size | Required | Default |
|------|------|------|----------|---------|
| `content` | String | 2097152 | ✓ | - |
| `passwordHash` | String | 64 | ✗ | - |
| `allowResponse` | Boolean | - | ✓ | false |
| `adminToken` | String | 64 | ✓ | - |
| `createdAt` | DateTime | - | ✓ | - |
| `expiresAt` | DateTime | - | ✓ | - |

**Add Indexes**:
- Index 1: Key index on `adminToken`
- Index 2: Key index on `expiresAt`

**Set Permissions**:
- **Read**: Any
- **Create**: Any
- **Update**: None
- **Delete**: None

### Create Responses Collection

1. Click **Create Collection**
2. Name: `responses`
3. Copy Collection ID

**Add Attributes**:

| Name | Type | Size | Required |
|------|------|------|----------|
| `messageId` | String | 255 | ✓ |
| `content` | String | 2097152 | ✓ |
| `createdAt` | DateTime | - | ✓ |

**Add Indexes**:
- Index 1: Key index on `messageId`

**Set Permissions**:
- **Read**: None
- **Create**: Any
- **Update**: None
- **Delete**: None

### Generate API Key

1. Navigate to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `themessage-server`
4. Scopes: Select **Database** (all operations)
5. Expiration: Never
6. Copy the API Key (shown only once!)

---

## Step 3: Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Appwrite credentials:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=themessage
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=messages
NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID=responses
```

Replace:
- `your_project_id_here` with your Project ID
- `your_api_key_here` with your API Key

---

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 5: Test the Application

### Create a Message

1. Visit homepage
2. Enter: `This is a secret test message`
3. Set password: `test123`
4. Check "Allow anonymous responses"
5. Click **CREATE MESSAGE**

### View the Message

1. Copy the **Message URL**
2. Open in new tab/incognito window
3. Enter password: `test123`
4. Message should decrypt and display

### Submit a Response

1. Enter response text
2. Click **SUBMIT RESPONSE**
3. Success message appears

### Check Admin Panel

1. Copy the **Admin URL**
2. Open in browser
3. View submitted response
4. Click **DESTROY MESSAGE**

### Verify Destruction

1. Try to open original Message URL
2. Should show "Message not found" error

---

## Step 6: Deploy to Production

### Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel
```

### Add Environment Variables

In Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add all variables from `.env.local`
3. Click **Save**

### Configure Appwrite

1. In Appwrite project settings
2. Add your Vercel domain to **Platforms**
3. Add domain to allowed origins

### Update Base URL

Add to Vercel environment variables:
```
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

---

## Troubleshooting

### "Failed to create message"

- Check Appwrite API Key is correct
- Verify collection IDs match
- Check Appwrite project is active

### "Decryption failed"

- Password is case-sensitive
- Ensure correct password was entered
- Check browser console for errors

### PDF not generating

- Verify `pdfkit` and `qrcode` are installed
- Check server logs for errors
- Ensure message ID is valid

### Styling looks broken

- Clear browser cache
- Verify `globals.css` is imported
- Check for CSS conflicts

---

## Next Steps

1. **Set up cleanup**: Create Appwrite Function for 30-day expiration
2. **Customize styling**: Modify `globals.css` terminal theme
3. **Add rate limiting**: Implement API rate limits
4. **Monitor usage**: Track message creation metrics
5. **Backup data**: Set up Appwrite backups

---

## Support

- **Documentation**: See `README.md` and `ARCHITECTURE.md`
- **Appwrite Setup**: See `APPWRITE_SETUP.md`
- **Issues**: Check browser console and server logs

---

🎉 **You're ready to create anonymous encrypted messages!**
