/**
 * Zod schemas and validators for API requests
 */

import { z } from 'zod';

/**
 * Out of Office (OOF) settings schema
 */
export const oofSettingsSchema = z.object({
  status: z.enum(['disabled', 'alwaysEnabled', 'scheduled']),
  internalReplyMessage: z.string().optional(),
  externalReplyMessage: z.string().optional(),
  scheduledStartDateTime: z.object({
    dateTime: z.string(), // ISO 8601 format
    timeZone: z.string(), // IANA timezone
  }).optional(),
  scheduledEndDateTime: z.object({
    dateTime: z.string(),
    timeZone: z.string(),
  }).optional(),
}).refine(
  (data) => {
    if (data.status === 'scheduled') {
      return !!(data.scheduledStartDateTime && data.scheduledEndDateTime);
    }
    return true;
  },
  {
    message: 'Start and end date/time are required for scheduled status',
  }
);

export type OofSettings = z.infer<typeof oofSettingsSchema>;

/**
 * Email forwarding rule schema
 */
export const forwardingRuleSchema = z.object({
  forwardTo: z.string().email('Must be a valid email address'),
  keepCopy: z.boolean().default(true),
  enabled: z.boolean().default(true),
});

export type ForwardingRule = z.infer<typeof forwardingRuleSchema>;

/**
 * Execution mode schema
 */
export const executionModeSchema = z.enum(['graph', 'n8n']);
export type ExecutionMode = z.infer<typeof executionModeSchema>;

/**
 * User profile schema
 */
export const userProfileSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  timeZone: z.string().default('America/New_York'),
  role: z.enum(['user', 'admin']).default('user'),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

/**
 * Audit log schema
 */
export const auditLogSchema = z.object({
  userId: z.string(),
  userEmail: z.string(),
  action: z.string(),
  mode: executionModeSchema,
  status: z.enum(['success', 'error', 'pending']),
  payload: z.string().optional(), // JSON string
  error: z.string().optional(),
  responseData: z.string().optional(), // JSON string
  createdAt: z.string().or(z.date()),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

/**
 * Validate email is from same domain (security check)
 */
export function validateSameDomain(email: string, allowedDomain?: string): boolean {
  if (!allowedDomain) {
    return true; // Skip validation if no domain specified
  }
  
  const emailDomain = email.split('@')[1]?.toLowerCase();
  return emailDomain === allowedDomain.toLowerCase();
}

/**
 * Validate external forwarding is allowed
 */
export function validateExternalForwarding(
  forwardTo: string,
  userEmail: string
): { valid: boolean; error?: string } {
  const allowExternal = process.env.ALLOW_EXTERNAL_FORWARDING === 'true';
  
  if (allowExternal) {
    return { valid: true };
  }
  
  const userDomain = userEmail.split('@')[1]?.toLowerCase();
  const forwardDomain = forwardTo.split('@')[1]?.toLowerCase();
  
  if (userDomain !== forwardDomain) {
    return {
      valid: false,
      error: `External forwarding is disabled. Must forward to @${userDomain}`,
    };
  }
  
  return { valid: true };
}
