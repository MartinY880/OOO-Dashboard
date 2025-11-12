/**
 * Direct database setup using Appwrite SDK
 * Run with: node scripts/setup-appwrite-direct.js
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
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
  log('🚀 Setting up Appwrite database using SDK...', 'blue');
  console.log();

  // Load environment
  if (!loadEnv()) {
    log('❌ Error: .env.local file not found', 'red');
    process.exit(1);
  }

  const required = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log(`❌ Error: Missing required environment variables: ${missing.join(', ')}`, 'red');
    process.exit(1);
  }

  const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY } = process.env;
  const DATABASE_ID = APPWRITE_PROJECT_ID;

  log('📋 Configuration:', 'blue');
  log(`  Endpoint: ${APPWRITE_ENDPOINT}`);
  log(`  Project ID: ${APPWRITE_PROJECT_ID}`);
  console.log();

  // Import Appwrite SDK
  const sdk = require('node-appwrite');
  const client = new sdk.Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);

  try {
    // Create Database
    log('📦 Creating database...', 'blue');
    try {
      await databases.create(DATABASE_ID, 'OOO Dashboard');
      log('  ✅ Database created successfully', 'green');
    } catch (error) {
      if (error.code === 409) {
        log('  ℹ️  Database already exists', 'yellow');
      } else {
        throw error;
      }
    }
    console.log();

    // Collection 1: profiles
    log('👤 Creating profiles collection...', 'blue');
    try {
      await databases.createCollection(
        DATABASE_ID,
        'profiles',
        'User Profiles',
        [sdk.Permission.read(sdk.Role.any())]
      );
      log('  ✅ Collection created', 'green');
    } catch (error) {
      if (error.code === 409) {
        log('  ℹ️  Collection already exists', 'yellow');
      } else {
        throw error;
      }
    }

    // Add attributes to profiles
    log('  Adding attributes...', 'blue');
    const profileAttrs = [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'displayName', type: 'string', size: 255, required: true },
      { key: 'email', type: 'email', required: true },
      { key: 'timeZone', type: 'string', size: 100, required: true, default: 'America/New_York' },
      { key: 'role', type: 'string', size: 50, required: true, default: 'user' },
    ];

    for (const attr of profileAttrs) {
      try {
        if (attr.type === 'email') {
          await databases.createEmailAttribute(DATABASE_ID, 'profiles', attr.key, attr.required, attr.default);
        } else {
          await databases.createStringAttribute(DATABASE_ID, 'profiles', attr.key, attr.size, attr.required, attr.default);
        }
        log(`    ✅ ${attr.key}`, 'green');
      } catch (error) {
        if (error.code === 409) {
          log(`    ℹ️  ${attr.key} exists`, 'yellow');
        } else {
          log(`    ⚠️  ${attr.key}: ${error.message}`, 'yellow');
        }
      }
    }

    // Create index
    try {
      await databases.createIndex(DATABASE_ID, 'profiles', 'userId_index', 'key', ['userId'], ['ASC']);
      log('    ✅ userId index created', 'green');
    } catch (error) {
      if (error.code === 409) {
        log('    ℹ️  userId index exists', 'yellow');
      }
    }
    console.log();

    // Collection 2: auditLogs
    log('📝 Creating auditLogs collection...', 'blue');
    try {
      await databases.createCollection(
        DATABASE_ID,
        'auditLogs',
        'Audit Logs',
        [sdk.Permission.read(sdk.Role.user(null, 'verified'))]
      );
      log('  ✅ Collection created', 'green');
    } catch (error) {
      if (error.code === 409) {
        log('  ℹ️  Collection already exists', 'yellow');
      } else {
        throw error;
      }
    }

    log('  Adding attributes...', 'blue');
    const auditAttrs = [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'action', type: 'string', size: 100, required: true },
      { key: 'details', type: 'string', size: 5000, required: false },
      { key: 'ipAddress', type: 'string', size: 45, required: false },
      { key: 'timestamp', type: 'datetime', required: true },
    ];

    for (const attr of auditAttrs) {
      try {
        if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(DATABASE_ID, 'auditLogs', attr.key, attr.required);
        } else {
          await databases.createStringAttribute(DATABASE_ID, 'auditLogs', attr.key, attr.size, attr.required);
        }
        log(`    ✅ ${attr.key}`, 'green');
      } catch (error) {
        if (error.code === 409) {
          log(`    ℹ️  ${attr.key} exists`, 'yellow');
        } else {
          log(`    ⚠️  ${attr.key}: ${error.message}`, 'yellow');
        }
      }
    }

    try {
      await databases.createIndex(DATABASE_ID, 'auditLogs', 'userId_timestamp', 'key', ['userId', 'timestamp'], ['ASC', 'DESC']);
      log('    ✅ userId_timestamp index created', 'green');
    } catch (error) {
      if (error.code === 409) {
        log('    ℹ️  userId_timestamp index exists', 'yellow');
      }
    }
    console.log();

    // Collection 3: secrets
    log('🔐 Creating secrets collection...', 'blue');
    try {
      await databases.createCollection(
        DATABASE_ID,
        'secrets',
        'User Secrets',
        []
      );
      log('  ✅ Collection created', 'green');
    } catch (error) {
      if (error.code === 409) {
        log('  ℹ️  Collection already exists', 'yellow');
      } else {
        throw error;
      }
    }

    log('  Adding attributes...', 'blue');
    const secretAttrs = [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'encryptedRefreshToken', type: 'string', size: 5000, required: false },
      { key: 'encryptedAccessToken', type: 'string', size: 5000, required: false },
      { key: 'tokenExpiry', type: 'datetime', required: false },
    ];

    for (const attr of secretAttrs) {
      try {
        if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(DATABASE_ID, 'secrets', attr.key, attr.required);
        } else {
          await databases.createStringAttribute(DATABASE_ID, 'secrets', attr.key, attr.size, attr.required);
        }
        log(`    ✅ ${attr.key}`, 'green');
      } catch (error) {
        if (error.code === 409) {
          log(`    ℹ️  ${attr.key} exists`, 'yellow');
        } else {
          log(`    ⚠️  ${attr.key}: ${error.message}`, 'yellow');
        }
      }
    }

    try {
      await databases.createIndex(DATABASE_ID, 'secrets', 'userId_index', 'key', ['userId'], ['ASC']);
      log('    ✅ userId index created', 'green');
    } catch (error) {
      if (error.code === 409) {
        log('    ℹ️  userId index exists', 'yellow');
      }
    }
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
    log('🎉 You can now use your application!', 'green');

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    if (error.response) {
      console.error(error.response);
    }
    process.exit(1);
  }
}

main();
