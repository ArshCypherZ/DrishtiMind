import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from './prisma';

export async function getAuthenticatedUserId() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        userId: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
    }
    return { userId, error: null };
  } catch (error) {
    console.error('Error resolving auth():', error?.message || error);
    return {
      userId: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }
}

export async function getAuthenticatedUser(request) {
  const { userId, error } = await getAuthenticatedUserId(request);
  if (error) return { user: null, error };

  const localUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!localUser) {
    return {
      user: null,
      error: NextResponse.json({ error: 'User not found' }, { status: 404 })
    };
  }

  return { user: localUser, error: null };
}

export async function withAuth(request, handler) {
  const { user, error } = await getAuthenticatedUser(request);
  if (error) return error;
  return handler(user);
}
