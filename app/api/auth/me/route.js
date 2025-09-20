import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { syncUser } from '../../../../lib/clerkSync';

export async function GET(request) {
  try {
    const authStatus = request.headers.get('x-clerk-auth-status');
    const authToken = request.headers.get('x-clerk-auth-token');
    const sessionToken = request.headers.get('x-clerk-session-token');
    
    if (authStatus !== 'signed-in') {
      console.log('User not signed in according to Clerk headers');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let clerkUser;
    let userId;
    
    try {
      clerkUser = await currentUser();

      if (clerkUser) {
        userId = clerkUser.id;
      }
    } catch (error) {
      console.log('Error getting currentUser():', error.message);
    }
    
    if (!userId) {
      try {
        const authResult = auth();
        userId = authResult?.userId;
      } catch (error) {
        console.log('Error with auth():', error.message);
      }
    }
    
    if (!userId && authToken) {
      try {
        // Clerk JWT tokens have the userId in the 'sub' field
        const tokenPayload = JSON.parse(atob(authToken.split('.')[1]));
        userId = tokenPayload.sub;
      } catch (error) {
        console.log('Error parsing JWT token:', error.message);
      }
    }
    
    if (!userId && sessionToken) {
      try {
        const sessionPayload = JSON.parse(atob(sessionToken.split('.')[1]));
        userId = sessionPayload.sub || sessionPayload.userId || sessionPayload.user_id;
      } catch (error) {
        console.log('Error parsing session token:', error.message);
      }
    }
    
    if (!userId) {
      console.log('No userId found after all attempts');
      return NextResponse.json({ error: 'Unauthorized - No user ID found' }, { status: 401 });
    }
    
    if (!clerkUser && userId) {
      try {
        clerkUser = await currentUser();
      } catch (error) {
        console.log('Retry error getting currentUser():', error.message);
      }
    }
    
    if (!clerkUser) {
      console.log('No clerkUser available - creating minimal user object');
      // Create a minimal user object if we have userId but no clerkUser
      clerkUser = {
        id: userId,
        emailAddresses: [{ emailAddress: 'unknown@example.com' }],
        firstName: 'Unknown',
        lastName: 'User',
        imageUrl: null
      };
    }

    const localUser = await syncUser(clerkUser);

    // Return user with all necessary fields for profile
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
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
