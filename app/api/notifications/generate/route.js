import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import notificationService from '../../../../lib/notificationService';

export async function POST(request) {
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
    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let notificationsCreated = 0;

    switch (action) {
      case 'perspective_session_completed':
        // Check for milestones when a perspective session is completed
        notificationsCreated = await notificationService.checkMilestones(user.id);
        break;

      case 'journal_entry_created':
        // Check for journal-related milestones
        notificationsCreated = await notificationService.checkMilestones(user.id);
        break;

      case 'mood_tracked':
        // Check for mood tracking milestones
        notificationsCreated = await notificationService.checkMilestones(user.id);
        break;

      case 'create_daily_reminder':
        // Create a daily reflection reminder
        await notificationService.createDailyReflectionReminder(user.id);
        notificationsCreated = 1;
        break;

      case 'create_weekly_reminder':
        // Create a weekly check-in reminder
        await notificationService.createWeeklyCheckInReminder(user.id);
        notificationsCreated = 1;
        break;

      case 'create_mindfulness_tip':
        // Create a random mindfulness tip
        await notificationService.createMindfulnessTip(user.id);
        notificationsCreated = 1;
        break;

      case 'create_custom_notification':
        // Create a custom notification
        const { title, message, type, scheduled_for } = data;
        if (!title || !message || !type) {
          return NextResponse.json(
            { error: 'Title, message, and type are required for custom notifications' },
            { status: 400 }
          );
        }
        await notificationService.createNotification(
          user.id,
          title,
          message,
          type,
          scheduled_for
        );
        notificationsCreated = 1;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: 'Notifications generated successfully',
      count: notificationsCreated
    });

  } catch (error) {
    console.error('Error generating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to generate notifications' },
      { status: 500 }
    );
  }
}
