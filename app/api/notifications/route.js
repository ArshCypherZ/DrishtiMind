import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth, currentUser } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET /api/notifications - Get all notifications for the current user
export async function GET(request) {
  try {
    const authStatus = request.headers.get('x-clerk-auth-status');
    const authToken = request.headers.get('x-clerk-auth-token');
    
    if (authStatus !== 'signed-in') {
      console.log('User not signed in according to Clerk headers');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Try currentUser() first as it's more reliable
    let clerkUser;
    let userId;
    
    try {
      clerkUser = await currentUser();
      if (clerkUser) {
        userId = clerkUser.id;
      }
    } catch (error) {
      console.log('👤 Error getting currentUser():', error.message);
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

    if (!userId) {
      console.log('No userId found after all attempts');
      return NextResponse.json({ error: 'Unauthorized - No user ID found' }, { status: 401 });
    }

    const localUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!localUser) {
      console.log('User not found in local database with clerkId:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = localUser;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const unreadOnly = searchParams.get('unread_only') === 'true';

    const whereClause = {
      user_id: user.id,
      ...(unreadOnly && { is_read: false })
    };

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: whereClause,
      })
    ]);

    return NextResponse.json({
      notifications,
      totalCount,
      hasMore: offset + limit < totalCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const localUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!localUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = localUser;

    const body = await request.json();
    const { title, message, type, scheduled_for } = body;

    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Title, message, and type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['tip', 'milestone', 'check_in', 'daily_reflection', 'task_reminder', 'achievement', 'reminder'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        user_id: user.id,
        title,
        message,
        type,
        scheduled_for: scheduled_for ? new Date(scheduled_for) : null,
        sent_at: scheduled_for ? null : new Date(),
      }
    });

    return NextResponse.json(notification, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
