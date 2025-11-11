/**
 * Microsoft Graph API client
 * Handles token management and Graph API calls
 */

import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { logger } from './logger';
import { encrypt, decrypt } from './crypto';
import { getSecret, saveSecret } from './appwrite';
import type { OofSettings, ForwardingRule } from './validators';

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || '';
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';
const AZURE_REDIRECT_URI = process.env.AZURE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/azure-ad';

/**
 * MSAL Confidential Client Application
 */
export function getMsalClient(): ConfidentialClientApplication {
  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    throw new Error('Missing required Azure AD environment variables');
  }
  
  return new ConfidentialClientApplication({
    auth: {
      clientId: AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
      clientSecret: AZURE_CLIENT_SECRET,
    },
    system: {
      loggerOptions: {
        loggerCallback(loglevel, message, containsPii) {
          if (!containsPii) {
            logger.debug('MSAL: ' + message);
          }
        },
        piiLoggingEnabled: false,
        logLevel: 3, // Error
      },
    },
  });
}

/**
 * Get access token for a user
 * Uses refresh token from Appwrite secrets
 */
export async function getAccessToken(
  userId: string,
  scopes: string[]
): Promise<string> {
  try {
    // Get encrypted refresh token from Appwrite
    const refreshTokenEnc = await getSecret(userId, 'microsoft');
    
    if (!refreshTokenEnc) {
      throw new Error('No refresh token found. User must authenticate.');
    }
    
    // Decrypt refresh token
    const refreshToken = decrypt(refreshTokenEnc);
    
    // Use MSAL to refresh the access token
    const msalClient = getMsalClient();
    
    const result = await msalClient.acquireTokenByRefreshToken({
      refreshToken,
      scopes,
    });
    
    if (!result) {
      throw new Error('Failed to acquire token');
    }
    
    return result.accessToken;
  } catch (error) {
    logger.error('Failed to get access token', error, { userId });
    throw new Error('Failed to authenticate. Please sign in again.');
  }
}

/**
 * Create authenticated Graph client
 */
export function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * Fetch helper with retry on 401
 */
async function fetchGraph<T>(
  userId: string,
  scopes: string[],
  callback: (client: Client) => Promise<T>
): Promise<T> {
  let accessToken = await getAccessToken(userId, scopes);
  let client = getGraphClient(accessToken);
  
  try {
    return await callback(client);
  } catch (error: any) {
    // If 401, try one more time with fresh token
    if (error.statusCode === 401) {
      logger.warn('Got 401, retrying with fresh token', { userId });
      accessToken = await getAccessToken(userId, scopes);
      client = getGraphClient(accessToken);
      return await callback(client);
    }
    
    throw error;
  }
}

/**
 * Get current mailbox settings (including OOF status)
 */
export async function getCurrentOofSettings(userId: string): Promise<any> {
  const scopes = ['https://graph.microsoft.com/MailboxSettings.Read'];
  
  return fetchGraph(userId, scopes, async (client) => {
    const result = await client.api('/me/mailboxSettings').get();
    return result.automaticRepliesSetting;
  });
}

/**
 * Set Out of Office (OOF) automatic replies
 */
export async function setOof(userId: string, settings: OofSettings): Promise<void> {
  const scopes = ['https://graph.microsoft.com/MailboxSettings.ReadWrite'];
  
  await fetchGraph(userId, scopes, async (client) => {
    await client.api('/me/mailboxSettings').patch({
      automaticRepliesSetting: settings,
    });
  });
  
  logger.info('OOF settings updated', { userId, status: settings.status });
}

/**
 * List message rules (to find our forwarding rule)
 */
export async function listMessageRules(userId: string): Promise<any[]> {
  const scopes = ['https://graph.microsoft.com/Mail.ReadWrite'];
  
  return fetchGraph(userId, scopes, async (client) => {
    const result = await client.api('/me/mailFolders/Inbox/messageRules').get();
    return result.value || [];
  });
}

/**
 * Create email forwarding rule
 */
export async function createForwardingRule(
  userId: string,
  rule: ForwardingRule
): Promise<void> {
  const scopes = ['https://graph.microsoft.com/Mail.ReadWrite'];
  
  await fetchGraph(userId, scopes, async (client) => {
    const ruleBody: any = {
      displayName: `Auto-forward to ${rule.forwardTo}`,
      sequence: 1,
      isEnabled: rule.enabled,
      conditions: {}, // Empty = matches all messages
      actions: {
        forwardTo: [
          {
            emailAddress: {
              address: rule.forwardTo,
            },
          },
        ],
        stopProcessingRules: true,
      },
    };
    
    // If not keeping a copy, also delete
    if (!rule.keepCopy) {
      ruleBody.actions.delete = true;
    }
    
    await client.api('/me/mailFolders/Inbox/messageRules').post(ruleBody);
  });
  
  logger.info('Forwarding rule created', { userId, forwardTo: rule.forwardTo });
}

/**
 * Delete forwarding rule by display name pattern
 */
export async function deleteForwardingRule(
  userId: string,
  forwardTo: string
): Promise<void> {
  const scopes = ['https://graph.microsoft.com/Mail.ReadWrite'];
  
  await fetchGraph(userId, scopes, async (client) => {
    const rules = await client.api('/me/mailFolders/Inbox/messageRules').get();
    
    const targetRuleName = `Auto-forward to ${forwardTo}`;
    const rule = rules.value?.find((r: any) => 
      r.displayName === targetRuleName
    );
    
    if (rule) {
      await client.api(`/me/mailFolders/Inbox/messageRules/${rule.id}`).delete();
      logger.info('Forwarding rule deleted', { userId, ruleId: rule.id });
    } else {
      logger.warn('Forwarding rule not found', { userId, targetRuleName });
    }
  });
}

/**
 * Get current forwarding rule status
 */
export async function getForwardingStatus(userId: string): Promise<{
  hasRule: boolean;
  forwardTo?: string;
  keepCopy?: boolean;
}> {
  try {
    const rules = await listMessageRules(userId);
    
    const forwardingRule = rules.find((r: any) => 
      r.displayName?.startsWith('Auto-forward to ')
    );
    
    if (!forwardingRule) {
      return { hasRule: false };
    }
    
    const forwardTo = forwardingRule.actions?.forwardTo?.[0]?.emailAddress?.address;
    const keepCopy = !forwardingRule.actions?.delete;
    
    return {
      hasRule: true,
      forwardTo,
      keepCopy,
    };
  } catch (error) {
    logger.error('Failed to get forwarding status', error, { userId });
    return { hasRule: false };
  }
}

/**
 * Exchange authorization code for tokens
 * Called from auth callback
 */
export async function exchangeCodeForTokens(
  code: string,
  scopes: string[]
): Promise<AuthenticationResult> {
  const msalClient = getMsalClient();
  
  const result = await msalClient.acquireTokenByCode({
    code,
    scopes,
    redirectUri: AZURE_REDIRECT_URI,
  });
  
  if (!result) {
    throw new Error('Failed to exchange code for tokens');
  }
  
  return result;
}

/**
 * Search for users in the organization
 * Returns a list of users matching the search query
 */
export async function searchUsers(
  userId: string,
  query: string
): Promise<Array<{ value: string; label: string; email: string; name: string }>> {
  try {
    const client = await getGraphClient(userId);
    
    // Search users by displayName or mail
    const response = await client
      .api('/users')
      .filter(
        `startswith(displayName,'${query}') or startswith(mail,'${query}') or startswith(userPrincipalName,'${query}')`
      )
      .select('id,displayName,mail,userPrincipalName')
      .top(10)
      .get();
    
    logger.info('User search results', { userId, query, count: response.value?.length || 0 });
    
    // Map to combobox format
    return (response.value || []).map((user: any) => ({
      value: user.mail || user.userPrincipalName,
      label: `${user.displayName} (${user.mail || user.userPrincipalName})`,
      email: user.mail || user.userPrincipalName,
      name: user.displayName,
    }));
  } catch (error) {
    logger.error('Failed to search users', error, { userId, query });
    throw error;
  }
}
