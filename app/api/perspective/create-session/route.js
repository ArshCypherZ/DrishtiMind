import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/authUtils';
import notificationService from '../../../../lib/notificationService';

export async function POST(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const body = await request.json();
    const { userInput } = body;

    if (!userInput || !userInput.trim()) {
      return NextResponse.json({ error: 'User input is required' }, { status: 400 });
    }

    // Create perspective session
    const currentDate = new Date();
    const session = await prisma.perspectiveSession.create({
      data: {
        user_id: user.id,
        date: currentDate,
        day: currentDate.getDate(),
        week: Math.ceil(currentDate.getDate() / 7),
        month: currentDate.getMonth() + 1,
        user_input: userInput.trim(),
        status: 'input'
      }
    });

    // Generate notifications based on milestones
    try {
      await notificationService.checkMilestones(user.id);
    } catch (notificationError) {
      console.error('Error generating notifications:', notificationError);
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: 'Session created successfully'
    });

  } catch (error) {
    console.error('Error creating perspective session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
