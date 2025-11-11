# Appwrite OAuth Setup Guide

This application uses **Appwrite OAuth** for Microsoft authentication instead of NextAuth.js.

## Setup Steps

### 1. Configure Microsoft OAuth in Appwrite Console

1. Go to your Appwrite Console → **Auth** → **Settings**
2. Find **OAuth2 Providers** section
3. Enable **Microsoft** provider
4. Configure:
   - **App ID**: Your Azure AD Application (client) ID
   - **App Secret**: Your Azure AD client secret
   - **Tenant ID**: Your Azure AD tenant ID (or use `common` for multi-tenant)

### 2. Configure Azure AD App Registration

1. Go to Azure Portal → **Azure Active Directory** → **App registrations**
2. Select your app or create a new one
3. Under **Authentication**, add **Web** platform:
   - Redirect URI: `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/microsoft/{projectId}`
   - Replace `{projectId}` with your Appwrite project ID
4. Under **API permissions**, grant:
   - `User.Read`
   - `MailboxSettings.ReadWrite`
   - `Mail.ReadWrite`
   - `offline_access`
5. Grant admin consent if required

### 3. Set Environment Variables in Appwrite

In your Appwrite Function settings, configure these environment variables:

**Required:**
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
ENCRYPTION_KEY_32B_BASE64=your_32_byte_key
```

**Optional (for n8n integration):**
```
N8N_WEBHOOK_URL=https://your-n8n.com/webhook
N8N_SIGNATURE_SECRET=your_secret
```

### 4. How It Works

1. User clicks "Sign in with Microsoft" button
2. Client calls `loginWithMicrosoft()` from `lib/appwrite-client.ts`
3. Appwrite redirects to Microsoft OAuth login
4. Microsoft redirects back to Appwrite with authorization code
5. Appwrite exchanges code for tokens and creates session
6. User is redirected to `/dashboard`
7. Session is stored in Appwrite and cookies

### 5. Benefits Over NextAuth.js

- ✅ No need for `NEXTAUTH_SECRET` or `NEXTAUTH_URL`
- ✅ Appwrite handles token refresh automatically
- ✅ Simpler deployment (no callback route needed)
- ✅ Built-in session management
- ✅ Better integration with Appwrite features

### 6. Token Management

For Microsoft Graph API calls, you'll need to implement token exchange:

1. User logs in via Appwrite OAuth
2. Store Microsoft access token in Appwrite's secrets collection (encrypted)
3. Use stored token for Graph API calls
4. Implement token refresh when needed

## Troubleshooting

### Login fails or redirects to error page

- Verify Microsoft OAuth is enabled in Appwrite Console
- Check Azure AD redirect URI matches Appwrite's format exactly
- Ensure API permissions are granted in Azure AD
- Check browser console for errors

### "Missing environment variables" error

- Verify all `NEXT_PUBLIC_*` variables are set
- They must be set at build time, not just runtime
- Rebuild your Appwrite Function after setting them

### Session not persisting

- Check that cookies are enabled
- Verify Appwrite endpoint is correct
- Check browser console for CORS errors
