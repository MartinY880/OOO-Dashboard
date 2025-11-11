# Appwrite Database Setup Guide

## Step 1: Create Database

1. Log in to your Appwrite Console at https://appwrite.martinyousif.com
2. Navigate to your project (ID: `69139fa80024c2f2b0da`)
3. Click on **Databases** in the left sidebar
4. Click **Create Database**
5. Enter Database ID: `69139fa80024c2f2b0da` (same as project ID)
6. Enter Database Name: `OOO Dashboard`
7. Click **Create**

## Step 2: Create Collections

### Collection 1: profiles
1. In the database, click **Add Collection**
2. Collection ID: `profiles`
3. Collection Name: `User Profiles`
4. Permissions:
   - **Read**: `role:all` (so users can read their own profile)
   - **Write**: None (only API can write)
5. Click **Create**

**Add Attributes:**
- `userId` - String (36) - Required
- `displayName` - String (255) - Required
- `email` - Email - Required
- `timeZone` - String (100) - Required - Default: `America/New_York`
- `role` - String (50) - Required - Default: `user`

**Create Index:**
- Key: `userId_index`
- Type: Key
- Attributes: `userId`
- Order: ASC

### Collection 2: auditLogs
1. Click **Add Collection**
2. Collection ID: `auditLogs`
3. Collection Name: `Audit Logs`
4. Permissions:
   - **Read**: `role:admin`
   - **Write**: None (only API can write)
5. Click **Create**

**Add Attributes:**
- `userId` - String (36) - Required
- `action` - String (100) - Required
- `details` - String (5000) - Optional
- `ipAddress` - String (45) - Optional
- `timestamp` - DateTime - Required

**Create Index:**
- Key: `userId_timestamp`
- Type: Key
- Attributes: `userId`, `timestamp`
- Order: ASC, DESC

### Collection 3: secrets
1. Click **Add Collection**
2. Collection ID: `secrets`
3. Collection Name: `User Secrets`
4. Permissions:
   - **Read**: None (only API can read)
   - **Write**: None (only API can write)
5. Click **Create**

**Add Attributes:**
- `userId` - String (36) - Required
- `encryptedRefreshToken` - String (5000) - Optional
- `encryptedAccessToken` - String (5000) - Optional
- `tokenExpiry` - DateTime - Optional

**Create Index:**
- Key: `userId_index`
- Type: Key
- Attributes: `userId`
- Order: ASC

## Step 3: Update Environment Variables

Make sure your `.env.local` file (in the `app/` directory) has:

```bash
APPWRITE_ENDPOINT=https://appwrite.martinyousif.com/v1
APPWRITE_PROJECT_ID=69139fa80024c2f2b0da
APPWRITE_API_KEY=your-api-key-here

# Public variables for client-side
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://appwrite.martinyousif.com/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=69139fa80024c2f2b0da
```

To get your API key:
1. Go to **Settings** → **API Keys** in Appwrite Console
2. Click **Create API Key**
3. Name: `OOO Dashboard Server`
4. Scopes: Select `databases.*`, `users.*`
5. Copy the key and add to `.env.local`

## Step 4: Test the Setup

After creating the database and collections, try:
1. Log in to your dashboard
2. The first time you log in, a profile will be automatically created
3. Try submitting the Out of Office form
4. Check the `profiles` collection to see your user profile

## Troubleshooting

**"Database not found" error:**
- Verify database ID matches `APPWRITE_PROJECT_ID`
- Check API key has `databases.*` scope

**"Collection not found" error:**
- Verify collection IDs are exactly: `profiles`, `auditLogs`, `secrets`
- Check permissions are set correctly

**"Authentication required" error:**
- Check browser console for errors
- Verify user session is active (check Application → Cookies in DevTools)
