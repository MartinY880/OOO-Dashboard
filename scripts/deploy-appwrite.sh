#!/bin/bash

# Appwrite Deployment Script
# This script deploys the database schema to your Appwrite server
# Run this after making changes to appwrite.json

set -e

echo "🚀 Deploying Appwrite configuration..."
echo ""

# Check if appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    echo "⚠️  Appwrite CLI not found. Install it with:"
    echo "   npm install -g appwrite-cli"
    exit 1
fi

# Check if appwrite.json exists
if [ ! -f "appwrite.json" ]; then
    echo "❌ appwrite.json not found in current directory"
    exit 1
fi

# Load environment variables if .env.local exists
if [ -f "app/.env.local" ]; then
    export $(cat app/.env.local | grep -v '^#' | xargs)
elif [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Validate required environment variables
if [ -z "$APPWRITE_ENDPOINT" ] || [ -z "$APPWRITE_PROJECT_ID" ] || [ -z "$APPWRITE_API_KEY" ]; then
    echo "❌ Missing required environment variables"
    echo "Please set: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY"
    exit 1
fi

echo "📋 Configuration:"
echo "  Endpoint: $APPWRITE_ENDPOINT"
echo "  Project ID: $APPWRITE_PROJECT_ID"
echo ""

# Initialize Appwrite CLI
echo "🔐 Configuring Appwrite CLI..."
appwrite client \
    --endpoint "$APPWRITE_ENDPOINT" \
    --projectId "$APPWRITE_PROJECT_ID" \
    --key "$APPWRITE_API_KEY"

echo ""
echo "📦 Deploying databases and collections..."
appwrite deploy database

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Created:"
echo "  - Database: OOO Dashboard"
echo "  - Collection: profiles"
echo "  - Collection: auditLogs"
echo "  - Collection: secrets"
echo ""
