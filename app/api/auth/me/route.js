import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { syncUser } from '../../../../lib/clerkSync';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.log('No userId found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;
    const clerkUser = await client.users.getUser(userId);

    
    if (!clerkUser) {
      console.log('No clerk user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const localUser = await syncUser(clerkUser);
    
    if (!localUser) {
      console.log('No local user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      user: {
        id: localUser.id,
        email: localUser.email,
        username: localUser.username,
        first_name: localUser.first_name,
        last_name: localUser.last_name,
        avatar_url: localUser.avatar_url,
        is_verified: localUser.is_verified,
        total_points: localUser.total_points,
        current_streak: localUser.current_streak,
        longest_streak: localUser.longest_streak,
        sessions: localUser.sessions,
        push_notification: localUser.push_notification,
        dark_mode: localUser.dark_mode,
        wellness_reminders: localUser.wellness_reminders,
        weekly_summary: localUser.weekly_summary,
        created_at: localUser.created_at,
        updated_at: localUser.updated_at
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
