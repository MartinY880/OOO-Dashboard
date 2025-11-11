# Office 365 Management Dashboard

Production-quality application for managing Office 365 mailbox settings (Out of Office and Email Forwarding) using **Appwrite + Next.js 14 + TypeScript** with Microsoft Graph API integration.

## 🎯 Features

- **Out of Office (OOF) Management**: Set automatic replies with custom messages, schedules, and timezone support
- **Email Forwarding Rules**: Create, view, and delete global forwarding rules with same-domain validation
- **Dual Execution Modes**:
  - `graph`: Direct Microsoft Graph API calls (delegated permissions)
  - `n8n`: Send signed payloads to n8n webhook for processing
- **Secure Authentication**: Microsoft SSO via MSAL with encrypted refresh token storage
- **Comprehensive Audit Logging**: All actions logged to Appwrite with full context
- **RBAC Support**: Admin and user roles managed via Appwrite
- **Timezone-Aware**: Full IANA timezone support (defaults to US Eastern)

## 🏗️ Architecture

```
/root
├── app/                 # Next.js 14 App Router application
│   ├── app/            # Routes and pages
│   │   ├── api/        # API routes (oof, forwarding, auth)
│   │   ├── dashboard/  # Dashboard pages
│   │   └── auth/       # Authentication pages
│   ├── components/     # React components (UI, forms)
│   └── lib/            # Shared libraries
│       ├── appwrite.ts # Appwrite SDK helpers
│       ├── auth.ts     # NextAuth configuration
│       ├── graph.ts    # Microsoft Graph client
│       ├── n8n.ts      # n8n webhook client
│       ├── validators.ts # Zod schemas
│       ├── crypto.ts   # Encryption utilities
│       └── logger.ts   # Structured logging
├── infra/              # Infrastructure configuration
│   ├── .devcontainer/  # Dev container setup
│   └── appwrite/       # Appwrite collections & seed script
└── tests/              # Testing infrastructure
    ├── e2e/            # Playwright tests
    └── rest.http       # REST client samples
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Appwrite account (cloud or self-hosted)
- Azure AD (Entra ID) app registration
- (Optional) n8n instance for webhook mode

### 1. Clone and Setup

```bash
# If using devcontainer (recommended for SSH/VS Code)
# Open in VS Code and select "Reopen in Container"

# Or install dependencies manually
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:

1. **Generate encryption key**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Generate NextAuth secret**:
   ```bash
   openssl rand -base64 32
   ```

3. Fill in Appwrite credentials (see [Appwrite Setup](#appwrite-setup))
4. Fill in Azure AD credentials (see [Azure AD Setup](#azure-ad-setup))
5. (Optional) Configure n8n webhook URL and secret

### 3. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com/) → **Azure Active Directory** → **App registrations**
2. Click **New registration**:
   - Name: `Office 365 Management Dashboard`
   - Supported account types: **Accounts in this organizational directory only**
   - Redirect URI: `Web` → `http://localhost:3000/api/auth/callback/azure-ad`
3. After creation, note the **Application (client) ID** and **Directory (tenant) ID**
4. Go to **Certificates & secrets** → **New client secret** → Save the secret value
5. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**:
   - `openid`
   - `profile`
   - `email`
   - `offline_access`
   - `User.Read`
   - `MailboxSettings.ReadWrite`
   - `Mail.ReadWrite`
6. Click **Grant admin consent** (if you have admin rights)

### 4. Appwrite Setup

1. Create a new project in [Appwrite Cloud](https://cloud.appwrite.io/) or your self-hosted instance
2. Note the **Project ID** and **Endpoint**
3. Go to **Settings** → **API Keys** → Create a new API key with:
   - Scopes: `databases.*`, `users.*`
   - Save the key securely
4. Create `app/.env.local` with your Appwrite credentials:
   ```bash
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your-project-id
   APPWRITE_API_KEY=your-api-key
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
   ```

### 5. Setup Appwrite Database (Automated)

Run the automated setup script to create the database and collections:

**Option 1: Using Bash (Linux/Mac)**
```bash
./scripts/setup-appwrite.sh
```

**Option 2: Using Node.js (Cross-platform)**
```bash
node scripts/setup-appwrite.js
```

This automatically creates:
- **Database**: `OOO Dashboard` (ID matches your project ID)
- **Collections**:
  - `profiles`: User profiles with timezone and role
  - `auditLogs`: Immutable audit trail of all actions
  - `secrets`: Encrypted refresh tokens (server-only access)

**Manual Setup**: If you prefer, see `APPWRITE_SETUP.md` for step-by-step manual instructions

### 6. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔐 Security Features

### Secure-by-Default Design

- **Refresh tokens encrypted at rest** using AES-256-GCM
- **Server-only API keys** never exposed to client
- **Delegated permissions** (no admin consent required for basic usage)
- **Same-domain forwarding** enforced by default (configure with `ALLOW_EXTERNAL_FORWARDING`)
- **Structured logging** with automatic PII redaction
- **Immutable audit logs** for compliance

### Encryption Key Management

Generate a secure 32-byte encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Store in `.env` as `ENCRYPTION_KEY_32B_BASE64`.

## 📊 Execution Modes

### Graph Mode (Default)

Direct Microsoft Graph API calls using delegated permissions:

```env
EXECUTION_MODE=graph
```

**Pros**:
- Real-time execution
- No external dependencies
- Better error handling

**Cons**:
- Requires refresh token management
- Rate limits apply

### n8n Webhook Mode

Send signed payloads to n8n for processing:

```env
EXECUTION_MODE=n8n
N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/office365-actions
N8N_SIGNATURE_SECRET=your-secret-here
```

**Pros**:
- Centralized workflow management
- Easy to modify without code changes
- Audit trail in n8n

**Cons**:
- Additional infrastructure dependency
- Slightly higher latency

## 🛠️ n8n Workflow Setup

### 1. Create n8n Workflow

1. Create a new workflow in n8n
2. Add **Webhook** trigger:
   - Method: POST
   - Path: `/office365-actions`
   - Authentication: None (we use signature verification)
3. Add **Function** node to verify signature:

```javascript
const crypto = require('crypto');

const secret = $env.N8N_SIGNATURE_SECRET;
const signature = $node["Webhook"].json.headers['x-signature'];
const body = $node["Webhook"].json.body;

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(body))
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}

return [{ json: body }];
```

4. Add **Switch** node on `action`:
   - Case `set-oof`: Connect to Microsoft Graph node (PATCH `/me/mailboxSettings`)
   - Case `set-forwarding`: Connect to Microsoft Graph node (POST `/me/mailFolders/Inbox/messageRules`)
   - Case `clear-forwarding`: Connect to Microsoft Graph node (DELETE rule)

5. Configure Microsoft Graph credentials:
   - OAuth2 (Delegated)
   - Same scopes as app
   - Per-user authentication

### 2. Configure Webhook in App

```env
N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/office365-actions
N8N_SIGNATURE_SECRET=generate-random-string
```

## 🧪 Testing

### Unit Tests

```bash
pnpm test
```

### E2E Tests

```bash
pnpm test:e2e
```

### Manual Testing with REST Client

See `tests/rest.http` for sample requests. Use VS Code REST Client extension.

## 📝 API Reference

### POST /api/oof

Set Out of Office automatic replies.

**Request**:
```json
{
  "mode": "graph",
  "settings": {
    "status": "scheduled",
    "internalReplyMessage": "<p>I'm out of office</p>",
    "externalReplyMessage": "<p>I'm out of office</p>",
    "scheduledStartDateTime": {
      "dateTime": "2025-11-20T09:00:00",
      "timeZone": "America/New_York"
    },
    "scheduledEndDateTime": {
      "dateTime": "2025-11-27T17:00:00",
      "timeZone": "America/New_York"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": { "message": "OOF settings updated successfully" }
}
```

### GET /api/oof

Get current OOF settings (graph mode only).

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "scheduled",
    "internalReplyMessage": "<p>I'm out of office</p>",
    ...
  }
}
```

### POST /api/forwarding

Create email forwarding rule.

**Request**:
```json
{
  "mode": "graph",
  "rule": {
    "forwardTo": "assistant@example.com",
    "keepCopy": true,
    "enabled": true
  }
}
```

### DELETE /api/forwarding?forwardTo=assistant@example.com

Delete forwarding rule.

### GET /api/forwarding

Get current forwarding status.

## 🔧 Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APPWRITE_ENDPOINT` | Yes | - | Appwrite API endpoint |
| `APPWRITE_PROJECT_ID` | Yes | - | Appwrite project ID |
| `APPWRITE_API_KEY` | Yes | - | Appwrite server API key |
| `AUTH_STRATEGY` | No | `msal` | `msal` or `appwrite-oauth` |
| `AZURE_TENANT_ID` | Yes | - | Azure AD tenant ID |
| `AZURE_CLIENT_ID` | Yes | - | Azure AD client ID |
| `AZURE_CLIENT_SECRET` | Yes | - | Azure AD client secret |
| `ENCRYPTION_KEY_32B_BASE64` | Yes | - | 32-byte base64 encryption key |
| `EXECUTION_MODE` | No | `graph` | `graph` or `n8n` |
| `N8N_WEBHOOK_URL` | No | - | n8n webhook URL (if mode=n8n) |
| `N8N_SIGNATURE_SECRET` | No | - | HMAC secret for n8n (if mode=n8n) |
| `ALLOW_EXTERNAL_FORWARDING` | No | `false` | Allow forwarding outside user's domain |

## 🐛 Troubleshooting

### "No refresh token found"

- User needs to sign out and sign in again
- Check if `offline_access` scope is in Azure AD config
- Verify `ENCRYPTION_KEY_32B_BASE64` hasn't changed

### "Insufficient privileges"

- Check Azure AD API permissions
- Ensure admin consent is granted (for org-wide deployment)
- Verify user has mailbox (not guest account)

### n8n signature verification fails

- Ensure `N8N_SIGNATURE_SECRET` matches in both app and n8n
- Check webhook body is JSON (not form-encoded)
- Verify n8n is computing HMAC on raw body string

### Appwrite connection errors

- Verify `APPWRITE_ENDPOINT` includes `/v1`
- Check API key has correct scopes
- Run `pnpm seed` if collections don't exist

## 📚 Additional Resources

- [Microsoft Graph API Documentation](https://learn.microsoft.com/en-us/graph/)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Next.js 14 App Router](https://nextjs.org/docs)
- [n8n Documentation](https://docs.n8n.io/)

## 🤝 Contributing

This is a production-ready template. Customize as needed for your organization's requirements.

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for secure, enterprise-grade Office 365 management**
