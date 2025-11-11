# 🚀 Quick Start - Automated Setup

Get your Office 365 Management Dashboard running in **5 minutes** with automated database setup!

## Prerequisites

- Node.js 20+
- Appwrite account ([cloud.appwrite.io](https://cloud.appwrite.io) or self-hosted)
- Azure AD tenant

## Step 1: Install Appwrite CLI

```bash
npm install -g appwrite-cli
```

## Step 2: Set Up Appwrite Project

1. Create a new project at https://cloud.appwrite.io (or your instance)
2. Note your **Project ID**
3. Go to **Settings** → **API Keys** → **Create API Key**:
   - Name: `OOO Dashboard Server`
   - Scopes: Select `databases.*` and `users.*`
   - Copy the API key

## Step 3: Configure Environment

Create `app/.env.local` with your credentials:

```bash
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id-here
APPWRITE_API_KEY=your-api-key-here

# Public variables (for client-side)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id-here

# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Microsoft Graph Scopes
GRAPH_SCOPES="openid profile email offline_access User.Read MailboxSettings.ReadWrite Mail.ReadWrite"

# Execution Mode
EXECUTION_MODE=graph
```

## Step 4: Run Automated Database Setup 🎉

This is the magic step that does everything automatically:

```bash
npm run setup:appwrite
```

Or use the script directly:

```bash
# Linux/Mac
./scripts/setup-appwrite.sh

# Cross-platform (Node.js)
node scripts/setup-appwrite.js
```

**What it does:**
- ✅ Creates database (ID matches your project ID)
- ✅ Creates `profiles` collection with all attributes and indexes
- ✅ Creates `auditLogs` collection with all attributes and indexes
- ✅ Creates `secrets` collection with all attributes and indexes
- ✅ Sets proper permissions on each collection

**Output:**
```
🚀 Setting up Appwrite database and collections...
📋 Configuration:
  Endpoint: https://cloud.appwrite.io/v1
  Project ID: 69139fa80024c2f2b0da

🔐 Configuring Appwrite CLI...
📦 Creating database...
👤 Creating profiles collection...
  Adding attributes to profiles...
  Creating userId index...
📝 Creating auditLogs collection...
  Adding attributes to auditLogs...
  Creating userId_timestamp index...
🔐 Creating secrets collection...
  Adding attributes to secrets...
  Creating userId index...

✅ Appwrite database setup complete!
```

## Step 5: Configure Azure AD OAuth

### In Azure Portal:

1. Go to your app registration
2. Add redirect URI: `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/microsoft/YOUR_PROJECT_ID`
   - Replace `YOUR_PROJECT_ID` with your actual Appwrite project ID
3. Enable "Allow public client flows" (under Authentication → Advanced settings)

### In Appwrite Console:

1. Go to **Auth** → **Settings** → scroll to **OAuth2 Providers**
2. Click **Microsoft**
3. Enable it and enter:
   - **App ID**: Your Azure Client ID
   - **App Secret**: Your Azure Client Secret
4. Save

## Step 6: Install Dependencies & Run

```bash
cd app
npm install
npm run dev
```

## Step 7: Test It! 🎉

1. Open http://localhost:3000
2. Click **Sign in with Microsoft**
3. Grant permissions
4. You should see the dashboard!

## Verify Everything Works

### Check User Session
Open browser DevTools (F12) → Console, you should see:
```
Loaded user ID: 6xxxxxxxxxxxxx
```

### Test User Search
1. In the "Forward emails to" field, type at least 2 characters
2. You should see users from your Microsoft organization appear in a dropdown

### Test Form Submission
1. Set a start/end date
2. Add a message
3. Click **Save Settings**
4. Should see: "Out of Office settings updated successfully!"

## Troubleshooting

### "Database not found"
- Make sure you ran `npm run setup:appwrite`
- Check that `APPWRITE_PROJECT_ID` is correct in `.env.local`
- Verify API key has `databases.*` scope

### "No user session found" 
- Check OAuth redirect URI matches exactly in both Azure and Appwrite
- Try logging out and back in
- Check browser console for errors

### "User search not working"
- Verify database exists (check Appwrite console → Databases)
- Check browser console for user ID log
- Make sure you have users in your Microsoft organization

### Appwrite CLI errors
- Make sure you have the latest version: `npm install -g appwrite-cli@latest`
- Check your `.env.local` file exists and has correct values

## Next Steps

- **Deploy to Production**: See [README.md](README.md) for deployment guide
- **Manual Setup**: If you prefer manual setup, see [APPWRITE_SETUP.md](APPWRITE_SETUP.md)
- **Customize**: Explore the `app/` directory to customize the UI and functionality

## Development Tips

### Re-run Setup Script
The script is idempotent - you can run it multiple times safely. It will skip existing resources.

### Check What Was Created
In Appwrite Console:
1. Go to **Databases**
2. Click on your database (ID matches project ID)
3. You should see 3 collections: `profiles`, `auditLogs`, `secrets`

### View Logs
All API calls log to console. Check terminal running `npm run dev` for detailed logs.

---

**Questions?** Check the main [README.md](README.md) for full documentation!
