/**
 * Authentication utilities
 * Uses Appwrite OAuth2 for Microsoft authentication
 */

import { Client, Account, Users } from 'node-appwrite';
import { logger } from './logger';
import { getProfile, createProfile } from './appwrite';
import type { UserProfile } from './validators';

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || '';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';

/**
 * Create an Appwrite client with user session
 * This requires the session token from the client
 */
export function getAppwriteClientWithSession(sessionToken: string): Client {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setJWT(sessionToken);
  
  return client;
}

/**
 * Get the current authenticated user from Appwrite session
 * @param sessionToken - JWT token from client-side Appwrite session
 */
export async function getCurrentUser(sessionToken?: string): Promise<UserProfile | null> {
  try {
    if (!sessionToken) {
      return null;
    }

    // Create client with user's session
    const client = getAppwriteClientWithSession(sessionToken);
    const account = new Account(client);
    
    // Get user info from Appwrite
    const appwriteUser = await account.get();
    
    // Get or create profile in our database
    let profile = await getProfile(appwriteUser.$id);
    
    if (!profile) {
      // Create profile on first login
      await createProfile({
        userId: appwriteUser.$id,
        displayName: appwriteUser.name || appwriteUser.email,
        email: appwriteUser.email,
        timeZone: 'America/New_York',
        role: 'user',
      });
      
      profile = await getProfile(appwriteUser.$id);
    }
    
    return profile;
  } catch (error) {
    logger.error('Failed to get current user', error);
    return null;
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(sessionToken?: string): Promise<UserProfile> {
  const user = await getCurrentUser(sessionToken);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Check if user has admin role
 */
export async function requireAdmin(sessionToken?: string): Promise<UserProfile> {
  const user = await requireAuth(sessionToken);
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
}
