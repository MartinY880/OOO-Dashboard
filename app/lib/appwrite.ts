/**
 * Appwrite SDK client and helper functions
 * Server-side only - never expose API keys to the client
 */

import { Client, Databases, Users, Query } from 'node-appwrite';
import { logger } from './logger';
import type { UserProfile, AuditLog } from './validators';

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT!;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID!;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY!;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  throw new Error('Missing required Appwrite environment variables');
}

/**
 * Initialize Appwrite server client
 */
export function getAppwriteClient(): Client {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);
  
  return client;
}

/**
 * Get Appwrite Databases instance
 */
export function getDatabase(): Databases {
  return new Databases(getAppwriteClient());
}

/**
 * Get Appwrite Users instance
 */
export function getUsersApi(): Users {
  return new Users(getAppwriteClient());
}

const DATABASE_ID = APPWRITE_PROJECT_ID;
const COLLECTIONS = {
  profiles: 'profiles',
  auditLogs: 'auditLogs',
  secrets: 'secrets',
};

/**
 * Profile management
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  try {
    const db = getDatabase();
    const response = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.profiles,
      [Query.equal('userId', userId), Query.limit(1)]
    );
    
    if (response.documents.length === 0) {
      return null;
    }
    
    const doc = response.documents[0] as any;
    return {
      userId: doc.userId,
      displayName: doc.displayName,
      email: doc.email,
      timeZone: doc.timeZone || 'America/New_York',
      role: doc.role || 'user',
    };
  } catch (error) {
    logger.error('Failed to get profile', error, { userId });
    throw error;
  }
}

export async function createProfile(profile: UserProfile): Promise<void> {
  try {
    const db = getDatabase();
    await db.createDocument(
      DATABASE_ID,
      COLLECTIONS.profiles,
      'unique()',
      profile
    );
    
    logger.info('Profile created', { userId: profile.userId });
  } catch (error) {
    logger.error('Failed to create profile', error, { userId: profile.userId });
    throw error;
  }
}

export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  try {
    const db = getDatabase();
    const response = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.profiles,
      [Query.equal('userId', userId), Query.limit(1)]
    );
    
    if (response.documents.length === 0) {
      throw new Error('Profile not found');
    }
    
    const docId = response.documents[0].$id;
    await db.updateDocument(
      DATABASE_ID,
      COLLECTIONS.profiles,
      docId,
      updates
    );
    
    logger.info('Profile updated', { userId });
  } catch (error) {
    logger.error('Failed to update profile', error, { userId });
    throw error;
  }
}

/**
 * Audit log management
 */
export async function createAuditLog(log: Omit<AuditLog, 'createdAt'>): Promise<void> {
  try {
    const db = getDatabase();
    await db.createDocument(
      DATABASE_ID,
      COLLECTIONS.auditLogs,
      'unique()',
      {
        ...log,
        createdAt: new Date().toISOString(),
      }
    );
    
    logger.info('Audit log created', {
      userId: log.userId,
      action: log.action,
      status: log.status,
    });
  } catch (error) {
    logger.error('Failed to create audit log', error);
    // Don't throw - audit logging failure shouldn't break the main flow
  }
}

export async function getAuditLogs(
  userId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  try {
    const db = getDatabase();
    const response = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.auditLogs,
      [
        Query.equal('userId', userId),
        Query.orderDesc('createdAt'),
        Query.limit(limit),
      ]
    );
    
    return response.documents.map((doc: any) => ({
      userId: doc.userId,
      userEmail: doc.userEmail,
      action: doc.action,
      mode: doc.mode,
      status: doc.status,
      payload: doc.payload,
      error: doc.error,
      responseData: doc.responseData,
      createdAt: doc.createdAt,
    }));
  } catch (error) {
    logger.error('Failed to get audit logs', error, { userId });
    return [];
  }
}

/**
 * Secrets management (refresh tokens)
 */
export async function getSecret(
  userId: string,
  provider: string
): Promise<string | null> {
  try {
    const db = getDatabase();
    const response = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.secrets,
      [
        Query.equal('userId', userId),
        Query.equal('provider', provider),
        Query.limit(1),
      ]
    );
    
    if (response.documents.length === 0) {
      return null;
    }
    
    return (response.documents[0] as any).refreshTokenEnc;
  } catch (error) {
    logger.error('Failed to get secret', error, { userId, provider });
    throw error;
  }
}

export async function saveSecret(
  userId: string,
  provider: string,
  refreshTokenEnc: string
): Promise<void> {
  try {
    const db = getDatabase();
    
    // Check if secret exists
    const existing = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.secrets,
      [
        Query.equal('userId', userId),
        Query.equal('provider', provider),
        Query.limit(1),
      ]
    );
    
    const now = new Date().toISOString();
    
    if (existing.documents.length > 0) {
      // Update existing
      await db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.secrets,
        existing.documents[0].$id,
        {
          refreshTokenEnc,
          updatedAt: now,
        }
      );
    } else {
      // Create new
      await db.createDocument(
        DATABASE_ID,
        COLLECTIONS.secrets,
        'unique()',
        {
          userId,
          provider,
          refreshTokenEnc,
          createdAt: now,
          updatedAt: now,
        }
      );
    }
    
    logger.info('Secret saved', { userId, provider });
  } catch (error) {
    logger.error('Failed to save secret', error, { userId, provider });
    throw error;
  }
}

export async function deleteSecret(userId: string, provider: string): Promise<void> {
  try {
    const db = getDatabase();
    const response = await db.listDocuments(
      DATABASE_ID,
      COLLECTIONS.secrets,
      [
        Query.equal('userId', userId),
        Query.equal('provider', provider),
        Query.limit(1),
      ]
    );
    
    if (response.documents.length > 0) {
      await db.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.secrets,
        response.documents[0].$id
      );
      
      logger.info('Secret deleted', { userId, provider });
    }
  } catch (error) {
    logger.error('Failed to delete secret', error, { userId, provider });
    throw error;
  }
}
