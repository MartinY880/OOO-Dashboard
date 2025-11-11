/**
 * Users search API route
 * GET /api/users?search=query
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { searchUsers } from '@/lib/graph';
import { logger } from '@/lib/logger';

/**
 * Search for users in the organization
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('search') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Search for users using Microsoft Graph
    const users = await searchUsers(user.userId, query);

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    logger.error('Failed to search users', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search users' },
      { status: 500 }
    );
  }
}
