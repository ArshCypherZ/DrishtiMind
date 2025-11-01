import { NextResponse } from 'next/server';
import notificationService from '../../../../lib/notificationService';
import { prisma } from '../../../../lib/prisma';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      processed: 0,
      created: 0,
      errors: 0,
      errorDetails: [],
      details: {
        scheduledProcessed: 0,
        remindersSetup: 0
      }
    };

    try {
      // Process scheduled notifications (past due date)
      const scheduledProcessed = await notificationService.processScheduledNotifications();
      results.details.scheduledProcessed = scheduledProcessed;
      results.processed += scheduledProcessed;

      // Setup automatic reminders for active users

      // Get all active users (users with activity in last 7 days)
      const activeUsers = await prisma.user.findMany({
        where: {
          OR: [
            {
              moods: {
                some: {
                  date: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            },
            {
              journals: {
                some: {
                  date: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            },
            {
              perspective_sessions: {
                some: {
                  date: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            }
          ]
        },
        select: { id: true }
      });

      for (const user of activeUsers) {
        try {
          const setupReminders = await notificationService.setupAutomaticReminders(user.id);
          if (setupReminders.length > 0) {
            results.details.remindersSetup += setupReminders.length;
            results.created += setupReminders.length;
          }
        } catch (error) {
          console.error(`Error setting up reminders for user ${user.id}:`, error);
          results.errors++;
          results.errorDetails.push({
            userId: user.id,
            action: 'setup_reminders',
            error: error.message
          });
        }
      }

    } catch (error) {
      console.error('Error in notification batch processing:', error);
      results.errors++;
      results.errorDetails.push({
        error: error.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification batch processing completed',
      results
    });

  } catch (error) {
    console.error('Error in notification batch processing:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    );
  }
}
