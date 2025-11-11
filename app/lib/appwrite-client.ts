/**
 * Appwrite client SDK for browser
 * Used for OAuth authentication and user sessions
 */

import { Client, Account } from 'appwrite';

// Client-side Appwrite configuration
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

/**
 * Initialize Appwrite client for browser
 */
export function getAppwriteBrowserClient(): Client {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);
  
  return client;
}

/**
 * Get Appwrite Account instance
 */
export function getAccount(): Account {
  return new Account(getAppwriteBrowserClient());
}

/**
 * Initiate Microsoft OAuth2 login
 * Redirects to Microsoft login page
 */
export async function loginWithMicrosoft(successUrl: string = '/dashboard', failureUrl: string = '/auth/error') {
  try {
    const account = getAccount();
    
    // This will redirect to Microsoft OAuth
    await account.createOAuth2Session(
      'microsoft',
      successUrl,
      failureUrl
    );
  } catch (error) {
    console.error('OAuth login failed:', error);
    throw error;
  }
}

/**
 * Get current user session
 */
export async function getCurrentSession() {
  try {
    const account = getAccount();
    return await account.get();
  } catch (error) {
    return null;
  }
}

/**
 * Logout current user
 */
export async function logout() {
  try {
    const account = getAccount();
    await account.deleteSession('current');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}
