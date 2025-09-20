import { NextResponse } from 'next/server';
import notificationService from '../../../../lib/notificationService';

export async function POST() {
  try {
    
    const processedCount = await notificationService.processScheduledNotifications();
    
    return NextResponse.json({
      message: 'Scheduled notifications processed successfully',
      count: processedCount
    });

  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled notifications' },
      { status: 500 }
    );
  }
}
