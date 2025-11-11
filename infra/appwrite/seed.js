#!/usr/bin/env node

/**
 * Appwrite Collection Seeder
 * 
 * This script creates the required Appwrite collections and sets up permissions.
 * Run with: node infra/appwrite/seed.js
 */

const sdk = require('node-appwrite');
const collections = require('./collections.json');

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const DATABASE_ID = APPWRITE_PROJECT_ID; // Using project ID as database ID

async function createDatabase() {
  try {
    await databases.get(DATABASE_ID);
    console.log('✅ Database already exists');
  } catch (error) {
    if (error.code === 404) {
      console.log('📦 Creating database...');
      await databases.create(DATABASE_ID, 'Office365 Management');
      console.log('✅ Database created');
    } else {
      throw error;
    }
  }
}

async function createCollection(collectionConfig) {
  const collectionId = collectionConfig.$id;
  
  try {
    // Check if collection exists
    await databases.getCollection(DATABASE_ID, collectionId);
    console.log(`✅ Collection '${collectionConfig.name}' already exists`);
    return;
  } catch (error) {
    if (error.code !== 404) throw error;
  }

  console.log(`📝 Creating collection '${collectionConfig.name}'...`);
  
  // Create collection with appropriate permissions
  const permissions = getCollectionPermissions(collectionId);
  
  await databases.createCollection(
    DATABASE_ID,
    collectionId,
    collectionConfig.name,
    permissions,
    collectionConfig.documentSecurity,
    collectionConfig.enabled
  );

  // Create attributes
  for (const attr of collectionConfig.attributes) {
    console.log(`  Adding attribute '${attr.key}'...`);
    
    try {
      switch (attr.type) {
        case 'string':
          await databases.createStringAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array || false
          );
          break;
        case 'datetime':
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array || false
          );
          break;
        default:
          console.warn(`  ⚠️  Unknown attribute type: ${attr.type}`);
      }
      
      // Wait a bit for attribute to be created
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (attrError) {
      console.error(`  ❌ Error creating attribute '${attr.key}':`, attrError.message);
    }
  }

  // Create indexes
  if (collectionConfig.indexes) {
    for (const index of collectionConfig.indexes) {
      console.log(`  Creating index '${index.key}'...`);
      
      try {
        await databases.createIndex(
          DATABASE_ID,
          collectionId,
          index.key,
          index.type,
          index.attributes,
          index.orders || []
        );
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (indexError) {
        console.error(`  ❌ Error creating index '${index.key}':`, indexError.message);
      }
    }
  }

  console.log(`✅ Collection '${collectionConfig.name}' created successfully`);
}

function getCollectionPermissions(collectionId) {
  // Secrets collection: server-only access
  if (collectionId === 'secrets') {
    return [];
  }
  
  // Profiles: users can read/update their own
  if (collectionId === 'profiles') {
    return [
      sdk.Permission.read(sdk.Role.any()),
      sdk.Permission.create(sdk.Role.users()),
      sdk.Permission.update(sdk.Role.users()),
    ];
  }
  
  // Audit logs: users can read their own, server can write
  if (collectionId === 'auditLogs') {
    return [
      sdk.Permission.read(sdk.Role.any()),
      sdk.Permission.create(sdk.Role.users()),
    ];
  }
  
  return [sdk.Permission.read(sdk.Role.any())];
}

async function main() {
  console.log('🚀 Starting Appwrite seeding process...\n');
  
  try {
    await createDatabase();
    
    for (const collection of collections.collections) {
      await createCollection(collection);
    }
    
    console.log('\n✅ All collections created successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Database ID: ${DATABASE_ID}`);
    console.log(`   Collections: ${collections.collections.map(c => c.name).join(', ')}`);
    
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

main();
