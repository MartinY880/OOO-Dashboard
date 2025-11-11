/**
 * Out of Office (OOF) API routes
 * POST /api/oof - Set OOF settings
 * GET /api/oof - Get current OOF settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { oofSettingsSchema, executionModeSchema } from '@/lib/validators';
import { setOof, getCurrentOofSettings } from '@/lib/graph';
import { postToN8n } from '@/lib/n8n';
import { createAuditLog } from '@/lib/appwrite';
import { logger } from '@/lib/logger';

const DEFAULT_EXECUTION_MODE = process.env.EXECUTION_MODE || 'graph';

/**
 * GET current OOF settings
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Only works with graph mode
    const settings = await getCurrentOofSettings(user.userId);
    
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    logger.error('GET /api/oof failed', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get OOF settings' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}

/**
 * POST set OOF settings
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    // Validate input
    const settings = oofSettingsSchema.parse(body.settings);
    const mode = executionModeSchema.parse(body.mode || DEFAULT_EXECUTION_MODE);
    
    logger.info('Setting OOF', {
      userId: user.userId,
      mode,
      status: settings.status,
    });
    
    let result: any = null;
    let error: string | undefined;
    
    try {
      if (mode === 'graph') {
        // Direct Graph API call
        await setOof(user.userId, settings);
        result = { message: 'OOF settings updated successfully' };
      } else {
        // n8n webhook
        result = await postToN8n({
          subjectId: user.userId,
          upn: user.email,
          action: 'set-oof',
          data: settings,
        });
      }
      
      // Create audit log
      await createAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: 'set-oof',
        mode,
        status: 'success',
        payload: JSON.stringify(settings),
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
        action: 'set-oof',
        mode,
        status: 'error',
        payload: JSON.stringify(settings),
        error,
      });
      
      throw execError;
    }
  } catch (error: any) {
    logger.error('POST /api/oof failed', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set OOF settings' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}
