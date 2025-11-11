#!/bin/bash

# Appwrite Database Setup Script
# This script creates the database and collections needed for the OOO Dashboard

set -e  # Exit on error

echo "🚀 Setting up Appwrite database and collections..."

# Check if Appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    echo "❌ Appwrite CLI not found. Installing..."
    npm install -g appwrite-cli
fi

# Load environment variables
if [ -f "app/.env.local" ]; then
    export $(cat app/.env.local | grep -v '^#' | xargs)
elif [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.local file not found"
    echo "Please create app/.env.local with APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY"
    exit 1
fi

# Validate required environment variables
if [ -z "$APPWRITE_ENDPOINT" ] || [ -z "$APPWRITE_PROJECT_ID" ] || [ -z "$APPWRITE_API_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Required: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY"
    exit 1
fi

echo "📋 Configuration:"
echo "  Endpoint: $APPWRITE_ENDPOINT"
echo "  Project ID: $APPWRITE_PROJECT_ID"
echo ""

# Login to Appwrite
echo "🔐 Configuring Appwrite CLI..."
appwrite client \
    --endpoint "$APPWRITE_ENDPOINT" \
    --projectId "$APPWRITE_PROJECT_ID" \
    --key "$APPWRITE_API_KEY"

DATABASE_ID="$APPWRITE_PROJECT_ID"

# Create Database
echo "📦 Creating database..."
appwrite databases create \
    --databaseId "$DATABASE_ID" \
    --name "OOO Dashboard" \
    2>/dev/null || echo "  ℹ️  Database already exists"

# Collection 1: profiles
echo "👤 Creating 'profiles' collection..."
appwrite databases createCollection \
    --databaseId "$DATABASE_ID" \
    --collectionId "profiles" \
    --name "User Profiles" \
    --permissions 'read("any")' \
    2>/dev/null || echo "  ℹ️  Collection already exists"

echo "  Adding attributes to profiles..."
appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "profiles" \
    --key "userId" \
    --size 36 \
    --required true \
    2>/dev/null || echo "    ℹ️  userId attribute exists"

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "profiles" \
    --key "displayName" \
    --size 255 \
    --required true \
    2>/dev/null || echo "    ℹ️  displayName attribute exists"

appwrite databases createEmailAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "profiles" \
    --key "email" \
    --required true \
    2>/dev/null || echo "    ℹ️  email attribute exists"

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "profiles" \
    --key "timeZone" \
    --size 100 \
    --required true \
    --default "America/New_York" \
    2>/dev/null || echo "    ℹ️  timeZone attribute exists"

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "profiles" \
    --key "role" \
    --size 50 \
    --required true \
    --default "user" \
    2>/dev/null || echo "    ℹ️  role attribute exists"

echo "  Creating userId index..."
appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "profiles" \
    --key "userId_index" \
    --type "key" \
    --attributes "userId" \
    --orders "ASC" \
    2>/dev/null || echo "    ℹ️  userId index exists"

# Collection 2: auditLogs
echo "📝 Creating 'auditLogs' collection..."
appwrite databases createCollection \
    --databaseId "$DATABASE_ID" \
    --collectionId "auditLogs" \
    --name "Audit Logs" \
    --permissions 'read("role:admin")' \
    2>/dev/null || echo "  ℹ️  Collection already exists"

echo "  Adding attributes to auditLogs..."
appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "auditLogs" \
    --key "userId" \
    --size 36 \
    --required true \
    2>/dev/null || echo "    ℹ️  userId attribute exists"

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "auditLogs" \
    --key "action" \
    --size 100 \
    --required true \
    2>/dev/null || echo "    ℹ️  action attribute exists"

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "auditLogs" \
    --key "details" \
    --size 5000 \
    --required false \
    2>/dev/null || echo "    ℹ️  details attribute exists"

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "auditLogs" \
    --key "ipAddress" \
    --size 45 \
    --required false \
    2>/dev/null || echo "    ℹ️  ipAddress attribute exists"

appwrite databases createDatetimeAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "auditLogs" \
    --key "timestamp" \
    --required true \
    2>/dev/null || echo "    ℹ️  timestamp attribute exists"

echo "  Creating userId_timestamp index..."
appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "auditLogs" \
    --key "userId_timestamp" \
    --type "key" \
    --attributes "userId" "timestamp" \
    --orders "ASC" "DESC" \
    2>/dev/null || echo "    ℹ️  userId_timestamp index exists"

# Collection 3: secrets
echo "🔐 Creating 'secrets' collection..."
appwrite databases createCollection \
    --databaseId "$DATABASE_ID" \
    --collectionId "secrets" \
    --name "User Secrets" \
    2>/dev/null || echo "  ℹ️  Collection already exists"

echo "  Adding attributes to secrets..."
appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "secrets" \
    --key "userId" \
    --size 36 \
    --required true \
    2>/dev/null || echo "    ℹ️  userId attribute exists"

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "secrets" \
    --key "encryptedRefreshToken" \
    --size 5000 \
    --required false \
    2>/dev/null || echo "    ℹ️  encryptedRefreshToken attribute exists"

appwrite databases createStringAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "secrets" \
    --key "encryptedAccessToken" \
    --size 5000 \
    --required false \
    2>/dev/null || echo "    ℹ️  encryptedAccessToken attribute exists"

appwrite databases createDatetimeAttribute \
    --databaseId "$DATABASE_ID" \
    --collectionId "secrets" \
    --key "tokenExpiry" \
    --required false \
    2>/dev/null || echo "    ℹ️  tokenExpiry attribute exists"

echo "  Creating userId index..."
appwrite databases createIndex \
    --databaseId "$DATABASE_ID" \
    --collectionId "secrets" \
    --key "userId_index" \
    --type "key" \
    --attributes "userId" \
    --orders "ASC" \
    2>/dev/null || echo "    ℹ️  userId index exists"

echo ""
echo "✅ Appwrite database setup complete!"
echo ""
echo "📊 Summary:"
echo "  Database ID: $DATABASE_ID"
echo "  Collections:"
echo "    - profiles (User Profiles)"
echo "    - auditLogs (Audit Logs)"
echo "    - secrets (User Secrets)"
echo ""
echo "🎉 You can now run your application!"
