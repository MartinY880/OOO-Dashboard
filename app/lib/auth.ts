/**
 * Authentication utilities
 * Supports two strategies: MSAL (direct) or Appwrite OAuth
 */

import { getServerSession } from 'next-auth/next';
import { AuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { logger } from './logger';
import { encrypt } from './crypto';
import { saveSecret, getProfile, createProfile } from './appwrite';
import { exchangeCodeForTokens } from './graph';
import type { UserProfile } from './validators';

const AUTH_STRATEGY = process.env.AUTH_STRATEGY || 'msal';
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || '';

/**
 * NextAuth configuration for MSAL strategy
 */
export const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId: AZURE_CLIENT_ID,
      clientSecret: AZURE_CLIENT_SECRET,
      tenantId: AZURE_TENANT_ID,
      authorization: {
        params: {
          scope: 'openid profile email offline_access User.Read MailboxSettings.ReadWrite Mail.ReadWrite',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!account || !user.email) {
          return false;
        }
        
        // Store refresh token if using MSAL strategy
        if (AUTH_STRATEGY === 'msal' && account.refresh_token) {
          const userId = user.id || account.providerAccountId;
          const refreshTokenEnc = encrypt(account.refresh_token);
          await saveSecret(userId, 'microsoft', refreshTokenEnc);
          
          logger.info('Refresh token saved during sign in', { userId });
        }
        
        // Ensure profile exists in Appwrite
        const userId = user.id || account.providerAccountId;
        const existingProfile = await getProfile(userId);
        
        if (!existingProfile) {
          await createProfile({
            userId,
            displayName: user.name || user.email,
            email: user.email,
            timeZone: 'America/New_York',
            role: 'user',
          });
        }
        
        return true;
      } catch (error) {
        logger.error('Sign in callback error', error);
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      // Persist account info in JWT
      if (account) {
        token.accessToken = account.access_token;
        token.userId = account.providerAccountId;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Add user ID to session
      if (session.user) {
        (session.user as any).userId = token.userId;
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
};

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    if (AUTH_STRATEGY === 'msal') {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return null;
      }
      
      const userId = (session.user as any).userId;
      const profile = await getProfile(userId);
      
      return profile;
    }
    
    // TODO: Implement Appwrite OAuth strategy
    // For now, return null
    return null;
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
