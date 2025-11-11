# 🚀 Quick Start Guide

This is a **5-minute guide** to get the Office 365 Management Dashboard running locally.

## Prerequisites Check

Run these commands to verify:

```bash
node --version    # Should be 20+
pnpm --version    # Should be 8+
```

If missing, install:
- Node.js 20: https://nodejs.org/
- pnpm: `npm install -g pnpm`

## Step 1: Generate Secrets (2 minutes)

```bash
# Generate encryption key
echo "ENCRYPTION_KEY_32B_BASE64=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"

# Generate NextAuth secret
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
```

**Save these outputs** - you'll need them!

## Step 2: Configure Environment (1 minute)

```bash
cp .env.example .env
```

Edit `.env` and paste the keys from Step 1. For now, leave these blank (we'll fill them later):
- `APPWRITE_*`
- `AZURE_*`

## Step 3: Azure AD Setup (3 minutes)

### Quick Method:
1. Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. Click **New registration**
3. Fill in:
   - Name: `Office365 Dashboard`
   - Redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
4. After creation, copy **Client ID** and **Tenant ID** to `.env`
5. Go to **Certificates & secrets** → New secret → Copy value to `.env`
6. Go to **API permissions** → Add these delegated permissions:
   - User.Read
   - MailboxSettings.ReadWrite
   - Mail.ReadWrite
   - offline_access
7. Click **Grant admin consent** (if available)

## Step 4: Appwrite Setup (2 minutes)

### Quick Method:
1. Go to: https://cloud.appwrite.io/
2. Create project: `Office365 Management`
3. Copy **Endpoint** and **Project ID** to `.env`
4. Settings → API Keys → Create with `databases.*` and `users.read` scopes
5. Copy API key to `.env`

## Step 5: Seed & Run (1 minute)

```bash
# Install dependencies
pnpm install

# Seed Appwrite collections
pnpm seed

# Start development server
pnpm dev
```

## Step 6: Test! (1 minute)

1. Open: http://localhost:3000
2. Click **Sign in with Microsoft**
3. Authenticate
4. You should see the dashboard!

## 🎉 Success!

You now have:
- ✅ Working authentication
- ✅ Database collections created
- ✅ Dashboard accessible

## Next Steps

### Try These Features:

**Set Out of Office:**
1. Navigate to "Out of Office"
2. Select "Disabled" status
3. Click "Save Settings"
4. Check Appwrite audit logs

**Create Forwarding Rule:**
1. Navigate to "Email Forwarding"
2. Enter an email address
3. Click "Create Forwarding Rule"
4. Verify in Microsoft Outlook rules

### Optional Enhancements:

**Enable n8n Mode:**
1. Set up n8n instance (see `docs/N8N_SETUP.md`)
2. Update `.env`: `EXECUTION_MODE=n8n`
3. Configure webhook URL and secret

**Customize UI:**
- Edit components in `app/components/`
- Modify styles in `app/app/globals.css`
- Add new features in `app/api/`

## Troubleshooting

### "No refresh token found"
**Fix**: Sign out and sign in again

### "Insufficient privileges"
**Fix**: Grant admin consent in Azure AD API permissions

### "Cannot connect to Appwrite"
**Fix**: Verify endpoint includes `/v1` and API key is valid

### Port 3000 already in use
**Fix**: `PORT=3001 pnpm dev`

## Full Documentation

- **Complete Setup**: `docs/SETUP_GUIDE.md`
- **n8n Integration**: `docs/N8N_SETUP.md`
- **Project Structure**: `PROJECT_STRUCTURE.md`
- **API Reference**: `README.md`

## Development Tips

```bash
# Run tests
pnpm test

# E2E tests
pnpm test:e2e

# Type checking
pnpm typecheck

# Linting
pnpm lint

# View REST samples
# Open tests/rest.http in VS Code with REST Client extension
```

## Production Deployment

When ready for production:

1. Update `.env` with production URLs
2. Add production redirect URI in Azure AD
3. Build: `pnpm build`
4. Deploy to Vercel, Docker, or traditional host

See `docs/SETUP_GUIDE.md` Part 6 for details.

---

**Need Help?**
- Check `README.md` for detailed documentation
- Review API samples in `tests/rest.http`
- See troubleshooting in `docs/SETUP_GUIDE.md`

**Happy Building! 🎊**
