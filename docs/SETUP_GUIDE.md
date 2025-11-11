# Setup Guide: Office 365 Management Dashboard

Complete step-by-step guide to deploy the application from scratch.

## Prerequisites

- Node.js 20+ installed
- pnpm 8+ installed
- Access to Azure AD (Entra ID) with app registration rights
- Appwrite account (Cloud or self-hosted)
- (Optional) n8n instance for webhook mode

## Part 1: Local Development Setup

### 1. Clone and Install Dependencies

```bash
cd /root
pnpm install
```

### 2. Generate Security Keys

```bash
# Generate encryption key for refresh tokens
node -e "console.log('ENCRYPTION_KEY_32B_BASE64=' + require('crypto').randomBytes(32).toString('base64'))"

# Generate NextAuth secret
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
```

Save these values - you'll need them for `.env`.

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the generated keys from step 2. Leave other values blank for now - we'll fill them as we create services.

## Part 2: Azure AD (Entra ID) Setup

### 1. Register Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: `Office 365 Management Dashboard`
   - **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI**: 
     - Platform: `Web`
     - URL: `http://localhost:3000/api/auth/callback/azure-ad`
5. Click **Register**

### 2. Copy Application Details

After registration:

1. Note the **Application (client) ID**
2. Note the **Directory (tenant) ID**
3. Update `.env`:
   ```env
   AZURE_CLIENT_ID=<your-client-id>
   AZURE_TENANT_ID=<your-tenant-id>
   ```

### 3. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Description: `Office365 Dashboard Secret`
4. Expires: Choose appropriate duration (12-24 months recommended)
5. Click **Add**
6. **COPY THE VALUE IMMEDIATELY** (you can't see it again)
7. Update `.env`:
   ```env
   AZURE_CLIENT_SECRET=<your-secret-value>
   ```

### 4. Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `openid`
   - `profile`
   - `email`
   - `offline_access`
   - `User.Read`
   - `MailboxSettings.ReadWrite`
   - `Mail.ReadWrite`
6. Click **Add permissions**

### 5. Grant Admin Consent (Optional but Recommended)

If you have admin rights:

1. Click **Grant admin consent for [Your Organization]**
2. Confirm

This allows users to consent once instead of per-user.

**Note**: If you don't have admin rights, users will be prompted to consent on first sign-in.

### 6. Configure Authentication

1. Go to **Authentication**
2. Under **Implicit grant and hybrid flows**:
   - ✅ Check **ID tokens**
3. Under **Advanced settings**:
   - Allow public client flows: **No**
4. Click **Save**

## Part 3: Appwrite Setup

### 1. Create Appwrite Project

**Option A: Appwrite Cloud** (Recommended for quick start)
1. Go to [cloud.appwrite.io](https://cloud.appwrite.io/)
2. Sign up or sign in
3. Click **Create Project**
4. Name: `Office 365 Management`
5. Project ID: Leave auto-generated or customize

**Option B: Self-Hosted**
1. Install Appwrite following [official docs](https://appwrite.io/docs/installation)
2. Access Appwrite console
3. Create project

### 2. Get Project Details

1. Note the **Endpoint** (e.g., `https://cloud.appwrite.io/v1`)
2. Note the **Project ID**
3. Update `.env`:
   ```env
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=<your-project-id>
   ```

### 3. Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Configure:
   - **Name**: `Server Key`
   - **Scopes**: Select:
     - `databases.read`
     - `databases.write`
     - `users.read`
   - **Expiration**: Never or long duration
4. Click **Create**
5. **COPY THE KEY IMMEDIATELY**
6. Update `.env`:
   ```env
   APPWRITE_API_KEY=<your-api-key>
   ```

### 4. Seed Database Collections

```bash
pnpm seed
```

This creates:
- `profiles` - User profiles with timezone and role
- `auditLogs` - Immutable action audit trail
- `secrets` - Encrypted refresh tokens (server-only)

Verify in Appwrite console: **Databases** → [Your Project ID] → Collections

## Part 4: First Run

### 1. Start Development Server

```bash
pnpm dev
```

Server starts at `http://localhost:3000`

### 2. Test Sign In

1. Open browser to `http://localhost:3000`
2. Click **Sign in with Microsoft**
3. Authenticate with your Microsoft account
4. Grant consent (if prompted)
5. You should be redirected to the dashboard

### 3. Test OOF

1. Navigate to **Out of Office**
2. Set status to **Disabled**
3. Click **Save Settings**
4. Check Appwrite **auditLogs** collection for the entry

### 4. Verify Audit Logs

In Appwrite console:
1. **Databases** → [Project ID] → **auditLogs**
2. You should see an entry with:
   - `action`: `set-oof`
   - `mode`: `graph`
   - `status`: `success`

## Part 5: n8n Integration (Optional)

### 1. Set Up n8n Instance

**Option A: n8n Cloud**
1. Sign up at [n8n.cloud](https://n8n.cloud/)
2. Create new instance

**Option B: Self-Hosted**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

### 2. Create Workflow

Follow the complete guide in `docs/N8N_SETUP.md`

### 3. Configure Webhook

1. Get webhook URL from n8n (e.g., `https://yourinstance.app.n8n.cloud/webhook/office365-actions`)
2. Generate signature secret:
   ```bash
   openssl rand -hex 32
   ```
3. Update `.env`:
   ```env
   EXECUTION_MODE=n8n
   N8N_WEBHOOK_URL=<your-webhook-url>
   N8N_SIGNATURE_SECRET=<your-secret>
   ```
4. Add same secret to n8n environment variables

### 4. Test n8n Mode

1. Restart dev server: `pnpm dev`
2. Set OOF via dashboard
3. Check n8n executions for webhook call

## Part 6: Production Deployment

### 1. Update Environment Variables

Create production `.env`:

```env
# Use production URLs
NEXTAUTH_URL=https://your-domain.com
AZURE_REDIRECT_URI=https://your-domain.com/api/auth/callback/azure-ad

# Production mode
NODE_ENV=production
```

### 2. Update Azure AD Redirect URI

In Azure Portal → App registrations → Authentication:
1. Add production redirect URI: `https://your-domain.com/api/auth/callback/azure-ad`
2. Save

### 3. Build Application

```bash
cd app
pnpm build
```

### 4. Deploy

**Option A: Vercel** (Recommended)
```bash
vercel --prod
```

**Option B: Docker**
```bash
docker build -t office365-mgmt .
docker run -p 3000:3000 --env-file .env office365-mgmt
```

**Option C: Traditional Host**
```bash
pnpm start
```

### 5. Set Environment Variables on Host

Ensure all `.env` variables are set on your hosting platform.

## Part 7: Security Hardening

### 1. Enable Same-Domain Forwarding Restriction

In `.env`:
```env
ALLOW_EXTERNAL_FORWARDING=false
```

This prevents users from forwarding to external domains.

### 2. Rotate Secrets Regularly

Schedule rotation of:
- Azure AD client secret (every 12-24 months)
- Appwrite API key (annually)
- Encryption key (only if compromised - requires re-authentication)

### 3. Enable RBAC

Update user roles in Appwrite `profiles` collection:
- `admin`: Can access all features + admin panel
- `user`: Standard access

### 4. Monitor Audit Logs

Set up alerts for:
- Failed authentication attempts
- External forwarding attempts (if restricted)
- High volume of API calls
- Errors in audit logs

### 5. Configure CORS

In `next.config.js`, limit origins:
```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
      ],
    },
  ];
}
```

## Troubleshooting

### "No refresh token found"

**Cause**: User session expired or encryption key changed

**Fix**:
1. Sign out
2. Sign in again
3. Verify `ENCRYPTION_KEY_32B_BASE64` hasn't changed

### "Insufficient privileges"

**Cause**: Missing API permissions or no admin consent

**Fix**:
1. Verify all Graph permissions are added in Azure AD
2. Grant admin consent
3. Ensure user account is not a guest

### "Failed to connect to Appwrite"

**Cause**: Wrong endpoint or API key

**Fix**:
1. Verify `APPWRITE_ENDPOINT` includes `/v1`
2. Check API key has correct scopes
3. Ensure API key hasn't expired

### n8n Signature Mismatch

**Cause**: Secret doesn't match or body format issue

**Fix**:
1. Ensure `N8N_SIGNATURE_SECRET` is identical in app and n8n
2. Verify n8n computes HMAC on raw body string
3. Check Content-Type is `application/json`

## Next Steps

1. **Customize UI**: Edit components in `app/components/`
2. **Add Features**: Extend API routes and forms
3. **Configure Timezones**: Update timezone list in OOF form
4. **Setup Monitoring**: Integrate with logging service
5. **User Training**: Document for end users

## Support Resources

- **Microsoft Graph**: https://learn.microsoft.com/en-us/graph/
- **Appwrite Docs**: https://appwrite.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **n8n Docs**: https://docs.n8n.io/

## Success Checklist

- ✅ User can sign in with Microsoft
- ✅ User can set OOF (disabled, always, scheduled)
- ✅ User can create/delete forwarding rule
- ✅ Audit logs record all actions
- ✅ Refresh tokens stored encrypted
- ✅ n8n integration works (if enabled)
- ✅ Production deployment complete

---

**Congratulations!** Your Office 365 Management Dashboard is ready for production use.
