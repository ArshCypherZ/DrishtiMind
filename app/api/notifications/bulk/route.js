import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function PUT(request) {
  try {
    const { userId } = await auth();
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
    const { action, notification_ids } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const whereClause = {
      user_id: user.id,
      ...(notification_ids && { id: { in: notification_ids } })
    };

    let result;

    switch (action) {
      case 'mark_all_read':
        result = await prisma.notification.updateMany({
          where: whereClause,
          data: { is_read: true }
        });
        break;

      case 'mark_all_unread':
        result = await prisma.notification.updateMany({
          where: whereClause,
          data: { is_read: false }
        });
        break;

      case 'delete_all':
        result = await prisma.notification.deleteMany({
          where: whereClause
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Successfully ${action.replace('_', ' ')}d notifications`,
      count: result.count
    });

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
