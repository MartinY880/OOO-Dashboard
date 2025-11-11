/**
 * n8n webhook client
 * Sends signed payloads to n8n for processing
 */

import { createHmac } from 'crypto';
import { logger } from './logger';
import type { ExecutionMode } from './validators';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_SIGNATURE_SECRET = process.env.N8N_SIGNATURE_SECRET;

/**
 * Payload sent to n8n webhook
 */
export interface N8nPayload {
  subjectId: string;
  upn: string;
  action: 'set-oof' | 'set-forwarding' | 'clear-forwarding';
  data: Record<string, any>;
  timestamp?: string;
}

/**
 * Compute HMAC SHA-256 signature
 */
function computeSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Send signed payload to n8n webhook
 */
export async function postToN8n(payload: N8nPayload): Promise<any> {
  if (!N8N_WEBHOOK_URL || !N8N_SIGNATURE_SECRET) {
    throw new Error('n8n webhook URL or signature secret not configured');
  }
  
  // Add timestamp
  const fullPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  };
  
  const body = JSON.stringify(fullPayload);
  const signature = computeSignature(body, N8N_SIGNATURE_SECRET);
  
  logger.info('Sending request to n8n', {
    action: payload.action,
    subjectId: payload.subjectId,
  });
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature,
      },
      body,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n webhook returned ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    logger.info('n8n webhook response received', {
      action: payload.action,
      status: response.status,
    });
    
    return result;
  } catch (error) {
    logger.error('Failed to call n8n webhook', error, {
      action: payload.action,
      subjectId: payload.subjectId,
    });
    throw error;
  }
}

/**
 * Verify incoming signature from n8n (if n8n calls back)
 */
export function verifyN8nSignature(
  body: string,
  signature: string
): boolean {
  if (!N8N_SIGNATURE_SECRET) {
    logger.warn('Cannot verify signature - N8N_SIGNATURE_SECRET not set');
    return false;
  }
  
  const expectedSignature = computeSignature(body, N8N_SIGNATURE_SECRET);
  return signature === expectedSignature;
}
