/**
 * Authentication utilities
 * Uses Appwrite OAuth2 for Microsoft authentication
 */

import { cookies } from 'next/headers';
import { Client, Account } from 'node-appwrite';
import { logger } from './logger';
import { getProfile, createProfile } from './appwrite';
import type { UserProfile } from './validators';

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || '';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '';

/**
 * Get Appwrite session from cookies
 */
function getSessionFromCookies(): string | null {
  try {
    const cookieStore = cookies();
    
    // Try different possible cookie names
    const possibleNames = [
      `a_session_${APPWRITE_PROJECT_ID}`,
      `a_session_${APPWRITE_PROJECT_ID}_legacy`,
      'appwrite_session',
    ];
    
    for (const name of possibleNames) {
      const cookie = cookieStore.get(name);
      if (cookie?.value) {
        logger.info('Found session cookie', { cookieName: name });
        return cookie.value;
      }
    }
    
    // Log all available cookies for debugging
    const allCookies = cookieStore.getAll();
    logger.warn('No Appwrite session cookie found', { 
      availableCookies: allCookies.map((c: any) => c.name),
      expectedNames: possibleNames 
    });
    
    return null;
  } catch (error) {
    logger.error('Failed to get session from cookies', error);
    return null;
  }
}

/**
 * Create Appwrite client with user session
 */
function getAppwriteClientWithSession(session: string): Client {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setSession(session);
  
  return client;
}

/**
 * Get the current authenticated user from Appwrite session
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const session = getSessionFromCookies();
    
    if (!session) {
      return null;
    }

    // Create client with user's session
    const client = getAppwriteClientWithSession(session);
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
export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Check if user has admin role
 */
export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
}
