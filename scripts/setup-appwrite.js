#!/usr/bin/env node

/**
 * Appwrite Database Setup Script
 * Creates database and collections needed for OOO Dashboard
 * 
 * Usage: node scripts/setup-appwrite.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, ignoreError = false) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (!ignoreError) {
      throw error;
    }
    return false;
  }
}

function loadEnv() {
  const envPaths = [
    path.join(__dirname, '..', 'app', '.env.local'),
    path.join(__dirname, '..', '.env.local'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
      
      log(`📄 Loaded environment from: ${envPath}`, 'blue');
      return true;
    }
  }
  
  return false;
}

async function main() {
  log('🚀 Setting up Appwrite database and collections...', 'blue');
  console.log();

  // Check if Appwrite CLI is installed
  try {
    execSync('appwrite --version', { stdio: 'ignore' });
  } catch {
    log('❌ Appwrite CLI not found. Installing...', 'yellow');
    exec('npm install -g appwrite-cli');
  }

  // Load environment variables
  if (!loadEnv()) {
    log('❌ Error: .env.local file not found', 'red');
    log('Please create app/.env.local with APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY', 'red');
    process.exit(1);
  }

  // Validate required environment variables
  const required = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log('❌ Error: Missing required environment variables', 'red');
    log(`Required: ${missing.join(', ')}`, 'red');
    process.exit(1);
  }

  const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY } = process.env;
  const DATABASE_ID = APPWRITE_PROJECT_ID;

  log('📋 Configuration:', 'blue');
  log(`  Endpoint: ${APPWRITE_ENDPOINT}`);
  log(`  Project ID: ${APPWRITE_PROJECT_ID}`);
  console.log();

  // Configure Appwrite CLI
  log('🔐 Configuring Appwrite CLI...', 'blue');
  exec(`appwrite client --endpoint "${APPWRITE_ENDPOINT}" --projectId "${APPWRITE_PROJECT_ID}" --key "${APPWRITE_API_KEY}"`);
  console.log();

  // Create Database
  log('📦 Creating database...', 'blue');
  exec(`appwrite databases create --databaseId "${DATABASE_ID}" --name "OOO Dashboard"`, true);
  console.log();

  // Collection 1: profiles
  log('👤 Creating profiles collection...', 'blue');
  exec(`appwrite databases createCollection --databaseId "${DATABASE_ID}" --collectionId "profiles" --name "User Profiles" --permissions 'read("any")'`, true);
  
  log('  Adding attributes to profiles...', 'blue');
  exec(`appwrite databases createStringAttribute --databaseId "${DATABASE_ID}" --collectionId "profiles" --key "userId" --size 36 --required true`, true);
  exec(`appwrite databases createStringAttribute --databaseId "${DATABASE_ID}" --collectionId "profiles" --key "displayName" --size 255 --required true`, true);
  exec(`appwrite databases createEmailAttribute --databaseId "${DATABASE_ID}" --collectionId "profiles" --key "email" --required true`, true);
  exec(`appwrite databases createStringAttribute --databaseId "${DATABASE_ID}" --collectionId "profiles" --key "timeZone" --size 100 --required true --default "America/New_York"`, true);
  exec(`appwrite databases createStringAttribute --databaseId "${DATABASE_ID}" --collectionId "profiles" --key "role" --size 50 --required true --default "user"`, true);
  
  log('  Creating userId index...', 'blue');
  exec(`appwrite databases createIndex --databaseId "${DATABASE_ID}" --collectionId "profiles" --key "userId_index" --type "key" --attributes "userId" --orders "ASC"`, true);
  console.log();

  // Collection 2: auditLogs
  log('📝 Creating auditLogs collection...', 'blue');
  exec(`appwrite databases createCollection --databaseId "${DATABASE_ID}" --collectionId "auditLogs" --name "Audit Logs" --permissions 'read("role:admin")'`, true);
  
  log('  Adding attributes to auditLogs...', 'blue');
  exec(`appwrite databases createStringAttribute --databaseId "${DATABASE_ID}" --collectionId "auditLogs" --key "userId" --size 36 --required true`, true);
  exec(`appwrite databases createStringAttribute --databaseId "${DATABASE_ID}" --collectionId "auditLogs" --key "action" --size 100 --required true`, true);
  exec(`appwrite databases createStringAttribute --databaseId "${DATABASE_ID}" --collectionId "auditLogs" --key "details" --size 5000 --required false`, true);
  exec(`appwrite databases createStringAttribute --databaseId "${DATABASE_ID}" --collectionId "auditLogs" --key "ipAddress" --size 45 --required false`, true);
  exec(`appwrite databases createDatetimeAttribute --databaseId "${DATABASE_ID}" --collectionId "auditLogs" --key "timestamp" --required true`, true);
  
  log('  Creating userId_timestamp index...', 'blue');
  exec(`appwrite databases createIndex --databaseId "${DATABASE_ID}" --collectionId "auditLogs" --key "userId_timestamp" --type "key" --attributes "userId" "timestamp" --orders "ASC" "DESC"`, true);
  console.log();

  // Collection 3: secrets
  log('🔐 Creating secrets collection...', 'blue');
  exec(`appwrite databases createCollection --databaseId "${DATABASE_ID}" --collectionId "secrets" --name "User Secrets"`, true);
  
  log('  Adding attributes to secrets...', 'blue');
  exec(`appwrite databases createStringAttribute --databaseId "${DATABASE_ID}" --collectionId "secrets" --key "userId" --size 36 --required true`, true);
  exec(`appwrite databases createStringAttribute --databaseId "${DATABASE_ID}" --collectionId "secrets" --key "encryptedRefreshToken" --size 5000 --required false`, true);
  exec(`appwrite databases createStringAttribute --databaseId "${DATABASE_ID}" --collectionId "secrets" --key "encryptedAccessToken" --size 5000 --required false`, true);
  exec(`appwrite databases createDatetimeAttribute --databaseId "${DATABASE_ID}" --collectionId "secrets" --key "tokenExpiry" --required false`, true);
  
  log('  Creating userId index...', 'blue');
  exec(`appwrite databases createIndex --databaseId "${DATABASE_ID}" --collectionId "secrets" --key "userId_index" --type "key" --attributes "userId" --orders "ASC"`, true);
  console.log();

  log('✅ Appwrite database setup complete!', 'green');
  console.log();
  log('📊 Summary:', 'blue');
  log(`  Database ID: ${DATABASE_ID}`);
  log('  Collections:');
  log('    - profiles (User Profiles)');
  log('    - auditLogs (Audit Logs)');
  log('    - secrets (User Secrets)');
  console.log();
  log('🎉 You can now run your application!', 'green');
}

main().catch(error => {
  log(`❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
