# n8n Workflow Setup Guide

This document explains how to set up an n8n workflow to handle Office 365 management actions via webhook.

## Overview

When `EXECUTION_MODE=n8n`, the application sends signed JSON payloads to an n8n webhook instead of calling Microsoft Graph directly. This allows you to:

- Centralize workflow logic in n8n
- Easily modify behavior without code changes
- Add additional processing steps (notifications, logging, etc.)
- Use n8n's visual workflow editor

## Workflow Architecture

```
App (Next.js) → Webhook → Signature Verification → Switch (action) → Microsoft Graph
                                                      ├─ set-oof
                                                      ├─ set-forwarding
                                                      └─ clear-forwarding
```

## Step-by-Step Setup

### 1. Create New n8n Workflow

1. Log in to your n8n instance
2. Click **New Workflow**
3. Name it: `Office 365 Management Actions`

### 2. Add Webhook Trigger

1. Add **Webhook** node
2. Configure:
   - **HTTP Method**: POST
   - **Path**: `/office365-actions`
   - **Authentication**: None (we use custom signature verification)
   - **Response Mode**: Using 'Respond to Webhook' Node

### 3. Add Signature Verification (Function Node)

Add a **Function** node connected to the webhook:

```javascript
// Verify HMAC SHA-256 signature
const crypto = require('crypto');

// Get signature secret from environment
const secret = $env.N8N_SIGNATURE_SECRET;

if (!secret) {
  throw new Error('N8N_SIGNATURE_SECRET not configured in n8n environment');
}

// Get signature from headers
const signature = $node["Webhook"].json.headers['x-signature'];

if (!signature) {
  throw new Error('Missing x-signature header');
}

// Get request body
const body = $node["Webhook"].json.body;

// Compute expected signature
const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(bodyString)
  .digest('hex');

// Verify signature
if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}

// Pass through the payload
return {
  json: body
};
```

**Important**: Set `N8N_SIGNATURE_SECRET` in n8n environment variables (Settings → Variables).

### 4. Add Switch Node

Add a **Switch** node to route based on `action`:

- **Mode**: Rules
- **Rules**:
  - `{{ $json.action }}` equals `set-oof` → Output 1
  - `{{ $json.action }}` equals `set-forwarding` → Output 2
  - `{{ $json.action }}` equals `clear-forwarding` → Output 3

### 5. Set Up Microsoft Graph Credentials

Before adding Graph nodes, configure OAuth2 credentials:

1. Go to **Credentials** → **Create New**
2. Select **Microsoft Graph API OAuth2**
3. Configure:
   - **Grant Type**: Authorization Code (Delegated)
   - **Client ID**: Your Azure AD Client ID
   - **Client Secret**: Your Azure AD Client Secret
   - **Tenant ID**: Your Azure AD Tenant ID
   - **Scope**: `User.Read MailboxSettings.ReadWrite Mail.ReadWrite offline_access`
4. Click **Connect** and authenticate

**Per-User Authentication**: For delegated permissions, each user must authenticate once. Store credentials per user or use a service account with application permissions (requires admin consent).

### 6. Add Microsoft Graph Node for OOF (Output 1)

Add **HTTP Request** node (or **Microsoft Graph** node if available):

```javascript
// Method: PATCH
// URL: https://graph.microsoft.com/v1.0/users/{{ $json.upn }}/mailboxSettings
// Authentication: Use Microsoft Graph OAuth2 credential
// Body (JSON):
{
  "automaticRepliesSetting": {
    "status": "{{ $json.data.status }}",
    "internalReplyMessage": "{{ $json.data.internalReplyMessage }}",
    "externalReplyMessage": "{{ $json.data.externalReplyMessage }}",
    "scheduledStartDateTime": {
      "dateTime": "{{ $json.data.scheduledStartDateTime?.dateTime }}",
      "timeZone": "{{ $json.data.scheduledStartDateTime?.timeZone }}"
    },
    "scheduledEndDateTime": {
      "dateTime": "{{ $json.data.scheduledEndDateTime?.dateTime }}",
      "timeZone": "{{ $json.data.scheduledEndDateTime?.timeZone }}"
    }
  }
}
```

### 7. Add Microsoft Graph Node for Forwarding (Output 2)

Add **HTTP Request** node:

```javascript
// Method: POST
// URL: https://graph.microsoft.com/v1.0/users/{{ $json.upn }}/mailFolders/Inbox/messageRules
// Authentication: Use Microsoft Graph OAuth2 credential
// Body (JSON):
{
  "displayName": "Auto-forward to {{ $json.data.forwardTo }}",
  "sequence": 1,
  "isEnabled": {{ $json.data.enabled }},
  "conditions": {},
  "actions": {
    "forwardTo": [
      {
        "emailAddress": {
          "address": "{{ $json.data.forwardTo }}"
        }
      }
    ],
    "stopProcessingRules": true,
    "delete": {{ !$json.data.keepCopy }}
  }
}
```

### 8. Add Clear Forwarding Logic (Output 3)

This requires two steps:

**Step 1**: List rules (HTTP Request node):
```javascript
// Method: GET
// URL: https://graph.microsoft.com/v1.0/users/{{ $json.upn }}/mailFolders/Inbox/messageRules
// Authentication: Use Microsoft Graph OAuth2 credential
```

**Step 2**: Filter and delete (Code node):
```javascript
const targetName = `Auto-forward to ${$json.data.forwardTo}`;
const rules = $input.first().json.value;

const ruleToDelete = rules.find(r => r.displayName === targetName);

if (!ruleToDelete) {
  return { json: { message: 'Rule not found', deleted: false } };
}

return {
  json: {
    ruleId: ruleToDelete.id,
    upn: $('Function').first().json.upn
  }
};
```

**Step 3**: Delete rule (HTTP Request node):
```javascript
// Method: DELETE
// URL: https://graph.microsoft.com/v1.0/users/{{ $json.upn }}/mailFolders/Inbox/messageRules/{{ $json.ruleId }}
// Authentication: Use Microsoft Graph OAuth2 credential
```

### 9. Add Response Nodes

For each branch, add a **Respond to Webhook** node:

```javascript
// Response Code: 200
// Body (JSON):
{
  "success": true,
  "action": "{{ $node['Switch'].json.action }}",
  "timestamp": "{{ $now }}",
  "message": "Action completed successfully"
}
```

### 10. Error Handling

Add **Error Trigger** node to catch failures:

1. Add **Error Trigger** node
2. Connect to **Respond to Webhook** node
3. Configure response:
   ```javascript
   // Response Code: 500
   // Body (JSON):
   {
     "success": false,
     "error": "{{ $json.error.message }}",
     "timestamp": "{{ $now }}"
   }
   ```

## Testing the Workflow

### 1. Get Webhook URL

After saving, n8n provides a webhook URL like:
```
https://your-instance.app.n8n.cloud/webhook/office365-actions
```

### 2. Configure App

Update `.env`:
```env
EXECUTION_MODE=n8n
N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/office365-actions
N8N_SIGNATURE_SECRET=your-secret-here
```

### 3. Test with curl

```bash
# Generate signature
PAYLOAD='{"subjectId":"user123","upn":"user@example.com","action":"set-oof","data":{"status":"disabled"}}'
SECRET="your-secret-here"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

# Send request
curl -X POST https://your-instance.app.n8n.cloud/webhook/office365-actions \
  -H "Content-Type: application/json" \
  -H "x-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

Expected response:
```json
{
  "success": true,
  "action": "set-oof",
  "message": "Action completed successfully"
}
```

## Security Best Practices

1. **Store secrets in n8n environment variables** (Settings → Variables)
2. **Use HTTPS** for webhook endpoints (required for production)
3. **Validate all inputs** in signature verification node
4. **Log suspicious requests** (failed signature checks)
5. **Rate limit** the webhook if possible
6. **Use delegated permissions** (per-user authentication) when possible
7. **Audit log all actions** in n8n or external system

## Troubleshooting

### Signature Verification Fails

- Ensure `N8N_SIGNATURE_SECRET` matches in both app and n8n
- Check that body is sent as JSON (not form-encoded)
- Verify HMAC is computed on raw body string, not parsed object

### Microsoft Graph 401 Unauthorized

- Re-authenticate Microsoft Graph OAuth2 credential
- Check token hasn't expired
- Verify scopes match app requirements

### Rule Not Found (Clear Forwarding)

- Check `displayName` format matches: `Auto-forward to {email}`
- Ensure rule was created by this workflow/app
- Verify user has mailbox (not guest account)

## Advanced: Application Permissions

To use application permissions (no per-user auth), modify credential setup:

1. Azure AD:
   - Grant **Application permissions**: `MailboxSettings.ReadWrite`, `Mail.ReadWrite`
   - **Grant admin consent** for the organization

2. n8n credential:
   - Change **Grant Type** to **Client Credentials**
   - Remove delegated scopes

3. Update Graph API calls to use `/users/{upn}/...` instead of `/me/...`

**Warning**: Application permissions grant access to ALL mailboxes. Use with caution and proper RBAC.

## Monitoring

Monitor workflow executions:

1. n8n Dashboard → Executions
2. Filter by workflow name
3. Review success/failure rates
4. Check execution logs for errors

## Sample Workflow JSON

See `n8n-workflow-sample.json` for a complete exportable workflow configuration.

---

**Need help?** Check n8n documentation: https://docs.n8n.io/
