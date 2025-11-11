/**
 * Email Forwarding API routes
 * POST /api/forwarding - Create or update forwarding rule
 * DELETE /api/forwarding - Delete forwarding rule
 * GET /api/forwarding - Get current forwarding status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { forwardingRuleSchema, executionModeSchema, validateExternalForwarding } from '@/lib/validators';
import { createForwardingRule, deleteForwardingRule, getForwardingStatus } from '@/lib/graph';
import { postToN8n } from '@/lib/n8n';
import { createAuditLog } from '@/lib/appwrite';
import { logger } from '@/lib/logger';

const DEFAULT_EXECUTION_MODE = process.env.EXECUTION_MODE || 'graph';

/**
 * GET current forwarding status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Only works with graph mode
    const status = await getForwardingStatus(user.userId);
    
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    logger.error('GET /api/forwarding failed', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get forwarding status' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}

/**
 * POST create forwarding rule
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    // Validate input
    const rule = forwardingRuleSchema.parse(body.rule);
    const mode = executionModeSchema.parse(body.mode || DEFAULT_EXECUTION_MODE);
    
    // Validate external forwarding
    const validation = validateExternalForwarding(rule.forwardTo, user.email);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 403 }
      );
    }
    
    logger.info('Creating forwarding rule', {
      userId: user.userId,
      mode,
      forwardTo: rule.forwardTo,
    });
    
    let result: any = null;
    let error: string | undefined;
    
    try {
      if (mode === 'graph') {
        // Direct Graph API call
        await createForwardingRule(user.userId, rule);
        result = { message: 'Forwarding rule created successfully' };
      } else {
        // n8n webhook
        result = await postToN8n({
          subjectId: user.userId,
          upn: user.email,
          action: 'set-forwarding',
          data: rule,
        });
      }
      
      // Create audit log
      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: 'set-forwarding',
        mode,
        status: 'success',
        payload: JSON.stringify(rule),
        responseData: JSON.stringify(result),
      });
      
      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (execError: any) {
      error = execError.message || 'Execution failed';
      
      // Log failure
      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: 'set-forwarding',
        mode,
        status: 'error',
        payload: JSON.stringify(rule),
        error,
      });
      
      throw execError;
    }
  } catch (error: any) {
    logger.error('POST /api/forwarding failed', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create forwarding rule' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}

/**
 * DELETE forwarding rule
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const forwardTo = searchParams.get('forwardTo');
    const modeParam = searchParams.get('mode');
    
    if (!forwardTo) {
      return NextResponse.json(
        { success: false, error: 'forwardTo parameter is required' },
        { status: 400 }
      );
    }
    
    const mode = executionModeSchema.parse(modeParam || DEFAULT_EXECUTION_MODE);
    
    logger.info('Deleting forwarding rule', {
      userId: user.userId,
      mode,
      forwardTo,
    });
    
    let result: any = null;
    let error: string | undefined;
    
    try {
      if (mode === 'graph') {
        // Direct Graph API call
        await deleteForwardingRule(user.userId, forwardTo);
        result = { message: 'Forwarding rule deleted successfully' };
      } else {
        // n8n webhook
        result = await postToN8n({
          subjectId: user.userId,
          upn: user.email,
          action: 'clear-forwarding',
          data: { forwardTo },
        });
      }
      
      // Create audit log
      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: 'clear-forwarding',
        mode,
        status: 'success',
        payload: JSON.stringify({ forwardTo }),
        responseData: JSON.stringify(result),
      });
      
      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (execError: any) {
      error = execError.message || 'Execution failed';
      
      // Log failure
      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: 'clear-forwarding',
        mode,
        status: 'error',
        payload: JSON.stringify({ forwardTo }),
        error,
      });
      
      throw execError;
    }
  } catch (error: any) {
    logger.error('DELETE /api/forwarding failed', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete forwarding rule' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}
