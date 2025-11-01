import { NextResponse } from 'next/server';
import notificationService from '../../../../lib/notificationService';
import { getAuthenticatedUser } from '../../../../lib/authUtils';

// POST /api/notifications/setup - Setup automatic reminders for a user
export async function POST(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'setup_reminders':
        // Setup automatic daily and weekly reminders
        const setupReminders = await notificationService.setupAutomaticReminders(user.id);
        result = {
          success: true,
          setup: setupReminders,
          message: `Setup ${setupReminders.length} automatic reminders`
        };
        break;

      case 'check_milestones':
        // Manually trigger milestone checking
        const milestoneCount = await notificationService.checkMilestones(user.id);
        result = {
          success: true,
          notifications: milestoneCount,
          message: `Generated ${milestoneCount} milestone notifications`
        };
        break;

      case 'create_mindfulness_tip':
        // Create a mindfulness tip
        const tip = await notificationService.createMindfulnessTip(user.id);
        result = {
          success: true,
          tip: tip,
          message: 'Mindfulness tip created successfully'
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in notification setup:', error);
    return NextResponse.json(
      { error: 'Failed to setup notifications' },
      { status: 500 }
    );
  }
}

// GET /api/notifications/setup - Get notification setup status
export async function GET(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const stats = await notificationService.getNotificationStats(user.id);
    
    return NextResponse.json({
      success: true,
      stats,
      message: 'Notification setup status retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting notification setup status:', error);
    return NextResponse.json(
      { error: 'Failed to get setup status' },
      { status: 500 }
    );
  }
}
