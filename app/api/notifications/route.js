import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../../../lib/authUtils';

const prisma = new PrismaClient();

// GET /api/notifications - Get all notifications for the current user
export async function GET(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

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
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

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
