import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from './prisma';

export async function getAuthenticatedUserId(request) {
  const authStatus = request.headers.get('x-clerk-auth-status');
  const authToken = request.headers.get('x-clerk-auth-token');
  const sessionToken = request.headers.get('x-clerk-session-token');
  
  
  if (authStatus !== 'signed-in') {
    return {
      userId: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
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
    return {
      userId: null,
      error: NextResponse.json({ error: 'Unauthorized - No user ID found' }, { status: 401 })
    };
  }

  return { userId, error: null };
}


export async function getAuthenticatedUser(request) {
  const { userId, error } = await getAuthenticatedUserId(request);
  
  if (error) {
    return { user: null, error };
  }

  const localUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!localUser) {
    console.log('User not found in local database with clerkId:', userId);
    return {
      user: null,
      error: NextResponse.json({ error: 'User not found' }, { status: 404 })
    };
  }
  return { user: localUser, error: null };
}

export async function withAuth(request, handler) {
  const { user, error } = await getAuthenticatedUser(request);
  
  if (error) {
    return error;
  }
  
  return handler(user);
}
