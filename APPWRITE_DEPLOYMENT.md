# Appwrite Infrastructure as Code

This directory contains the Appwrite configuration that defines your database schema, collections, and functions.

## Files

- **`appwrite.json`** - Appwrite project configuration defining databases, collections, attributes, and indexes
- **`scripts/deploy-appwrite.sh`** - Deployment script to push configuration to your Appwrite server

## Usage

### Initial Setup

1. **Install Appwrite CLI** (one-time):
   ```bash
   npm install -g appwrite-cli
   ```

2. **Set environment variables** in `app/.env.local`:
   ```bash
   APPWRITE_ENDPOINT=https://appwrite.martinyousif.com/v1
   APPWRITE_PROJECT_ID=69139fa80024c2f2b0da
   APPWRITE_API_KEY=your-api-key-here
   ```

3. **Deploy the schema**:
   ```bash
   ./scripts/deploy-appwrite.sh
   ```

This will create:
- Database: `OOO Dashboard` (ID: 69139fa80024c2f2b0da)
- Collection: `profiles` - User profiles with timezone and role
- Collection: `auditLogs` - Audit trail of all actions
- Collection: `secrets` - Encrypted user tokens

### Making Changes

1. Edit `appwrite.json` to add/modify collections or attributes
2. Run `./scripts/deploy-appwrite.sh` to apply changes
3. Commit changes to git: `git add appwrite.json && git commit -m "Update schema"`

## Schema Overview

### Collection: profiles
Stores user profile information.

**Attributes:**
- `userId` (String, 36) - Appwrite user ID
- `displayName` (String, 255) - User's display name
- `email` (Email) - User's email address
- `timeZone` (String, 100) - IANA timezone (default: America/New_York)
- `role` (String, 50) - User role: 'user' or 'admin'

**Indexes:**
- `userId_index` - Fast lookup by user ID

### Collection: auditLogs
Immutable audit trail of user actions.

**Attributes:**
- `userId` (String, 36) - User who performed action
- `action` (String, 100) - Action type (e.g., "update_oof", "set_forwarding")
- `details` (String, 5000, optional) - JSON details of the action
- `ipAddress` (String, 45, optional) - IP address of request
- `timestamp` (DateTime) - When action occurred

**Indexes:**
- `userId_timestamp` - Query logs by user and time range

### Collection: secrets
Encrypted storage for sensitive user tokens.

**Attributes:**
- `userId` (String, 36) - User ID
- `encryptedRefreshToken` (String, 5000, optional) - Encrypted OAuth refresh token
- `encryptedAccessToken` (String, 5000, optional) - Encrypted OAuth access token
- `tokenExpiry` (DateTime, optional) - Token expiration time

**Indexes:**
- `userId_index` - Fast lookup by user ID

**Security:** This collection has no read permissions - only server-side API can access.

## Appwrite CLI Reference

Common commands:

```bash
# Deploy all resources
appwrite deploy

# Deploy only databases
appwrite deploy database

# Deploy only collections
appwrite deploy collection

# Pull current schema from server
appwrite init project

# List all databases
appwrite databases list

# List collections in a database
appwrite databases listCollections --databaseId=<id>
```

## Troubleshooting

**"Appwrite CLI not found"**
- Install: `npm install -g appwrite-cli`

**"Missing environment variables"**
- Ensure `app/.env.local` has APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY

**"Attribute already exists"**
- Appwrite CLI is idempotent but won't modify existing attributes
- To change attributes, delete them in console first or use a migration script

**"Permission denied"**
- Check your API key has `databases.*` scope in Appwrite console

## CI/CD Integration

To automatically deploy schema changes in CI/CD:

```yaml
# Example GitHub Actions
- name: Deploy Appwrite Schema
  env:
    APPWRITE_ENDPOINT: ${{ secrets.APPWRITE_ENDPOINT }}
    APPWRITE_PROJECT_ID: ${{ secrets.APPWRITE_PROJECT_ID }}
    APPWRITE_API_KEY: ${{ secrets.APPWRITE_API_KEY }}
  run: |
    npm install -g appwrite-cli
    ./scripts/deploy-appwrite.sh
```

## Learn More

- [Appwrite Databases Documentation](https://appwrite.io/docs/databases)
- [Appwrite CLI Documentation](https://appwrite.io/docs/command-line)
- [Appwrite JSON Schema Reference](https://appwrite.io/docs/databases#schema)
